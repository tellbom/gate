<template>
    <footer class="footer-copyright">
        <div class="footer-content">
            <div class="copyright-text">
                © {{ currentYear }} {{ companyName }}. All Rights Reserved.
            </div>
            <div class="footer-links">
                <!-- <a 
                    v-if="showAdminLink"
                    :href="adminUrl" 
                    class="admin-link"
                    @click="handleAdminClick"
                >
                    <i class="fa fa-user"></i>
                    <span>管理员入口</span>
                </a>
                <a 
                    v-if="showLockLink"
                    :href="lockUrl" 
                    class="admin-link"
                    @click="handleLockClick"
                >
                    <i class="fa fa-lock"></i>
                    <span>监督建议</span>
                </a> -->
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
    companyName?: string
    adminUrl?: string
    lockUrl?:string
    showAdminLink?: boolean
    showLockLink?:boolean
}

const props = withDefaults(defineProps<Props>(), {
    companyName: '公司名称',
    adminUrl: '/admin',
    showAdminLink: true,
    showLockLink:true,
    lockUrl:'#'
})

interface Emits {
    (e: 'admin-click', event: MouseEvent): void,
    (e: 'lock-click', event: MouseEvent): void
}

const emit = defineEmits<Emits>()

// 当前年份
const currentYear = computed(() => new Date().getFullYear())

// 管理员入口点击
const handleAdminClick = (event: MouseEvent) => {
    emit('admin-click', event)
}

// 监督建议点击
const handleLockClick = (event: MouseEvent) => {
    emit('lock-click', event)
}
</script>

<style scoped lang="scss">
.footer-copyright {
    width: 100%;
    background: #0066cc;
    padding: 24px 20px;
}

.footer-content {
    max-width: 2000px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}

.copyright-text {
    font-size: 17px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    letter-spacing: 0.01em;
}

.footer-links {
    display: flex;
    align-items: center;
    gap: 24px;
}

.admin-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    
    i {
        font-size: 12px;
    }
    
    &:hover {
        color: #ffffff;
        background: rgba(198, 47, 47, 0.15);
        border-color: rgba(198, 47, 47, 0.3);
        transform: translateY(-2px);
    }
    
    &:active {
        transform: translateY(0);
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .footer-copyright {
        padding: 20px 16px;
        margin-top: 40px;
    }
    
    .footer-content {
        flex-direction: column;
        text-align: center;
        gap: 12px;
    }
    
    .copyright-text {
        font-size: 13px;
    }
    
    .admin-link {
        font-size: 12px;
        padding: 6px 12px;
    }
}

@media (max-width: 480px) {
    .footer-copyright {
        padding: 16px 12px;
    }
    
    .copyright-text {
        font-size: 12px;
    }
}
</style>