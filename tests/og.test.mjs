import assert from 'node:assert/strict'
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import sizeOf from 'image-size'
import { normalizeRoute, seoProps, siteOrigin } from '../lib/seo.mjs'
import { parseDocument, readPages, shorten } from '../scripts/og/content.mjs'
import { generate } from '../scripts/og/generate.mjs'
import { loadAssets, renderCard, wrapText } from '../scripts/og/render.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const context = {
  route: '/docs/example',
  filename: 'docs/example.mdx',
  section: 'Examples'
}
const intro =
  'Learn how to configure a document and publish specific sharing content for this page.'

test('new MDX documents extract H1 and prose without evaluating code or JSX', () => {
  const page = parseDocument(
    `import Card from 'somewhere'\n\nexport const secret = 'ignore this'\n\n# Using \`dorad\` with **PQC**\n\n<Callout type="warning">Do not use this generic warning as an abstract.</Callout>\n\n![Screenshot](/image.png)\n\n\`\`\`sh\necho ignore-this\n\`\`\`\n\nLearn [ML-DSA](https://example.com), preserve **your address**, and sign with \`dorad\`.\n\n| Key | Value |\n| --- | --- |\n| Secret | ignored |\n`,
    context
  )
  assert.equal(page.title, 'Using dorad with PQC')
  assert.equal(
    page.description,
    'Learn ML-DSA, preserve your address, and sign with dorad.'
  )
})

test('description overrides legacy desc and ogTitle overrides the document title', () => {
  const page = parseDocument(
    `---\ntitle: Article title\nogTitle: 'Share **this** title'\ndescription: Specific new summary for this article.\ndesc: Old summary\n---\n# Body title\n\n${intro}`,
    context
  )
  assert.equal(page.title, 'Share this title')
  assert.equal(page.description, 'Specific new summary for this article.')
  const legacy = parseDocument(
    `---\ntitle: Legacy\ndesc: Backward compatible summary\n---`,
    context
  )
  assert.equal(legacy.description, 'Backward compatible summary')
})

test('navigation titles work for documents without H1, and incomplete pages fail clearly', () => {
  const chinese = parseDocument(
    '# 中文配置指南\n\n为现有账户配置签名密钥。',
    context
  )
  assert.equal(chinese.description, '为现有账户配置签名密钥。')
  assert.equal(
    parseDocument(intro, { ...context, navigationTitle: 'Navigation title' })
      .title,
    'Navigation title'
  )
  assert.throws(
    () => parseDocument('# Title\n\n<Component />', context),
    /docs\/example.mdx.*introductory paragraph/
  )
  assert.throws(
    () => parseDocument(`---\ntitle: [wrong, type]\n---\n${intro}`, context),
    /title must be a string/
  )
  assert.throws(
    () => parseDocument(`---\nlocale: en\n---\n# Title\n\n${intro}`, context),
    /language_TERRITORY/
  )
})

test('canonical routes exclude query strings, anchors and trailing slashes', () => {
  assert.equal(
    normalizeRoute('/docs/example/?utm_source=chat#section'),
    '/docs/example'
  )
  assert.equal(normalizeRoute('/docs/%E4%B8%AD%E6%96%87'), '/docs/中文')
  assert.equal(
    siteOrigin('https://docs.example.com/path/'),
    'https://docs.example.com'
  )
  assert.throws(() => siteOrigin('javascript:alert(1)'), /HTTP/)
  const props = seoProps(
    {
      ...parseDocument(`# Article\n\n${intro}`, context),
      image: {
        url: '/og/card.123.png',
        width: 1200,
        height: 628,
        alt: 'Article'
      }
    },
    'https://docs.example.com'
  )
  assert.equal(props.canonical, 'https://docs.example.com/docs/example')
  assert.equal(
    props.openGraph.images[0].url,
    'https://docs.example.com/og/card.123.png'
  )
  assert.equal(
    props.additionalMetaTags.find(tag => tag.name === 'twitter:title').content,
    'Article'
  )
  assert.equal(
    props.additionalMetaTags.find(tag => tag.name === 'twitter:image').content,
    props.openGraph.images[0].url
  )
})

test('summary shortening respects complete sentences and word boundaries', () => {
  const text =
    'First complete sentence. Another sentence with more information that will exceed the requested length.'
  assert.equal(shorten(text, 48), 'First complete sentence.')
  assert.equal(shorten('word '.repeat(100), 60).endsWith('word…'), true)
  assert.equal(Array.from(shorten('中文说明'.repeat(100), 60)).length, 60)
})

test('line wrapping fits long URLs and truncates ordinary text at word boundaries', () => {
  const measureText = text => Array.from(text).length
  const { lines, truncated } = wrapText(
    'a long title with several meaningful words that cannot all fit',
    { size: 1, maxLines: 2, width: 20, measureText }
  )
  assert(truncated)
  assert(lines.every(line => measureText(line) <= 20))
  assert(lines.at(-1).endsWith('…'))
  const identifier = wrapText('x'.repeat(300), {
    size: 1,
    maxLines: 3,
    width: 20,
    measureText
  })
  assert(identifier.lines.every(line => measureText(line) <= 20))
})

test('bundled fonts render Chinese, symbols and a long English title offline', async () => {
  const assets = await loadAssets(root)
  for (const title of [
    '中文文档：配置与更新 · ML-DSA-65',
    'Dora Vota Post-Quantum Consensus Benchmark: Transaction Confirmation and Node Load'
  ]) {
    const page = {
      ...context,
      title,
      description:
        '具体内容会随文档更新。Build sharing previews with a specific title & description.',
      locale: 'zh_CN'
    }
    const rendered = await renderCard(page, assets)
    assert.deepEqual(sizeOf(rendered.png), {
      height: 628,
      width: 1200,
      type: 'png'
    })
    assert(rendered.layout.titleLines.length <= 3)
    assert(rendered.layout.descriptionLines.length <= 3)
  }
})

test('generation discovers new routes, reuses stable images, and changes image URLs after content edits', async t => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'df-docs-og-'))
  t.after(() => rm(fixture, { recursive: true, force: true }))
  await mkdir(path.join(fixture, 'pages/docs/new'), { recursive: true })
  await mkdir(path.join(fixture, 'public'), { recursive: true })
  await symlink(path.join(root, 'assets'), path.join(fixture, 'assets'))
  await writeFile(
    path.join(fixture, 'pages/index.mdx'),
    "import Landing from './landing'\n\n<Landing />\n"
  )
  await writeFile(
    path.join(fixture, 'pages/docs/_meta.json'),
    JSON.stringify({ new: 'New Guide' })
  )
  const document = path.join(fixture, 'pages/docs/new/index.md')
  await writeFile(document, `# New document\n\n${intro}`)
  const first = await generate(fixture)
  assert.equal(Object.keys(first).length, 2)
  assert.equal(first['/docs/new'].section, 'New Guide')
  const stable = await generate(fixture)
  assert.equal(first['/docs/new'].image.url, stable['/docs/new'].image.url)
  await writeFile(
    document,
    '# Updated document\n\nLearn about completely updated content and metadata in this new document.'
  )
  const updated = await generate(fixture)
  assert.notEqual(first['/docs/new'].image.url, updated['/docs/new'].image.url)
  assert.equal(first['/'].image.url, updated['/'].image.url)
  // Both old and new images remain available during a dev-session transition.
  await readFile(
    path.join(fixture, 'public', `.${first['/docs/new'].image.url}`)
  )
  await readFile(
    path.join(fixture, 'public', `.${updated['/docs/new'].image.url}`)
  )
  await mkdir(path.join(fixture, 'pages/docs/added'), { recursive: true })
  await writeFile(
    path.join(fixture, 'pages/docs/added/page.mdx'),
    `# Added page\n\n${intro}`
  )
  assert((await readPages(fixture))['/docs/added/page'])
})

test('local custom covers are fingerprinted and remote covers fail explicitly', async t => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'df-docs-og-cover-'))
  t.after(() => rm(fixture, { recursive: true, force: true }))
  await mkdir(path.join(fixture, 'pages'), { recursive: true })
  await mkdir(path.join(fixture, 'public'), { recursive: true })
  await symlink(path.join(root, 'assets'), path.join(fixture, 'assets'))
  await writeFile(
    path.join(fixture, 'public/cover.png'),
    await readFile(path.join(root, 'assets/og-bg.png'))
  )
  const document = path.join(fixture, 'pages/cover.mdx')
  await writeFile(
    document,
    `---\nogImage: /cover.png\nogImageAlt: Custom cover\n---\n# Covered article\n\n${intro}`
  )
  const pages = await generate(fixture)
  assert.equal(pages['/cover'].image.alt, 'Custom cover')
  assert.match(pages['/cover'].image.url, /^\/og\/cover\.[a-f0-9]+\.png$/)
  assert.equal(pages['/cover'].image.width, 1200)
  assert.throws(
    () =>
      parseDocument(
        `---\nogImage: https://example.com/cover.png\n---\n# Article\n\n${intro}`,
        context
      ),
    /local public image/
  )
})
