import { adapterNotionBlockMap } from '@/lib/utils/notion.util'

describe('adapterNotionBlockMap', () => {
  it('normalizes current Notion record wrappers to the legacy record map shape', () => {
    const currentBlock = {
      spaceId: 'space-id',
      value: {
        role: 'reader',
        value: {
          id: 'page-id',
          type: 'collection_view_page',
          collection_id: 'collection-id'
        }
      }
    }
    const currentCollection = {
      spaceId: 'space-id',
      value: {
        role: 'reader',
        value: {
          id: 'collection-id',
          schema: { title: { name: 'title', type: 'title' } }
        }
      }
    }

    expect(
      adapterNotionBlockMap({
        block: { 'page-id': currentBlock },
        collection: { 'collection-id': currentCollection },
        collection_query: { 'collection-id': { view: { blockIds: [] } } }
      })
    ).toEqual({
      block: {
        'page-id': {
          value: {
            id: 'page-id',
            type: 'collection_view_page',
            collection_id: 'collection-id'
          }
        }
      },
      collection: {
        'collection-id': {
          value: {
            id: 'collection-id',
            schema: { title: { name: 'title', type: 'title' } }
          }
        }
      },
      collection_query: { 'collection-id': { view: { blockIds: [] } } }
    })
  })
})
