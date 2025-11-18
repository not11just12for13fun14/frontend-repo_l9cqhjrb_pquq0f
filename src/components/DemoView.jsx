import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const WS_BASE = import.meta.env.VITE_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:8000'
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function DemoView() {
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState([])
  const [leads, setLeads] = useState([])
  const [projectId, setProjectId] = useState('')
  const wsRef = useRef(null)

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/demo/bootstrap`)
      const data = await res.json()
      setSteps(data.steps)
      setLeads(data.leads)
      setProjectId(data.project_id)
      setLoading(false)

      const ws = new WebSocket(`${WS_BASE}/ws/projects/${data.project_id}`)
      ws.onmessage = (evt) => {
        const event = JSON.parse(evt.data)
        if (event.type === 'lead_advanced') {
          setLeads((prev) => prev.map((l) => (l.id === event.lead_id ? { ...l, current_step: event.to } : l)))
        }
      }
      wsRef.current = ws
    }
    bootstrap()
    return () => wsRef.current?.close()
  }, [])

  useEffect(() => {
    // Auto-advance random leads for demo
    if (!projectId) return
    const id = setInterval(async () => {
      try {
        await fetch(`${API_BASE}/api/projects/${projectId}/advance-random`, { method: 'POST' })
      } catch (e) {}
    }, 2000)
    return () => clearInterval(id)
  }, [projectId])

  const columns = useMemo(() => steps.map((s) => ({ key: s, title: s })), [steps])

  if (loading) {
    return (
      <div className="py-24 text-center text-blue-100">Chargement de la démo…</div>
    )
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {columns.map((col, idx) => (
            <div key={col.key} className="relative h-[420px] rounded-2xl p-3 bg-gradient-to-b from-slate-800/70 to-slate-900/60 border border-white/10 overflow-hidden">
              <div className="mb-2 text-sm font-semibold text-white/90">{col.title}</div>
              <ParticleField index={idx} step={col.key} leads={leads.filter((l)=>l.current_step===col.key)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ParticleField({ leads, index, step }) {
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const r = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setDims({ w: rect.width, h: rect.height })
    }
    r()
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-3 rounded-xl bg-slate-900/40 border border-white/5 overflow-hidden">
      {/* subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.06),transparent_40%)]" />
      {leads.map((lead) => (
        <LeadParticle key={lead.id} lead={lead} w={dims.w} h={dims.h} columnIndex={index} />
      ))}
    </div>
  )
}

function LeadParticle({ lead, w, h, columnIndex }) {
  const x = Math.random() * (w - 14)
  const y = Math.random() * (h - 14)
  const duration = 6 + Math.random() * 6
  return (
    <motion.div
      className="absolute h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_6px_rgba(34,211,238,0.7)]"
      initial={{ x, y, opacity: 0.7 }}
      animate={{ x: x + (Math.random() * 30 - 15), y: y + (Math.random() * 30 - 15), opacity: 1 }}
      transition={{ duration, yoyo: Infinity, repeat: Infinity, ease: 'easeInOut' }}
      title={`${lead.name} • ${lead.source || '—'}`}
    />
  )
}
