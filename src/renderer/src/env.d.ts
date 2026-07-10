/// <reference types="vite/client" />

/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

interface NcmConverterAPI {
  selectNcmFiles(): Promise<string[]>
  selectFolder(): Promise<string | null>
  convertFile(payload: {
    filePath: string
    outputDir: string
    filenameTemplate: string
  }): Promise<{
    success: boolean
    outputPath?: string
    format?: string
    songName?: string
    artist?: string
    album?: string
    coverImageBase64?: string
    errorMessage?: string
  }>
  onConvertProgress(
    callback: (payload: { filePath: string; progress: number }) => void
  ): () => void
  revealInFolder(filePath: string): Promise<void>
  openFile(filePath: string): Promise<void>
  getSettings(): Promise<{
    language: string
    outputDir: string
    filenameTemplate: string
    theme: string
  }>
  setSettings(patch: Record<string, unknown>): Promise<void>
  openUrl(url: string): Promise<void>
  getPathForFile(file: File): string
  minimizeWindow: () => Promise<void>
}

declare global {
  interface Window {
    ncmConverter: NcmConverterAPI
  }
}
