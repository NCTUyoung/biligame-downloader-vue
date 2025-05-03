<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../../stores/gameData'

const gameStore = useGameStore()

// 悬停状态
const hoveredItemId = ref<string | null>(null)

// 分页设置
const pagination = ref({
  current: 1,
  pageSize: 40,
  pageSizeOptions: ['20', '40', '60', '80', '100']
})

// 当前页的数据
const currentPageItems = computed(() => {
  const startIndex = (pagination.value.current - 1) * pagination.value.pageSize
  const endIndex = startIndex + pagination.value.pageSize
  return gameStore.items.slice(startIndex, endIndex)
})

// 改变页码
const handlePageChange = (page: number, pageSize?: number) => {
  pagination.value.current = page
  if (pageSize) pagination.value.pageSize = pageSize
}

// 根据稀有度获取标签颜色
function getRarityColor(rarity: string): string {
  // 碧蓝航线色彩映射
  if (gameStore.currentGameId === 'blhx') {
    const blhxColorMap: Record<string, string> = {
      '普通': '#8E8E8E',
      '稀有': '#4F9BF3',
      '精锐': '#AA6FF9',
      '超稀有': '#FF9B19',
      '海上传奇': '#FF6666',
      '最高方案': '#FF4D4F',
      '决战方案': '#FE0000',
      // 保留原有的英文映射以兼容性
      'N': '#8E8E8E',
      'R': '#4F9BF3',
      'SR': '#AA6FF9',
      'SSR': '#FF9B19',
      'UR': '#FF4D4F'
    }
    return blhxColorMap[rarity] || 'default'
  }

  // FGO色彩映射
  if (gameStore.currentGameId === 'fgo') {
    const fgoColorMap: Record<string, string> = {
      '1★': '#8E8E8E',
      '2★': '#8E8E8E',
      '3★': '#4F9BF3',
      '4★': '#AA6FF9',
      '5★': '#FF9B19',
    }
    return fgoColorMap[rarity] || 'default'
  }

  // 默认颜色
  return 'default'
}
</script>

<template>
  <div v-if="gameStore.items.length > 0">
    <a-row align="middle" justify="end" style="margin-bottom: 16px">
      <a-col>
        <a-select
          v-model:value="pagination.pageSize"
          style="width: 120px"
          @change="(size: number) => handlePageChange(1, size)"
        >
          <a-select-option v-for="size in pagination.pageSizeOptions" :key="size" :value="Number(size)">
            每页 {{ size }} 项
          </a-select-option>
        </a-select>
      </a-col>
    </a-row>

    <a-list
      :data-source="currentPageItems"
      :grid="{ gutter: 4, xs: 2, sm: 3, md: 5, lg: 6, xl: 8, xxl: 10 }"
      class="dense-grid"
      :pagination="gameStore.items.length > pagination.pageSize ? {
        ...pagination,
        showSizeChanger: false,
        onChange: handlePageChange,
        onShowSizeChange: handlePageChange,
        total: gameStore.items.length,
        size: 'small'
      } : false"
    >
      <template #renderItem="{ item }">
        <a-list-item>
          <a-card
            hoverable
            class="item-card"
            size="small"
            :class="{ 'item-card-hovered': hoveredItemId === item.id }"
            @mouseenter="hoveredItemId = item.id"
            @mouseleave="hoveredItemId = null"
            :body-style="{ padding: '8px' }"
          >
            <template #cover>
              <div class="card-image-container">
                <img
                  v-if="item.avatarUrl"
                  :src="item.avatarUrl"
                  :alt="item.name"
                  class="item-image"
                />
                <div class="item-badges">
                  <a-tag :color="getRarityColor(item.rarity)" class="rarity-tag">
                    {{ item.rarity }}
                  </a-tag>
                </div>
              </div>
            </template>
            <template #title>
              <div class="item-title">{{ item.name }}</div>
            </template>
          </a-card>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<style scoped>
.item-card {
  transition: all 0.3s;
  border-radius: 6px;
  overflow: hidden;
  height: 100%;
  margin-bottom: 4px;
}

.item-card-hovered {
  transform: translateY(-3px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.card-image-container {
  position: relative;
  height: 120px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
}

.item-card-hovered .item-image {
  transform: scale(1.05);
}

.item-badges {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 1;
}

.rarity-tag {
  font-weight: bold;
  padding: 0 4px;
  border: none;
  font-size: 10px;
  line-height: 16px;
}

.item-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 0;
  font-size: 13px;
  line-height: 1.2;
  text-align: center;
}

/* 密集网格样式 */
.dense-grid :deep(.ant-list-item) {
  padding: 0;
  margin-bottom: 4px;
}

.dense-grid :deep(.ant-row) {
  margin-left: -2px !important;
  margin-right: -2px !important;
}

.dense-grid :deep(.ant-col) {
  padding-left: 2px !important;
  padding-right: 2px !important;
}
</style>