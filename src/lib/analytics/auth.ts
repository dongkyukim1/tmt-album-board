import { cookies } from 'next/headers'
export const COOKIE = 'tmt_analytics_session'
export function apiBase() {
  const value = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL
  if (!value) throw new Error('BACKEND_NOT_CONFIGURED')
  const url = new URL(value)
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('BACKEND_NOT_CONFIGURED')
  return value.replace(/\/$/, '')
}
export async function checkAdmin(token: string): Promise<number> {
  const result = await fetch(`${apiBase()}/admin/overview`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(65_000) })
  return result.status
}
export async function adminStatus() {
  const token = (await cookies()).get(COOKIE)?.value
  return token ? checkAdmin(token) : 401
}
