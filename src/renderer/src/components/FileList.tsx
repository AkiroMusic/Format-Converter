/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import FileItem from './FileItem'

function FileList(): JSX.Element {
  const { t } = useTranslation()
  const files = useAppStore((s) => s.files)
  const stats = useAppStore((s) => s.stats)
  const isConverting = useAppStore((s) => s.isConverting)
  const outputDir = useAppStore((s) => s.outputDir)
  const selectedIds = useAppStore((s) => s.selectedIds)
  const clearAll = useAppStore((s) => s.clearAll)
  const setConverting = useAppStore((s) => s.setConverting)
  const setFileSuccess = useAppStore((s) => s.setFileSuccess)
  const setFileError = useAppStore((s) => s.setFileError)
  const updateFileProgress = useAppStore((s) => s.updateFileProgress)
  const selectAll = useAppStore((s) => s.selectAll)
  const deselectAll = useAppStore((s) => s.deselectAll)
  const removeSelected = useAppStore((s) => s.removeSelected)
  const retryAll = useAppStore((s) => s.retryAll)
  const moveFile = useAppStore((s) => s.moveFile)

  const [draggedFileId, setDraggedFileId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const checkboxRef = useRef<HTMLInputElement>(null)

  const allSelected = files.length > 0 && selectedIds.length === files.length
  const someSelected = selectedIds.length > 0 && !allSelected
  const hasErrors = files.some((f) => f.status === 'error')

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const convertAll = useCallback(async () => {
    if (files.length === 0 || isConverting) return
    let dir = outputDir
    if (!dir) {
      dir = await window.ncmConverter.selectFolder()
      if (!dir) return
      useAppStore.getState().setOutputDir(dir)
    }

    setConverting(true)

    const unsub = window.ncmConverter.onConvertProgress(({ filePath, progress }) => {
      updateFileProgress(filePath, progress)
    })

    const pendingFiles = files.filter((f) => f.status === 'pending')
    const limit = useAppStore.getState().settings.concurrentLimit || 3

    for (let i = 0; i < pendingFiles.length; i += limit) {
      const batch = pendingFiles.slice(i, i + limit)
      const results = await Promise.all(
        batch.map((file) =>
          window.ncmConverter
            .convertFile({
              filePath: file.filePath,
              outputDir: dir || '',
              filenameTemplate: useAppStore.getState().settings.filenameTemplate,
              outputFormat: useAppStore.getState().settings.outputFormat,
              duplicateAction: useAppStore.getState().settings.duplicateAction
            })
            .then((result) => ({ file, result }))
        )
      )

      for (const { file, result } of results) {
        if (result.success) {
          setFileSuccess(file.filePath, {
            format: result.format,
            songName: result.songName,
            artist: result.artist,
            album: result.album,
            coverImageBase64: result.coverImageBase64,
            outputPath: result.outputPath
          })
        } else {
          setFileError(file.filePath, result.errorMessage || t('error.convertFailed'))
        }
      }
    }

    unsub()
    setConverting(false)
  }, [files, isConverting, outputDir, setConverting, setFileSuccess, setFileError, updateFileProgress, t])

  const clearAllHandler = useCallback(() => {
    if (files.length === 0) return
    clearAll()
  }, [files, clearAll])

  const clearCompletedHandler = useCallback(() => {
    const state = useAppStore.getState()
    state.files.forEach((f) => {
      if (f.status === 'success' || f.status === 'error') {
        state.removeFile(f.id)
      }
    })
  }, [])

  const handleSelectAllToggle = useCallback(() => {
    if (allSelected) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [allSelected, selectAll, deselectAll])

  // Drag-to-reorder handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, fileId: string) => {
      setDraggedFileId(fileId)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', fileId)
      const el = e.currentTarget
      requestAnimationFrame(() => {
        el.style.opacity = '0.4'
      })
    },
    []
  )

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    setDraggedFileId(null)
    setDragOverIndex(null)
    e.currentTarget.style.opacity = '1'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const container = e.currentTarget
    const items = container.querySelectorAll<HTMLDivElement>('[data-file-index]')
    let insertIndex = items.length
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      if (e.clientY < midY) {
        insertIndex = i
        break
      }
    }
    setDragOverIndex(insertIndex)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverIndex(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const fromId = e.dataTransfer.getData('text/plain')
      if (!fromId) return

      const fromIndex = files.findIndex((f) => f.id === fromId)
      if (fromIndex === -1) return

      let toIndex = dragOverIndex ?? files.length - 1
      if (fromIndex < toIndex) {
        toIndex = toIndex - 1
      }

      if (fromIndex !== toIndex) {
        moveFile(fromIndex, toIndex)
      }

      setDraggedFileId(null)
      setDragOverIndex(null)
    },
    [files, dragOverIndex, moveFile]
  )

  if (files.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          padding: 'var(--space-8)',
          color: 'var(--text-tertiary)',
          fontSize: '14px'
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '12px', opacity: 0.5 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        {t('status.noFiles')}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Select All row */}
      <div
        className="flex items-center"
        style={{
          padding: '0 16px 8px',
          gap: '8px',
          minHeight: '32px'
        }}
      >
        <label
          className="flex items-center"
          style={{ gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', userSelect: 'none' }}
        >
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAllToggle}
          />
          {t('actions.selectAll')}
        </label>
        <div style={{ flex: 1 }} />
        <button
          onClick={removeSelected}
          disabled={selectedIds.length === 0}
          style={{
            height: '28px',
            padding: '0 12px',
            border: 'none',
            borderRadius: '14px',
            cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: 'var(--surface-2)',
            color: selectedIds.length === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            opacity: selectedIds.length === 0 ? 0.5 : 1,
            transition: 'all 150ms ease'
          }}
        >
          {t('actions.removeSelected', { count: selectedIds.length })}
        </button>
        {hasErrors && (
          <button
            onClick={retryAll}
            style={{
              height: '28px',
              padding: '0 12px',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: 'var(--surface-2)',
              color: 'var(--error)',
              transition: 'all 150ms ease'
            }}
          >
            {t('actions.retryAll')}
          </button>
        )}
      </div>

      {/* File list with drag-to-reorder */}
      <div
        style={{
          maxHeight: '360px',
          overflowY: 'auto',
          flex: 1
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.map((file, index) => (
          <div
            key={file.id}
            draggable={!isConverting}
            data-file-index={index}
            onDragStart={(e) => handleDragStart(e, file.id)}
            onDragEnd={handleDragEnd}
            style={{
              borderTop: dragOverIndex === index && draggedFileId !== file.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginTop: dragOverIndex === index && draggedFileId !== file.id ? '-2px' : '0',
              transition: 'border-color 100ms ease, opacity 150ms ease'
            }}
          >
            <FileItem file={file} index={index} />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div
        className="flex items-center justify-center"
        style={{
          gap: 'var(--space-3)',
          padding: 'var(--space-4) 0',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={convertAll}
          disabled={isConverting || files.every((f) => f.status !== 'pending')}
          style={{
            height: '40px',
            padding: '0 24px',
            border: 'none',
            borderRadius: '20px',
            cursor: isConverting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--accent)',
            color: '#12141A',
            opacity: isConverting ? 0.6 : 1,
            transition: 'all 150ms ease'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {t('actions.convertAll')}
        </button>
        <button
          onClick={clearAllHandler}
          disabled={files.length === 0}
          style={{
            height: '40px',
            padding: '0 24px',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            transition: 'all 150ms ease'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          {t('actions.clear')}
        </button>
        <button
          onClick={clearCompletedHandler}
          disabled={!files.some((f) => f.status === 'success' || f.status === 'error')}
          style={{
            height: '40px',
            padding: '0 24px',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            transition: 'all 150ms ease'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {t('actions.clearCompleted')}
        </button>
      </div>

      {/* Stats */}
      {(stats.total > 0 || stats.success > 0 || stats.fail > 0) && (
        <div
          className="flex justify-center"
          style={{
            gap: 'var(--space-8)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('stats.total')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>
              {stats.success}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('stats.success')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--error)' }}>
              {stats.fail}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('stats.fail')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileList
