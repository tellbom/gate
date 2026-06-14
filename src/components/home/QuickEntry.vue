<template>
  <div class="quick-card">
    <div class="card-title">快捷入口</div>
    <div class="entry-grid">
      <button
        v-for="item in entries"
        :key="item.key"
        class="entry-btn"
        @click="$emit('entry-click', item)"
      >
        <div class="entry-icon" :style="{ background: item.bg }">
          <el-icon :size="20" :style="{ color: item.color }">
            <component :is="item.icon" />
          </el-icon>
        </div>
        <span class="entry-label">{{ item.label }}</span>
        <span v-if="item.badge" class="entry-badge">{{ item.badge }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  entries: { type: Array, default: () => [] },
})

defineEmits(['entry-click'])
</script>

<style scoped>
.quick-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px 18px;
  box-shadow: 0 2px 14px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 14px;
  letter-spacing: -.2px;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.entry-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 14px 6px;
  background: #fafafa;
  border: 1px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all .18s;
  position: relative;
}
.entry-btn:hover {
  background: #fff;
  border-color: rgba(198,47,47,.15);
  box-shadow: 0 4px 16px rgba(198,47,47,.1);
  transform: translateY(-2px);
}
.entry-btn:active { transform: translateY(0); }

.entry-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}

.entry-label {
  font-size: 12px;
  font-weight: 500;
  color: #444;
  text-align: center;
  white-space: nowrap;
}

.entry-badge {
  position: absolute;
  top: 8px; right: 8px;
  background: #c62f2f;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 100px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
  line-height: 1;
}
</style>
