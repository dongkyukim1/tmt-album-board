import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), fetch: vi.fn(), load: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.cookie }) }))
vi.mock('@/lib/analytics/auth', async () => import('../src/lib/analytics/auth'))
vi.mock('@/lib/analytics/google', () => ({
  loadAnalytics: mocks.load,
  AnalyticsError: class extends Error { constructor(public code: string) { super(code) } },
}))
import { GET } from '../src/app/api/analytics/route'
import { POST, DELETE } from '../src/app/api/analytics/session/route'

const origin = 'https://tmt.example'
const login = (requestOrigin: string | null = origin, body: unknown = { email: 'admin@example.com', password: 'test-password' }) => new NextRequest(`${origin}/api/analytics/session`, {
  method: 'POST', headers: { 'content-type': 'application/json', ...(requestOrigin ? { origin: requestOrigin } : {}) }, body: JSON.stringify(body),
})
const overview = (status: number) => new Response(null, { status })

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('API_BASE_URL', 'https://api.tmt.example/api/v1')
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.cookie.mockReturnValue(undefined)
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('analytics access boundary', () => {
  it('denies an anonymous request before contacting Google or the backend', async () => {
    const response = await GET(new NextRequest(`${origin}/api/analytics`))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ code: 'AUTH_REQUIRED' })
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.load).not.toHaveBeenCalled()
  })

  it.each([401, 403, 500])('fails closed when admin verification returns %i', async status => {
    mocks.cookie.mockReturnValue({ value: 'access-token' })
    mocks.fetch.mockResolvedValue(overview(status))
    const response = await GET(new NextRequest(`${origin}/api/analytics`))
    expect(response.status).toBe(status === 500 ? 503 : status)
    expect(mocks.load).not.toHaveBeenCalled()
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it('authorizes every request, including requests that can hit the report cache', async () => {
    mocks.cookie.mockReturnValue({ value: 'access-token' })
    mocks.fetch.mockResolvedValue(overview(200))
    mocks.load.mockResolvedValue({ source: 'Google Analytics 4' })
    const response = await GET(new NextRequest(`${origin}/api/analytics?days=7&platform=ios`))
    expect(response.status).toBe(200)
    expect(mocks.fetch).toHaveBeenCalledWith('https://api.tmt.example/api/v1/admin/overview', expect.objectContaining({ headers: { Authorization: 'Bearer access-token' }, cache: 'no-store' }))
    expect(mocks.load).toHaveBeenCalledWith(7, 'ios')
    expect(await response.json()).toEqual({ data: { source: 'Google Analytics 4' } })
    mocks.fetch.mockResolvedValue(overview(403))
    expect((await GET(new NextRequest(`${origin}/api/analytics?days=7&platform=ios`))).status).toBe(403)
    expect(mocks.load).toHaveBeenCalledTimes(1)
  })

  it.each(['days=365', 'days=NaN', 'platform=all', 'platform=../../secret'])('rejects an invalid filter: %s', async query => {
    mocks.cookie.mockReturnValue({ value: 'access-token' })
    mocks.fetch.mockResolvedValue(overview(200))
    const response = await GET(new NextRequest(`${origin}/api/analytics?${query}`))
    expect(response.status).toBe(400)
    expect(mocks.load).not.toHaveBeenCalled()
  })

  it('does not expose Google credential or upstream exception contents', async () => {
    mocks.cookie.mockReturnValue({ value: 'access-token' })
    mocks.fetch.mockResolvedValue(overview(200))
    mocks.load.mockRejectedValue(new Error('private_key=secret, Authorization=secret'))
    const response = await GET(new NextRequest(`${origin}/api/analytics`))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ code: 'UNAVAILABLE' })
  })

  it('does not send the bearer token to a remote plaintext backend', async () => {
    vi.stubEnv('API_BASE_URL', 'http://api.tmt.example/api/v1')
    mocks.cookie.mockReturnValue({ value: 'access-token' })
    const response = await GET(new NextRequest(`${origin}/api/analytics`))
    expect(response.status).toBe(503)
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.load).not.toHaveBeenCalled()
  })
})

describe('analytics session security', () => {
  it.each([null, 'https://attacker.example'])('rejects a login without a matching origin: %s', async requestOrigin => {
    const response = await POST(login(requestOrigin))
    expect(response.status).toBe(403)
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(response.cookies.get('tmt_analytics_session')).toBeUndefined()
  })

  it('rejects oversized input without forwarding it to authentication', async () => {
    const response = await POST(login(origin, { email: 'x'.repeat(255), password: 'test' }))
    expect(response.status).toBe(400)
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('never creates an admin session for an authenticated non-admin', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ data: { accessToken: 'non-admin-token' } })).mockResolvedValueOnce(overview(403))
    const response = await POST(login())
    expect(response.status).toBe(403)
    expect(response.cookies.get('tmt_analytics_session')).toBeUndefined()
    expect(await response.text()).not.toContain('non-admin-token')
  })

  it('places an admin token only in an HttpOnly, SameSite cookie scoped to analytics', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ data: { accessToken: 'admin-token', refreshToken: 'refresh-secret' } })).mockResolvedValueOnce(overview(200))
    const response = await POST(login())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(response.cookies.get('tmt_analytics_session')).toMatchObject({ value: 'admin-token', httpOnly: true, sameSite: 'strict', path: '/api/analytics', maxAge: 840 })
    expect(response.headers.get('set-cookie')).not.toContain('refresh-secret')
  })

  it('preserves login rate limiting and issues no session on rejection', async () => {
    mocks.fetch.mockResolvedValue(overview(429))
    const response = await POST(login())
    expect(response.status).toBe(429)
    expect(response.cookies.get('tmt_analytics_session')).toBeUndefined()
  })

  it('marks the authentication cookie Secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const productionSession = await import('../src/app/api/analytics/session/route')
    mocks.fetch.mockResolvedValueOnce(Response.json({ data: { accessToken: 'admin-token' } })).mockResolvedValueOnce(overview(200))
    const response = await productionSession.POST(login())
    expect(response.status).toBe(200)
    expect(response.cookies.get('tmt_analytics_session')?.secure).toBe(true)
  })

  it('rejects cross-origin logout without deleting the session', async () => {
    const response = await DELETE(new NextRequest(`${origin}/api/analytics/session`, { method: 'DELETE', headers: { origin: 'https://attacker.example' } }))
    expect(response.status).toBe(403)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('expires the same cookie path on an authorized logout', async () => {
    const response = await DELETE(new NextRequest(`${origin}/api/analytics/session`, { method: 'DELETE', headers: { origin } }))
    expect(response.status).toBe(200)
    expect(response.cookies.get('tmt_analytics_session')).toMatchObject({ value: '', path: '/api/analytics', maxAge: 0, httpOnly: true, sameSite: 'strict' })
  })
})
