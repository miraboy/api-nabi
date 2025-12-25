/**
 * Utilitaire de pagination
 */

/**
 * Extraire les paramètres de pagination de la query string
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Créer la réponse paginée
 */
const createPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    data,
    pagination: {
      current_page: page,
      per_page: limit,
      total_items: total,
      total_pages: totalPages,
      has_next: hasNext,
      has_prev: hasPrev,
      next_page: hasNext ? page + 1 : null,
      prev_page: hasPrev ? page - 1 : null,
    }
  };
};

module.exports = {
  getPaginationParams,
  createPaginatedResponse,
};