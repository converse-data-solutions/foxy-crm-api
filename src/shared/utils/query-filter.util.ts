import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export type FilterType = 'exact' | 'ilike' | 'gte' | 'lte' | 'like';

export type FiltersMap = Record<string, { column: string; type: FilterType }>;

export function applyFilters<T extends ObjectLiteral, Q extends Record<keyof Q & string, unknown>>(
  qb: SelectQueryBuilder<T>,
  filtersMap: FiltersMap,
  query: Partial<Q>,
  paramPrefix = 'p',
): SelectQueryBuilder<T> {
  function makeParamName(rawKey: string) {
    const safe = rawKey.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    return `${paramPrefix}_${safe}`;
  }

  for (const [rawKey, rawValue] of Object.entries(query)) {
    if (rawValue == null || rawKey === 'page' || rawKey === 'limit') continue;

    const filter = filtersMap[rawKey];
    if (!filter) continue;

    const paramName = makeParamName(rawKey);

    switch (filter.type) {
      case 'exact':
        qb.andWhere(`${filter.column} = :${paramName}`, { [paramName]: rawValue });
        break;

      case 'ilike':
        if (typeof rawValue !== 'string') continue;
        qb.andWhere(`${filter.column} ILIKE :${paramName}`, { [paramName]: `%${rawValue}%` });
        break;

      case 'like':
        if (typeof rawValue !== 'string') continue;
        qb.andWhere(`${filter.column} LIKE :${paramName}`, { [paramName]: `%${rawValue}%` });
        break;

      case 'gte':
        qb.andWhere(`${filter.column} >= :${paramName}`, { [paramName]: rawValue });
        break;

      case 'lte':
        qb.andWhere(`${filter.column} <= :${paramName}`, { [paramName]: rawValue });
        break;

      default:
        break;
    }
  }

  return qb;
}
