vcl 4.1;

/*
 * Gate 二级门户公共内容缓存
 *
 * 适用场景：
 *   - 新闻、公告等内容对所有已登录用户完全相同；
 *   - 浏览器请求仍携带 Keycloak Authorization: Bearer <token>；
 *   - 只希望缓存明确列入白名单的 GET/HEAD；
 *   - 401、403、重定向和其他错误绝不能缓存。
 *
 * 重要安全边界：
 *   Varnish 命中缓存时不会调用 Keycloak 验证 JWT。任何携带
 *   Authorization 头的请求（即使 Bearer 内容是伪造的）都可能命中
 *   已缓存的公共内容。因此 PUBLIC_CACHE_PATHS 中只能放真正允许公开
 *   阅读、且不同用户响应完全一致的接口，绝不能放 RBAC、用户信息、
 *   菜单、权限、待办和个人数据接口。
 */

backend portal_backend {
    /*
     * 按实际 Docker 网络修改：
     *   Varnish -> Traefik：.host = "traefik"; .port = "80";
     *   Varnish -> 门户后端：填写门户后端的 Docker service name/port。
     */
    .host = "traefik";
    .port = "80";

    .connect_timeout = 3s;
    .first_byte_timeout = 30s;
    .between_bytes_timeout = 10s;

    .probe = {
        /* 修改成后端真实健康检查地址。 */
        .url = "/ping";
        .timeout = 2s;
        .interval = 10s;
        .window = 5;
        .threshold = 3;
    }
}

sub vcl_recv {
    set req.backend_hint = portal_backend;

    /*
     * PUBLIC_CACHE_PATHS：必须替换成真实新闻/公告 API。
     *
     * 当前示例匹配：
     *   /api/portal/news
     *   /api/portal/news/{id}
     *   /api/portal/announcements
     *   /api/portal/announcements/{id}
     *
     * 查询参数属于 req.url 的一部分，不同页码/筛选条件会生成不同缓存键。
     */
    if (req.url !~ "^/api/portal/(news|announcements)(/|\\?|$)") {
        return (pass);
    }

    /* 只有 GET/HEAD 可以进入门户公共内容缓存。 */
    if (req.method != "GET" && req.method != "HEAD") {
        return (pass);
    }

    /*
     * 没有 Authorization 时仍交给后端/Keycloak 返回真实鉴权结果，
     * 不能从公共缓存直接返回成功响应。
     *
     * 注意：这里只检查请求头是否存在，不验证 JWT 真伪。
     */
    if (!req.http.Authorization ||
        req.http.Authorization !~ "(?i)^Bearer[ ]+[^ ]+$") {
        return (pass);
    }

    /*
     * 公共内容不应因 Keycloak/前端 Cookie 被内置 VCL 强制 PASS，
     * 也不应把 Cookie 带给门户业务后端产生用户差异。
     * Authorization 必须保留，使缓存 MISS 时后端仍会验证 token。
     */
    unset req.http.Cookie;

    /*
     * 显式进入缓存查找，绕过 Varnish 内置规则中
     * “存在 Authorization 就 PASS”的行为。
     */
    return (hash);
}

sub vcl_hash {
    /*
     * 不把 Authorization/token 放入缓存键：
     * 新闻公告才能在不同登录用户之间共享缓存。
     */
    if (req.http.host) {
        hash_data(req.http.host);
    } else {
        hash_data(server.ip);
    }

    hash_data(req.url);

    /*
     * 如果同一个 Varnish 服务多个门户 Project，即使目前数据看起来相同，
     * 仍建议按 X-Project 隔离，避免以后出现跨门户数据串用。
     */
    if (req.http.X-Project) {
        hash_data(req.http.X-Project);
    }

    return (lookup);
}

sub vcl_backend_response {
    /*
     * ABP MVC/Cookie 认证可能把未认证 API 请求返回为：
     *
     *   302 Location: /Error?httpError=401
     *
     * 浏览器会自动跟随 302，Axios 通常只能看到最终错误页，无法看到原始
     * 302。这里在响应离开 Varnish 前将它还原为标准 401，交给 Axios
     * 执行一次 token 刷新与重试。
     *
     * 只转换 Location 明确带有 httpError=401 的跳转，正常业务 302
     * 不受影响。
     */
    if ((beresp.status == 301 ||
         beresp.status == 302 ||
         beresp.status == 303 ||
         beresp.status == 307 ||
         beresp.status == 308) &&
        beresp.http.Location ~ "(?i)(^|[?&])httpError=401([&#]|$)") {
        set beresp.status = 401;
        set beresp.reason = "Unauthorized";
        set beresp.http.WWW-Authenticate = "Bearer";
        set beresp.http.Cache-Control = "private, no-store";
        unset beresp.http.Location;
        set beresp.uncacheable = true;
        set beresp.ttl = 0s;
        set beresp.grace = 0s;
        return (deliver);
    }

    /*
     * 双保险：只有公共接口的 GET/HEAD 才允许存储。
     */
    if (bereq.method != "GET" && bereq.method != "HEAD") {
        set beresp.uncacheable = true;
        set beresp.ttl = 0s;
        return (deliver);
    }

    if (bereq.url !~ "^/api/portal/(news|announcements)(/|\\?|$)") {
        set beresp.uncacheable = true;
        set beresp.ttl = 0s;
        return (deliver);
    }

    /*
     * 只缓存成功响应。
     * 401/403/404/429/5xx、Keycloak 重定向等全部禁止缓存。
     */
    if (beresp.status != 200) {
        set beresp.uncacheable = true;
        set beresp.ttl = 0s;
        set beresp.grace = 0s;
        return (deliver);
    }

    /*
     * 仅缓存 JSON 公共数据，避免错误路由返回 HTML 登录页并被缓存。
     */
    if (!beresp.http.Content-Type ||
        beresp.http.Content-Type !~ "(?i)^application/json([ ;]|$)") {
        set beresp.uncacheable = true;
        set beresp.ttl = 0s;
        return (deliver);
    }

    /*
     * Set-Cookie 或后端明确声明私有/禁止缓存时尊重后端决定。
     */
    if (beresp.http.Set-Cookie ||
        beresp.http.Cache-Control ~ "(?i)(private|no-store|no-cache)") {
        set beresp.uncacheable = true;
        set beresp.ttl = 0s;
        return (deliver);
    }

    /*
     * 公共新闻/公告缓存策略：
     *   ttl   正常缓存 5 分钟；
     *   grace 后端短暂异常时最多使用 1 分钟旧数据；
     *   keep  为条件回源保留对象元数据 10 分钟。
     */
    set beresp.ttl = 5m;
    set beresp.grace = 1m;
    set beresp.keep = 10m;

    /*
     * 防止后端误返回 Cookie 后被后续改动带入共享缓存。
     * 前面已经在存在 Set-Cookie 时禁止缓存，此处只是额外保护。
     */
    unset beresp.http.Set-Cookie;

    return (deliver);
}

sub vcl_deliver {
    /*
     * 联调期间保留；确认完成后可删除，避免对外暴露缓存实现细节。
     */
    set resp.http.X-Portal-Cache-Hits = obj.hits;

    if (obj.hits > 0) {
        set resp.http.X-Portal-Cache = "HIT";
    } else {
        set resp.http.X-Portal-Cache = "MISS-OR-PASS";
    }
}
