import type { CardListData, Config, IntegrationUserConfig, ThemeUserConfig } from 'astro-pure/types'

export const theme: ThemeUserConfig = {
  title: "YinFeng's Blog",
  author: 'YinFeng',
  description: '吟风的个人博客，记录 AI、Agent、学习与思考。',
  favicon: '/favicon/favicon.ico',
  locale: {
    lang: 'zh-CN',
    attrs: 'zh_CN',
    dateLocale: 'zh-CN',
    dateOptions: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  },
  logo: {
    src: 'src/assets/avatar.png',
    alt: 'YinFeng Avatar'
  },
  titleDelimiter: '•',
  prerender: true,
  npmCDN: 'https://cdn.jsdelivr.net/npm',
  head: [],
  customCss: [],
  header: {
    menu: [
      { title: 'Blog', link: '/blog' },
      { title: 'About', link: '/about' },
      { title: 'Contact', link: '/contact' }
    ]
  },
  footer: {
    links: [
      {
        title: 'Site Policy',
        link: '/terms/list',
        pos: 2
      }
    ],
    credits: true,
    social: {
      github: 'https://github.com/YinFengWindy'
    }
  },
  content: {
    externalLinksContent: ' ↗',
    blogPageSize: 8,
    externalLinkArrow: true,
    share: ['weibo', 'x', 'bluesky']
  }
}

export const integ: IntegrationUserConfig = {
  links: {
    logbook: [
      { date: '2026-06-26', content: '博客已从旧版 WordPress 迁移到 Astro。' }
    ],
    applyTip: [
      { name: 'Name', val: "YinFeng's Blog" },
      { name: 'Desc', val: theme.description || 'Null' },
      { name: 'Link', val: 'https://www.windchant.online/' },
      { name: 'Avatar', val: 'https://www.windchant.online/favicon/favicon.ico' }
    ]
  },
  pagefind: true,
  quote: {
    server: 'https://v1.hitokoto.cn/?max_length=60',
    target: `(data) => data.hitokoto || 'Error'`
  },
  typography: {
    class: 'prose text-base text-muted-foreground'
  },
  mediumZoom: {
    enable: true,
    selector: '.prose .zoomable',
    options: {
      className: 'zoomable'
    }
  },
  waline: {
    enable: false,
    server: '',
    additionalConfigs: {
      pageview: false,
      comment: false
    }
  }
}

export const terms: CardListData = {
  title: 'Terms content',
  list: [
    {
      title: 'Privacy Policy',
      link: '/terms/privacy-policy'
    },
    {
      title: 'Terms and Conditions',
      link: '/terms/terms-and-conditions'
    },
    {
      title: 'Copyright',
      link: '/terms/copyright'
    },
    {
      title: 'Disclaimer',
      link: '/terms/disclaimer'
    }
  ]
}

const config = { ...theme, integ } as Config
export default config
