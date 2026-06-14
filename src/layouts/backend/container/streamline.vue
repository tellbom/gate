<template>
  <el-container class="layout-container streamline-layout">
    <!-- 顶部固定栏 -->
    <TopBar />

    <!-- 主内容区域 -->
    <el-container class="content-wrapper">
      <!-- Header 组件 -->
      <div class="header-section">
        <Header />
      </div>

      <!-- Main 组件 - 图表内容区域 -->
      <div class="main-section">
        <Main />
      </div>
    </el-container>
  </el-container>·

  <!-- 版权声明 -->
  <FooterCopyright
    company-name="数字化集团有限责任公司"
  />
  <CloseFullScreen v-if="navTabs.state.tabFullScreen" />
</template>

<script setup lang="ts">
import FooterCopyright from "/@/layouts/backend/components/FooterCopyright.vue";
import TopBar from "/@/layouts/backend/components/topBar.vue";
import Header from "/@/layouts/backend/components/header.vue";
import Main from "/@/layouts/backend/router-view/main.vue";
import CloseFullScreen from "/@/layouts/backend/components/closeFullScreen.vue";
import { useNavTabs } from "/@/stores/navTabs";
import { adminBaseRoutePath } from "/@/router/static/adminBase";
import { useRouter } from "vue-router";

const navTabs = useNavTabs();
const router = useRouter();

const handleLockClick = (e: any) => {
  console.log(adminBaseRoutePath + "/superviseleadfeedback/index");
  // router.push({path:adminBaseRoutePath+'/superviseleadfeedback/index'})
};
</script>

<style scoped>
/* 整体容器 */
.layout-container {
  --streamline-primary: #0066cc;
  --streamline-primary-focus: #0071e3;
  --streamline-ink: #1d1d1f;
  --streamline-muted: #7a7a7a;
  --streamline-canvas: #ffffff;
  --streamline-parchment: #f5f5f7;
  --streamline-hairline: #e0e0e0;
  width: 100%;
  min-height: 100vh;
  color: var(--streamline-ink);
  background-color: var(--streamline-canvas);
}

/* 主内容包裹器 - 背景图跟随滚动，但尺寸固定 */
.content-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  /* 背景大图 - 跟随滚动，尺寸固定 */
  background: url("/@/assets/images/process_backend.png") center top / 100% auto no-repeat
              var(--streamline-parchment);
  background-attachment: scroll; /* 🔥 跟随滚动 */
  background-size: 100% auto; /* 🔥 固定宽度100%，高度自动 */
  padding-top: 20%;
}

/* Header 区域 */
.header-section {
  width: 95%;
  max-width: 2000px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
}

/* Main 区域 */
.main-section {
  width: 95%;
  max-width: 2000px;
  margin: 8px auto 40px;
  padding: 24px;
  background: var(--streamline-canvas);
  border: 1px solid var(--streamline-hairline);
  border-radius: 12px;
  position: relative;
  z-index: 20;
}


/* 响应式调整 */
@media (max-width: 1400px) {
  .header-section,
  .main-section {
    width: 100%;
  }

  .content-wrapper {
    padding-top: 240px; /* 中等屏幕调整 */
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding-top: 180px; /* 小屏幕调整 */
    min-height: 300px;
    /* 移动端可能需要调整背景图显示方式 */
    background-size: cover;
  }

  .header-section,
  .main-section {
    width: 95%;
  }

  .main-section {
    margin: 8px auto 20px;
    padding: 16px;
    border-radius: 8px;
  }
}

/* 确保图表组件在 main-section 内的正确显示 */
.main-section :deep(.chart-container) {
  position: relative;
  width: 100%;
  overflow: visible;
}

/* 图表 tooltip 不被裁剪 */
.main-section :deep(canvas) {
  max-width: 100%;
  height: auto;
}
</style>
