export const parseIntWithDefault = (
  value: unknown,
  defaultValue: number,
  max?: number
): number => {
  if (typeof value !== 'string') return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;

  return max ? Math.min(parsed, max) : parsed;
};

export const parseStringWithDefault = (
  value: unknown,
  defaultValue: string
): string => {
  return typeof value === 'string' ? value : defaultValue;
};

export const parseBooleanWithDefault = (
  value: unknown,
  defaultValue: boolean
): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
};

export interface PaginationParams {
  limit: number;
  offset: number;
}

export const parsePaginationParams = (query: {
  limit?: unknown;
  offset?: unknown;
}): PaginationParams => ({
  limit: parseIntWithDefault(query.limit, 50, 100),
  offset: parseIntWithDefault(query.offset, 0),
});
