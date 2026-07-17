// Pre-downloads Whisper model for bundling into the installer.
// Run after `npm install`:  node scripts/download-whisper.js [model]
// Output lands in build/whisper-models/ (picked up by extraResources).

const path = require('path')
const fs   = require('fs')

const MODEL = process.argv[2] || 'Xenova/whisper-base.en'
const OUT   = path.join(__dirname, '..', 'build', 'whisper-models')

fs.mkdirSync(OUT, { recursive: true })
console.log(`Downloading ${MODEL} → ${OUT}`)

const { pipeline, env } = require('@xenova/transformers')
env.cacheDir = OUT
env.allowRemoteModels = true

pipeline('automatic-speech-recognition', MODEL, {
  quantized: true,
  progress_callback: (p) => {
    if (p.status === 'downloading') {
      const pct = p.total ? Math.round((p.loaded / p.total) * 100) : '?'
      process.stdout.write(`\r  ${p.file}  ${pct}%   `)
    } else if (p.status === 'done') {
      process.stdout.write(`\r  ${p.file}  done        \n`)
    }
  },
}).then(() => {
  console.log(`\nModel ready in ${OUT}`)
  process.exit(0)
}).catch(e => {
  console.error(e)
  process.exit(1)
})
