<script setup lang="ts">
import { useDetailImagesStore } from '../../stores/detailImages'
import { computed } from 'vue'

const detailStore = useDetailImagesStore()

// 根据类型分组图片
const groupedImages = computed(() => {
  if (!detailStore.selectedShip) return { portraits: [], related: [] }

  const portraits = detailStore.selectedShip.detailImages.filter(img => img.type === 'portrait')
  const related = detailStore.selectedShip.detailImages.filter(img => img.type === 'related')

  return { portraits, related }
})

// 判断图片是否正在下载
const isDownloading = (url: string) => {
  return !!detailStore.downloadingImages[url]
}
</script>

<template>
  <a-modal
    v-if="detailStore.showDetailModal && detailStore.selectedShip"
    :visible="detailStore.showDetailModal"
    :title="`${detailStore.selectedShip.name} 的详情图片`"
    :width="1000"
    @cancel="detailStore.closeDetailModal"
    :footer="null"
  >
    <a-spin :spinning="detailStore.isLoadingDetails" tip="获取详情中...">
      <div v-if="!detailStore.isLoadingDetails && (!detailStore.selectedShip.detailImages || detailStore.selectedShip.detailImages.length === 0)" class="no-images">
        <a-empty description="未找到详情图片" />
      </div>

      <div v-else class="detail-images-container">
        <a-button
          type="primary"
          style="margin-bottom: 20px"
          @click="detailStore.downloadAllDetailImages(detailStore.selectedShip!)"
        >
          下载全部图片
        </a-button>

        <!-- 立绘图片 -->
        <div v-if="groupedImages.portraits.length > 0" class="image-section">
          <h3>立绘 ({{ groupedImages.portraits.length }}张)</h3>
          <div class="image-grid">
            <div v-for="(image, index) in groupedImages.portraits" :key="`portrait-${index}`" class="image-card">
              <div class="image-wrapper">
                <img :src="image.url" :alt="image.title" class="detail-image" />
              </div>
              <div class="image-footer">
                <div class="image-info">
                  <div class="image-title">{{ image.title }}</div>
                  <div class="image-resolution" v-if="image.resolution">{{ image.resolution }}</div>
                </div>
                <a-button
                  type="primary"
                  size="small"
                  :loading="isDownloading(image.url)"
                  @click="detailStore.downloadDetailImage(detailStore.selectedShip!, image.url, image.title)"
                >
                  下载
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关图片 -->
        <div v-if="groupedImages.related.length > 0" class="image-section">
          <h3>相关图片 ({{ groupedImages.related.length }}张)</h3>
          <div class="image-grid">
            <div v-for="(image, index) in groupedImages.related" :key="`related-${index}`" class="image-card">
              <div class="image-wrapper">
                <img :src="image.url" :alt="image.title" class="detail-image" />
              </div>
              <div class="image-footer">
                <div class="image-info">
                  <div class="image-title">{{ image.title }}</div>
                  <div class="image-resolution" v-if="image.resolution">{{ image.resolution }}</div>
                </div>
                <a-button
                  type="primary"
                  size="small"
                  :loading="isDownloading(image.url)"
                  @click="detailStore.downloadDetailImage(detailStore.selectedShip!, image.url, image.title)"
                >
                  下载
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<style scoped>
.detail-images-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 10px;
}

.no-images {
  text-align: center;
  padding: 40px 0;
}

.image-section {
  margin-bottom: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-wrapper {
  height: 220px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.image-footer {
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #fafafa;
}

.image-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 150px;
  overflow: hidden;
}

.image-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.image-resolution {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}
</style>