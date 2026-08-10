import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/ui'
import { isMockAI, aiProviderLabel } from '@/ai/engine'
import { supabaseEnabled } from '@/lib/supabase'

const NAV: { to: string; label: string; glyph: string; end?: boolean }[] = [
  { to: '/', label: 'Overview', glyph: '◎', end: true },
  { to: '/hypotheses', label: 'Hypotheses', glyph: '⋔' },
  { to: '/segments', label: 'Customer Segments', glyph: '⌗' },
  { to: '/interviews', label: 'Interviews', glyph: '❝' },
  { to: '/insights', label: 'Insights', glyph: '✦' },
  { to: '/evidence', label: 'Evidence Board', glyph: '▤' },
  { to: '/decisions', label: 'Decisions', glyph: '⟐' },
]

export function Sidebar() {
  const { projects, activeProjectId, setActiveProject } = useStore()
  const openSetup = useUI(s => s.openSetup)
  const active = projects.find(p => p.id === activeProjectId) ?? projects[0]

  return (
    <aside className="w-60 shrink-0 border-r border-line bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ink text-white grid place-items-center text-sm font-bold">G</div>
          <span className="font-semibold tracking-tight">Groundwork</span>
        </div>
        <p className="text-[11px] text-ink-faint mt-1.5 leading-tight">From belief to evidence.</p>
      </div>

      {/* Project switcher */}
      <div className="px-3 pt-3">
        <label className="label px-1">Project</label>
        <select
          className="input text-sm py-1.5"
          value={active?.id}
          onChange={e => setActiveProject(e.target.value)}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-ink-soft hover:bg-black/[0.03]',
              )
            }
          >
            <span className="w-4 text-center text-ink-faint">{item.glyph}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-line space-y-1.5">
        <button
          onClick={openSetup}
          className="w-full flex items-center justify-between text-[11px] rounded-md -mx-1 px-1 py-0.5 hover:bg-black/[0.03] transition-colors"
          title="Set up real AI"
        >
          <span className="text-ink-faint">AI</span>
          <span className="flex items-center gap-1.5 text-ink-soft">
            <span className={cn('w-1.5 h-1.5 rounded-full', isMockAI ? 'bg-ink-faint/50' : 'bg-support-fg')} />
            {aiProviderLabel}
            {isMockAI && <span className="text-brand-600">· Enable</span>}
          </span>
        </button>
        <StatusLine label="Database" value={supabaseEnabled ? 'Supabase' : 'Local (browser)'} tone={supabaseEnabled ? 'good' : 'muted'} />
        <div className="pt-2 mt-1 border-t border-line flex items-center justify-between">
          <a href="https://pyreel.com" target="_blank" rel="noreferrer" className="text-[11px] text-ink-faint hover:text-ink-soft transition-colors">
            Made by <span className="font-medium text-ink-soft">Pyreel</span>
          </a>
          <button onClick={openSetup} className="text-[11px] text-ink-faint hover:text-ink-soft transition-colors">Setup &amp; help</button>
        </div>
      </div>
    </aside>
  )
}

function StatusLine({ label, value, tone }: { label: string; value: string; tone: 'good' | 'muted' }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-ink-faint">{label}</span>
      <span className="flex items-center gap-1.5 text-ink-soft">
        <span className={cn('w-1.5 h-1.5 rounded-full', tone === 'good' ? 'bg-support-fg' : 'bg-ink-faint/50')} />
        {value}
      </span>
    </div>
  )
}
