/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from './store/useAppStore'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import DropZone from './components/DropZone'
import FileList from './components/FileList'
import PlayerBar from './components/PlayerBar'
import SettingsPanel from './components/SettingsPanel'
import './i18n'
import './styles/tokens.css'

type ViewType = 'convert' | 'settings' | 'history'

function App(): JSX.Element {
  const { t } = useTranslation()
  const [currentView, setCurrentView] = useState<ViewType>('convert')
  const { settings, setSettings, isConverting } = useAppStore()

  // Load settings on mount
  useEffect(() => {
    window.ncmConverter?.getSettings().then((s) => {
      setSettings(s)
    }).catch(() => {
      // Settings store may not be ready, use defaults
    })
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't handle if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      // Ctrl+V: Import NCM files
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        if (isConverting) return
        window.ncmConverter.selectNcmFiles().then((paths: string[]) => {
          if (paths.length > 0) {
            const entries = paths.map((path: string) => {
              const parts = path.replace(/\\/g, '/').split('/')
              const fileName = parts[parts.length - 1]
              return {
                id: crypto.randomUUID(),
                filePath: path,
                fileName,
                fileSize: 0,
                status: 'pending' as const,
                progress: 0
              }
            })
            useAppStore.getState().addFiles(entries)
          }
        })
        return
      }

      // Delete or Backspace: Remove selected files
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useAppStore.getState()
        if (state.selectedIds.length > 0) {
          e.preventDefault()
          state.removeSelected()
        }
        return
      }

      // Ctrl+A: Select all files
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const state = useAppStore.getState()
        if (state.files.length > 0) {
          e.preventDefault()
          if (state.selectedIds.length === state.files.length) {
            state.deselectAll()
          } else {
            state.selectAll()
          }
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isConverting])

  const renderContent = (): JSX.Element => {
    switch (currentView) {
      case 'convert':
        return (
          <div className="flex flex-col flex-1 h-full">
            <DropZone />
            <FileList />
          </div>
        )
      case 'settings':
        return <SettingsPanel />
      case 'history':
        return (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
            {t('history.empty')}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col w-full h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />
        <main className="flex-1 flex flex-col overflow-hidden" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-6)' }}>
            {renderContent()}
          </div>
        </main>
      </div>
      <PlayerBar />

      {/* Copyright footer — always visible */}
      <div
        style={{
          height: '22px',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          backgroundColor: 'var(--surface-1)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          letterSpacing: '0.3px'
        }}
      >
        © 2026 Akiro
      </div>
    </div>
  )
}

export default App
