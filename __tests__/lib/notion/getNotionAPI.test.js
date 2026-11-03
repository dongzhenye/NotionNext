describe('Notion API edge compatibility', () => {
  beforeEach(() => {
    jest.resetModules()
    delete process.env.API_BASE_URL
  })

  afterEach(() => {
    jest.dontMock('notion-client')
  })

  it('reads content through the current Notion host with an identifying user agent', async () => {
    jest.doMock('notion-client', () => ({
      NotionAPI: class {
        constructor(options) {
          this.options = options
        }

        async getPage() {
          const userAgent = this.options.ofetchOptions?.headers?.['User-Agent']
          if (
            this.options.apiBaseUrl !== 'https://app.notion.com/api/v3' ||
            userAgent !==
              'NotionNext (+https://github.com/NotionNext/NotionNext)'
          ) {
            throw new Error('Notion edge compatibility is not configured')
          }
          return { recordMap: { block: {} } }
        }
      }
    }))

    const { notionAPI } = require('@/lib/notion/getNotionAPI')

    await expect(notionAPI.getPage('public-page-id')).resolves.toEqual({
      recordMap: { block: {} }
    })
  })
})
