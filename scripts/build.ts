import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { generate } from './og/generate'
import { checkBuild } from './og/check'

const require = createRequire(import.meta.url)
// tsx executes TypeScript; tsc separately enforces the strict tooling types.
async function run(script: string, args: string[]): Promise<void> {
  const child = spawn(process.execPath, [script, ...args], { stdio: 'inherit' })
  const code = await new Promise<number>((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve(signal ? 1 : code ?? 1))
  })
  if (code !== 0) process.exit(code)
}
await run(require.resolve('typescript/bin/tsc'), [
  '--project',
  'tsconfig.og.json'
])
await generate()
await run(require.resolve('next/dist/bin/next'), [
  'build',
  ...process.argv.slice(2)
])
await checkBuild()
