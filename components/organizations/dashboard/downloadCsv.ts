/**
 * Camada 11 · helper de download (só navegador)
 * Regra: transforma um texto CSV em arquivo baixado, via Blob + link temporário.
 * Não faz: montar o CSV (é `buildOrgImpactCsv`, função pura e testada) nem
 * avisar o usuário (o toast é de quem chama).
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
