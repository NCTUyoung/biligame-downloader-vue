import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 基础数据模型接口
export interface BaseGameItem {
  id: string             // 唯一标识
  name: string           // 名称
  sanitizedName: string  // 清理后的文件名
  wikiUrl: string        // Wiki页面URL
  avatarUrl: string      // 缩略图URL
  hiresImageUrl: string  // 高清图URL
  type: string           // 类型标识(如角色、道具、武器等)
  rarity: string         // 稀有度
  category: string       // 分类(如阵营、系列等)
  gameId: string         // 关联的游戏ID
  properties: Record<string, any> // 游戏特有的属性
}

// 下载状态类型
export type DownloadStatus = 'pending' | 'downloading' | 'success' | 'error'

// 下载项类型
export interface DownloadItem {
  item: BaseGameItem
  status: DownloadStatus
  message?: string
}

// 游戏配置接口
export interface GameConfig {
  id: string           // 游戏ID
  name: string         // 游戏名称
  icon: string         // 图标
  defaultUrl: string   // 默认URL
  parserName: string   // 使用的解析器名称
  categories: string[] // 分类列表
  rarities: string[]   // 稀有度列表
  types: string[]      // 类型列表
}

// 预定义的游戏列表
export const SUPPORTED_GAMES: GameConfig[] = [
  {
    id: 'blhx',
    name: '碧蓝航线',
    icon: '🚢',
    defaultUrl: 'https://wiki.biligame.com/blhx/舰船图鉴',
    parserName: 'blhxParser',
    categories: ['白鹰', '皇家', '重樱', '铁血', '东煌', '北方联合', '自由鸢尾', 'sardegna'],
    rarities: ['普通', '稀有', '精锐', '超稀有', '海上传奇', '最高方案', '决战方案'],
    types: ['舰船', '装备']
  },
  // 可以添加更多游戏
  {
    id: 'fgo',
    name: 'Fate/Grand Order',
    icon: '⚔️',
    defaultUrl: 'https://wiki.biligame.com/fgo/英灵图鉴',
    parserName: 'fgoParser',
    categories: ['剑', '弓', '枪', '骑', '术', '杀', '狂', '其他'],
    rarities: ['1★', '2★', '3★', '4★', '5★'],
    types: ['英灵', '礼装']
  }
]

export const useGameStore = defineStore('gameData', () => {
  // 状态
  const currentGameId = ref<string>('blhx') // 默认游戏
  const items = ref<BaseGameItem[]>([])
  const parsedPageUrl = ref<string>('')
  const isAnalyzing = ref<boolean>(false)
  const downloads = ref<DownloadItem[]>([])
  const statusMessage = ref<string>('点击"解析页面"开始')

  // 计算属性
  const currentGame = computed(() =>
    SUPPORTED_GAMES.find(game => game.id === currentGameId.value) || SUPPORTED_GAMES[0]
  )

  // 方法
  function setGameItems(newItems: BaseGameItem[]) {
    items.value = newItems
    statusMessage.value = newItems.length > 0 ? '解析成功' : '未找到数据'
  }

  function setCurrentGame(gameId: string) {
    const game = SUPPORTED_GAMES.find(g => g.id === gameId)
    if (game) {
      currentGameId.value = gameId
      items.value = []
      downloads.value = []
      statusMessage.value = `已切换到${game.name}`
    }
  }

  function startAnalyzing(url: string) {
    isAnalyzing.value = true
    parsedPageUrl.value = url
    statusMessage.value = '正在解析页面...'
    items.value = []
    downloads.value = []
  }

  function finishAnalyzing() {
    isAnalyzing.value = false
    if (items.value.length > 0) {
      statusMessage.value = '解析成功'
    }
  }

  function addDownloadTask(item: BaseGameItem) {
    downloads.value.push({
      item,
      status: 'pending'
    })
  }

  function updateDownloadStatus(itemId: string, status: DownloadStatus, message?: string) {
    const downloadItem = downloads.value.find(item => item.item.id === itemId)
    if (downloadItem) {
      downloadItem.status = status
      if (message) {
        downloadItem.message = message
      }
    }
  }

  function getDownloadStats() {
    const total = downloads.value.length
    const pending = downloads.value.filter(item => item.status === 'pending').length
    const downloading = downloads.value.filter(item => item.status === 'downloading').length
    const success = downloads.value.filter(item => item.status === 'success').length
    const error = downloads.value.filter(item => item.status === 'error').length

    return { total, pending, downloading, success, error }
  }

  function clearDownloads() {
    downloads.value = []
  }

  // 从URL解析文件扩展名
  function getFileExtension(url: string): string {
    try {
      const pathname = new URL(url).pathname
      const parts = pathname.split('.')
      if (parts.length > 1) {
        let ext = parts.pop()?.toLowerCase() || ''
        // 处理可能的查询参数或片段标识符残留
        ext = ext.split('?')[0].split('#')[0]
        // 基础验证，确保是常见的图片扩展名
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          return ext
        }
      }
    } catch (e) {
      console.warn("无法从URL解析扩展名:", url, e)
    }
    // 如果无法确定，默认为jpg
    return 'jpg'
  }

  // 清理文件名/文件夹名
  function sanitizePathSegment(name: string): string {
    // 移除或替换路径段中不允许的字符
    return name.replace(/[\\/:\*\?"<>\|\.]/g, '_').trim()
  }

  return {
    items,
    currentGameId,
    currentGame,
    parsedPageUrl,
    isAnalyzing,
    downloads,
    statusMessage,
    SUPPORTED_GAMES,
    setGameItems,
    setCurrentGame,
    startAnalyzing,
    finishAnalyzing,
    addDownloadTask,
    updateDownloadStatus,
    getDownloadStats,
    clearDownloads,
    getFileExtension,
    sanitizePathSegment
  }
})

// 为了兼容现有代码，保留旧的ships存储但使用新的gameStore
export interface ShipData {
  name: string
  sanitizedName: string
  wikiUrl: string
  avatarUrl: string
  hiresAvatarUrl: string
  roleAndType: string[]
  rarity: string
  faction: string
}

export const useShipStore = defineStore('ships', () => {
  const gameStore = useGameStore()

  const ships = computed(() => {
    if (gameStore.currentGameId === 'blhx') {
      // 将通用格式转换为ShipData格式
      return gameStore.items.map(item => ({
        name: item.name,
        sanitizedName: item.sanitizedName,
        wikiUrl: item.wikiUrl,
        avatarUrl: item.avatarUrl,
        hiresAvatarUrl: item.hiresImageUrl,
        roleAndType: item.properties.roleAndType || [],
        rarity: item.rarity,
        faction: item.category
      }))
    }
    return []
  })

  return {
    // 暴露原始gameStore的全部属性和方法，使其与旧代码兼容
    ships,
    parsedPageUrl: gameStore.parsedPageUrl,
    isAnalyzing: gameStore.isAnalyzing,
    downloads: gameStore.downloads,
    statusMessage: gameStore.statusMessage,
    setShips: (newShips: ShipData[]) => {
      // 转换ShipData格式到通用BaseGameItem格式
      const items: BaseGameItem[] = newShips.map(ship => ({
        id: ship.sanitizedName,
        name: ship.name,
        sanitizedName: ship.sanitizedName,
        wikiUrl: ship.wikiUrl,
        avatarUrl: ship.avatarUrl,
        hiresImageUrl: ship.hiresAvatarUrl,
        type: '舰船',
        rarity: ship.rarity,
        category: ship.faction,
        gameId: 'blhx',
        properties: {
          roleAndType: ship.roleAndType
        }
      }))
      gameStore.setGameItems(items)
    },
    startAnalyzing: gameStore.startAnalyzing,
    finishAnalyzing: gameStore.finishAnalyzing,
    addDownloadTask: (ship: ShipData) => {
      const item: BaseGameItem = {
        id: ship.sanitizedName,
        name: ship.name,
        sanitizedName: ship.sanitizedName,
        wikiUrl: ship.wikiUrl,
        avatarUrl: ship.avatarUrl,
        hiresImageUrl: ship.hiresAvatarUrl,
        type: '舰船',
        rarity: ship.rarity,
        category: ship.faction,
        gameId: 'blhx',
        properties: {
          roleAndType: ship.roleAndType
        }
      }
      gameStore.addDownloadTask(item)
    },
    updateDownloadStatus: (shipName: string, status: DownloadStatus, message?: string) => {
      gameStore.updateDownloadStatus(shipName, status, message)
    },
    getDownloadStats: gameStore.getDownloadStats,
    clearDownloads: gameStore.clearDownloads,
    getFileExtension: gameStore.getFileExtension,
    sanitizePathSegment: gameStore.sanitizePathSegment
  }
})