/**
 * Placeholder de carregamento do catálogo de mentores.
 * Espelha a estrutura do `MentorCard` (retrato 4/3 + badges, nome, cargo,
 * bio, skills e rodapé) para que a troca skeleton → card não cause salto de layout.
 */
export function MentorSkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse"
    >
      {/* Retrato */}
      <div className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800">
        <div className="absolute top-3 left-3 h-6 w-20 rounded-full bg-slate-300/70 dark:bg-slate-700" />
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-300/70 dark:bg-slate-700" />
        <div className="absolute bottom-3 left-3 h-6 w-24 rounded-lg bg-slate-300/70 dark:bg-slate-700" />
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-4">
        <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800 mt-1.5" />

        <div className="mt-3 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-800 pl-2.5">
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="flex gap-1.5 mt-3.5">
          <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-14 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-10 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
          <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}
