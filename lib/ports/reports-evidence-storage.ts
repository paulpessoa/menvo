/**
 * Camada 6 · Port (storage de evidencias de denuncia)
 * Regra: o que o service precisa para guardar um arquivo, sem saber de Supabase.
 * Tradeoff: uma interface a mais para testar o service sem rede; o adapter usa o
 * client da sessao para as policies do bucket continuarem valendo.
 */
export interface ReportEvidenceStorage {
  /** Stores the bytes at `path`; throws when the storage refuses. */
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<void>
}
