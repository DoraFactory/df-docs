import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sizeOf from 'image-size'
import { readPages } from './content.mjs'
import { loadAssets, renderCard, WIDTH, HEIGHT } from './render.mjs'

async function writeIfChanged(filename, value) {
  if ((await readFile(filename, 'utf8').catch(() => '')) === value) return
  await writeFile(`${filename}.tmp`, value)
  await rename(`${filename}.tmp`, filename)
}

export async function generate(root = process.cwd()) {
  const pages = await readPages(root)
  const generated = path.join(root, '.generated')
  const directory = path.join(root, 'public/og')
  await Promise.all([
    mkdir(generated, { recursive: true }),
    mkdir(directory, { recursive: true })
  ])
  const cache = JSON.parse(
    await readFile(path.join(generated, 'og-cache.json'), 'utf8').catch(
      () => '{}'
    )
  )
  const nextCache = {}
  const assets = await loadAssets(root)
  let rendered = 0
  for (const [route, page] of Object.entries(pages)) {
    const slug =
      route === '/'
        ? 'home'
        : route
            .slice(1)
            .replace(/[^\p{L}\p{N}-]+/gu, '-')
            .slice(0, 100)
    let image
    if (page.customImage) {
      const input = await readFile(
        path.join(root, 'public', `.${page.customImage}`)
      )
      const dimensions = sizeOf(input)
      if (!['png', 'jpg', 'webp'].includes(dimensions.type))
        throw new Error(`${route}: ogImage must be PNG, JPEG or WebP`)
      const hash = createHash('sha256').update(input).digest('hex').slice(0, 16)
      const name = `${slug}.${hash}.${dimensions.type}`
      await writeFile(path.join(directory, name), input)
      image = {
        url: `/og/${name}`,
        width: dimensions.width,
        height: dimensions.height,
        type:
          dimensions.type === 'jpg' ? 'image/jpeg' : `image/${dimensions.type}`,
        alt: page.imageAlt
      }
      delete page.customImage
      delete page.imageAlt
    } else {
      const inputHash = createHash('sha256')
        .update(assets.fingerprint)
        .update(JSON.stringify(page))
        .digest('hex')
      const previous = cache[route]
      if (
        previous?.inputHash === inputHash &&
        (await readFile(
          path.join(root, 'public', `.${previous.image.url}`)
        ).then(
          () => true,
          () => false
        ))
      ) {
        image = previous.image
        nextCache[route] = previous
      } else {
        const { png, fingerprint, layout } = await renderCard(
          page,
          assets
        ).catch(error => {
          throw new Error(`${route}: ${error.message}`, { cause: error })
        })
        const name = `${slug}.${fingerprint}.png`
        await writeFile(path.join(directory, name), png)
        image = {
          url: `/og/${name}`,
          width: WIDTH,
          height: HEIGHT,
          type: 'image/png',
          alt: `${page.title} — ${page.description}`
        }
        nextCache[route] = { inputHash, image, layout }
        rendered++
      }
    }
    page.image = image
  }
  // Publish the index only after every referenced image is ready.
  await writeIfChanged(
    path.join(generated, 'seo.json'),
    `${JSON.stringify(pages, null, 2)}\n`
  )
  await writeIfChanged(
    path.join(generated, 'og-cache.json'),
    `${JSON.stringify(nextCache, null, 2)}\n`
  )
  console.log(
    `OG: ${
      Object.keys(pages).length
    } document routes validated; ${rendered} images generated.`
  )
  return pages
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  generate().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
