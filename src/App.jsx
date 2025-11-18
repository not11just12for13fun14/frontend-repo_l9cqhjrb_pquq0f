import { useState } from 'react'
import Hero from './components/Hero'
import Concept from './components/Concept'
import Roles from './components/Roles'
import DemoView from './components/DemoView'

function App() {
  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_6px_rgba(34,211,238,0.6)]"></div>
            <span className="font-semibold">Leadflow</span>
          </div>
          <nav className="hidden sm:flex gap-6 text-sm text-white/80">
            <a href="#concept" className="hover:text-white">Concept</a>
            <a href="#roles" className="hover:text-white">Rôles</a>
            <a href="#demo" className="hover:text-white">Démo</a>
          </nav>
          <button onClick={()=>setShowDemo(true)} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold hover:bg-blue-400">Essayer</button>
        </div>
      </header>

      {!showDemo && (
        <>
          <Hero onStartDemo={() => setShowDemo(true)} />
          <Concept />
          <Roles />
          <section id="demo"><DemoView /></section>
        </>
      )}

      {showDemo && (
        <main>
          <DemoView />
        </main>
      )}

      <footer className="px-6 py-12 text-center text-white/60">© {new Date().getFullYear()} Leadflow</footer>
    </div>
  )
}

export default App
