import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { parse } from 'parse5'
import type { DefaultTreeAdapterMap } from 'parse5'
import sizeOf from 'image-size'
import { absoluteUrl, seoProps, siteOrigin } from '../../lib/seo'
import type { SharingPage, SharingManifest } from '../../lib/seo'

type HtmlNode = DefaultTreeAdapterMap['node']
type HtmlElement = DefaultTreeAdapterMap['element']

// @next/env is CommonJS in Next 13; use its actual export shape on Node 18.
const { loadEnvConfig } = createRequire(import.meta.url)(
  '@next/env'
) as typeof import('@next/env')

function elements(
  node: HtmlNode,
  predicate: (node: HtmlElement) => boolean,
  result: HtmlElement[] = []
): HtmlElement[] {
  if ('tagName' in node && predicate(node)) result.push(node)
  if ('childNodes' in node)
    for (const child of node.childNodes) elements(child, predicate, result)
  return result
}

export function checkHtml(
  html: string,
  page: SharingPage,
  origin: string
): void {
  const tree = parse(html)
  const head = elements(tree, node => node.tagName === 'head')[0]
  assert(head, `${page.route}: missing head`)
  const meta = elements(head, node => node.tagName === 'meta').map(node =>
    Object.fromEntries(node.attrs.map(a => [a.name, a.value]))
  )
  const expected = seoProps(page, origin)
  const fields = {
    'og:title': page.title,
    'og:description': page.description,
    'og:type': 'website',
    'og:locale': page.locale,
    'og:url': expected.canonical,
    'og:image': expected.openGraph.images[0].url,
    'og:image:width': String(page.image.width),
    'og:image:height': String(page.image.height),
    'og:image:alt': page.image.alt,
    'og:image:type': page.image.type,
    'twitter:card': 'summary_large_image',
    'twitter:title': page.title,
    'twitter:description': page.description,
    'twitter:image': expected.openGraph.images[0].url,
    'twitter:image:alt': page.image.alt,
    description: page.description
  }
  for (const [key, value] of Object.entries(fields)) {
    const tags = meta.filter(tag => tag.property === key || tag.name === key)
    assert.equal(
      tags.length,
      1,
      `${page.route}: expected exactly one ${key}, found ${tags.length}`
    )
    assert.equal(tags[0]?.content, value, `${page.route}: incorrect ${key}`)
  }
  const canonical = elements(
    head,
    node =>
      node.tagName === 'link' &&
      node.attrs.some(a => a.name === 'rel' && a.value === 'canonical')
  )
  assert.equal(canonical.length, 1, `${page.route}: expected one canonical`)
  assert.equal(
    canonical[0]?.attrs.find(a => a.name === 'href')?.value,
    expected.canonical
  )
  assert.equal(expected.canonical, absoluteUrl(page.route, origin))
}

export async function checkBuild(root: string = process.cwd()): Promise<void> {
  // Match Next's production environment loading, including .env.local overrides.
  loadEnvConfig(root, false)
  const origin = siteOrigin(process.env.NEXT_PUBLIC_SITE_ROOT)
  const pages: SharingManifest = JSON.parse(
    await readFile(path.join(root, '.generated/seo.json'), 'utf8')
  )
  const serverRoot = path.join(root, '.next/server')
  const routes: Record<string, string> = JSON.parse(
    await readFile(path.join(serverRoot, 'pages-manifest.json'), 'utf8')
  )
  for (const [route, page] of Object.entries(pages)) {
    const output = routes[route]
    assert(
      output && output.endsWith('.html'),
      `${route}: document must produce static HTML`
    )
    checkHtml(
      await readFile(path.join(serverRoot, output), 'utf8'),
      page,
      origin
    )
    const image = await readFile(
      path.join(root, 'public', `.${page.image.url}`)
    )
    const dimensions = sizeOf(image)
    assert.equal(dimensions.width, page.image.width, `${route}: image width`)
    assert.equal(dimensions.height, page.image.height, `${route}: image height`)
  }
  console.log(
    `OG: verified static HTML, unique metadata and image dimensions for all ${
      Object.keys(pages).length
    } routes.`
  )
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  checkBuild().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
