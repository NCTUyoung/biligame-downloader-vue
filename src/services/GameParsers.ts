import { BaseGameItem } from '../stores/gameData'

/**
 * 清理文件名中不允许的字符
 */
function sanitizeFilename(name: string): string {
  // 移除或替换文件名中不允许的字符，例如 / \ : * ? " < > |
  return name.replace(/[\\/:\*\?"<>\|\.]/g, '_').trim()
}

/**
 * 游戏解析器接口
 */
export interface GameParser {
  parseHtmlContent(htmlContent: string): Promise<BaseGameItem[]>
  parsePageFromUrl(url: string): Promise<BaseGameItem[]>
}

/**
 * 碧蓝航线解析器
 */
export class BlhxParser implements GameParser {
  /**
   * 解析碧蓝航线页面HTML内容，提取舰船数据
   * @param htmlContent 页面的HTML内容
   * @returns 解析出的舰船数据数组
   */
  async parseHtmlContent(htmlContent: string): Promise<BaseGameItem[]> {
    // 创建一个DOM解析器来解析HTML内容
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    const extractedData: BaseGameItem[] = []

    // 找到所有包含舰船信息的div元素
    const characterElements = doc.querySelectorAll('.jntj-1.divsort')
    console.log(`找到了 ${characterElements.length} 个舰船元素`)

    characterElements.forEach((element, index) => {
      try {
        // 提取data-param属性
        const dataset = (element as HTMLElement).dataset
        const roleAndType = dataset.param1 ? dataset.param1.split(',').filter(s => s) : []
        const rarity = dataset.param2 || '未知稀有度'
        const faction = dataset.param3 || '未知阵营'

        // 提取名称和wiki链接
        let name = `未知角色_${index + 1}`
        let wikiUrl = ''

        const nameLinkElement = element.querySelector('.jntj-4 a')
        if (nameLinkElement) {
          // 可能包含<br>，取第一个
          const nameParts = nameLinkElement.innerHTML.split('<br>')
          name = nameParts[0].trim()
          wikiUrl = `https://patchwiki.biligame.com${nameLinkElement.getAttribute('href')}`
        } else {
          // 备用方案：尝试从图片alt获取名称
          const altNameElement = element.querySelector('.jntj-2 > img')
          if (altNameElement) {
            name = (altNameElement as HTMLImageElement).alt.replace('头像.jpg', '').trim()
          }
          // 备用方案：尝试从.jntj-3获取链接
          const altLinkElement = element.querySelector('.jntj-3 a')
          if (altLinkElement) {
            wikiUrl = `https://patchwiki.biligame.com${altLinkElement.getAttribute('href')}`
          }
        }
        const sanitizedName = sanitizeFilename(name)

        // 提取头像图片URL
        let avatarUrl = ''
        let hiresImageUrl = ''

        const avatarImgElement = element.querySelector('.jntj-2 > img')
        if (avatarImgElement) {
          avatarUrl = (avatarImgElement as HTMLImageElement).src
          // 尝试获取高分辨率图片URL
          hiresImageUrl = avatarUrl.replace(/\/thumb\//, '/').replace(/\/\d+px-.*/, '')
        }

        if (sanitizedName && hiresImageUrl) {
          const gameItem: BaseGameItem = {
            id: sanitizedName,
            name,
            sanitizedName,
            wikiUrl,
            avatarUrl,
            hiresImageUrl,
            type: '舰船',
            rarity,
            category: faction,
            gameId: 'blhx',
            properties: {
              roleAndType
            }
          }

          console.log(`解析成功: ${sanitizedName}`, gameItem)
          extractedData.push(gameItem)
        } else {
          console.warn(`在元素 ${index + 1} 中未能完整提取名称或图片URL。Name: ${name}, URL: ${hiresImageUrl}`)
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
  async parsePageFromUrl(url: string): Promise<BaseGameItem[]> {
    try {
      console.log(`开始获取页面: ${url}`)

      // 使用主进程的fetchPage API避免CORS问题
      const result = await window.electronAPI.fetchPage(url)

      if (!result.success || !result.html) {
        throw new Error(result.error || '获取页面失败')
      }

      const htmlContent = result.html
      console.log(`页面获取成功，内容长度: ${htmlContent.length}`)

      return this.parseHtmlContent(htmlContent)
    } catch (error) {
      console.error('获取或解析页面时出错:', error)
      throw error
    }
  }
}

/**
 * FGO解析器占位实现
 */
export class FgoParser implements GameParser {
  async parseHtmlContent(_htmlContent: string): Promise<BaseGameItem[]> {
    // 这里实现FGO特有的解析逻辑
    // 作为示例，返回空数组
    console.log('FGO解析器尚未完全实现')
    return []
  }

  async parsePageFromUrl(url: string): Promise<BaseGameItem[]> {
    try {
      console.log(`开始获取页面: ${url}`)

      // 使用主进程的fetchPage API避免CORS问题
      const result = await window.electronAPI.fetchPage(url)

      if (!result.success || !result.html) {
        throw new Error(result.error || '获取页面失败')
      }

      const htmlContent = result.html
      console.log(`页面获取成功，内容长度: ${htmlContent.length}`)

      return this.parseHtmlContent(htmlContent)
    } catch (error) {
      console.error('获取或解析页面时出错:', error)
      throw error
    }
  }
}

/**
 * 游戏解析器工厂，根据游戏ID返回对应的解析器
 */
export class GameParserFactory {
  static getParser(gameId: string): GameParser {
    switch (gameId) {
      case 'blhx':
        return new BlhxParser()
      case 'fgo':
        return new FgoParser()
      default:
        console.warn(`未找到游戏 ${gameId} 的解析器，使用默认解析器`)
        return new BlhxParser()
    }
  }
}

/**
 * 通用解析函数，从URL解析页面内容
 * @param url 要解析的页面URL
 * @param gameId 游戏ID
 * @returns 解析出的游戏数据数组
 */
export async function parsePageFromUrl(url: string, gameId: string = 'blhx'): Promise<BaseGameItem[]> {
  const parser = GameParserFactory.getParser(gameId)
  return parser.parsePageFromUrl(url)
}