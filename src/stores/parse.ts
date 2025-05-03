import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useShipStore } from './ships'
import { parsePageFromUrl } from '../services/parser'
import { message } from 'ant-design-vue'

export const useParseStore = defineStore('parse', () => {
  const shipStore = useShipStore()

  // 页面URL
  const pageUrl = ref<string>('https://wiki.biligame.com/blhx/舰船图鉴')

  // 分析页面方法
  async function analyzePage() {
    if (!pageUrl.value.trim()) {
      message.error('请输入有效的页面URL')
      return
    }

    try {
      shipStore.startAnalyzing(pageUrl.value)
      const ships = await parsePageFromUrl(pageUrl.value)
      shipStore.setShips(ships)
      if (ships.length > 0) {
        message.success('解析成功')
      } else {
        message.warning('未找到舰船数据')
      }
    } catch (error) {
      console.error('解析页面失败:', error)
      message.error(`解析失败: ${(error instanceof Error ? error.message : String(error)) || '未知错误'}`)
      shipStore.statusMessage = `解析失败: ${(error instanceof Error ? error.message : String(error)) || '未知错误'}`
    } finally {
      shipStore.finishAnalyzing()
    }
  }

  return {
    pageUrl,
    analyzePage
  }
})