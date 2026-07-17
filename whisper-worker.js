'use strict';
// Runs in Node.js worker_threads context.
// Whisper model is bundled inside the app — no internet required at any point.

const { parentPort } = require('worker_threads');
const path = require('path');

// Point transformers.js at the bundled model directory and disable all remote fetching
const { env } = require('@xenova/transformers');
env.localModelPath = path.join(__dirname, 'models');
env.allowRemoteModels = false;

let transcriber = null;

async function initModel(modelId) {
  const { pipeline } = require('@xenova/transformers');

  parentPort.postMessage({ type: 'status', text: 'Loading AI model…' });

  transcriber = await pipeline(
    'automatic-speech-recognition',
    modelId || 'Xenova/whisper-small.en',
    {
      quantized: true,
      progress_callback: (p) => {
        if (p.status === 'initiate') {
          parentPort.postMessage({ type: 'dl_start', file: p.file });
        } else if (p.status === 'progress') {
          parentPort.postMessage({
            type: 'dl_progress',
            file: p.file,
            loaded: p.loaded || 0,
            total: p.total || 1,
            pct: Math.round(((p.loaded || 0) / (p.total || 1)) * 100)
          });
        } else if (p.status === 'done') {
          parentPort.postMessage({ type: 'dl_done', file: p.file });
        }
      }
    }
  );

  parentPort.postMessage({ type: 'ready' });
}

async function transcribeChunk({ id, buffer, speakerId }) {
  if (!transcriber) {
    parentPort.postMessage({ type: 'error', message: 'Model not ready' });
    return;
  }

  const audio = new Float32Array(buffer);

  try {
    const result = await transcriber(audio, {
      sampling_rate: 16000,
      language: 'english',
      task: 'transcribe',
      return_timestamps: false
    });

    const text = (result.text || '').trim();
    parentPort.postMessage({ type: 'result', id, text, speakerId });
  } catch (err) {
    parentPort.postMessage({ type: 'error', message: err.message });
  }
}

parentPort.on('message', async (msg) => {
  switch (msg.type) {
    case 'init':
      await initModel(msg.model).catch(err => {
        parentPort.postMessage({ type: 'error', message: 'Model load failed: ' + err.message });
      });
      break;
    case 'transcribe':
      await transcribeChunk(msg);
      break;
  }
});
