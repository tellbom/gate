<!--
 * @Author: fzq
 * @Date: 2026-03-05 10:53:42
 * @LastEditors: fzq
 * @LastEditTime: 2026-04-16 16:33:51
 * @Description: 
 * @FilePath: \flow\src\layouts\backend\components\header.vue
-->
<template>
    <el-header v-if="!navTabs.state.tabFullScreen" class="layout-header">
        <component :is="config.layout.layoutMode + 'NavBar'"></component>
    </el-header>
</template>

<script setup lang="ts">
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'
import DefaultNavBar from '/@/layouts/backend/components/navBar/default.vue'
import ClassicNavBar from '/@/layouts/backend/components/navBar/classic.vue'
import StreamlineNavBar from '/@/layouts/backend/components/menus/menuHorizontal.vue'
import DoubleNavBar from '/@/layouts/backend/components/navBar/double.vue'

defineOptions({
    name: 'layout/header',
    components: { DefaultNavBar, ClassicNavBar, StreamlineNavBar, DoubleNavBar },
})

const config = useConfig()
const navTabs = useNavTabs()
</script>

<style scoped lang="scss">
/*
 * el-header 本身保持透明并去除默认高度限制。
 * 背景色由内部的 menuHorizontal.vue 的 .layouts-menu-horizontal 负责，
 * 不在此层设置颜色，避免双重背景叠加。
 */
.layout-header {
    height: auto;
    padding: 0;
    background-color: transparent;
}
</style>