import { describe, expect, it } from 'vitest'
import { createId } from './createId'

describe('createId', () => {
  it('usa randomUUID quando disponível', () => {
    const cryptoApi = {
      randomUUID: () => 'uuid-seguro',
    }

    expect(createId(cryptoApi)).toBe('uuid-seguro')
  })

  it('cria UUID com getRandomValues como alternativa', () => {
    const cryptoApi = {
      getRandomValues: (bytes) => {
        bytes.fill(10)
        return bytes
      },
    }

    const id = createId(cryptoApi)

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('cria um identificador local sem crypto', () => {
    expect(createId(null)).toMatch(/^local-/)
  })
})
