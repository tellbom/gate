# 内网前端直连 Traefik/RBAC 改造说明

## 1. 改造目标

前端仍使用 Nginx 部署静态资源，并保留其他业务 API 的 Nginx 代理能力；只有 RBAC 请求由浏览器直接访问 Traefik，不再经过前端 Nginx。

推荐拓扑：

```text
用户浏览器
├── http://<frontend-host>:<frontend-port>
│   └── 前端 Nginx（静态资源及其他业务 API）
│
└── http://<traefik-host>:<traefik-port>/rbacServer/*
    └── Traefik
        ├── CORS
        ├── StripPrefix(/rbacServer)
        └── Consul 发现的 RBAC 服务
```

本次测试环境使用：

| 用途 | 地址 |
| --- | --- |
| 前端 Nginx | `http://192.168.124.2:5006` |
| Traefik 公共入口 | `http://192.168.124.2:5005` |
| RBAC BaseURL | `http://192.168.124.2:5005/rbacServer` |
| Keycloak Realm | `http://192.168.124.2:18085/realms/master` |

正式内网环境应将表中的 IP 和端口替换为实际地址。

## 2. 前端修改

### 2.1 生产环境变量

修改 `.env.production`：

```dotenv
VITE_PREVIEW_URL = 'http://<frontend-host>:<frontend-port>'
VITE_RBAC_BASE_URL = 'http://<traefik-host>:<traefik-port>/rbacServer'
VITE_KEYCLOAK_REALM_URL = 'http://<keycloak-host>:<keycloak-port>/realms/<realm>'
VITE_KEYCLOAK_CLIENT_ID = 'gate-web'
```

本次测试配置为：

```dotenv
VITE_PREVIEW_URL = 'http://192.168.124.2:5006'
VITE_RBAC_BASE_URL = 'http://192.168.124.2:5005/rbacServer'
VITE_KEYCLOAK_REALM_URL = 'http://192.168.124.2:18085/realms/master'
VITE_KEYCLOAK_CLIENT_ID = 'gate-web'
```

`VITE_*` 变量会在 Vite 构建时写入前端产物。修改环境变量后必须重新执行生产构建并更新镜像，仅重启旧容器不会生效。

不要写成下面这种形式：

```dotenv
VITE_RBAC_BASE_URL = ':5005/rbacServer'
```

浏览器需要完整 URL，正确格式必须包含协议、IP/主机名和端口。

### 2.2 RBAC Axios 客户端

所有 RBAC API 必须使用 `src/api/backend/rbac/client/index.ts` 创建的专用 Axios 实例。

`getUrl()` 必须返回读取到的环境变量，不能再次硬编码 `/rbacServer`：

```ts
function getUrl(): string {
    const baseURL: string =
        (import.meta.env.VITE_RBAC_BASE_URL as string) ||
        (import.meta.env.VITE_AXIOS_BASE_URL as string) ||
        window.location.protocol + '//' + window.location.host
    return baseURL
}
```

调用方只保留 RBAC 内部路径，例如：

```ts
rbacAxios.get('/api/admin/index')
```

浏览器最终请求：

```text
http://<traefik-host>:<traefik-port>/rbacServer/api/admin/index
```

不要在业务代码中重复拼接 Traefik 地址或 `/rbacServer`，避免出现双前缀：

```text
/rbacServer/rbacServer/api/...
```

可用以下命令检查是否存在绕过专用客户端的 RBAC 地址：

```powershell
rg -n "rbacServer|VITE_RBAC_BASE_URL|axios\.create|baseURL" src
```

### 2.3 Nginx

前端 Nginx 只负责：

- 静态资源；
- Vue History 路由回退；
- RBAC 之外的其他业务 API 代理。

RBAC 直连方案下，Nginx 中不要添加 `/rbacServer` 代理。

项目当前的 `deploy/nginx/default.conf`：

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    include /etc/nginx/server-locations/*.conf;
}
```

其他业务 API 可以继续放在 `/etc/nginx/server-locations/*.conf`，例如：

```nginx
location /processServer/ {
    proxy_pass http://process-api/;
}
```

## 3. Traefik 与 Consul 配置

### 3.1 RBAC 路由

Traefik 公共端口可以代理多个子服务，`5005` 不需要是 RBAC 专属端口：

```text
/rbacServer/*     → RBAC
/processServer/*  → Process
/userServer/*     → User
```

RBAC 注册到 Consul 时需要等价于以下 tags：

```text
traefik.enable=true
traefik.http.routers.rbac.rule=PathPrefix(`/rbacServer`)
traefik.http.routers.rbac.entrypoints=web
traefik.http.routers.rbac.priority=100
traefik.http.routers.rbac.middlewares=rbac-cors,rbac-strip
traefik.http.middlewares.rbac-strip.stripprefix.prefixes=/rbacServer
traefik.http.services.rbac.loadbalancer.server.port=<rbac-port>
```

请求转换示例：

```text
浏览器发送：/rbacServer/api/admin/index
RBAC 收到： /api/admin/index
```

如果 Consul 中存在多套环境，router、middleware 和 service 名称需要增加环境前缀，避免动态配置相互覆盖。

### 3.2 CORS

前端与 Traefik 的 IP 或端口不同即为跨域。Traefik 或 RBAC 必须配置 CORS，只需选择一处作为唯一责任方。

Traefik tags 示例：

```text
traefik.http.middlewares.rbac-cors.headers.accesscontrolalloworiginlist=http://<frontend-host>:<frontend-port>
traefik.http.middlewares.rbac-cors.headers.accesscontrolallowmethods=GET,OPTIONS,PUT,POST,DELETE,PATCH
traefik.http.middlewares.rbac-cors.headers.accesscontrolallowheaders=Authorization,Content-Type,X-Project
traefik.http.middlewares.rbac-cors.headers.accesscontrolmaxage=600
traefik.http.middlewares.rbac-cors.headers.addvaryheader=true
```

要求：

- `Access-Control-Allow-Origin` 必须包含实际前端 Origin；
- `OPTIONS` 预检必须返回成功；
- 必须允许 `Authorization` 和 `X-Project`；
- 多个前端入口应显式列入白名单；
- 不建议在正式内网使用任意来源 `*`。

预检验证：

```bash
curl -i -X OPTIONS \
  "http://<traefik-host>:<traefik-port>/rbacServer/api/admin/index" \
  -H "Origin: http://<frontend-host>:<frontend-port>" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,x-project"
```

预期至少包含：

```text
HTTP/1.1 200
Access-Control-Allow-Origin: http://<frontend-host>:<frontend-port>
Access-Control-Allow-Headers: Authorization,Content-Type,X-Project
```

## 4. 真实客户端 IP

浏览器直接连接 Traefik 后，前端 Nginx 不在 RBAC 链路中：

```text
浏览器 → Traefik → RBAC
```

Traefik 会向后端传递 `X-Forwarded-For`、`X-Real-Ip` 等代理头。RBAC 只能信任真实 Traefik 的 IP 或容器网络，不应无条件信任任意客户端提供的转发头。

RBAC 示例：

```text
ForwardedHeaders__ForwardLimit=1
ForwardedHeaders__KnownNetworks__0=<traefik-network-cidr>
```

非 Docker 部署时建议使用 Traefik 固定 IP 作为 KnownProxy；Docker 网络部署时使用实际 Traefik/RBAC 共享网络的 CIDR。

验收时应在两台不同局域网电脑上登录，确认 `/api/admin/index` 返回各自地址，而不是：

- Docker 网关地址；
- 前端 Nginx 地址；
- VM 宿主机地址；
- 客户端伪造的 `X-Forwarded-For`。

## 5. Keycloak

Keycloak 客户端 `gate-web` 的回调地址必须指向前端，不是 Traefik/RBAC：

```text
Valid Redirect URIs:
http://<frontend-host>:<frontend-port>/login

Root URL:
http://<frontend-host>:<frontend-port>

Home URL:
http://<frontend-host>:<frontend-port>

Web Origins:
http://<frontend-host>:<frontend-port>
```

如果同时保留测试和正式前端入口，可同时配置多个精确地址。修改前端服务器后，应同步检查 Keycloak，否则会出现 `Invalid parameter: redirect_uri`。

## 6. Docker 构建与部署

构建前端：

```powershell
cd E:\Web\gate
npm run build
docker build -t gate-frontend:<version> .
```

前端容器独立公开端口示例：

```yaml
services:
  frontend:
    image: gate-frontend:<version>
    ports:
      - "<frontend-port>:80"
```

不要再给前端容器添加 Traefik 的 ``PathPrefix(`/`)`` 兜底路由，否则用户仍可能通过 Traefik API 端口访问前端，无法证明两套入口已经分离。

## 7. VMware/NAT 环境

如果 Docker 运行在 VMware 虚拟机内，需要同时满足：

1. 容器端口映射到 VM；
2. VM 内防火墙放行；
3. VMware 宿主机把局域网端口转发到 VM；
4. Windows 宿主机防火墙放行。

例如：

```text
Windows 宿主机：192.168.124.2
VM：            192.168.48.128
前端端口：      5006
```

Windows 宿主机可使用以下方式转发：

```powershell
netsh interface portproxy add v4tov4 `
  listenaddress=0.0.0.0 listenport=5006 `
  connectaddress=192.168.48.128 connectport=5006

netsh advfirewall firewall add rule `
  name="Gate Frontend 5006" `
  dir=in action=allow protocol=TCP localport=5006
```

检查规则：

```powershell
netsh interface portproxy show all
Get-NetTCPConnection -LocalPort 5006 -State Listen
```

也可以通过 VMware Virtual Network Editor 配置 NAT Port Forwarding。不要只检查 VM 内 `curl 127.0.0.1:5006`，必须从另一台局域网电脑访问宿主机地址。

## 8. 验收清单

### 8.1 基础连通

```bash
curl -I http://<frontend-host>:<frontend-port>/
curl -i http://<traefik-host>:<traefik-port>/
curl -i http://<traefik-host>:<traefik-port>/rbacServer/api/admin/index
```

预期：

- 前端入口返回 HTML 200；
- Traefik 根路径没有前端兜底时返回 404；
- RBAC 未携带 Token 返回 401 或 403，而不是 HTML。

### 8.2 浏览器验收

1. 从前端地址进入系统；
2. 完成 Keycloak 登录；
3. 浏览器 Network 中所有 RBAC 请求的主机必须是 Traefik；
4. `/rbacServer/api/auth/login` 返回 200；
5. `/rbacServer/api/admin/index` 返回 200；
6. 项目、用户、角色组、菜单和审计接口均返回 200；
7. 浏览器 Console 无 CORS 错误；
8. `adminInfo.loginIp` 与当前访问电脑 IP 一致；
9. 更换另一台局域网电脑重复验证 IP。

浏览器中正确的请求应类似：

```text
页面：http://<frontend-host>:<frontend-port>/lnbox/dashboard
API： http://<traefik-host>:<traefik-port>/rbacServer/api/admin/index
```

这可以直接证明 RBAC 请求没有经过前端 Nginx。

## 9. 常见问题

### 修改 `.env.production` 后请求地址没有变化

原因通常是：

- 没有重新执行 `npm run build`；
- Docker 镜像仍复制旧 `dist`；
- 浏览器缓存了旧 JS；
- RBAC 客户端仍硬编码 `/rbacServer`。

处理：

```powershell
npm run build
docker build --no-cache -t gate-frontend:<new-version> .
```

随后替换容器并在浏览器执行无缓存刷新。

### 浏览器报 CORS，但 curl 正常

普通 curl 不执行浏览器同源策略。必须检查 `OPTIONS` 预检、前端 Origin、允许请求头和 Traefik middleware 是否挂载到正确 router。

### 接口返回 HTML

说明请求落到了前端 Nginx，而不是 RBAC。检查：

- `VITE_RBAC_BASE_URL` 是否为 Traefik 绝对地址；
- 是否使用 RBAC 专用 Axios；
- Traefik 是否匹配 `/rbacServer`；
- RBAC router 优先级是否高于其他兜底 router。

### 返回 IP 始终相同

检查请求是否经过额外 Nginx、NAT 或统一代理；同时核对 Traefik access log 和 RBAC 的 Trusted Proxy 配置。VM 宿主机 NAT 可能使 Traefik只能看到宿主机地址，需要使用桥接网络或在上游正确传递并限制信任代理头。

## 10. HTTP 内网限制

本方案按“无域名、无 HTTPS”条件设计。Bearer Token 会通过明文 HTTP 传输，只适用于受控内网。网络边界必须限制 Traefik、Keycloak 和前端端口仅对授权内网开放。

## 参考资料

- [Vite 环境变量](https://vite.dev/guide/env-and-mode)
- [Traefik Headers/CORS Middleware](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/headers/)
- [Traefik Consul Catalog Provider](https://doc.traefik.io/traefik/providers/consul-catalog/)
