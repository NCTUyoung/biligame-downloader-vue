<script setup lang="ts">
import { useGameParserStore } from '../../stores/gameParser'

const gameParserStore = useGameParserStore()
</script>

<template>
  <a-form layout="inline">
    <a-form-item label="Wiki页面URL" style="flex: 1">
      <a-input
        v-model:value="gameParserStore.pageUrl"
        placeholder="输入Bilibili Wiki页面URL"
        :disabled="gameParserStore.isAnalyzing"
        style="width: 100%"
      />
    </a-form-item>
    <a-form-item>
      <a-button
        type="primary"
        @click="gameParserStore.analyzePage"
        :loading="gameParserStore.isAnalyzing"
        :disabled="!gameParserStore.pageUrl.trim()"
      >
        {{ gameParserStore.isAnalyzing ? '解析中...' : '解析页面' }}
      </a-button>
    </a-form-item>
  </a-form>

  <a-alert
    v-if="gameParserStore.statusMessage && gameParserStore.statusMessage.includes('失败')"
    :message="gameParserStore.statusMessage"
    type="error"
    show-icon
    style="margin-top: 16px"
  />
</template>