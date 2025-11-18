import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WS_BASE = import.meta.env.VITE_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:8000'
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Phase colors (background gradients)
const PHASE_STYLES = {
  Acquisition: {
    bg: 'from-sky-800/50 via-sky-900/50 to-sky-950/60',
    dot: 'bg-sky-300',
    glow: 'shadow-[0_0_28px_10px_rgba(56,189,248,0.65)]'
  },
  Setter: {
    bg: 'from-violet-800/50 via-fuchsia-900/50 to-fuchsia-950/60',
    dot: 'bg-fuchsia-300',
    glow: 'shadow-[0_0_28px_10px_rgba(232,121,249,0.6)]'
  },
  Closer: {
    bg: 'from-orange-800/50 via-amber-900/50 to-emerald-950/60',
    dot: 'bg-amber-300',
    glow: 'shadow-[0_0_28px_10px_rgba(251,191,36,0.6)]'
  },
  Vente: {
    bg: 'from-emerald-800/50 via-emerald-900/50 to-emerald-950/60',
    dot: 'bg-emerald-300',
    glow: 'shadow-[0_0_28px_10px_rgba(16,185,129,0.6)]'
  },
  Lost: {
    bg: 'from-slate-800/50 via-slate-900/60 to-black/70',
    dot: 'bg-slate-400',
    glow: 'shadow-[0_0_24px_8px_rgba(148,163,184,0.35)]'
  }
}

export default function DemoView() {
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState([])
  const [users, setUsers] = useState([])
  const [leads, setLeads] = useState([])
  const [projectId, setProjectId] = useState('')
  const [zoom, setZoom] = useState(1)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [viewMode, setViewMode] = useState('default') // default | admin-acq | admin-set | admin-close
  const [selectedLead, setSelectedLead] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/demo/bootstrap`)
      const data = await res.json()
      setSteps(data.steps)
      setLeads(data.leads)
      setProjectId(data.project_id)
      // load members
      try {
        const ures = await fetch(`${API_BASE}/api/users?project_id=${data.project_id}`)
        const u = await ures.json()
        setUsers(u)
      } catch (e) {}
      setLoading(false)

      const ws = new WebSocket(`${WS_BASE}/ws/projects/${data.project_id}`)
      ws.onmessage = (evt) => {
        const event = JSON.parse(evt.data)
        if (event.type === 'lead_advanced') {
          setLeads((prev) => prev.map((l) => (l.id === event.lead_id ? { ...l, current_step: event.to, status: event.to === steps[steps.length-1] ? 'won' : l.status } : l)))
        }
        if (event.type === 'lead_assigned') {
          setLeads((prev) => prev.map((l) => (l.id === event.lead_id ? { ...l, assigned_to: event.to_user } : l)))
        }
      }
      wsRef.current = ws
    }
    bootstrap()
    return () => wsRef.current?.close()
  }, [])

  useEffect(() => {
    if (!projectId) return
    const id = setInterval(async () => {
      try {
        await fetch(`${API_BASE}/api/projects/${projectId}/advance-random`, { method: 'POST' })
      } catch (e) {}
    }, 2200)
    return () => clearInterval(id)
  }, [projectId])

  const sources = useMemo(() => {
    const set = new Set(leads.map(l => l.source).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [leads])

  const assignedOptions = useMemo(() => {
    return ['all', 'unassigned', ...users.map(u => u.id)]
  }, [users])

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (query && !(l.name?.toLowerCase().includes(query.toLowerCase()) || l.source?.toLowerCase().includes(query.toLowerCase()))) return false
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
      if (assignedFilter === 'unassigned' && l.assigned_to) return false
      if (assignedFilter !== 'all' && assignedFilter !== 'unassigned' && l.assigned_to !== assignedFilter) return false
      return true
    })
  }, [leads, query, sourceFilter, assignedFilter])

  const columns = useMemo(() => steps.map((s) => ({ key: s, title: s })), [steps])

  if (loading) {
    return (
      <div className="py-24 text-center text-blue-100">Chargement de la démo…</div>
    )
  }

  return (
    <section className="px-4 sm:px-6 py-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <Toolbar
          zoom={zoom}
          setZoom={setZoom}
          query={query}
          setQuery={setQuery}
          sources={sources}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          users={users}
          assignedFilter={assignedFilter}
          setAssignedFilter={setAssignedFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/40 p-3 sm:p-4">
          <CanvasBoard
            columns={columns}
            leads={filteredLeads}
            users={users}
            zoom={zoom}
            viewMode={viewMode}
            onSelectLead={setSelectedLead}
          />
        </div>
      </div>

      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        steps={steps}
        users={users}
        onAdvance={async (leadId, toStep) => {
          await fetch(`${API_BASE}/api/leads/${leadId}/advance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_step: toStep }) })
        }}
        onAssign={async (leadId, userId) => {
          await fetch(`${API_BASE}/api/leads/${leadId}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) })
        }}
      />
    </section>
  )
}

function Toolbar({ zoom, setZoom, query, setQuery, sources, sourceFilter, setSourceFilter, users, assignedFilter, setAssignedFilter, viewMode, setViewMode }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/70">Zoom</span>
        <input type="range" min={0.7} max={1.6} step={0.05} value={zoom} onChange={(e)=>setZoom(parseFloat(e.target.value))} className="w-40" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher…" className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm outline-none border border-white/10 placeholder:text-white/40" />
        <select value={sourceFilter} onChange={(e)=>setSourceFilter(e.target.value)} className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm outline-none border border-white/10">
          {sources.map(s=> (<option key={s} value={s}>{s==='all'?'Toutes sources':s}</option>))}
        </select>
        <select value={assignedFilter} onChange={(e)=>setAssignedFilter(e.target.value)} className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm outline-none border border-white/10">
          {['all','unassigned', ...users.map(u=>u.id)].map(v=> (
            <option key={v} value={v}>{v==='all'?'Tous assignés': v==='unassigned'?'Non assignés': users.find(u=>u.id===v)?.name || v}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1">
          <button onClick={()=>setViewMode('default')} className={`px-3 py-1.5 rounded-md text-sm ${viewMode==='default'?'bg-slate-700/70':'hover:bg-slate-700/40'}`}>Vue</button>
          <button onClick={()=>setViewMode('admin-acq')} className={`px-3 py-1.5 rounded-md text-sm ${viewMode==='admin-acq'?'bg-slate-700/70':'hover:bg-slate-700/40'}`}>Acquisition</button>
          <button onClick={()=>setViewMode('admin-set')} className={`px-3 py-1.5 rounded-md text-sm ${viewMode==='admin-set'?'bg-slate-700/70':'hover:bg-slate-700/40'}`}>Setting</button>
          <button onClick={()=>setViewMode('admin-close')} className={`px-3 py-1.5 rounded-md text-sm ${viewMode==='admin-close'?'bg-slate-700/70':'hover:bg-slate-700/40'}`}>Closing</button>
        </div>
      </div>
    </div>
  )
}

function CanvasBoard({ columns, leads, users, zoom, viewMode, onSelectLead }) {
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const r = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setDims({ w: rect.width, h: 520 })
    }
    r()
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  // Lanes per admin mode
  const laneMap = useMemo(() => {
    const map = new Map()
    if (viewMode === 'admin-acq') {
      const vals = Array.from(new Set(leads.map(l=>l.source||'Autre')))
      vals.forEach((v, i) => map.set(`acq:${v}`, i))
    } else if (viewMode === 'admin-set') {
      const setters = users.filter(u=>u.role==='setter').map(u=>u.id)
      setters.forEach((id, i) => map.set(`set:${id}`, i))
      map.set('set:unassigned', setters.length)
    } else if (viewMode === 'admin-close') {
      const closers = users.filter(u=>u.role==='closer').map(u=>u.id)
      closers.forEach((id, i) => map.set(`close:${id}`, i))
      map.set('close:unassigned', closers.length)
    }
    return map
  }, [viewMode, leads, users])

  const columnWidth = useMemo(() => (dims.w - 16) / Math.max(1, columns.length), [dims.w, columns.length])
  const height = dims.h

  // Position resolver
  const getPos = (lead) => {
    const stepIndex = Math.max(0, columns.findIndex(c=>c.key===lead.current_step))
    const x = 8 + columnWidth * stepIndex + columnWidth * 0.5

    let lane = 0
    if (viewMode === 'admin-acq') {
      const key = `acq:${lead.source||'Autre'}`
      lane = laneMap.get(key) ?? 0
    } else if (viewMode === 'admin-set') {
      const key = `set:${lead.assigned_to || 'unassigned'}`
      lane = laneMap.get(key) ?? 0
    } else if (viewMode === 'admin-close') {
      const to = (lead.assigned_to && users.find(u=>u.id===lead.assigned_to)?.role === 'closer') ? lead.assigned_to : 'unassigned'
      const key = `close:${to}`
      lane = laneMap.get(key) ?? 0
    } else {
      // default deterministic lane by id hash
      lane = hashToLane(lead.id, 8)
    }

    const lanesCount = laneMap.size || 8
    const laneHeight = height / Math.max(1, lanesCount)
    const y = laneHeight * lane + laneHeight * 0.2 + (hashToLane(lead.id + 'salt', 10) / 10) * (laneHeight * 0.6)
    return { x, y }
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/50">
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {/* Columns */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((col, idx) => (
            <div key={col.key} className={`relative border-l border-white/10 ${idx===columns.length-1?'border-r':''} bg-gradient-to-b ${PHASE_STYLES[col.key]?.bg || 'from-slate-800/40 to-slate-900/60'}`}>
              <div className="sticky top-0 z-10 backdrop-blur-sm bg-slate-950/30 border-b border-white/10 px-3 py-2">
                <div className="text-sm font-semibold">{col.title}</div>
                <StatsHint mode={viewMode} columnKey={col.key} users={users} />
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <svg className="relative pointer-events-none" width={dims.w} height={height} />
        <div className="absolute inset-0">
          {leads.map((lead) => (
            <LeadDot
              key={lead.id}
              lead={lead}
              pos={getPos(lead)}
              phaseStyle={PHASE_STYLES[lead.current_step] || PHASE_STYLES.Acquisition}
              onClick={() => onSelectLead(lead)}
              users={users}
            />)
          )}
        </div>
      </div>
    </div>
  )
}

function StatsHint({ mode, columnKey, users }) {
  if (mode === 'admin-acq' && columnKey === 'Acquisition') {
    return <div className="text-[11px] text-white/70">Groupé par canal d'entrée. Stats: volume, taux de qualification.</div>
  }
  if (mode === 'admin-set' && columnKey === 'Setter') {
    return <div className="text-[11px] text-white/70">Groupé par setter. Stats: conv., durée moy., RDV, no-show.</div>
  }
  if (mode === 'admin-close' && columnKey === 'Closer') {
    return <div className="text-[11px] text-white/70">Groupé par closer. Stats: closing, panier moyen, délai.</div>
  }
  return null
}

function LeadDot({ lead, pos, phaseStyle, onClick, users }) {
  const [hover, setHover] = useState(false)
  const size = 8
  const assigned = users.find(u=>u.id===lead.assigned_to)
  const roleTint = assigned?.role === 'setter' ? 'ring-fuchsia-400/50' : assigned?.role === 'closer' ? 'ring-emerald-400/50' : 'ring-cyan-400/40'

  return (
    <div
      className="absolute"
      style={{ left: 0, top: 0, transform: `translate(${pos.x - size/2}px, ${pos.y - size/2}px)` }}
    >
      <motion.button
        onMouseEnter={()=>setHover(true)}
        onMouseLeave={()=>setHover(false)}
        onClick={onClick}
        className={`h-2.5 w-2.5 rounded-full ${phaseStyle.dot} ${phaseStyle.glow} ring-2 ${roleTint}`}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        title={lead.name}
      />
      <AnimatePresence>
        {hover && (
          <motion.div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-3 rounded-md border border-white/10 bg-slate-900/90 px-2 py-1 text-xs text-white/90 backdrop-blur"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <div className="font-medium">{lead.name}</div>
            <div className="text-white/70">{lead.source || '—'} • {lead.current_step}</div>
            <div className="text-white/60">Assigné: {assigned?.name || '—'}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LeadDrawer({ lead, onClose, steps, users, onAdvance, onAssign }) {
  return (
    <AnimatePresence>
      {lead && (
        <motion.aside
          className="fixed right-0 top-0 z-40 h-full w-full max-w-md border-l border-white/10 bg-slate-950/95 backdrop-blur p-4 sm:p-6 overflow-y-auto"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Lead</div>
              <div className="text-lg font-semibold">{lead.name}</div>
            </div>
            <button onClick={onClose} className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Fermer</button>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="rounded-lg border border-white/10 p-3 bg-slate-900/40">
              <div className="text-sm text-white/60">Source</div>
              <div className="font-medium">{lead.source || '—'}</div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 bg-slate-900/40">
              <div className="text-sm text-white/60">Étape</div>
              <div className="font-medium">{lead.current_step}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {steps.map(s => (
                  <button key={s} onClick={()=>onAdvance(lead.id, s)} className={`rounded-md px-2.5 py-1 text-xs border ${lead.current_step===s?'bg-white/10 border-white/30':'border-white/10 hover:bg-white/5'}`}>{s}</button>
                ))}
                <button onClick={()=>onAdvance(lead.id, null)} className="rounded-md px-2.5 py-1 text-xs border border-white/10 hover:bg-white/5">Avancer ➜</button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 bg-slate-900/40">
              <div className="text-sm text-white/60">Assignation</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={()=>onAssign(lead.id, null)} className="col-span-2 rounded-md px-3 py-2 text-sm border border-white/10 hover:bg-white/5">Non assigné</button>
                <div className="col-span-2 text-xs text-white/50 mt-1">Setters</div>
                {users.filter(u=>u.role==='setter').map(u => (
                  <button key={u.id} onClick={()=>onAssign(lead.id, u.id)} className="rounded-md px-3 py-2 text-sm border border-white/10 hover:bg-white/5 text-left">{u.name}</button>
                ))}
                <div className="col-span-2 text-xs text-white/50 mt-1">Closers</div>
                {users.filter(u=>u.role==='closer').map(u => (
                  <button key={u.id} onClick={()=>onAssign(lead.id, u.id)} className="rounded-md px-3 py-2 text-sm border border-white/10 hover:bg-white/5 text-left">{u.name}</button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 p-3 bg-slate-900/40">
              <div className="text-sm text-white/60">Historique</div>
              <div className="mt-2 text-sm text-white/70">Bientôt: timeline horodatée (avancées, assignations, notes…)</div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function hashToLane(str, lanes) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h) % lanes
}
