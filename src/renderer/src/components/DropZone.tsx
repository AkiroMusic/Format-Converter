/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore, FileEntry } from '../store/useAppStore'

function DropZone(): JSX.Element {
  const { t } = useTranslation()
  const addFiles = useAppStore((s) => s.addFiles)
  const setOutputDir = useAppStore((s) => s.setOutputDir)
  const outputDir = useAppStore((s) => s.outputDir)
  const settings = useAppStore((s) => s.settings)
  const setOutputFormat = useAppStore((s) => s.setOutputFormat)
  const isConverting = useAppStore((s) => s.isConverting)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const handleFilesAdded = useCallback(
    (paths: string[]) => {
      const entries: FileEntry[] = paths.map((path) => {
        const parts = path.replace(/\\/g, '/').split('/')
        const fileName = parts[parts.length - 1]
        return {
          id: crypto.randomUUID(),
          filePath: path,
          fileName,
          fileSize: 0,
          status: 'pending',
          progress: 0
        }
      })
      addFiles(entries)
    },
    [addFiles]
  )

  const handleClick = useCallback(async () => {
    if (isConverting) return
    const paths = await window.ncmConverter.selectNcmFiles()
    if (paths.length > 0) {
      handleFilesAdded(paths)
    }
  }, [handleFilesAdded, isConverting])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      dragCounter.current = 0

      if (isConverting) return

      const files = Array.from(e.dataTransfer.files)
      const paths: string[] = []

      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.ncm')) {
          const path = window.ncmConverter.getPathForFile(file)
          if (path) paths.push(path)
        }
      }

      if (paths.length > 0) {
        // Ensure output directory is selected
        if (!outputDir) {
          window.ncmConverter.selectFolder().then((dir) => {
            if (dir) {
              setOutputDir(dir)
              handleFilesAdded(paths)
            }
          })
        } else {
          handleFilesAdded(paths)
        }
      }
    },
    [handleFilesAdded, isConverting, outputDir, setOutputDir]
  )

  const handleSelectOutputDir = useCallback(async () => {
    const dir = await window.ncmConverter.selectFolder()
    if (dir) {
      setOutputDir(dir)
    }
  }, [setOutputDir])

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      {/* Output directory selector */}
      <div
        className="flex items-center"
        style={{
          marginBottom: 'var(--space-3)',
          gap: 'var(--space-2)',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}
      >
        <span>{t('settings.outputDir')}:</span>
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: outputDir ? 'var(--text-primary)' : 'var(--text-tertiary)'
          }}
        >
          {outputDir || t('settings.placeholder')}
        </span>
        <button
          onClick={handleSelectOutputDir}
          style={{
            padding: '4px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {t('actions.browse')}
        </button>
      </div>

      {/* Output format selector */}
      <div style={{ marginBottom: 'var(--space-3)', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span style={{ marginBottom: 'var(--space-1)', display: 'block' }}>{t('settings.outputFormat')}:</span>
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

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: isConverting ? 'default' : 'pointer',
          transition: 'all 150ms ease',
          backgroundColor: isDragOver ? 'var(--surface-2)' : 'transparent',
          opacity: isConverting ? 0.5 : 1
        }}
      >
        {/* Upload icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 12px',
            color: isDragOver ? 'var(--accent)' : 'var(--text-tertiary)'
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {t('dropzone.title')}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t('dropzone.hint')}
        </div>
      </div>
    </div>
  )
}

export default DropZone
