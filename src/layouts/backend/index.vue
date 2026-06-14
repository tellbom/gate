<template>
  <component :is="config.layout.layoutMode"></component>
</template>

<script setup lang="ts">
import { reactive, nextTick } from "vue";
import { useConfig } from "/@/stores/config";
import { useNavTabs } from "/@/stores/navTabs";
import { useTerminal } from "/@/stores/terminal";
import { useSiteConfig } from "/@/stores/siteConfig";
import { useAdminInfo } from "/@/stores/adminInfo";
import { useRoute } from "vue-router";
import Default from "/@/layouts/backend/container/default.vue";
import Classic from "/@/layouts/backend/container/classic.vue";
import Streamline from "/@/layouts/backend/container/streamline.vue";
import Double from "/@/layouts/backend/container/double.vue";
import { onMounted, onBeforeMount } from "vue";
import { Session } from "/@/utils/storage";
import { index } from "/@/api/backend";
import { handleAdminRoute, getFirstRoute, routePush } from "/@/utils/router";
import router from "/@/router/index";
import { adminBaseRoutePath } from "/@/router/static/adminBase";
import { useEventListener } from "@vueuse/core";
import { BEFORE_RESIZE_LAYOUT } from "/@/stores/constant/cacheKey";
import { isEmpty } from "lodash-es";
import { setNavTabsWidth } from "/@/utils/layout";
import adminBaseRoute from "/@/router/static/adminBase";

defineOptions({
  components: { Default, Classic, Streamline, Double },
});

const terminal = useTerminal();
const navTabs = useNavTabs();
const config = useConfig();
const route = useRoute();
const siteConfig = useSiteConfig();
const adminInfo = useAdminInfo();

const state = reactive({
  autoMenuCollapseLock: false,
});

onMounted(() => {
  if (!adminInfo.token) return router.push({ name: "adminLogin" });

  init();
  setNavTabsWidth();
  useEventListener(window, "resize", setNavTabsWidth);
});
onBeforeMount(() => {
  onAdaptiveLayout();
  useEventListener(window, "resize", onAdaptiveLayout);
});

const init = async () => {
  const { loadRbacBackendIndex } = await import('/@/api/backend/rbac/bridge')
  const rbacIndex = await loadRbacBackendIndex()

  if (!rbacIndex || !rbacIndex.menus?.length) {
    console.warn('[layout] RBAC index returned empty, no menus to register')
    return
  }

  // 将后端 type 字段统一转换：menudir → menu_dir
  const normalizeMenuType = (nodes: any[]): any[] =>
    nodes.map(node => ({
      ...node,
      type: node.type === 'menudir' ? 'menu_dir' : node.type,
      children: node.children?.length ? normalizeMenuType(node.children) : [],
    }))

  const menus = normalizeMenuType(rbacIndex.menus)

  handleAdminRoute(menus)

  nextTick(() => {
    // 预跳转到上次路径
    if (route.params.to) {
      const lastRoute = JSON.parse(route.params.to as string)
      if (lastRoute.path !== adminBaseRoutePath) {
        const query = !isEmpty(lastRoute.query) ? lastRoute.query : {}
        routePush({ path: lastRoute.path, query })
        return
      }
    }

    // 跳转到第一个菜单
    const firstRoute = getFirstRoute(navTabs.state.tabsViewRoutes)
    if (firstRoute) {
      routePush(firstRoute.path)
    }
  })
}

const onAdaptiveLayout = () => {
  let defaultBeforeResizeLayout = {
    layoutMode: config.layout.layoutMode,
    menuCollapse: config.layout.menuCollapse,
  };
  let beforeResizeLayout = Session.get(BEFORE_RESIZE_LAYOUT);
  if (!beforeResizeLayout)
    Session.set(BEFORE_RESIZE_LAYOUT, defaultBeforeResizeLayout);

  const clientWidth = document.body.clientWidth;
  if (clientWidth < 1024) {
    /**
     * 锁定窗口改变自动调整 menuCollapse
     * 避免已是小窗且打开了菜单栏时，意外的自动关闭菜单栏
     */
    if (!state.autoMenuCollapseLock) {
      state.autoMenuCollapseLock = true;
      config.setLayout("menuCollapse", true);
    }
    config.setLayout("shrink", true);
  } else {
    state.autoMenuCollapseLock = false;
    let beforeResizeLayoutTemp =
      beforeResizeLayout || defaultBeforeResizeLayout;

    config.setLayout("menuCollapse", beforeResizeLayoutTemp.menuCollapse);
    config.setLayout("shrink", false);
  }
};
</script>
