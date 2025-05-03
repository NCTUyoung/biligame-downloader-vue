import { app, BrowserWindow, session, ipcMain, dialog, protocol } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
// 直接使用应用根目录，不要使用上一级目录
process.env.APP_ROOT = app.getAppPath()
console.log('应用根目录:', process.env.APP_ROOT)

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
// 明确设置开发服务器URL，确保包含index.html
const VITE_DEV_SERVER_URL =
  process.env['VITE_DEV_SERVER_URL'] ?
  process.env['VITE_DEV_SERVER_URL'] :
  ''  // 在生产环境中不应使用开发服务器URL

const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
// 根据是否打包确定正确的渲染进程文件位置
// 对于打包后的应用，资源可能在resources/app.asar/dist或resources/dist
let RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

// 检查资源目录，处理打包情况
const possiblePaths = [
  RENDERER_DIST, // 默认开发路径
  path.join(process.env.APP_ROOT, '../dist'), // 相对于app.asar的路径
  path.join(process.env.APP_ROOT, '../../dist'), // 相对于app.asar的另一种可能路径
  path.join(process.env.APP_ROOT, 'resources', 'dist'), // 通过extraResources配置的路径
  path.join(process.env.APP_ROOT, '..', 'resources', 'dist'), // 打包后的资源可能的位置
  path.join(process.env.APP_ROOT, '..', '..', 'resources', 'dist'), // 另一种可能的打包路径
]

// 检查各种可能的路径
for (const testPath of possiblePaths) {
  try {
    if (require('fs').existsSync(path.join(testPath, 'index.html'))) {
      RENDERER_DIST = testPath
      console.log('找到有效渲染路径:', RENDERER_DIST)
      break
    }
  } catch (e) {
    console.error('检查路径错误:', testPath, e)
  }
}

// 导出为模块变量而不是使用 export 关键字
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL
exports.MAIN_DIST = MAIN_DIST
exports.RENDERER_DIST = RENDERER_DIST

let win: BrowserWindow | null

// 下载相关函数
// 从URL中提取或猜测文件扩展名
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

// 清理路径段名
function sanitizePathSegment(name: string): string {
  // 移除或替换路径段中不允许的字符
  return name.replace(/[\\/:\*\?"<>\|\.]/g, '_').trim()
}

// 设置IPC通信处理下载请求
ipcMain.handle('download-image', async (_, args) => {
  try {
    const { imageUrl, characterName, rarity, customDownloadDir, fileName } = args

    console.log('收到下载请求:', {
      imageUrl,
      characterName,
      rarity,
      fileName
    })

    // 获取下载目录（使用用户指定的目录或默认下载目录）
    const baseDir = customDownloadDir || app.getPath('downloads')

    // 创建干净的路径段
    const safeRarity = sanitizePathSegment(rarity || 'UnknownRarity')
    const safeCharacterName = sanitizePathSegment(characterName || `UnknownChar_${Date.now()}`)
    const fileExtension = getFileExtension(imageUrl)

    // 构建完整路径
    const targetDir = path.join(baseDir, safeRarity, safeCharacterName)
    const filename = fileName ?
      `${sanitizePathSegment(fileName)}.${fileExtension}` :
      `avatar.${fileExtension}`
    const fullPath = path.join(targetDir, filename)

    console.log(`下载路径: ${fullPath}`)

    // 确保目录存在
    await fs.mkdir(targetDir, { recursive: true })

    // 下载图片
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    await fs.writeFile(fullPath, Buffer.from(buffer))

    console.log(`图片已保存至: ${fullPath}`)
    return { status: 'success', path: fullPath }
  } catch (error) {
    console.error('下载图片失败:', error)
    return { status: 'error', message: (error as Error).message || '下载失败' }
  }
})

// 设置IPC通信以选择下载目录
ipcMain.handle('select-download-directory', async () => {
  if (!win) return { canceled: true }

  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: '选择下载目录',
    defaultPath: app.getPath('downloads')
  })

  return result
})

// 添加请求页面内容的API
ipcMain.handle('fetch-page', async (_, url) => {
  try {
    console.log(`主进程: 开始获取页面: ${url}`)

    // 使用Node.js的fetch API获取页面
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`)
    }

    const htmlContent = await response.text()
    console.log(`主进程: 页面获取成功，内容长度: ${htmlContent.length}`)

    return { success: true, html: htmlContent }
  } catch (error) {
    console.error('主进程: 获取页面失败:', error)
    return { success: false, error: (error as Error).message }
  }
})

function createWindow() {
  win = new BrowserWindow({
    width: 1200,  // 设置默认窗口大小
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // 确保上下文隔离
      nodeIntegration: false,  // 不在渲染进程中启用Node.js集成
      devTools: true  // 始终启用开发者工具，便于调试
    },
  })

  // 添加错误处理
  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription)

    // 尝试重新加载
    if (win) {
      console.log('尝试重新加载...')
      setTimeout(() => {
        // 检查是否是开发环境
        const isDev = process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'development'
        if (isDev && VITE_DEV_SERVER_URL) {
          win?.loadURL(VITE_DEV_SERVER_URL)
        } else {
          // 在生产环境中，尝试加载本地文件
          const fs = require('fs')
          const indexPath = path.join(RENDERER_DIST, 'index.html')
          if (fs.existsSync(indexPath)) {
            console.log(`尝试重新加载本地文件: ${indexPath}`)
            win?.loadFile(indexPath)
          }
        }
      }, 1000)
    }
  })

  // 渲染进程错误捕获
  win.webContents.on('render-process-gone', (_, details) => {
    console.error('渲染进程崩溃:', details.reason, details.exitCode)
  })

  // 未处理的渲染进程异常
  win.webContents.on('unresponsive', () => {
    console.error('渲染进程无响应')
  })

  // 启用渲染进程日志
  win.webContents.on('console-message', (_, level, message, line, sourceId) => {
    const levels = ['verbose', 'info', 'warning', 'error']
    console.log(`[${levels[level] || 'info'}] ${message} (${sourceId}:${line})`)
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    console.log('页面加载完成')
  })

  // 开发模式判断
  const isDev = process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'development'

  if (isDev) {
    console.log('开发模式: 加载开发服务器 URL:', VITE_DEV_SERVER_URL)

    // 允许加载本地资源
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      if (details.url.startsWith('file://')) {
        console.log('拦截文件请求:', details.url)
      }
      callback({})
    })

    win.loadURL(VITE_DEV_SERVER_URL)
    // 打开开发者工具
    win.webContents.openDevTools()
  } else {
    // 显示Window以便用户看到加载过程
    win.show()

    try {
      const fs = require('fs')
      const indexPath = path.join(RENDERER_DIST, 'index.html')

      console.log('----生产模式资源路径信息----')
      console.log('应用根目录:', app.getAppPath())
      console.log('渲染进程目录:', RENDERER_DIST)
      console.log('HTML路径:', indexPath)
      console.log('HTML文件存在:', fs.existsSync(indexPath))
      console.log('--------------------------')

      if (!fs.existsSync(indexPath)) {
        console.error(`错误: ${indexPath} 不存在`)
        return
      }

      console.log(`正在加载文件: ${indexPath}`)
      win.loadFile(indexPath)

      // 开发阶段可以打开开发者工具，发布时可以注释掉
      win.webContents.openDevTools()
    } catch (error) {
      console.error('加载渲染进程错误:', error)
    }
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // 注册file协议处理
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.replace('file:///', '')
    try {
      return callback(decodeURIComponent(url))
    } catch (error) {
      console.error('协议处理错误:', error)
    }
  })

  createWindow()
})
