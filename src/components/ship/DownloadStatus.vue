<script setup lang="ts">
import { computed, ref } from 'vue'
import { useShipStore } from '../../stores/ships'

const shipStore = useShipStore()

// 添加过滤状态
const statusFilter = ref('all') // 默认显示全部

// 发出重试事件
const emit = defineEmits<{
  (e: 'retry', shipName: string): void
}>()

// 点击重试按钮处理
const handleRetry = (shipName: string) => {
  emit('retry', shipName)
}

// 定义表格列
const columns = [
  { title: '舰船名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '详情', dataIndex: 'message', key: 'message' },
  { title: '操作', key: 'action' }
]

// 处理状态数据，添加过滤功能
const downloadData = computed(() => {
  let data = shipStore.downloads.map(item => ({
    key: item.ship.sanitizedName,
    name: item.ship.name,
    status: item.status === 'pending' ? '等待中' :
            item.status === 'downloading' ? '下载中...' :
            item.status === 'success' ? '成功' : '失败',
    message: item.message || '',
    statusType: item.status,
    shipData: item.ship
  }))

  // 根据过滤条件筛选
  if (statusFilter.value !== 'all') {
    data = data.filter(item => item.statusType === statusFilter.value)
  }

  return data
})

// 获取状态统计数据
const statusStats = computed(() => {
  const stats = shipStore.getDownloadStats()
  return [
    { type: 'all', count: stats.total, label: '全部' },
    { type: 'success', count: stats.success, label: '成功' },
    { type: 'error', count: stats.error, label: '失败' },
    { type: 'downloading', count: stats.downloading, label: '下载中' },
    { type: 'pending', count: stats.pending, label: '等待中' }
  ]
})
</script>

<template>
  <div v-if="shipStore.downloads.length > 0" style="margin-top: 16px">
    <a-typography-title :level="4">下载状态</a-typography-title>

    <!-- 添加过滤器 -->
    <a-radio-group v-model:value="statusFilter" button-style="solid" style="margin-bottom: 16px">
      <a-radio-button v-for="stat in statusStats" :key="stat.type" :value="stat.type">
        {{ stat.label }} ({{ stat.count }})
      </a-radio-button>
    </a-radio-group>

    <a-table
      :columns="columns"
      :data-source="downloadData"
      :row-class-name="(record: any) => `status-${record.statusType}`"
      :pagination="{ pageSize: 10 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag
            :color="record.statusType === 'success' ? 'success' :
                   record.statusType === 'error' ? 'error' :
                   record.statusType === 'downloading' ? 'processing' : 'default'"
          >
            {{ record.status }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button
            v-if="record.statusType === 'error'"
            type="primary"
            size="small"
            @click="handleRetry(record.key)"
          >
            重试
          </a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style>
/* 保持状态颜色的样式 */
.status-success {
  background-color: rgba(82, 196, 26, 0.1);
}

.status-error {
  background-color: rgba(245, 34, 45, 0.1);
}

.status-downloading {
  background-color: rgba(24, 144, 255, 0.1);
}
</style>