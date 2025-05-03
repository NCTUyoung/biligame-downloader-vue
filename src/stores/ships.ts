import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义船舰数据类型
export interface ShipData {
  name: string
  sanitizedName: string
  wikiUrl: string
  avatarUrl: string
  hiresAvatarUrl: string
  roleAndType: string[]
  rarity: string
  faction: string
  detailImages: {
    title: string
    url: string
    type: 'portrait' | 'related'  // portrait=立绘, related=相关图片
    width?: number
    height?: number
    resolution?: string  // 例如 "1920x1080"
  }[]
  detailFetched: boolean
}

// 定义下载状态类型
export type DownloadStatus = 'pending' | 'downloading' | 'success' | 'error'

// 定义下载项类型
export interface DownloadItem {
  ship: ShipData
  status: DownloadStatus
  message?: string
}

export const useShipStore = defineStore('ships', () => {
  // 状态
  const ships = ref<ShipData[]>([])
  const parsedPageUrl = ref<string>('')
  const isAnalyzing = ref<boolean>(false)
  const downloads = ref<DownloadItem[]>([])
  const statusMessage = ref<string>('点击"解析页面"开始')

  // 方法
  function setShips(newShips: ShipData[]) {
    ships.value = newShips
    statusMessage.value = newShips.length > 0 ? '解析成功' : '未找到舰船数据'
  }

  function startAnalyzing(url: string) {
    isAnalyzing.value = true
    parsedPageUrl.value = url
    statusMessage.value = '正在解析页面...'
    ships.value = []
    downloads.value = []
  }

  function finishAnalyzing() {
    isAnalyzing.value = false
    if (ships.value.length > 0) {
      statusMessage.value = '解析成功'
    }
  }

  function addDownloadTask(ship: ShipData) {
    downloads.value.push({
      ship,
      status: 'pending'
    })
  }

  function updateDownloadStatus(shipName: string, status: DownloadStatus, message?: string) {
    const downloadItem = downloads.value.find(item => item.ship.sanitizedName === shipName)
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
    ships,
    parsedPageUrl,
    isAnalyzing,
    downloads,
    statusMessage,
    setShips,
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