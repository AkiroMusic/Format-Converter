/**
 * NCM Format Converter
 * Copyright (c) 2026 Akiro. All rights reserved.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { parseNCM } from '../../core/ncmDecrypt'
import { writeID3Tags } from '../../core/id3Writer'
import { renderFilenameTemplate } from '../../core/template'

export function registerConvertHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(
    'convert:file',
    async (
      _event,
      payload: {
        filePath: string
        outputDir: string
        filenameTemplate: string
        outputFormat: string
        duplicateAction: string
      }
    ): Promise<{
      success: boolean
      outputPath?: string
      format?: string
      songName?: string
      artist?: string
      album?: string
      coverImageBase64?: string
      errorMessage?: string
    }> => {
      try {
        const { filePath, outputDir, filenameTemplate, outputFormat = 'source', duplicateAction = 'rename' } = payload
        const win = getMainWindow()

        const sendProgress = (progress: number): void => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('convert:progress', { filePath, progress })
          }
        }

        sendProgress(0.05)

        // Read the .ncm file
        const fileBuffer = await readFile(filePath)
        sendProgress(0.1)

        // Parse and decrypt
        const result = await parseNCM(fileBuffer.buffer, {
          onProgress: (p) => sendProgress(0.1 + p * 0.7)
        })

        sendProgress(0.8)

        // Write ID3 tags only for MP3 (bugfix per spec §I)
        const audioWithTags = result.format.ext === 'mp3'
          ? writeID3Tags(
              {
                title: result.songName,
                artist: result.artist,
                album: result.album,
                image: result.image
                  ? { imageBuffer: result.image, mime: result.imageMime || 'image/jpeg' }
                  : undefined
              },
              result.audioData
            )
          : result.audioData

        sendProgress(0.9)

        // Determine source format and handle outputFormat
        const sourceFormat = result.format.ext
        const targetFormat = outputFormat === 'source' ? sourceFormat : outputFormat

        // Format conversion is not yet supported; fall back to source format
        if (targetFormat !== sourceFormat) {
          // Aspirational — only source passthrough is supported for now
        }

        // Generate output filename from template
        const outputFileName = renderFilenameTemplate(filenameTemplate, {
          artist: result.artist,
          title: result.songName,
          album: result.album
        })
        const outputFileNameWithExt = `${outputFileName}.${sourceFormat}`
        let outputPath = join(outputDir, outputFileNameWithExt)

        // Ensure output directory exists
        const outputDirPath = dirname(outputPath)
        if (!existsSync(outputDirPath)) {
          mkdirSync(outputDirPath, { recursive: true })
        }

        // Handle duplicate files
        const ext = '.' + sourceFormat
        const basePath = outputPath.slice(0, -ext.length)
        if (duplicateAction === 'skip' && existsSync(outputPath)) {
          return { success: false, errorMessage: 'File already exists' }
        } else if (duplicateAction === 'rename') {
          let counter = 1
          while (existsSync(outputPath)) {
            outputPath = `${basePath} (${counter})${ext}`
            counter++
          }
        }
        // For 'overwrite', proceed as normal (writeFile overwrites by default)

        // Write to disk
        await writeFile(outputPath, Buffer.from(audioWithTags))
        sendProgress(1.0)

        // Prepare cover image as base64 for renderer
        let coverImageBase64: string | undefined
        if (result.image) {
          coverImageBase64 = Buffer.from(result.image).toString('base64')
        }

        return {
          success: true,
          outputPath,
          format: sourceFormat,
          songName: result.songName,
          artist: result.artist,
          album: result.album,
          coverImageBase64
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          success: false,
          errorMessage: message
        }
      }
    }
  )
}
