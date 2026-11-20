import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { createElement as h } from 'react'
import * as fontkit from 'fontkit'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const require = createRequire(import.meta.url)
export const WIDTH = 1200
export const HEIGHT = 628
const TEXT_WIDTH = 936

export async function loadAssets(root) {
  const [regular, bold, background, template, fontCss, fontVersion] =
    await Promise.all([
      readFile(path.join(root, 'assets/PublicSans-Regular.woff')),
      readFile(path.join(root, 'assets/PublicSans-ExtraBold.woff')),
      readFile(path.join(root, 'assets/og-bg.png')),
      readFile(new URL('./render.mjs', import.meta.url)),
      readFile(require.resolve('@fontsource/noto-sans-sc/400.css'), 'utf8'),
      readFile(require.resolve('@fontsource/noto-sans-sc/package.json'))
    ])
  const hash = createHash('sha256')
    .update(regular)
    .update(bold)
    .update(background)
    .update(template)
    .update(fontCss)
    .update(fontVersion)
  return {
    fonts: [
      { name: 'Public Sans', data: regular, weight: 400, style: 'normal' },
      { name: 'Public Sans', data: bold, weight: 800, style: 'normal' }
    ],
    metrics: [fontkit.create(regular), fontkit.create(bold)],
    background: `data:image/png;base64,${background.toString('base64')}`,
    fontCss,
    fingerprint: hash.digest('hex'),
    fallbackCache: new Map()
  }
}

async function fontsFor(text, assets) {
  const missing = new Set(
    Array.from(text)
      .map(char => char.codePointAt(0))
      .filter(code => !assets.metrics[0].hasGlyphForCodePoint(code))
  )
  const fallback = []
  // Fontsource includes local Unicode subsets; only load subsets this card needs.
  // No runtime/build-time font or emoji downloads are required.
  for (const block of assets.fontCss.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    if (!missing.size) break
    const ranges = [
      ...block[1].matchAll(/U\+([\da-f]+)(?:-([\da-f]+))?/gi)
    ].map(([, a, b]) => [parseInt(a, 16), parseInt(b || a, 16)])
    if (
      ![...missing].some(code =>
        ranges.some(([a, b]) => code >= a && code <= b)
      )
    )
      continue
    const file = /url\(\.\/files\/([^)]*\.woff)\)/.exec(block[1])?.[1]
    if (!file) continue
    if (!assets.fallbackCache.has(file)) {
      const data = await readFile(
        require.resolve(`@fontsource/noto-sans-sc/files/${file}`)
      )
      assets.fallbackCache.set(file, { data, metric: fontkit.create(data) })
    }
    const loaded = assets.fallbackCache.get(file)
    fallback.push({
      name: `Fallback ${fallback.length}`,
      data: loaded.data,
      weight: 400,
      style: 'normal',
      metric: loaded.metric
    })
    for (const code of missing)
      if (loaded.metric.hasGlyphForCodePoint(code)) missing.delete(code)
  }
  if (missing.size) {
    throw new Error(
      `Missing local OG font glyphs: ${[...missing]
        .map(code => String.fromCodePoint(code))
        .join(
          ' '
        )}; add a bundled fallback font or use an ogTitle/description override`
    )
  }
  return fallback
}

function measure(text, size, bold, assets, fallback) {
  const primary = assets.metrics[bold ? 1 : 0]
  let width = 0
  let run = ''
  let previous
  function flush() {
    if (run)
      width +=
        (previous
          .layout(run)
          .positions.reduce((sum, position) => sum + position.xAdvance, 0) *
          size) /
        previous.unitsPerEm
    run = ''
  }
  for (const char of text) {
    const code = char.codePointAt(0)
    const metric = primary.hasGlyphForCodePoint(code)
      ? primary
      : fallback.find(font => font.metric.hasGlyphForCodePoint(code))?.metric
    if (!metric) continue
    if (metric !== previous) {
      flush()
      previous = metric
    }
    run += char
  }
  flush()
  return width
}

export function wrapText(
  text,
  { size, maxLines, width = TEXT_WIDTH, measureText }
) {
  const tokens = [
    ...new Intl.Segmenter('en', { granularity: 'word' }).segment(text)
  ].map(item => item.segment)
  const lines = []
  let line = ''
  for (const token of tokens) {
    const next = `${line}${token}`
    if (measureText(next, size) <= width) {
      line = next
      continue
    }
    if (line.trim()) lines.push(line.trimEnd())
    line = token.trimStart()
    // Very long URLs/identifiers still have to fit the card.
    if (measureText(line, size) > width) {
      let chunk = ''
      for (const char of new Intl.Segmenter('en', {
        granularity: 'grapheme'
      }).segment(line)) {
        if (chunk && measureText(chunk + char.segment, size) > width) {
          lines.push(chunk)
          chunk = ''
        }
        chunk += char.segment
      }
      line = chunk
    }
  }
  if (line.trim()) lines.push(line.trimEnd())
  if (lines.length <= maxLines) return { lines, truncated: false }
  const visible = lines.slice(0, maxLines)
  let last = visible.at(-1)
  while (measureText(`${last}…`, size) > width)
    last = Array.from(last).slice(0, -1).join('')
  const boundary = last.lastIndexOf(' ')
  if (boundary > last.length * 0.65) last = last.slice(0, boundary)
  visible[visible.length - 1] = `${last.trimEnd()}…`
  return { lines: visible, truncated: true }
}

export async function renderCard(page, assets) {
  const fallback = await fontsFor(
    `${page.title} ${page.description} ${page.section} ${page.route}…`,
    assets
  )
  const measureText = (text, size, bold = false) =>
    measure(text, size, bold, assets, fallback)
  let title
  let titleSize
  for (const size of [54, 48, 42, 36]) {
    titleSize = size
    title = wrapText(page.title, {
      size,
      maxLines: 3,
      measureText: (text, s) => measureText(text, s, true)
    })
    if (!title.truncated) break
  }
  const description = wrapText(page.description, {
    size: 26,
    maxLines: 3,
    measureText
  })
  const section = wrapText(page.section, { size: 18, maxLines: 1, measureText })
  const route = wrapText(
    page.route === '/' ? 'docs.dorafactory.org' : page.route,
    { size: 16, maxLines: 1, measureText }
  )
  const family = ['Public Sans', ...fallback.map(font => font.name)].join(', ')
  const textLines = (lines, size, weight, color, lineHeight) =>
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          fontSize: size,
          fontWeight: weight,
          color,
          lineHeight,
          flexShrink: 0
        }
      },
      ...lines.map((text, index) =>
        h(
          'div',
          {
            key: index,
            style: { display: 'flex', whiteSpace: 'pre', flexShrink: 0 }
          },
          text
        )
      )
    )
  const tree = h(
    'div',
    {
      style: {
        display: 'flex',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#111111',
        backgroundImage: `url(${assets.background})`,
        backgroundSize: `${WIDTH}px ${HEIGHT}px`,
        fontFamily: family
      }
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          position: 'absolute',
          left: 132,
          top: 165,
          width: TEXT_WIDTH,
          flexDirection: 'column'
        }
      },
      textLines(section.lines, 18, 400, '#c3a7eb', 1.3),
      h(
        'div',
        { style: { display: 'flex', marginTop: 16 } },
        textLines(title.lines, titleSize, 800, '#f5f5f5', 1.13)
      ),
      h(
        'div',
        { style: { display: 'flex', marginTop: 24 } },
        textLines(description.lines, 26, 400, '#aaaabc', 1.3)
      )
    ),
    h(
      'div',
      { style: { display: 'flex', position: 'absolute', top: 574, left: 132 } },
      textLines(route.lines, 16, 400, '#858599', 1.2)
    )
  )
  const nodes = []
  const svg = await satori(tree, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [...assets.fonts, ...fallback.map(({ metric, ...font }) => font)],
    onNodeDetected: node => nodes.push(node)
  })
  for (const node of nodes) {
    if (
      node.textContent &&
      (node.left < 125 ||
        node.left + node.width > 1080 ||
        node.top < 150 ||
        node.top + node.height > 608)
    ) {
      throw new Error(
        `${page.route}: OG text exceeds the safe area: ${node.textContent}`
      )
    }
  }
  return {
    png: new Resvg(svg).render().asPng(),
    fingerprint: createHash('sha256')
      .update(assets.fingerprint)
      .update(JSON.stringify(page))
      .update(Buffer.concat(fallback.map(font => font.data)))
      .digest('hex')
      .slice(0, 16),
    layout: {
      titleSize,
      titleLines: title.lines,
      descriptionLines: description.lines
    }
  }
}
