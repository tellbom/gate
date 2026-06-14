<template>
    <div></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import router from '/@/router'
import { useAdminInfo } from '/@/stores/adminInfo'
import { getExternalAuthTokenFromQuery } from '/@/utils/externalAuthToken'

const route = useRoute()
const adminInfo = useAdminInfo()

onMounted(() => {
    const token = getExternalAuthTokenFromQuery(route.query)

    if (token) {
        adminInfo.setToken(token, 'auth')
    }

    router.replace({ name: 'adminLogin' })
})
</script>
