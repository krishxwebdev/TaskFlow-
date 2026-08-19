class QueryValidationError extends Error {}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) throw new QueryValidationError('Pagination values must be positive integers');
  const parsed = Number(value);
  if (parsed < 1 || parsed > maximum) throw new QueryValidationError(`Value must be between 1 and ${maximum}`);
  return parsed;
}

function pagination(query) {
  const page = positiveInteger(query.page, 1);
  const limit = positiveInteger(query.limit, 20, 100);
  return { page, limit, offset: (page - 1) * limit };
}

function enumValue(value, allowed, label) {
  if (!value) return undefined;
  if (!allowed.includes(value)) throw new QueryValidationError(`Invalid ${label}`);
  return value;
}

function dateValue(value, label) {
  if (!value) return undefined;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new QueryValidationError(`Invalid ${label}; expected YYYY-MM-DD`);
  }
  return value;
}

function sortClause(query, allowed, defaultKey) {
  const key = query.sort || defaultKey;
  const column = allowed[key];
  if (!column) throw new QueryValidationError('Invalid sort field');
  const order = (query.order || 'desc').toLowerCase();
  if (!['asc', 'desc'].includes(order)) throw new QueryValidationError('Invalid sort order');
  return `${column} ${order.toUpperCase()}`;
}

function searchValue(value) {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (trimmed.length > 100) throw new QueryValidationError('Search must be 100 characters or fewer');
  return trimmed || undefined;
}

module.exports = {
  QueryValidationError,
  pagination,
  enumValue,
  dateValue,
  sortClause,
  searchValue,
  positiveInteger,
};
