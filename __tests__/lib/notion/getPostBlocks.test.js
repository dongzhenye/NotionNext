jest.mock('@/lib/notion/getNotionAPI', () => ({
  __esModule: true,
  default: {
    getBlocks: jest.fn().mockResolvedValue({
      recordMap: {
        block: {
          child: {
            spaceId: 'space-id',
            value: {
              role: 'reader',
              value: { id: 'child', type: 'text', parent_id: 'page-id' }
            }
          }
        }
      }
    })
  }
}))

jest.mock('@/lib/cache/cache_manager', () => ({
  getDataFromCache: jest.fn(),
  getOrSetDataWithCache: jest.fn(),
  setDataToCache: jest.fn()
}))

import {
  convertNotionBlocksToPost,
  fetchInBatches
} from '@/lib/notion/getPostBlocks'

describe('current Notion block wrappers', () => {
  it('preserves legacy root-property redaction and child block processing', () => {
    const result = convertNotionBlocksToPost('page-id', {
      block: {
        'page-id': {
          spaceId: 'space-id',
          value: {
            role: 'reader',
            value: {
              id: 'page-id',
              type: 'page',
              properties: { privateMarker: [['must-not-leak']] }
            }
          }
        },
        child: {
          spaceId: 'space-id',
          value: {
            role: 'reader',
            value: { id: 'child', type: 'text', parent_id: 'page-id' }
          }
        }
      }
    })

    expect(result.block['page-id'].value.properties).toBeUndefined()
    expect(result.block.child.value).toMatchObject({
      id: 'child',
      type: 'text',
      parent_id: 'page-id'
    })
  })

  it('normalizes blocks fetched after the initial site-data conversion', async () => {
    await expect(fetchInBatches(['child'])).resolves.toEqual({
      child: {
        value: { id: 'child', type: 'text', parent_id: 'page-id' }
      }
    })
  })
})
