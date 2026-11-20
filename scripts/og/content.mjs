import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  normalizeRoute
} from '../../lib/seo.mjs'

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

export const normalizeText = value =>
  String(value ?? '')
    .replace(/\s+/gu, ' ')
    .trim()

export function plainText(node) {
  if (ignoredNodes.has(node.type)) return ''
  if (node.type.startsWith('mdxJsx') && !containers.has(node.name)) return ''
  if (node.type === 'break') return ' '
  if (typeof node.value === 'string') return node.value
  return (node.children || []).map(plainText).join('')
}

export function shorten(text, limit = 260) {
  text = normalizeText(text)
  const chars = Array.from(text)
  if (chars.length <= limit) return text
  const prefix = chars.slice(0, limit - 1).join('')
  const sentences = [...prefix.matchAll(/[.!?。！？](?=\s|$)/gu)]
  const lastSentence = sentences.at(-1)
  if (lastSentence && lastSentence.index > limit * 0.4) {
    return prefix.slice(0, lastSentence.index + 1)
  }
  const boundary = prefix.lastIndexOf(' ')
  return `${(boundary > prefix.length * 0.65
    ? prefix.slice(0, boundary)
    : prefix
  ).trimEnd()}…`
}

function stringField(data, key, source) {
  const value = data[key]
  if (value == null) return ''
  if (typeof value !== 'string')
    throw new Error(`${source}: ${key} must be a string`)
  return normalizeText(plainText(inlineParser.parse(value)))
}

export function parseDocument(
  source,
  { route, filename, navigationTitle, section }
) {
  const { data, content } = matter(source)
  const tree = parser.parse(content)
  const heading = tree.children.find(
    node => node.type === 'heading' && node.depth === 1
  )
  const paragraphs = []
  function collect(node) {
    if (node.type === 'paragraph') {
      const text = normalizeText(plainText(node))
      if (/[\p{L}\p{N}]/u.test(text)) paragraphs.push(text)
    } else if (
      node.type === 'root' ||
      (node.type === 'mdxJsxFlowElement' && containers.has(node.name))
    ) {
      node.children?.forEach(collect)
    }
  }
  collect(tree)
  const title =
    stringField(data, 'ogTitle', filename) ||
    stringField(data, 'title', filename) ||
    normalizeText(heading && plainText(heading)) ||
    navigationTitle
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
  const page = {
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

export async function walk(directory) {
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

export async function readPages(root) {
  const pagesDirectory = path.join(root, 'pages')
  const filenames = await walk(pagesDirectory)
  const metaCache = new Map()
  async function navigation(directory, name) {
    if (!metaCache.has(directory)) {
      const file = path.join(directory, '_meta.json')
      const text = await readFile(file, 'utf8').catch(error => {
        if (error.code === 'ENOENT') return '{}'
        throw error
      })
      metaCache.set(directory, JSON.parse(text))
    }
    const entry = metaCache.get(directory)[name]
    return typeof entry === 'string' ? entry : entry?.title
  }
  const result = {}
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
