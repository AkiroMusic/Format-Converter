/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { contextBridge, ipcRenderer, webUtils } from 'electron'

const ncmConverterAPI = {
  selectNcmFiles: (): Promise<string[]> =>
    ipcRenderer.invoke('dialog:selectNcmFiles'),

  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectFolder'),

  convertFile: (payload: {
    filePath: string
    outputDir: string
    filenameTemplate: string
    outputFormat: string
    duplicateAction: string
  }): Promise<{
    success: boolean
    outputPath?: string
    format?: string
    songName?: string
    artist?: string
    album?: string
    coverImageBase64?: string
    errorMessage?: string
  }> => ipcRenderer.invoke('convert:file', payload),

  onConvertProgress: (
    callback: (payload: { filePath: string; progress: number }) => void
  ): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { filePath: string; progress: number }) =>
      callback(payload)
    ipcRenderer.on('convert:progress', handler)
    return () => ipcRenderer.removeListener('convert:progress', handler)
  },

  revealInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('fs:revealInFolder', filePath),

  openFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('fs:openFile', filePath),

  getSettings: (): Promise<{
    language: string
    outputDir: string
    filenameTemplate: string
    theme: string
    outputFormat: string
    concurrentLimit: number
    duplicateAction: string
  }> => ipcRenderer.invoke('settings:get'),

  setSettings: (patch: Record<string, unknown>): Promise<void> =>
    ipcRenderer.invoke('settings:set', patch),

  openUrl: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openUrl', url),

  minimizeWindow: (): Promise<void> =>
    ipcRenderer.invoke('window:minimize'),

  getPathForFile: (file: File): string => {
    return webUtils.getPathForFile(file)
  }
}

contextBridge.exposeInMainWorld('ncmConverter', ncmConverterAPI)
