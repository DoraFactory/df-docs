import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import * as fontkit from 'fontkit'
import type { Font as FontMetrics } from 'fontkit'
import satori from 'satori'
import type { Font as SatoriFont, SatoriNode } from 'satori'
import { Resvg } from '@resvg/resvg-js'
import type { DocumentMetadata } from '../../lib/seo'

interface LoadedFont {
  data: Buffer
  metric: FontMetrics
}

interface FallbackFont extends SatoriFont {
  data: Buffer
  metric: FontMetrics
  weight: 400
  style: 'normal'
}

export interface CardAssets {
  fonts: SatoriFont[]
  metrics: [FontMetrics, FontMetrics]
  background: string
  fontCss: string
  fingerprint: string
  fallbackCache: Map<string, LoadedFont>
}

interface WrappedText {
  lines: string[]
  truncated: boolean
}

interface WrapOptions {
  size: number
  maxLines: number
  width?: number
  measureText: (text: string, size: number) => number
}

export interface CardLayout {
  titleSize: number
  titleLines: string[]
  descriptionLines: string[]
}

interface RenderedCard {
  png: Buffer
  fingerprint: string
  layout: CardLayout
}

function fontMetrics(data: Buffer): FontMetrics {
  const font = fontkit.create(data)
  if ('fonts' in font)
    throw new Error('OG fonts must be individual fonts, not font collections')
  return font
}

const require = createRequire(import.meta.url)
export const WIDTH = 1200
export const HEIGHT = 628
const TEXT_WIDTH = 936

export async function loadAssets(root: string): Promise<CardAssets> {
  const [regular, bold, background, template, fontCss, fontVersion] =
    await Promise.all([
      readFile(path.join(root, 'assets/PublicSans-Regular.woff')),
      readFile(path.join(root, 'assets/PublicSans-ExtraBold.woff')),
      readFile(path.join(root, 'assets/og-bg.png')),
      readFile(new URL('./render.tsx', import.meta.url)),
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
    metrics: [fontMetrics(regular), fontMetrics(bold)],
    background: `data:image/png;base64,${background.toString('base64')}`,
    fontCss,
    fingerprint: hash.digest('hex'),
    fallbackCache: new Map()
  }
}

async function fontsFor(
  text: string,
  assets: CardAssets
): Promise<FallbackFont[]> {
  const missing = new Set(
    Array.from(text)
      .map(char => char.codePointAt(0))
      .filter(
        (code): code is number =>
          code !== undefined && !assets.metrics[0].hasGlyphForCodePoint(code)
      )
  )
  const fallback: FallbackFont[] = []
  // Fontsource includes local Unicode subsets; only load subsets this card needs.
  // No runtime/build-time font or emoji downloads are required.
  for (const block of assets.fontCss.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    if (!missing.size) break
    const ranges = [
      ...(block[1] || '').matchAll(/U\+([\da-f]+)(?:-([\da-f]+))?/gi)
    ].map(([, a = '', b]): [number, number] => [
      parseInt(a, 16),
      parseInt(b || a, 16)
    ])
    if (
      ![...missing].some(code =>
        ranges.some(([a, b]) => code >= a && code <= b)
      )
    )
      continue
    const file = /url\(\.\/files\/([^)]*\.woff)\)/.exec(block[1] || '')?.[1]
    if (!file) continue
    let loaded = assets.fallbackCache.get(file)
    if (!loaded) {
      const data = await readFile(
        require.resolve(`@fontsource/noto-sans-sc/files/${file}`)
      )
      loaded = { data, metric: fontMetrics(data) }
      assets.fallbackCache.set(file, loaded)
    }
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

function measure(
  text: string,
  size: number,
  bold: boolean,
  assets: CardAssets,
  fallback: FallbackFont[]
): number {
  const primary = assets.metrics[bold ? 1 : 0]
  let width = 0
  let run = ''
  let previous: FontMetrics | undefined
  function flush() {
    if (run && previous)
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
    if (code === undefined) continue
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
  text: string,
  { size, maxLines, width = TEXT_WIDTH, measureText }: WrapOptions
): WrappedText {
  const tokens = [
    ...new Intl.Segmenter('en', { granularity: 'word' }).segment(text)
  ].map(item => item.segment)
  const lines: string[] = []
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
  let last = visible.at(-1) || ''
  while (measureText(`${last}…`, size) > width)
    last = Array.from(last).slice(0, -1).join('')
  const boundary = last.lastIndexOf(' ')
  if (boundary > last.length * 0.65) last = last.slice(0, boundary)
  visible[visible.length - 1] = `${last.trimEnd()}…`
  return { lines: visible, truncated: true }
}

export async function renderCard(
  page: DocumentMetadata,
  assets: CardAssets
): Promise<RenderedCard> {
  const fallback = await fontsFor(
    `${page.title} ${page.description} ${page.section} ${page.route}…`,
    assets
  )
  const measureText = (text: string, size: number, bold = false) =>
    measure(text, size, bold, assets, fallback)
  let title: WrappedText = { lines: [], truncated: false }
  let titleSize = 36
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
  const tree = (
    <div
      style={{
        display: 'flex',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#111111',
        backgroundImage: `url(${assets.background})`,
        backgroundSize: `${WIDTH}px ${HEIGHT}px`,
        fontFamily: family
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 132,
          top: 165,
          width: TEXT_WIDTH,
          flexDirection: 'column'
        }}
      >
        <TextLines
          lines={section.lines}
          size={18}
          weight={400}
          color="#c3a7eb"
          lineHeight={1.3}
        />
        <div style={{ display: 'flex', marginTop: 16 }}>
          <TextLines
            lines={title.lines}
            size={titleSize}
            weight={800}
            color="#f5f5f5"
            lineHeight={1.13}
          />
        </div>
        <div style={{ display: 'flex', marginTop: 24 }}>
          <TextLines
            lines={description.lines}
            size={26}
            weight={400}
            color="#aaaabc"
            lineHeight={1.3}
          />
        </div>
      </div>
      <div
        style={{ display: 'flex', position: 'absolute', top: 574, left: 132 }}
      >
        <TextLines
          lines={route.lines}
          size={16}
          weight={400}
          color="#858599"
          lineHeight={1.2}
        />
      </div>
    </div>
  )
  const nodes: SatoriNode[] = []
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

interface TextLinesProps {
  lines: string[]
  size: number
  weight: 400 | 800
  color: string
  lineHeight: number
}

function TextLines({ lines, size, weight, color, lineHeight }: TextLinesProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight,
        flexShrink: 0
      }}
    >
      {lines.map((text, index) => (
        <div
          key={index}
          style={{ display: 'flex', whiteSpace: 'pre', flexShrink: 0 }}
        >
          {text}
        </div>
      ))}
    </div>
  )
}
