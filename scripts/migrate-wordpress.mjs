import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')

const sshTarget = process.env.WP_SSH_TARGET || 'root@82.156.201.110'
const wpRoot = process.env.WP_ROOT || '/usr/local/lighthouse/softwares/wordpress'
const outputRoot = process.env.WP_OUTPUT_ROOT || join(repoRoot, 'src', 'content', 'blog')
const dryRun = process.argv.includes('--dry-run')

const runRemote = (command) =>
  execFileSync('ssh', ['-o', 'BatchMode=yes', sshTarget, command], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  }).trim()

const stripHtml = (input) =>
  input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

const yamlQuote = (value) => `'${String(value).replace(/'/g, "''")}'`

const unique = (array) => Array.from(new Set(array))

const slugify = (value, fallback) => {
  const normalized = String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || fallback
}

const formatDateTime = (value) => {
  const date = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const replaceContentImages = async (content, targetDir) => {
  const imageUrls = unique(
    Array.from(
      String(content).matchAll(/https?:\/\/[^"' )>]+\/wp-content\/uploads\/[^"' )>]+/g),
      (match) => match[0]
    )
  )

  let nextContent = String(content)

  for (const imageUrl of imageUrls) {
    const parsed = new URL(imageUrl)
    const originalName = decodeURIComponent(parsed.pathname.split('/').pop() || 'image')
    const localName = originalName.replace(/\s+/g, '-')
    const localPath = join(targetDir, localName)

    if (!dryRun) {
      await downloadFile(imageUrl, localPath)
    }

    nextContent = nextContent.split(imageUrl).join(`./${localName}`)
  }

  return nextContent
}

const stripWordPressArtifacts = (content) =>
  String(content)
    .replace(/<!--\s*wp:[\s\S]*?-->/g, '')
    .replace(/<!--\s*\/wp:[\s\S]*?-->/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/\n{3,}/g, '\n\n')

const stripEmptyWrappedCodeBlocks = (content) =>
  String(content).replace(
    /<pre>\s*(<img[^>]+\/>)\s*<code class="language-[^"]*">\s*<\/code>\s*<\/pre>/g,
    '$1'
  )

const escapeTemplateLiteral = (content) =>
  String(content).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

const makeDescription = (title, excerpt, content) => {
  const candidates = [excerpt, content]
    .map((text) => stripHtml(text || ''))
    .filter(Boolean)
  const source = candidates[0] || title
  return source.slice(0, 160)
}

const downloadFile = async (url, destPath) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(destPath, buffer)
}

const listJson = JSON.parse(
  runRemote(`cd ${wpRoot} && wp post list --post_type=post --post_status=publish --fields=ID --format=json --allow-root`)
)

if (!Array.isArray(listJson) || !listJson.length) {
  throw new Error('No published WordPress posts found.')
}

const report = []

for (const item of listJson) {
  const id = item.ID
  const post = JSON.parse(
    runRemote(
      `cd ${wpRoot} && wp post get ${id} --fields=ID,post_title,post_name,post_date,post_excerpt,post_content --format=json --allow-root`
    )
  )

  const thumbId = runRemote(`cd ${wpRoot} && wp post meta get ${id} _thumbnail_id --allow-root || true`)
  const datePrefix = formatDateTime(post.post_date).slice(0, 10).replace(/-/g, '')
  const folderName = `${datePrefix} - ${slugify(post.post_title, `wp-post-${id}`)}`
  const targetDir = join(outputRoot, folderName)
  const postPath = join(targetDir, 'post.mdx')

  const description = makeDescription(post.post_title, post.post_excerpt, post.post_content)
  let body = String(post.post_content || '').trimEnd()

  let frontmatter = [
    '---',
    `title: ${yamlQuote(post.post_title)}`,
    `description: ${yamlQuote(description)}`,
    `publishDate: ${formatDateTime(post.post_date)}`
  ]

  if (thumbId) {
    const thumb = JSON.parse(
      runRemote(
        `cd ${wpRoot} && wp post get ${thumbId} --fields=ID,post_title,guid,post_mime_type --format=json --allow-root`
      )
    )
    const imageUrl = thumb.guid.replace(/&amp;/g, '&')
    const imageExt = extname(new URL(imageUrl).pathname) || '.jpg'
    const finalHeroPath = join(targetDir, `hero${imageExt}`)

    if (!dryRun) {
      await mkdir(targetDir, { recursive: true })
      await downloadFile(imageUrl, finalHeroPath)
    }

    frontmatter = [
      ...frontmatter,
      'heroImage:',
      `  src: ./${`hero${imageExt}`}`,
      `  alt: ${yamlQuote(post.post_title)}`
    ]
  }

  frontmatter.push('---', '')

  if (!dryRun) {
    await mkdir(targetDir, { recursive: true })
    await rm(join(targetDir, 'post.md'), { force: true })
    body = await replaceContentImages(body, targetDir)
    body = stripWordPressArtifacts(body)
    body = stripEmptyWrappedCodeBlocks(body)
    const escapedBody = escapeTemplateLiteral(body)
    const postFile = `${frontmatter.join('\n')}import WordPressHtml from '@/components/blog/WordPressHtml.astro'\n\n<WordPressHtml html={String.raw\`${escapedBody}\`} />\n`
    await writeFile(postPath, postFile, 'utf8')
  }

  report.push({ id, title: post.post_title, folderName, hasHero: !!thumbId })
}

if (dryRun) {
  console.log(JSON.stringify(report, null, 2))
} else {
  const reportPath = join(repoRoot, 'scripts', 'wordpress-import-report.json')
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')
  console.log(`Imported ${report.length} WordPress posts.`)
  console.log(`Report written to ${reportPath}`)
}
