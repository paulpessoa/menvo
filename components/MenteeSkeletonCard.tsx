/**
 * Placeholder de carregamento do diretório de membros da comunidade (/community).
 * Espelha a anatomia do `MenteeCard` (retrato 4/3 com overlay, nome, cargo,
 * tópicos de interesse, botão de ação e link de perfil) para evitar salto
 * de layout (CLS) durante o carregamento inicial e buscas debouncadas,
 * alinhado ao padrão visual de `MentorSkeletonCard` em /mentors.
 */
export function MenteeSkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse"
    >
      {/* Retrato 4/3 com overlay de gradiente e placeholders de nome e cargo */}
      <div className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
          {/* Nome */}
          <div className="h-6 w-3/4 rounded bg-slate-300/80 dark:bg-slate-700" />
          {/* Cargo / Empresa */}
          <div className="h-4 w-1/2 rounded bg-slate-300/60 dark:bg-slate-700/80" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* Label de seção ("O que busca aprender") */}
          <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />

          {/* Bio em duas linhas */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Tags de tópicos */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-14 rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Rodapé: Botão de ação ("Oferecer Ajuda") + Link de perfil */}
        <div className="mt-auto pt-4 flex flex-col gap-3">
          {/* Botão */}
          <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />

          {/* Link Ver Perfil */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <span />
            <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
