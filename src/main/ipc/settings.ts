/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { ipcMain } from 'electron'
import { SimpleStore } from '../simpleStore'

interface AppSettings {
  language: string
  outputDir: string
  filenameTemplate: string
  theme: string
}

const store = new SimpleStore<AppSettings>({
  name: 'settings',
  defaults: {
    language: 'zh-CN',
    outputDir: '',
    filenameTemplate: '{artist} - {title}',
    theme: 'dark'
  }
})

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async (): Promise<AppSettings> => {
    return store.store
  })

  ipcMain.handle('settings:set', async (_event, patch: Partial<AppSettings>): Promise<void> => {
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) {
        store.set(key as keyof AppSettings, value)
      }
    }
  })
}

export { store as settingsStore }
