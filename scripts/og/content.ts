import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import type { Root } from 'mdast'
import type { DocumentMetadata } from '../../lib/seo'
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  normalizeRoute
} from '../../lib/seo'

export interface DocumentContext {
  route: string
  filename: string
  navigationTitle?: string
  section?: string
}

export interface ParsedDocument extends DocumentMetadata {
  customImage?: string
  imageAlt?: string
}

// A structural view of the fields used from Markdown and MDX AST nodes.
// This also admits the MDX JSX/expression extensions to the standard mdast.
interface ContentNode {
  type: string
  value?: string
  name?: string | null
  children?: ContentNode[]
  depth?: number
}

type Navigation = Record<string, unknown>

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm)
const inlineParser = unified().use(remarkParse)
const ignoredNodes = new Set([
  'code',
  'html',
  'image',
  'imageReference',
  'definition',
  'footnoteDefinition',
  'mdxjsEsm',
  'mdxFlowExpression',
  'mdxTextExpression'
])
const containers = new Set([
  'Steps',
  'Tabs',
  'Tabs.Tab',
  'div',
  'section',
  'p',
  'span',
  'i',
  'b',
  'strong',
  'em',
  'a'
])

export const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .replace(/\s+/gu, ' ')
    .trim()

export function plainText(node: ContentNode | undefined): string {
  if (!node) return ''
  if (ignoredNodes.has(node.type)) return ''
  if (node.type.startsWith('mdxJsx') && !containers.has(node.name || ''))
    return ''
  if (node.type === 'break') return ' '
  if (typeof node.value === 'string') return node.value
  return (node.children || []).map(plainText).join('')
}

export function shorten(text: string, limit = 260): string {
  text = normalizeText(text)
  const chars = Array.from(text)
  if (chars.length <= limit) return text
  const prefix = chars.slice(0, limit - 1).join('')
  const sentences = [...prefix.matchAll(/[.!?。！？](?=\s|$)/gu)]
  const lastSentence = sentences.at(-1)
  if (lastSentence?.index !== undefined && lastSentence.index > limit * 0.4) {
    return prefix.slice(0, lastSentence.index + 1)
  }
  const boundary = prefix.lastIndexOf(' ')
  return `${(boundary > prefix.length * 0.65
    ? prefix.slice(0, boundary)
    : prefix
  ).trimEnd()}…`
}

function stringField(
  data: Record<string, unknown>,
  key: string,
  source: string
): string {
  const value = data[key]
  if (value == null) return ''
  if (typeof value !== 'string')
    throw new Error(`${source}: ${key} must be a string`)
  return normalizeText(plainText(inlineParser.parse(value)))
}

export function parseDocument(
  source: string,
  { route, filename, navigationTitle, section }: DocumentContext
): ParsedDocument {
  const { data, content } = matter(source)
  const tree: Root = parser.parse(content)
  const heading = tree.children.find(
    node => node.type === 'heading' && node.depth === 1
  )
  const paragraphs: string[] = []
  function collect(node: ContentNode): void {
    if (node.type === 'paragraph') {
      const text = normalizeText(plainText(node))
      if (/[\p{L}\p{N}]/u.test(text)) paragraphs.push(text)
    } else if (
      node.type === 'root' ||
      (node.type === 'mdxJsxFlowElement' && containers.has(node.name || ''))
    ) {
      node.children?.forEach(collect)
    }
  }
  collect(tree)
  const title =
    stringField(data, 'ogTitle', filename) ||
    stringField(data, 'title', filename) ||
    normalizeText(plainText(heading)) ||
    navigationTitle ||
    ''
  const description =
    stringField(data, 'description', filename) ||
    stringField(data, 'desc', filename) ||
    paragraphs[0]
  const locale = stringField(data, 'locale', filename) || 'en_US'
  if (!/^[a-z]{2,3}_[A-Z]{2}$/.test(locale)) {
    throw new Error(
      `${filename}: locale must use language_TERRITORY, e.g. en_US`
    )
  }
  const page: ParsedDocument = {
    route,
    title:
      route === '/'
        ? stringField(data, 'ogTitle', filename) || HOME_TITLE
        : title,
    description: shorten(
      route === '/' ? description || HOME_DESCRIPTION : description || ''
    ),
    section: section || SITE_NAME,
    locale
  }
  if (!page.title || !page.description) {
    throw new Error(
      `${filename}: cannot generate sharing content; add a title/H1 and an introductory paragraph or description`
    )
  }
  const customImage = stringField(data, 'ogImage', filename)
  if (customImage) {
    if (
      !customImage.startsWith('/') ||
      customImage.startsWith('//') ||
      /[?#]/.test(customImage)
    ) {
      throw new Error(
        `${filename}: ogImage must be a local public image path without query or fragment`
      )
    }
    page.customImage = customImage
    page.imageAlt = stringField(data, 'ogImageAlt', filename) || page.title
  }
  return page
}

export async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(entry => {
        if (
          entry.name.startsWith('.') ||
          entry.name.startsWith('_') ||
          entry.name === 'api'
        )
          return []
        const filename = path.join(directory, entry.name)
        return entry.isDirectory()
          ? walk(filename)
          : /\.mdx?$/.test(entry.name)
            ? [filename]
            : []
      })
  )
  return nested.flat()
}

export async function readPages(
  root: string
): Promise<Record<string, ParsedDocument>> {
  const pagesDirectory = path.join(root, 'pages')
  const filenames = await walk(pagesDirectory)
  const metaCache = new Map<string, Navigation>()
  async function navigation(
    directory: string,
    name: string
  ): Promise<string | undefined> {
    if (!metaCache.has(directory)) {
      const file = path.join(directory, '_meta.json')
      const text = await readFile(file, 'utf8').catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return '{}'
          throw error
        }
      )
      const parsed: unknown = JSON.parse(text)
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(`${file}: navigation metadata must be an object`)
      }
      metaCache.set(directory, parsed as Navigation)
    }
    const entry = metaCache.get(directory)?.[name]
    if (typeof entry === 'string') return entry
    if (
      typeof entry === 'object' &&
      entry !== null &&
      'title' in entry &&
      typeof entry.title === 'string'
    )
      return entry.title
    return undefined
  }
  const result: Record<string, ParsedDocument> = {}
  for (const filename of filenames) {
    const relative = path
      .relative(pagesDirectory, filename)
      .split(path.sep)
      .join('/')
    if (/[\[\]]/.test(relative))
      throw new Error(
        `${relative}: dynamic routes require an explicit list of document routes`
      )
    const route = normalizeRoute(
      relative.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '')
    )
    if (result[route])
      throw new Error(`${relative}: duplicate document route ${route}`)
    const name = path.basename(filename).replace(/\.mdx?$/, '')
    const directory = path.dirname(filename)
    const parentTitle =
      directory === pagesDirectory
        ? SITE_NAME
        : await navigation(path.dirname(directory), path.basename(directory))
    const section =
      parentTitle || (route === '/docs' ? 'Documentation' : 'Dora Factory Docs')
    const page = parseDocument(await readFile(filename, 'utf8'), {
      route,
      filename: relative,
      navigationTitle: await navigation(directory, name),
      section
    })
    if (page.customImage) {
      const imagePath = path.resolve(root, 'public', `.${page.customImage}`)
      if (!imagePath.startsWith(`${path.join(root, 'public')}${path.sep}`))
        throw new Error(`${relative}: invalid ogImage path`)
      if (!(await stat(imagePath)).isFile())
        throw new Error(`${relative}: ogImage must point to a file`)
    }
    result[route] = page
  }
  return result
}
