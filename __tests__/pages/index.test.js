jest.mock('@/blog.config', () => ({
  __esModule: true,
  default: { THEME: 'hexo', NEXT_REVALIDATE_SECOND: 60 }
}))
jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultValue) => {
    if (key === 'POST_LIST_STYLE') return 'page'
    if (key === 'POSTS_PER_PAGE') return 12
    if (key === 'POST_LIST_PREVIEW') return false
    return defaultValue
  })
}))
jest.mock('@/lib/db/getSiteData', () => ({
  getGlobalData: jest.fn().mockResolvedValue({
    allPages: [
      { id: 'post-id', type: 'Post', status: 'Published', title: 'Post' }
    ],
    NOTION_CONFIG: {},
    latestPosts: []
  }),
  getPostBlocks: jest.fn()
}))
jest.mock('@/lib/robots.txt', () => ({ generateRobotsTxt: jest.fn() }))
jest.mock('@/lib/rss', () => ({ generateRss: jest.fn() }))
jest.mock('@/lib/sitemap.xml', () => ({ generateSitemapXml: jest.fn() }))
jest.mock('@/lib/redirect', () => ({ generateRedirectJson: jest.fn() }))
jest.mock('@/lib/plugins/algolia', () => ({ checkDataFromAlgolia: jest.fn() }))
jest.mock('@/themes/theme', () => ({ DynamicLayout: () => null }))

import { generateRss } from '@/lib/rss'
import { getStaticProps } from '@/pages/index'

describe('home page build artifacts', () => {
  it('waits for RSS generation before completing static props', async () => {
    let finishRss
    generateRss.mockImplementation(
      () => new Promise(resolve => (finishRss = resolve))
    )

    let staticPropsFinished = false
    const staticProps = getStaticProps({ locale: 'zh-CN' }).then(result => {
      staticPropsFinished = true
      return result
    })

    await Promise.resolve()
    await Promise.resolve()
    const finishedBeforeRss = staticPropsFinished
    finishRss()
    await staticProps

    expect(generateRss).toHaveBeenCalledTimes(1)
    expect(finishedBeforeRss).toBe(false)
  })
})
