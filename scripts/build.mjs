import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { generate } from './og/generate.mjs'
import { checkBuild } from './og/check.mjs'

const require = createRequire(import.meta.url)
await generate()
const child = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'build', ...process.argv.slice(2)],
  { stdio: 'inherit' }
)
const code = await new Promise(resolve =>
  child.on('exit', (code, signal) => resolve(signal ? 1 : code))
)
if (code !== 0) process.exit(code || 1)
await checkBuild()
