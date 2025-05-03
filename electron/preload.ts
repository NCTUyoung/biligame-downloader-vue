import { ipcRenderer, contextBridge } from 'electron'

// 定义下载图片所需的参数类型
interface DownloadImageParams {
  imageUrl: string
  characterName: string
  faction: string
  rarity: string
  imageIndex?: number
  customDownloadDir?: string
  fileName?: string
}

// 定义IPC渲染器接口
interface IpcRendererAPI {
  on: (channel: string, listener: (...args: any[]) => void) => void
  off: (channel: string, ...args: any[]) => void
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

// 定义暴露给渲染进程的API类型
interface ElectronAPI {
  on: (channel: string, listener: (...args: any[]) => void) => void
  off: (channel: string, ...args: any[]) => void
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
  downloadImage: (params: DownloadImageParams) => Promise<{ status: string; path?: string; message?: string }>
  selectDownloadDirectory: () => Promise<Electron.OpenDialogReturnValue>
  fetchPage: (url: string) => Promise<{ success: boolean; html?: string; error?: string }>
}

// --------- 暴露API给渲染进程 ---------
contextBridge.exposeInMainWorld('electronAPI', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // 下载图片的便捷封装
  async downloadImage(params: DownloadImageParams) {
    return ipcRenderer.invoke('download-image', params) as Promise<{ status: string; path?: string; message?: string }>
  },

  // 选择下载目录的便捷封装
  async selectDownloadDirectory() {
    return ipcRenderer.invoke('select-download-directory') as Promise<Electron.OpenDialogReturnValue>
  },

  // 添加页面抓取API封装
  async fetchPage(url: string) {
    return ipcRenderer.invoke('fetch-page', url) as Promise<{ success: boolean; html?: string; error?: string }>
  }
} as ElectronAPI)

// 为了保持向后兼容
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  }
} as IpcRendererAPI)
