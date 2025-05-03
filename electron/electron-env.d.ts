/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: {
    on: (channel: string, listener: (...args: any[]) => void) => void
    off: (channel: string, ...args: any[]) => void
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>
    downloadImage: (params: {
      imageUrl: string
      characterName: string
      faction: string
      rarity: string
      imageIndex?: number
      customDownloadDir?: string
      fileName?: string
    }) => Promise<{ status: string; path?: string; message?: string }>
    selectDownloadDirectory: () => Promise<Electron.OpenDialogReturnValue>
    fetchPage: (url: string) => Promise<{ success: boolean; html?: string; error?: string }>
  }
}
