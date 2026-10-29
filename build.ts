import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })

const result = await Bun.build({
  entrypoints: ['src/main.ts'],
  outdir: 'dist',
  target: 'browser',
  format: 'iife',
  minify: true,
  naming: '[name].js',
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

for (const file of await readdir('public')) {
  await copyFile(`public/${file}`, `dist/${file}`)
}

console.log(`built dist/ (${result.outputs.map(o => o.path).join(', ')})`)
