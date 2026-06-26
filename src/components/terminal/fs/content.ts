export const ROOT_LABEL = 'windchant.online'

export const SOCIAL_LINKS: { label: string; href: string }[] = [
  { label: 'github', href: 'https://github.com/YinFengWindy' },
  { label: 'mail', href: 'mailto:3174898512@qq.com' },
  { label: 'bilibili', href: 'https://space.bilibili.com/359809751?spm_id_from=333.1365.0.0' }
]

export const README_TEXT = `windchant.online — a pseudo-FS over this blog.

If you're exploring in dev mode:
  ls               — see what's here
  search agent     — search posts
  cat about        — short bio
  cat now          — what this site is doing
  cd /blog         — recent posts
`

export const ABOUT_TEXT = `YinFeng
Personal blog · AI · Agent · learning notes

This site now runs on Astro and keeps a lightweight terminal view over the
published content. The current version focuses on posts and core pages only.
`

export const NOW_TEXT = `Now:

- keeping this blog on Astro
- writing about AI / Agent / engineering notes
- gradually replacing old template content with my own material
`

export const PERSONALITY_TEXT = `# personality.conf

style:     calm, practical, content-first
voice:     simple, direct, engineering-oriented
languages: zh-CN, en
location:  China
`

export const MOTD_TEXT = `Welcome to windchant.online dev mode.

This terminal exposes the site's content as a small directory tree.
Type \`help\` for commands. \`exit\` or Esc to leave.
`
