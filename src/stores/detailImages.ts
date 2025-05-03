import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useShipStore, ShipData } from './ships'
import { fetchShipDetailImages } from '../services/parser'
import { message } from 'ant-design-vue'

export const useDetailImagesStore = defineStore('detailImages', () => {
  const shipStore = useShipStore()

  // 当前选中的舰船
  const selectedShip = ref<ShipData | null>(null)

  // 正在加载详情
  const isLoadingDetails = ref(false)

  // 是否显示详情图片模态框
  const showDetailModal = ref(false)

  // 正在下载的图片
  const downloadingImages = ref<{[key: string]: boolean}>({})

  // 选择舰船并获取详情
  async function selectShipAndGetDetails(ship: ShipData) {
    selectedShip.value = ship
    showDetailModal.value = true

    if (!ship.detailFetched) {
      try {
        isLoadingDetails.value = true
        const updatedShip = await fetchShipDetailImages(ship)

        // 更新store中的舰船数据
        const index = shipStore.ships.findIndex(s => s.sanitizedName === ship.sanitizedName)
        if (index !== -1) {
          const ships = [...shipStore.ships]
          ships[index] = updatedShip
          shipStore.setShips(ships)
          selectedShip.value = updatedShip
        }
      } catch (error) {
        message.error(`获取${ship.name}详情图片失败`)
        console.error('获取详情图片失败:', error)
      } finally {
        isLoadingDetails.value = false
      }
    }
  }

  // 下载单张详情图片
  async function downloadDetailImage(ship: ShipData, imageUrl: string, imageTitle: string) {
    if (downloadingImages.value[imageUrl]) {
      return
    }

    try {
      downloadingImages.value = { ...downloadingImages.value, [imageUrl]: true }
      message.info(`开始下载: ${imageTitle}`)

      const result = await window.electronAPI.downloadImage({
        imageUrl: imageUrl,
        characterName: ship.sanitizedName,
        faction: ship.faction,
        rarity: ship.rarity,
        customDownloadDir: undefined,
        fileName: imageTitle
      })

      if (result.status === 'success') {
        message.success(`图片已保存到: ${result.path}`)
      } else {
        throw new Error(result.message || '下载失败')
      }
    } catch (error) {
      console.error(`下载图片失败:`, error)
      message.error(`下载失败: ${(error instanceof Error ? error.message : String(error))}`)
    } finally {
      // 从下载中状态移除
      const newDownloading = { ...downloadingImages.value }
      delete newDownloading[imageUrl]
      downloadingImages.value = newDownloading
    }
  }

  // 下载所有详情图片
  async function downloadAllDetailImages(ship: ShipData) {
    if (!ship.detailImages || ship.detailImages.length === 0) {
      message.warning(`${ship.name}没有详情图片`)
      return
    }

    message.info(`开始下载${ship.name}的${ship.detailImages.length}张详情图片`)

    for (const image of ship.detailImages) {
      await downloadDetailImage(ship, image.url, image.title)
    }

    message.success(`${ship.name}的详情图片下载完成`)
  }

  // 关闭模态框
  function closeDetailModal() {
    showDetailModal.value = false
    selectedShip.value = null
  }

  return {
    selectedShip,
    isLoadingDetails,
    showDetailModal,
    downloadingImages,
    selectShipAndGetDetails,
    downloadDetailImage,
    downloadAllDetailImages,
    closeDetailModal
  }
})