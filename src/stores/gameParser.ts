import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore, BaseGameItem, GameImageDetail } from './gameData'
import { parsePageFromUrl, convertToGameItemView } from '../services/parser'
import { message } from 'ant-design-vue'

// 游戏数据的通用接口 - 用于UI组件
export interface GameItemView {
  name: string;
  sanitizedName: string;
  wikiUrl: string;
  avatarUrl: string;
  hiresAvatarUrl?: string;
  roleAndType?: string[];
  rarity: string;
  faction: string;
  properties?: Record<string, any>;
  detailImages?: GameImageDetail[];
  detailFetched?: boolean;
}

/**
 * 从GameItemView转换为BaseGameItem
 */
export function convertToBaseGameItem(ship: GameItemView): BaseGameItem {
  return {
    id: ship.sanitizedName,
    name: ship.name,
    sanitizedName: ship.sanitizedName,
    wikiUrl: ship.wikiUrl,
    avatarUrl: ship.avatarUrl,
    hiresImageUrl: ship.hiresAvatarUrl || '',
    type: '舰船',
    rarity: ship.rarity,
    category: ship.faction,
    gameId: 'blhx',
    properties: {
      roleAndType: ship.roleAndType || []
    },
    detailFetched: ship.detailFetched || false,
    detailImages: ship.detailImages || []
  };
}

export const useGameParserStore = defineStore('gameParser', () => {
  const gameStore = useGameStore()

  // 页面URL
  const pageUrl = ref<string>('https://wiki.biligame.com/blhx/舰船图鉴')

  // 计算属性 - 将通用gameStore中的items转换为UI友好的格式
  const ships = computed<GameItemView[]>(() => {
    if (gameStore.currentGameId === 'blhx') {
      // 使用转换函数
      return gameStore.items.map(convertToGameItemView);
    }
    return []
  })

  // 分析页面方法
  async function analyzePage() {
    if (!pageUrl.value.trim()) {
      message.error('请输入有效的页面URL')
      return
    }

    try {
      gameStore.startAnalyzing(pageUrl.value)
      const parsedShips = await parsePageFromUrl(pageUrl.value)

      // 使用转换函数
      const items = parsedShips.map(convertToBaseGameItem);

      gameStore.setGameItems(items)

      if (items.length > 0) {
        message.success('解析成功')
      } else {
        message.warning('未找到舰船数据')
      }
    } catch (error) {
      console.error('解析页面失败:', error)
      message.error(`解析失败: ${(error instanceof Error ? error.message : String(error)) || '未知错误'}`)
      gameStore.statusMessage = `解析失败: ${(error instanceof Error ? error.message : String(error)) || '未知错误'}`
    } finally {
      gameStore.finishAnalyzing()
    }
  }

  // 获取下载统计信息
  function getDownloadStats() {
    const total = gameStore.downloads.length
    const pending = gameStore.downloads.filter(item => item.status === 'pending').length
    const downloading = gameStore.downloads.filter(item => item.status === 'downloading').length
    const success = gameStore.downloads.filter(item => item.status === 'success').length
    const error = gameStore.downloads.filter(item => item.status === 'error').length

    return { total, pending, downloading, success, error }
  }

  // 导出与原有ships和parse store兼容的属性和方法
  return {
    pageUrl,
    analyzePage,
    ships,
    getDownloadStats,

    // 直接暴露gameStore的属性和方法，用于兼容
    parsedPageUrl: gameStore.parsedPageUrl,
    isAnalyzing: gameStore.isAnalyzing,
    downloads: gameStore.downloads,
    statusMessage: gameStore.statusMessage,
    startAnalyzing: gameStore.startAnalyzing,
    finishAnalyzing: gameStore.finishAnalyzing,
    clearDownloads: gameStore.clearDownloads,

    // 添加直接处理GameItemView的下载任务方法
    addDownloadTask: (ship: GameItemView) => {
      // 使用转换函数
      const item = convertToBaseGameItem(ship);
      gameStore.addDownloadTask(item);
    },

    updateDownloadStatus: gameStore.updateDownloadStatus,

    // 更新为接收GameItemView类型
    setShips: (newShips: GameItemView[]) => {
      // 使用转换函数
      const items = newShips.map(convertToBaseGameItem);
      gameStore.setGameItems(items)
    }
  }
})