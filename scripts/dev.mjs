import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { watch } from 'chokidar'
import { generate } from './og/generate.mjs'

const require = createRequire(import.meta.url)
await generate()
const child = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)],
  { stdio: 'inherit' }
)
let timer
let running = false
let pending = false
async function update() {
  if (running) {
    pending = true
    return
  }
  running = true
  try {
    await generate()
  } catch (error) {
    console.error('OG generation failed:', error.message)
  }
  running = false
  if (pending) {
    pending = false
    await update()
  }
}
const watcher = watch(['pages', 'assets', 'lib/seo.mjs'], {
  ignoreInitial: true,
  // The document set is small. Polling also works on mounted filesystems and
  // environments where native filesystem notifications are unavailable.
  usePolling: true,
  interval: 500,
  awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
})
watcher.on('error', error => console.error('OG watcher error:', error))
watcher.on('all', () => {
  clearTimeout(timer)
  timer = setTimeout(update, 200)
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearTimeout(timer)
    watcher.close()
    child.kill(signal)
  })
}
child.on('exit', async (code, signal) => {
  clearTimeout(timer)
  await watcher.close()
  process.exit(signal ? 0 : code || 0)
})
