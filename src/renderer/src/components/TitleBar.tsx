/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import LanguageSwitcher from './LanguageSwitcher'

function TitleBar(): JSX.Element {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'other'>('other')

  useEffect(() => {
    // Detect platform via userAgent
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('win')) setPlatform('win32')
    else if (ua.includes('mac')) setPlatform('darwin')
    else setPlatform('other')
  }, [])

  // Apply stored theme on mount
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [])

  const handleToggleTheme = useCallback((): void => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
    setSettings({ theme: newTheme })
    document.documentElement.dataset.theme = newTheme
    window.ncmConverter?.setSettings({ theme: newTheme })
  }, [settings.theme, setSettings])

  const handleMinimize = (): void => {
    window.ncmConverter?.minimizeWindow()
  }

  const handleClose = (): void => {
    window.close()
  }

  return (
    <div
      className="flex items-center"
      style={{
        height: '36px',
        backgroundColor: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        WebkitAppRegion: 'drag',
        WebkitUserSelect: 'none',
        position: 'relative',
        flexShrink: 0
      }}
    >
      {/* macOS traffic light spacing (keeps left side balanced) */}
      {platform === 'darwin' && <div style={{ width: '78px', height: '100%' }} />}

      {/* Title / Wordmark — truly centered via absolute positioning */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Fraunces', serif",
          fontSize: '14px',
          color: 'var(--accent)',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap'
        }}
      >
        {t('app.title')}
      </div>

      {/* Right-side controls */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          WebkitAppRegion: 'no-drag'
        }}
      >
        <LanguageSwitcher />

        {/* Theme toggle */}
        <button
          onClick={handleToggleTheme}
          style={{
            width: '36px',
            height: '36px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            transition: 'color 150ms ease'
          }}
          title={t(settings.theme === 'dark' ? 'theme.light' : 'theme.dark')}
        >
          {settings.theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Windows window controls */}
        {platform === 'win32' && (
          <>
            <button
              onClick={handleMinimize}
              style={{
                width: '46px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}
              title={t('titlebar.minimize')}
            >
              ─
            </button>
            <button
              onClick={handleClose}
              style={{
                width: '46px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
              title={t('titlebar.close')}
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default TitleBar
