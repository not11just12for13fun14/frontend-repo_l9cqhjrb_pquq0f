import { motion } from 'framer-motion'

export default function Hero({ onStartDemo }) {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-blue-500/30 blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 h-96 w-[28rem] rounded-full bg-cyan-500/20 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white"
        >
          Leadflow — Le pipeline commercial vivant
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto"
        >
          Suis les leads en mouvement. Donne du pouvoir à chaque rôle. Transforme la donnée en clarté.
        </motion.p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={onStartDemo}
            className="rounded-xl bg-blue-500 px-6 py-3 text-white font-semibold hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
          >
            Essayer la démo
          </button>
          <a
            href="#concept"
            className="rounded-xl border border-white/20 px-6 py-3 text-white/90 hover:text-white hover:border-white/40 transition-colors"
          >
            En savoir plus
          </a>
        </div>
      </div>

      {/* Particle band preview */}
      <div className="relative mt-16">
        <ParticleBand />
      </div>
    </section>
  )
}

function ParticleBand() {
  const particles = Array.from({ length: 120 }, (_, i) => i)
  return (
    <div className="relative mx-auto max-w-5xl h-40 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-800 to-blue-900/40 border border-white/10 overflow-hidden">
      <div className="absolute inset-y-0 left-1/3 w-px bg-white/10"></div>
      <div className="absolute inset-y-0 left-2/3 w-px bg-white/10"></div>
      {particles.map((p) => (
        <motion.div
          key={p}
          className="absolute h-1 w-1 rounded-full bg-white/90 shadow-[0_0_15px_2px_rgba(56,189,248,0.8)]"
          initial={{ x: -40, y: Math.random() * 160, opacity: 0 }}
          animate={{ x: 1000, y: Math.random() * 160, opacity: 1 }}
          transition={{ duration: 6 + Math.random() * 4, delay: Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
