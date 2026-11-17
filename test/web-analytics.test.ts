import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../analytics.js', import.meta.url), 'utf8')
function browser(url: string) {
  const location = new URL(url)
  const scripts: { src?: string }[] = []
  const window = {
    dataLayer: [] as IArguments[],
    addEventListener() {},
    tmtAnalytics: undefined as undefined | { page(): void; event(name: string): void },
  }
  const update = (_state: unknown, _title: string, next?: string | URL | null) => {
    if (next != null) location.href = new URL(String(next), location.href).href
  }
  const history = { pushState: update, replaceState: update }
  const scope = { window, history, location, URLSearchParams, document: { createElement: () => ({}), head: { appendChild: (script: { src?: string }) => scripts.push(script) } } }
  runInNewContext(source, scope)
  const commands = () => window.dataLayer.map(command => Array.from(command))
  const pageViews = () => commands().filter(command => command[0] === 'event' && command[1] === 'page_view')
  return { window, history, scripts, commands, pageViews, rerun: () => runInNewContext(source, scope) }
}

describe('web analytics collection boundaries', () => {
  it.each([
    'http://localhost:3000/',
    'https://preview.vercel.app/',
    'https://tmt-album-board.vercel.app/?mock=1',
    'https://tmt-album-board.vercel.app/admin/analytics',
    'https://tmt-album-board.vercel.app/admin/reports',
  ])('does not load or collect on %s', url => {
    const app = browser(url)
    app.window.tmtAnalytics?.event('chart_save')
    app.window.tmtAnalytics?.page()
    expect(app.scripts).toHaveLength(0)
    expect(app.commands()).toHaveLength(0)
  })

  it('sends a sanitized page and excludes IDs, titles, query values and unknown events', () => {
    const app = browser('https://tmt-album-board.vercel.app/album/private-album-id?email=private@example.com#secret')
    app.window.tmtAnalytics?.event('private_search_term')
    expect(app.scripts).toHaveLength(1)
    expect(app.pageViews()).toHaveLength(1)
    expect(app.pageViews()[0][2]).toMatchObject({ page_location: 'https://tmt-album-board.vercel.app/album_detail', page_title: 'album_detail', page_referrer: '' })
    const sent = JSON.stringify(app.commands())
    for (const value of ['private-album-id', 'private@example.com', 'secret', 'private_search_term']) expect(sent).not.toContain(value)
  })

  it('initializes at most once when both SPA and layout include the collector', () => {
    const app = browser('https://tmt-album-board.vercel.app/')
    app.rerun()
    expect(app.scripts).toHaveLength(1)
    expect(app.pageViews()).toHaveLength(1)
  })

  it('updates the effective page context after client navigation for automatic engagement events', () => {
    const app = browser('https://tmt-album-board.vercel.app/taste')
    app.history.pushState(null, '', '/album/123')
    // Official gtag precedence: event > config > global set. Automatic events
    // need the latest page at the persistent scope, not only on page_view.
    let globalParameters: Record<string, unknown> = {}
    let configuration: Record<string, unknown> = {}
    for (const command of app.commands()) {
      if (command[0] === 'set') globalParameters = { ...globalParameters, ...command[1] }
      if (command[0] === 'config') configuration = { ...configuration, ...command[2] }
    }
    expect({ ...globalParameters, ...configuration }).toMatchObject({ page_location: 'https://tmt-album-board.vercel.app/album_detail', page_title: 'album_detail' })
  })

  it('counts navigation between distinct albums while deduplicating the same route', () => {
    const app = browser('https://tmt-album-board.vercel.app/album/123')
    app.window.tmtAnalytics?.page()
    expect(app.pageViews()).toHaveLength(1)
    app.history.pushState(null, '', '/album/456')
    expect(app.pageViews()).toHaveLength(2)
    expect(JSON.stringify(app.commands())).not.toContain('/album/456')
  })
  it('disables automatic collection on client-side admin navigation and resumes on public pages', () => {
    const app = browser('https://tmt-album-board.vercel.app/taste')
    app.history.pushState(null, '', '/admin/analytics')
    expect((app.window as unknown as Record<string, unknown>)['ga-disable-G-RNF13TKBPY']).toBe(true)
    app.window.tmtAnalytics?.event('chart_save')
    expect(app.pageViews()).toHaveLength(1)
    app.history.pushState(null, '', '/taste')
    expect((app.window as unknown as Record<string, unknown>)['ga-disable-G-RNF13TKBPY']).toBe(false)
    expect(app.pageViews()).toHaveLength(2)
  })

})
