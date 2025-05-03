import { ShipData } from '../stores/ships'

/**
 * 清理文件名中不允许的字符
 */
function sanitizeFilename(name: string): string {
  // 移除或替换文件名中不允许的字符，例如 / \ : * ? " < > |
  return name.replace(/[\\/:\*\?"<>\|]/g, '_').trim()
}

/**
 * 解析页面HTML内容，提取舰船数据
 * @param htmlContent 页面的HTML内容
 * @returns 解析出的舰船数据数组
 */
export async function parseHtmlContent(htmlContent: string): Promise<ShipData[]> {
  // 创建一个DOM解析器来解析HTML内容
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')

  const extractedData: ShipData[] = []

  // 找到所有包含舰船信息的div元素
  const characterElements = doc.querySelectorAll('.jntj-1.divsort')
  console.log(`找到了 ${characterElements.length} 个舰船元素`)

  characterElements.forEach((element, index) => {
    try {
      const data = {} as Partial<ShipData>
      const dataset = (element as HTMLElement).dataset

      // 提取data-param属性
      data.roleAndType = dataset.param1 ? dataset.param1.split(',').filter(s => s) : []
      data.rarity = dataset.param2 || '未知稀有度'
      data.faction = dataset.param3 || '未知阵营'

      // 提取名称和wiki链接
      const nameLinkElement = element.querySelector('.jntj-4 a')
      if (nameLinkElement) {
        // 可能包含<br>，取第一个
        const nameParts = nameLinkElement.innerHTML.split('<br>')
        data.name = nameParts[0].trim()
        data.wikiUrl = `https://wiki.biligame.com${nameLinkElement.getAttribute('href')}`
      } else {
        // 备用方案：尝试从图片alt获取名称
        const altNameElement = element.querySelector('.jntj-2 > img')
        if (altNameElement) {
          data.name = (altNameElement as HTMLImageElement).alt.replace('头像.jpg', '').trim()
        } else {
          data.name = `未知角色_${index + 1}`
        }
        // 备用方案：尝试从.jntj-3获取链接
        const altLinkElement = element.querySelector('.jntj-3 a')
        if (altLinkElement) {
          data.wikiUrl = `https://wiki.biligame.com${altLinkElement.getAttribute('href')}`
        }
      }
      data.sanitizedName = sanitizeFilename(data.name!) // 清理文件名

      // 提取头像图片URL
      const avatarImgElement = element.querySelector('.jntj-2 > img')
      if (avatarImgElement) {
        data.avatarUrl = (avatarImgElement as HTMLImageElement).src
        // 尝试获取高分辨率图片URL
        data.hiresAvatarUrl = data.avatarUrl.replace(/\/thumb\//, '/').replace(/\/\d+px-.*/, '')
      } else {
        data.avatarUrl = ''
        data.hiresAvatarUrl = ''
      }

      // 初始化详情相关字段
      data.detailImages = []
      data.detailFetched = false

      if (data.sanitizedName && data.hiresAvatarUrl) {
        console.log(`解析成功: ${data.sanitizedName}`, data)
        extractedData.push(data as ShipData)
      } else {
        console.warn(`在元素 ${index + 1} 中未能完整提取名称或图片URL。Name: ${data.name}, URL: ${data.hiresAvatarUrl}`)
      }
    } catch (e) {
      console.error(`处理第 ${index + 1} 个元素时出错:`, e)
    }
  })

  console.log(`解析完成，共提取数据: ${extractedData.length} 条`)
  return extractedData
}

/**
 * 从指定URL获取页面内容并解析
 * @param url 要解析的页面URL
 * @returns 解析出的舰船数据数组
 */
export async function parsePageFromUrl(url: string): Promise<ShipData[]> {
  try {
    console.log(`开始获取页面: ${url}`)

    // 使用主进程的fetchPage API避免CORS问题
    const result = await window.electronAPI.fetchPage(url)

    if (!result.success || !result.html) {
      throw new Error(result.error || '获取页面失败')
    }

    const htmlContent = result.html
    console.log(`页面获取成功，内容长度: ${htmlContent.length}`)

    return parseHtmlContent(htmlContent)
  } catch (error) {
    console.error('获取或解析页面时出错:', error)
    throw error
  }
}

/**
 * 获取舰船详情页面的图片
 * @param ship 舰船数据
 * @returns 更新后的舰船数据
 */
export async function fetchShipDetailImages(ship: ShipData): Promise<ShipData> {
  try {
    console.log(`获取舰船 ${ship.name} 的详情图片...`)

    // 已经获取过详情，直接返回
    if (ship.detailFetched) {
      return ship
    }

    // 获取详情页内容
    const result = await window.electronAPI.fetchPage(ship.wikiUrl)
    if (!result.success || !result.html) {
      throw new Error(result.error || '获取详情页失败')
    }

    const htmlContent = result.html
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    const detailImages: ShipData['detailImages'] = []

    // 1. 获取TabContainer中的立绘
    const tabContainers = doc.querySelectorAll('.TabContainer')
    console.log(`找到TabContainer: ${tabContainers.length}个`)

    tabContainers.forEach(container => {
      // 检查是否在立绘部分（通过查找上方的标题）
      let isPortraitSection = false
      let prevEl = container.previousElementSibling
      while (prevEl && !isPortraitSection) {
        if (prevEl.tagName === 'TD' && prevEl.textContent?.includes('立绘')) {
          isPortraitSection = true
        } else if (prevEl.tagName === 'H2' && prevEl.textContent?.includes('立绘')) {
          isPortraitSection = true
        }
        prevEl = prevEl.previousElementSibling
      }

      // 处理容器内的所有图片
      const images = container.querySelectorAll('img')
      images.forEach(img => {
        let imgUrl = img.src
        if (imgUrl.includes('/thumb/')) {
          imgUrl = imgUrl.replace(/\/thumb\//, '/').replace(/\/\d+px-.*/, '')
        }

        // 获取原始图片尺寸信息
        const width = Number(img.getAttribute('data-file-width')) || img.naturalWidth || 0
        const height = Number(img.getAttribute('data-file-height')) || img.naturalHeight || 0
        const resolution = width && height ? `${width}x${height}` : undefined

        if (img.naturalWidth > 100 || img.width > 100) {
          detailImages.push({
            title: img.alt || `${ship.name}_立绘_${detailImages.length + 1}`,
            url: imgUrl,
            type: 'portrait',
            width,
            height,
            resolution
          })
        }
      })
    })

    // 2. 获取gallery中的相关图片
    const galleries = doc.querySelectorAll('.gallery')
    console.log(`找到gallery: ${galleries.length}个`)

    galleries.forEach(gallery => {
      const images = gallery.querySelectorAll('img')
      images.forEach(img => {
        let imgUrl = img.src
        if (imgUrl.includes('/thumb/')) {
          imgUrl = imgUrl.replace(/\/thumb\//, '/').replace(/\/\d+px-.*/, '')
        }

        // 尝试获取图片描述
        let title = img.alt || ''
        const textElement = img.closest('.gallerybox')?.querySelector('.gallerytext p')
        if (textElement && textElement.textContent) {
          title = textElement.textContent.trim()
        }

        // 获取原始图片尺寸信息
        const width = Number(img.getAttribute('data-file-width')) || img.naturalWidth || 0
        const height = Number(img.getAttribute('data-file-height')) || img.naturalHeight || 0
        const resolution = width && height ? `${width}x${height}` : undefined

        if (img.naturalWidth > 100 || img.width > 100) {
          detailImages.push({
            title: title || `${ship.name}_相关图片_${detailImages.length + 1}`,
            url: imgUrl,
            type: 'related',
            width,
            height,
            resolution
          })
        }
      })
    })

    // 去重，避免重复图片
    const uniqueUrls = new Set<string>()
    const uniqueImages = detailImages.filter(img => {
      if (uniqueUrls.has(img.url)) {
        return false
      }
      uniqueUrls.add(img.url)
      return true
    })

    console.log(`获取到 ${ship.name} 的详情图片 ${uniqueImages.length} 张`)

    // 更新舰船数据
    return {
      ...ship,
      detailImages: uniqueImages,
      detailFetched: true
    }
  } catch (error) {
    console.error(`获取舰船 ${ship.name} 详情图片失败:`, error)
    // 即使出错，也标记为已获取，避免重复获取
    return {
      ...ship,
      detailFetched: true
    }
  }
}