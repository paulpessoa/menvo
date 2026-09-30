/**
 * @jest-environment node
 */
import { signResultLink, verifyResultLink } from './result-link'

const QUIZ_ID = '4394562d-8b17-48c8-8234-b851c345b501'

describe('quiz result link token', () => {
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  beforeAll(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  afterAll(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  })

  it('verifies a token for the same quiz and e-mail (case-insensitive)', () => {
    const token = signResultLink(QUIZ_ID, 'Ana@Example.com')
    expect(verifyResultLink(token, QUIZ_ID, 'ana@example.com')).toBe(true)
  })

  it('rejects a token for another quiz or another e-mail', () => {
    const token = signResultLink(QUIZ_ID, 'ana@example.com')
    expect(verifyResultLink(token, '00000000-0000-0000-0000-000000000000', 'ana@example.com')).toBe(false)
    expect(verifyResultLink(token, QUIZ_ID, 'other@example.com')).toBe(false)
  })

  it('rejects an expired token', () => {
    const issuedAt = Date.now() - 31 * 24 * 60 * 60 * 1000
    const token = signResultLink(QUIZ_ID, 'ana@example.com', issuedAt)
    expect(verifyResultLink(token, QUIZ_ID, 'ana@example.com')).toBe(false)
  })

  it('rejects a token whose expiry was pushed forward', () => {
    const token = signResultLink(QUIZ_ID, 'ana@example.com')
    const [, sig] = token.split('.')
    const forged = `${(Date.now() + 365 * 24 * 60 * 60 * 1000).toString(36)}.${sig}`
    expect(verifyResultLink(forged, QUIZ_ID, 'ana@example.com')).toBe(false)
  })

  it('rejects garbage', () => {
    expect(verifyResultLink('', QUIZ_ID, 'ana@example.com')).toBe(false)
    expect(verifyResultLink('not-a-token', QUIZ_ID, 'ana@example.com')).toBe(false)
  })
})
