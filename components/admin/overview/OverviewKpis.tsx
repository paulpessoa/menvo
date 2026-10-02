import type { AdminOverview } from "@/lib/services/admin/overview.types"
import { StatTile } from "./StatTile"
import { formatInt, formatPercent, percentChange } from "./chart-theme"

interface OverviewKpisProps {
  data: AdminOverview
}

/**
 * The four numbers that say whether the marketplace is healthy: is the base
 * growing, is there enough mentor supply for the demand, are sessions
 * happening, and are they good.
 */
export function OverviewKpis({ data }: OverviewKpisProps) {
  const { users, sessions, ratings } = data
  const menteesPerMentor = users.verifiedMentors ? users.mentees / users.verifiedMentors : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatTile
        label="Novos cadastros (30 dias)"
        value={formatInt(users.new30d)}
        change={percentChange(users.new30d, users.prev30d)}
        detail={`${formatInt(users.total)} na base`}
      />
      <StatTile
        label="Mentorados por mentor verificado"
        value={menteesPerMentor === null ? "-" : menteesPerMentor.toFixed(1)}
        detail={`${formatInt(users.verifiedMentors)} mentores · ${formatInt(users.mentees)} mentorados`}
      />
      <StatTile
        label="Pedidos de sessão (30 dias)"
        value={formatInt(sessions.last30d)}
        change={percentChange(sessions.last30d, sessions.prev30d)}
        detail={sessions.cancelRate === null ? undefined : `${formatPercent(sessions.cancelRate)} canceladas em 12 semanas`}
      />
      <StatTile
        label="Nota média das sessões"
        value={ratings.average === null ? "-" : ratings.average.toFixed(2).replace(".", ",")}
        detail={`${formatInt(ratings.distribution.reduce((acc, r) => acc + r.count, 0))} avaliações`}
      />
    </div>
  )
}
