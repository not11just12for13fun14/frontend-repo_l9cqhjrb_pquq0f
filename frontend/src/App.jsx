import React, { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || ''

const STEP_COLORS = { New: '#60a5fa', Qualified: '#34d399', Meeting: '#fbbf24', Closed: '#f87171' }

function Column({ title, children }) {
  return (
    <div className="flex-1 border-l border-white/10 relative min-h-[60vh] p-3">
      <div className="text-sm text-white/70 mb-2 font-medium">{title}</div>
      <div className="relative w-full h-[55vh]">{children}</div>
    </div>
  )
}

function Dot({ x, y, color, title }) {
  return (
    <div title={title} className="absolute w-3 h-3 rounded-full" style={{ left: `${x}%`, top: `${y}%`, background: color }} />
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [project, setProject] = useState(null)
  const [steps, setSteps] = useState(["New", "Qualified", "Meeting", "Closed"])
  const [leads, setLeads] = useState([])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        setLoading(true)
        const res = await fetch(`${API}/api/demo/bootstrap`)
        if (!res.ok) throw new Error('http')
        const data = await res.json()
        if (cancelled) return
        setProject(data.project)
        setSteps(data.steps || steps)
        setLeads(data.leads || [])
      } catch (e) {
        setError("Backend injoignable")
      } finally {
        setLoading(false)
      }
    }
    boot()
    return () => { cancelled = true }
  }, [])

  const leadsByStep = useMemo(() => {
    const map = {}; steps.forEach(s => { map[s] = [] })
    leads.forEach(l => { const s = steps.includes(l.step) ? l.step : steps[0]; map[s].push(l) })
    return map
  }, [leads, steps])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Leadflow Demo</h1>
          <span className="text-sm text-white/70">{project ? project.name : '...'}</span>
        </div>
        {loading && <div className="p-3 rounded bg-white/5">Chargement…</div>}
        {error && <div className="p-3 rounded bg-red-500/20 border border-red-500/40">{error}</div>}
        {!loading && !error && (
          <div className="flex gap-2 bg-white/5 rounded border border-white/10 overflow-hidden">
            {steps.map((step) => (
              <Column key={step} title={`${step} (${leadsByStep[step]?.length || 0})`}>
                {leadsByStep[step]?.map((lead, idx) => {
                  const x = (idx * 13) % 90 + 5
                  const y = ((idx * 29) % 90) + 5
                  return (
                    <Dot key={lead._id} x={x} y={y} color={STEP_COLORS[step] || '#a78bfa'} title={`${lead.name} • ${lead.source}`} />
                  )
                })}
              </Column>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
