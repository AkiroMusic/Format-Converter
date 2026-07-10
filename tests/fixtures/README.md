# Test Fixtures

## NCM Sample File

To run the full regression test suite, place a real `.ncm` (NetEase Cloud Music) file in this directory.

### Instructions

1. Find any `.ncm` file from your NetEase Cloud Music cache directory:
   - **Windows**: `%USERPROFILE%\AppData\Local\Netease\CloudMusic\Cache\Cache\`
   - **macOS**: `~/Library/Containers/com.netease.163music/Data/Caches/onlineCache/`
   - **Linux**: `~/.cache/netease-cloud-music/Cache/`

2. Copy a `.ncm` file into this directory as `sample.ncm`

3. Run the tests:
   ```bash
   npm test
   ```

### Important Notes

- The test will **gracefully skip** the full NCM parsing test if no `sample.ncm` file is found.
- Unit tests for individual crypto primitives (AES, RC4, etc.) do NOT require a sample file — they run independently.
- The sample file is used only for integration testing of the complete `parseNCM` function.

### Byte-Level Verification

For Phase 1 regression testing, you'll need to:
1. Convert the sample `.ncm` file using the **original HTML tool** (`index.html`) — open it in a browser, convert, and download the result.
2. Convert the same file using the new desktop app.
3. Compare the two output files:
   ```bash
   fc /b original_output.mp3 new_output.mp3
   ```
   (For MP3 output, they should be byte-identical. For FLAC/M4A, the new version will differ by the absence of ID3 headers — this is expected and intentional.)
