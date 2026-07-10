/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import LanguageSwitcher from './LanguageSwitcher'

function SettingsPanel(): JSX.Element {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const setOutputDir = useAppStore((s) => s.setOutputDir)
  const setOutputFormat = useAppStore((s) => s.setOutputFormat)
  const setConcurrentLimit = useAppStore((s) => s.setConcurrentLimit)
  const setDuplicateAction = useAppStore((s) => s.setDuplicateAction)

  const handleBrowseOutputDir = useCallback(async () => {
    const dir = await window.ncmConverter.selectFolder()
    if (dir) {
      setOutputDir(dir)
      setSettings({ outputDir: dir })
      window.ncmConverter.setSettings({ outputDir: dir })
    }
  }, [setOutputDir, setSettings])

  const handleTemplateChange = useCallback(
    (value: string) => {
      setSettings({ filenameTemplate: value })
      window.ncmConverter.setSettings({ filenameTemplate: value })
    },
    [setSettings]
  )

  const templatePresets = [
    { label: '{artist} - {title}', value: '{artist} - {title}' },
    { label: '{title}', value: '{title}' },
    { label: '{album}/{artist} - {title}', value: '{album}/{artist} - {title}' }
  ]

  return (
    <div style={{ padding: 'var(--space-4) 0' }}>
      <h2
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '20px',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-6)',
          fontWeight: 600
        }}
      >
        {t('settings.title')}
      </h2>

      {/* Language */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          {t('settings.language')}
        </label>
        <LanguageSwitcher />
      </div>

      {/* Output Directory */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          {t('settings.outputDir')}
        </label>
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <div
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              color: settings.outputDir ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '13px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {settings.outputDir || t('settings.placeholder')}
          </div>
          <button
            onClick={handleBrowseOutputDir}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit'
            }}
          >
            {t('actions.browse')}
          </button>
        </div>
      </div>

      {/* Filename Template */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          {t('settings.filenameTemplate')}
        </label>
        <input
          type="text"
          value={settings.filenameTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: "'IBM Plex Mono', monospace",
            outline: 'none',
            marginBottom: 'var(--space-2)'
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {templatePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleTemplateChange(preset.value)}
              style={{
                padding: '4px 10px',
                border: `1px solid ${settings.filenameTemplate === preset.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: settings.filenameTemplate === preset.value ? 'rgba(201, 162, 75, 0.1)' : 'transparent',
                color: settings.filenameTemplate === preset.value ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
          {t('settings.filenameHint')}
        </div>
      </div>

      {/* Output Format */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          {t('settings.outputFormat')}
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {[
            { value: 'source', label: t('format.source') },
            { value: 'mp3', label: t('format.mp3') },
            { value: 'flac', label: t('format.flac') },
            { value: 'wav', label: t('format.wav') },
            { value: 'ogg', label: t('format.ogg') }
          ].map((opt) => {
            const isActive = settings.outputFormat === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setOutputFormat(opt.value)
                  window.ncmConverter.setSettings({ outputFormat: opt.value })
                }}
                style={{
                  padding: '4px 10px',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(201, 162, 75, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Max Concurrent Conversions */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          {t('settings.concurrentLimit')}: <strong>{settings.concurrentLimit}</strong>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={settings.concurrentLimit}
          onChange={(e) => {
            const val = Number(e.target.value)
            setConcurrentLimit(val)
            window.ncmConverter.setSettings({ concurrentLimit: val })
          }}
          style={{
            width: '100%',
            accentColor: 'var(--accent)',
            height: '6px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* When File Exists */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          {t('settings.duplicateAction')}
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {[
            { value: 'overwrite', label: t('settings.duplicateOverwrite') },
            { value: 'skip', label: t('settings.duplicateSkip') },
            { value: 'rename', label: t('settings.duplicateRename') }
          ].map((opt) => {
            const isActive = settings.duplicateAction === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setDuplicateAction(opt.value)
                  window.ncmConverter.setSettings({ duplicateAction: opt.value })
                }}
                style={{
                  padding: '4px 10px',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(201, 162, 75, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
