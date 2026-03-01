
/**
 * Helper para ser usado em cláusulas 'where' do Prisma
 * Garante que apenas registros que NÃO foram marcados como deletados sejam retornados.
 */
export const notDeleted = { 
  deletedAt: null 
};
