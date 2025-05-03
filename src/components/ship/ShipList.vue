<script setup lang="ts">
import { useShipStore, ShipData } from '../../stores/ships'
import { usePaginationStore } from '../../stores/pagination'
import { useDetailImagesStore } from '../../stores/detailImages'
import { ref, computed, watch } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import ShipDetailImages from './ShipDetailImages.vue'

const shipStore = useShipStore()
const paginationStore = usePaginationStore()
const detailStore = useDetailImagesStore()

// 搜索相关
const searchValue = ref('')
const searching = ref(false)

// 监听搜索值变化
watch(searchValue, (value) => {
  paginationStore.setSearchKeyword(value)
})

// 清除搜索
function clearSearch() {
  searchValue.value = ''
  paginationStore.setSearchKeyword('')
}

// 舰船卡片的悬停状态
const hoveredShip = ref<string | null>(null)

// 查看舰船详情
function viewShipDetails(ship: ShipData) {
  detailStore.selectShipAndGetDetails(ship)
}

// 根据稀有度获取标签颜色
function getRarityColor(rarity: string): string {
  const colorMap: Record<string, string> = {
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
  return colorMap[rarity] || 'default'
}

// 计算结果信息
const resultInfo = computed(() => {
  const total = paginationStore.filteredShips?.length || 0
  const originalTotal = shipStore.ships.length

  if (searchValue.value && total !== originalTotal) {
    return `找到 ${total} 个结果（共 ${originalTotal} 个）`
  }
  return `共 ${originalTotal} 个舰船`
})

// 是否有过滤后的舰船
const hasFilteredShips = computed(() => {
  return (paginationStore.filteredShips?.length || 0) > 0
})
</script>

<template>
  <div v-if="shipStore.ships.length > 0">
    <a-row align="middle" style="margin-bottom: 16px">
      <!-- 搜索框 -->
      <a-col :xs="24" :sm="12" :md="14" :lg="16">
        <a-input-search
          v-model:value="searchValue"
          placeholder="搜索舰船名称、阵营或稀有度"
          style="max-width: 400px;"
          @search="(value: string) => paginationStore.setSearchKeyword(value)"
          :loading="searching"
          allow-clear
        >
          <template #prefix>
            <search-outlined />
          </template>
        </a-input-search>
        <a-typography-text v-if="searchValue" style="margin-left: 8px" type="secondary">
          {{ resultInfo }}
        </a-typography-text>
      </a-col>

      <!-- 分页选择 -->
      <a-col :xs="24" :sm="12" :md="10" :lg="8" class="text-right">
        <a-select
          v-model:value="paginationStore.pagination.pageSize"
          style="width: 120px"
          @change="(size: number) => paginationStore.handlePageChange(1, size)"
        >
          <a-select-option
            v-for="size in paginationStore.pagination.pageSizeOptions"
            :key="size"
            :value="Number(size)"
          >
            每页 {{ size }} 项
          </a-select-option>
        </a-select>
      </a-col>
    </a-row>

    <!-- 结果为空时显示 -->
    <a-empty v-if="!hasFilteredShips" description="未找到匹配的舰船">
      <template #extra>
        <a-button type="primary" @click="clearSearch">清除搜索</a-button>
      </template>
    </a-empty>

    <a-list
      v-else
      :data-source="paginationStore.currentPageShips || []"
      :grid="{ gutter: 4, xs: 2, sm: 3, md: 5, lg: 6, xl: 8, xxl: 10 }"
      class="dense-grid"
      :pagination="(paginationStore.filteredShips?.length || 0) > paginationStore.pagination.pageSize ? {
        ...paginationStore.pagination,
        showSizeChanger: false,
        onChange: paginationStore.handlePageChange,
        onShowSizeChange: paginationStore.handlePageChange,
        total: paginationStore.filteredShips?.length || 0,
        size: 'small'
      } : false"
    >
      <template #renderItem="{ item }">
        <a-list-item>
          <a-card
            hoverable
            class="ship-card"
            size="small"
            :class="{ 'ship-card-hovered': hoveredShip === item.sanitizedName }"
            @mouseenter="hoveredShip = item.sanitizedName"
            @mouseleave="hoveredShip = null"
            @click="viewShipDetails(item)"
            :body-style="{ padding: '8px' }"
          >
            <template #cover>
              <div class="card-image-container">
                <img
                  v-if="item.avatarUrl"
                  :src="item.avatarUrl"
                  :alt="item.name"
                  class="ship-image"
                />
                <div class="ship-badges">
                  <a-tag :color="getRarityColor(item.rarity)" class="rarity-tag">
                    {{ item.rarity }}
                  </a-tag>
                </div>
                <div class="ship-faction">
                  <a-tag class="faction-tag" color="blue">{{ item.faction }}</a-tag>
                </div>
              </div>
            </template>
            <template #title>
              <div class="ship-title">{{ item.name }}</div>
            </template>
          </a-card>
        </a-list-item>
      </template>
    </a-list>

    <!-- 详情图片模态框 -->
    <ShipDetailImages />
  </div>
</template>

<style scoped>
.ship-card {
  transition: all 0.3s;
  border-radius: 6px;
  overflow: hidden;
  height: 100%;
  margin-bottom: 4px;
  cursor: pointer;
}

.ship-card-hovered {
  transform: translateY(-3px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.card-image-container {
  position: relative;
  height: 120px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.ship-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
}

.ship-card-hovered .ship-image {
  transform: scale(1.05);
}

.ship-badges {
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

.ship-faction {
  position: absolute;
  bottom: 2px;
  left: 2px;
  z-index: 1;
}

.faction-tag {
  margin: 0;
  border: none;
  font-size: 10px;
  padding: 0 4px;
  line-height: 16px;
}

.ship-title {
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

.text-right {
  text-align: right;
}

@media (max-width: 576px) {
  .text-right {
    text-align: left;
    margin-top: 8px;
  }
}
</style>