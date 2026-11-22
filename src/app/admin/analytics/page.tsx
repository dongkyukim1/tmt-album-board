import type { Metadata } from 'next'
import Dashboard from './Dashboard'
export const metadata: Metadata = { title: 'TMT Insights · 제품 분석', robots: { index: false, follow: false } }
export default function Page() { return <Dashboard /> }
