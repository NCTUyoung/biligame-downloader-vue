/// <reference types="vite/client" />

// 定义下载图片所需的参数类型
interface DownloadImageParams {
  imageUrl: string
  characterName: string
  faction: string
  rarity: string
  imageIndex?: number
  customDownloadDir?: string
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

// 为了TypeScript识别.vue文件
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
