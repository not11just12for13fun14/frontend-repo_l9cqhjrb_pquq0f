export default function Roles() {
  const roles = [
    {
      title: 'Administrateur',
      points: [
        'Crée les projets et définit les étapes',
        'Importe les leads (CSV, Sheets, Notion, Airtable)',
        'Gère les membres et permissions',
        'Accède aux statistiques globales'
      ]
    },
    {
      title: 'Setter',
      points: [
        'Voit ses leads assignés',
        'Qualifie, passe au closer ou arrête',
        'Intègre Calendly pour les RDV'
      ]
    },
    {
      title: 'Closer',
      points: [
        'Reçoit les leads qualifiés',
        "Accède à l'historique et aux notes",
        'Clôture les deals et indique le résultat'
      ]
    },
    {
      title: 'Viewer / Analyst',
      points: [
        'Accès en lecture seule',
        'Consulte taux de conversion et performances'
      ]
    }
  ]

  return (
    <section id="roles" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">Rôles utilisateurs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r) => (
            <div key={r.title} className="rounded-2xl bg-slate-800/60 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-3">{r.title}</h3>
              <ul className="space-y-2 text-blue-100 text-sm">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2 items-start"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400"></span>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
