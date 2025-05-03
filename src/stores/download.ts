import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGameParserStore, GameItemView } from './gameParser'
import { fetchShipDetailImages } from '../services/parser'
import { message } from 'ant-design-vue'

export const useDownloadStore = defineStore('download', () => {
  // 使用游戏解析器存储
  const gameParserStore = useGameParserStore()

  // 下载状态
  const isDownloading = ref<boolean>(false)
  const downloadLimit = ref<number>(10)
  const downloadFolder = ref<string>('')
  const includeDetailImages = ref<boolean>(true)

  // 开始下载图片
  async function downloadImages() {
    if (gameParserStore.ships.length === 0) return

    // 获取要下载的数量
    const isDownloadingAll = downloadLimit.value >= gameParserStore.ships.length
    const limit = isDownloadingAll ? gameParserStore.ships.length : downloadLimit.value
    const shipsToDowload = gameParserStore.ships.slice(0, limit)

    gameParserStore.statusMessage = `开始下载 ${isDownloadingAll ? '全部' : limit} 个图片...`
    message.info(`开始下载 ${isDownloadingAll ? '全部' : limit} 个舰船图片${includeDetailImages.value ? '(含详情图)' : ''}...`)
    isDownloading.value = true

    // 清除之前的下载状态
    gameParserStore.clearDownloads()

    // 创建下载任务
    for (const ship of shipsToDowload) {
      gameParserStore.addDownloadTask(ship)
    }

    // 并发下载主图片
    await Promise.all(
      shipsToDowload.map(async (ship: GameItemView) => {
        try {
          gameParserStore.updateDownloadStatus(ship.sanitizedName, 'downloading')

          // 下载主头像
          const result = await window.electronAPI.downloadImage({
            imageUrl: ship.hiresAvatarUrl || ship.avatarUrl || '',
            characterName: ship.sanitizedName,
            faction: ship.faction,
            rarity: ship.rarity,
            customDownloadDir: downloadFolder.value || undefined
          })

          if (result.status === 'success') {
            gameParserStore.updateDownloadStatus(ship.sanitizedName, 'success', `已保存到 ${result.path}`)

            // 如果包含详情图，获取并下载详情图片
            if (includeDetailImages.value) {
              try {
                // 获取详情图片（如果尚未获取）
                if (!ship.detailFetched) {
                  const updatedShip = await fetchShipDetailImages(ship)

                  // 更新store中的舰船数据
                  const index = gameParserStore.ships.findIndex(s => s.sanitizedName === ship.sanitizedName)
                  if (index !== -1) {
                    const ships = [...gameParserStore.ships]
                    ships[index] = updatedShip
                    gameParserStore.setShips(ships)

                    // 更新下载任务中的舰船数据
                    const downloadIndex = gameParserStore.downloads.findIndex(item => item.item.sanitizedName === ship.sanitizedName)
                    if (downloadIndex !== -1) {
                      // 转换为BaseGameItem
                      const baseItem = {
                        id: updatedShip.sanitizedName,
                        name: updatedShip.name,
                        sanitizedName: updatedShip.sanitizedName,
                        wikiUrl: updatedShip.wikiUrl,
                        avatarUrl: updatedShip.avatarUrl,
                        hiresImageUrl: updatedShip.hiresAvatarUrl,
                        type: '舰船',
                        rarity: updatedShip.rarity,
                        category: updatedShip.faction,
                        gameId: 'blhx',
                        properties: updatedShip.properties || { roleAndType: updatedShip.roleAndType || [] },
                        detailFetched: updatedShip.detailFetched,
                        detailImages: updatedShip.detailImages
                      };
                      gameParserStore.downloads[downloadIndex].item = baseItem;
                    }

                    // 下载所有详情图片
                    if (updatedShip.detailImages && updatedShip.detailImages.length > 0) {
                      gameParserStore.updateDownloadStatus(ship.sanitizedName, 'downloading',
                        `正在下载详情图片(共${updatedShip.detailImages.length}张)...`)

                      for (const image of updatedShip.detailImages) {
                        await window.electronAPI.downloadImage({
                          imageUrl: image.url,
                          characterName: updatedShip.sanitizedName,
                          faction: updatedShip.faction,
                          rarity: updatedShip.rarity,
                          customDownloadDir: downloadFolder.value || undefined,
                          fileName: image.title
                        })
                      }

                      const savePath = result.path ? result.path.substring(0, result.path.lastIndexOf('\\')) : '下载目录'
                      gameParserStore.updateDownloadStatus(ship.sanitizedName, 'success',
                        `已下载 ${updatedShip.detailImages.length + 1} 张图片到 ${savePath}`)
                    }
                  }
                } else if (ship.detailImages && ship.detailImages.length > 0) {
                  // 已经获取过详情，直接下载
                  gameParserStore.updateDownloadStatus(ship.sanitizedName, 'downloading',
                    `正在下载详情图片(共${ship.detailImages.length}张)...`)

                  for (const image of ship.detailImages) {
                    await window.electronAPI.downloadImage({
                      imageUrl: image.url,
                      characterName: ship.sanitizedName,
                      faction: ship.faction,
                      rarity: ship.rarity,
                      customDownloadDir: downloadFolder.value || undefined,
                      fileName: image.title
                    })
                  }

                  const savePath = result.path ? result.path.substring(0, result.path.lastIndexOf('\\')) : '下载目录'
                  gameParserStore.updateDownloadStatus(ship.sanitizedName, 'success',
                    `已下载 ${ship.detailImages.length + 1} 张图片到 ${savePath}`)
                }
              } catch (detailError) {
                console.error(`下载 ${ship.name} 的详情图片失败:`, detailError)
                gameParserStore.updateDownloadStatus(ship.sanitizedName, 'error',
                  `主图已保存，但详情图下载失败: ${detailError instanceof Error ? detailError.message : String(detailError)}`)
              }
            }
          } else {
            throw new Error(result.message || '下载失败')
          }
        } catch (error) {
          console.error(`下载 ${ship.name} 失败:`, error)
          gameParserStore.updateDownloadStatus(ship.sanitizedName, 'error', (error instanceof Error ? error.message : String(error)))
        }
      })
    )

    // 获取统计信息
    const stats = gameParserStore.getDownloadStats()
    const statusText = `下载完成: ${stats.success} 成功, ${stats.error} 失败`
    gameParserStore.statusMessage = statusText
    if (stats.error > 0) {
      message.warning(statusText)
    } else {
      message.success(statusText)
    }
    isDownloading.value = false
  }

  // 重试下载方法
  async function retryDownload(shipName: string) {
    const downloadItem = gameParserStore.downloads.find(item => item.item.sanitizedName === shipName)
    if (!downloadItem) return

    // 使用类型转换，这样TypeScript就知道它是GameItemView类型
    const shipAsGameView: GameItemView = {
      name: downloadItem.item.name,
      sanitizedName: downloadItem.item.sanitizedName,
      wikiUrl: downloadItem.item.wikiUrl,
      avatarUrl: downloadItem.item.avatarUrl,
      hiresAvatarUrl: downloadItem.item.hiresImageUrl,
      rarity: downloadItem.item.rarity,
      faction: downloadItem.item.category,
      properties: downloadItem.item.properties,
      detailFetched: downloadItem.item.detailFetched,
      detailImages: downloadItem.item.detailImages,
      roleAndType: downloadItem.item.properties.roleAndType
    };

    try {
      // 更新状态为下载中
      gameParserStore.updateDownloadStatus(shipAsGameView.sanitizedName, 'downloading')
      message.info(`正在重试下载: ${shipAsGameView.name}`)

      const result = await window.electronAPI.downloadImage({
        imageUrl: shipAsGameView.hiresAvatarUrl || shipAsGameView.avatarUrl || '',
        characterName: shipAsGameView.sanitizedName,
        faction: shipAsGameView.faction,
        rarity: shipAsGameView.rarity,
        customDownloadDir: downloadFolder.value || undefined
      })

      if (result.status === 'success') {
        gameParserStore.updateDownloadStatus(shipAsGameView.sanitizedName, 'success', `已保存到 ${result.path}`)
        message.success(`重试成功: ${shipAsGameView.name}`)
      } else {
        throw new Error(result.message || '下载失败')
      }
    } catch (error) {
      console.error(`重试下载 ${shipAsGameView.name} 失败:`, error)
      gameParserStore.updateDownloadStatus(shipAsGameView.sanitizedName, 'error', (error instanceof Error ? error.message : String(error)))
      message.error(`重试失败: ${shipAsGameView.name}`)
    }
  }

  // 选择下载目录
  async function selectDownloadFolder() {
    try {
      const result = await window.electronAPI.selectDownloadDirectory()
      if (!result.canceled && result.filePaths.length > 0) {
        downloadFolder.value = result.filePaths[0]
        message.success('已选择下载目录: ' + result.filePaths[0])
      }
    } catch (error) {
      console.error('选择下载目录失败:', error)
      message.error('选择下载目录失败')
    }
  }

  return {
    isDownloading,
    downloadLimit,
    downloadFolder,
    includeDetailImages,
    downloadImages,
    retryDownload,
    selectDownloadFolder
  }
})