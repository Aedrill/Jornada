import { describe, expect, it } from 'vitest'
import {
  isSupabaseConfigured,
  supabase,
} from './supabaseClient'

describe('supabaseClient', () => {
  it('não quebra quando as variáveis estão ausentes', () => {
    expect(supabase).toBeNull()
  })

  it('expõe um estado de configuração identificável', () => {
    expect(isSupabaseConfigured).toBe(false)
    expect(typeof isSupabaseConfigured).toBe('boolean')
  })
})
