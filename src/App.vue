<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameParserStore } from './stores/gameParser'
import { useDownloadStore } from './stores/download'

// 导入组件
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import ParseControl from './components/ship/ParseControl.vue'
import ShipList from './components/ship/ShipList.vue'
import DownloadControl from './components/ship/DownloadControl.vue'
import DownloadStatus from './components/ship/DownloadStatus.vue'

// 使用各状态存储
const gameParserStore = useGameParserStore()
const downloadStore = useDownloadStore()

// 页面加载时
onMounted(() => {
  console.log('Bilibili舰船下载器已加载')
})
</script>

<template>
  <a-layout class="main-layout">
    <!-- 头部组件 -->
    <AppHeader />

    <a-layout-content class="content">
      <a-card bordered>
        <a-space direction="vertical" style="width: 100%" :size="16">
          <!-- 解析控制组件 -->
          <ParseControl />

          <!-- 舰船列表组件 -->
          <ShipList v-if="gameParserStore.ships.length > 0" />

          <!-- 下载控制组件 -->
          <DownloadControl
            v-if="gameParserStore.ships.length > 0"
            v-model:limit="downloadStore.downloadLimit"
            v-model:folder="downloadStore.downloadFolder"
            v-model:include-detail-images="downloadStore.includeDetailImages"
            :is-downloading="downloadStore.isDownloading"
            @select-folder="downloadStore.selectDownloadFolder"
            @download="downloadStore.downloadImages"
          />

          <!-- 下载状态组件 -->
          <DownloadStatus
            v-if="gameParserStore.downloads.length > 0"
            @retry="downloadStore.retryDownload"
          />
        </a-space>
      </a-card>
    </a-layout-content>

    <!-- 底部组件 -->
    <AppFooter />
  </a-layout>
</template>

<style>
#app {
  height: 100%;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

.main-layout {
  min-height: 100vh;
}

.content {
  padding: 24px;
  background: #f0f2f5;
}
</style>
