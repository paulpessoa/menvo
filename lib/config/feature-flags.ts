/**
 * Feature Flags System
 * Permite ativar/desativar novas funcionalidades de forma segura (Rollback imediato)
 */

export const FEATURE_FLAGS = {
  // Ativa a nova UX fluida estilo ADPList (sem Tabs)
  NEW_MENTORSHIP_UX: process.env.NEXT_PUBLIC_FEATURE_NEW_UX === 'true' || false,
  
  // Ativa avaliações automáticas por e-mail
  AUTOMATED_FEEDBACK: true,
  
  // Ativa chat experimental
  EXPERIMENTAL_CHAT: false
};

/**
 * Hook ou helper para verificar flags no lado do cliente ou servidor
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
