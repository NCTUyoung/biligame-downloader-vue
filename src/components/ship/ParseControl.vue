<script setup lang="ts">
import { useShipStore } from '../../stores/ships'
import { useParseStore } from '../../stores/parse'

const shipStore = useShipStore()
const parseStore = useParseStore()
</script>

<template>
  <a-form layout="inline">
    <a-form-item label="Wiki页面URL" style="flex: 1">
      <a-input
        v-model:value="parseStore.pageUrl"
        placeholder="输入Bilibili Wiki页面URL"
        :disabled="shipStore.isAnalyzing"
        style="width: 100%"
      />
    </a-form-item>
    <a-form-item>
      <a-button
        type="primary"
        @click="parseStore.analyzePage"
        :loading="shipStore.isAnalyzing"
        :disabled="!parseStore.pageUrl.trim()"
      >
        {{ shipStore.isAnalyzing ? '解析中...' : '解析页面' }}
      </a-button>
    </a-form-item>
  </a-form>

  <a-alert
    v-if="shipStore.statusMessage && shipStore.statusMessage.includes('失败')"
    :message="shipStore.statusMessage"
    type="error"
    show-icon
    style="margin-top: 16px"
  />
</template>