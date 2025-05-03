<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { useGameParserStore } from '../../stores/gameParser'

defineProps<{
  limit: number
  folder: string
  isDownloading: boolean
  includeDetailImages: boolean
}>()

const emit = defineEmits<{
  (e: 'update:limit', value: number): void
  (e: 'update:folder', value: string): void
  (e: 'update:includeDetailImages', value: boolean): void
  (e: 'selectFolder'): void
  (e: 'download'): void
}>()

const gameParserStore = useGameParserStore()

// 是否选择全部下载的复选框
const downloadAll = ref(false)

// 用于v-model的处理
const updateLimit = (value: number) => {
  emit('update:limit', value)
}

// 监听全部选择的变化
watch(downloadAll, (checked) => {
  if (checked) {
    // 选择全部时，设置下载数量为舰船总数
    emit('update:limit', gameParserStore.ships.length)
  }
})
</script>

<template>
  <div v-if="gameParserStore.ships.length > 0" class="download-control">
    <a-divider orientation="left">下载选项</a-divider>

    <a-form layout="vertical">
      <a-row :gutter="[16, 0]">
        <!-- 第一行 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-form-item label="下载数量">
            <a-space>
              <a-input-number
                :value="limit"
                @update:value="updateLimit"
                :min="1"
                :max="gameParserStore.ships.length"
                :disabled="isDownloading || downloadAll"
                style="width: 100px"
              />
              <a-checkbox
                v-model:checked="downloadAll"
                :disabled="isDownloading"
              >
                全部
              </a-checkbox>
            </a-space>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-form-item label="包含图片">
            <a-checkbox
              :checked="includeDetailImages"
              @update:checked="(val: boolean) => emit('update:includeDetailImages', val)"
              :disabled="isDownloading"
            >
              包含详情图片
            </a-checkbox>
          </a-form-item>
        </a-col>

        <!-- 第二行 -->
        <a-col :xs="24" :sm="18" :md="16" :lg="12">
          <a-form-item label="下载目录">
            <a-space>
              <a-button
                @click="emit('selectFolder')"
                :disabled="isDownloading"
              >
                选择目录
              </a-button>
              <a-typography-text v-if="folder" type="secondary" class="folder-path">
                {{ folder }}
              </a-typography-text>
            </a-space>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="6" :md="8" :lg="6" class="download-btn-col">
          <a-form-item>
            <a-button
              type="primary"
              @click="emit('download')"
              :loading="isDownloading"
              :disabled="gameParserStore.ships.length === 0"
              size="large"
              block
            >
              {{ isDownloading ? '下载中...' : '开始下载' }}
            </a-button>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<style scoped>
.download-control {
  background-color: #f8f8f8;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.folder-path {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

@media (max-width: 576px) {
  .folder-path {
    max-width: 200px;
  }

  .download-btn-col {
    margin-top: 16px;
  }
}
</style>