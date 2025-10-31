export function paginationParams(pages?: number, limits?: number) {
  const page = Math.max(1, Number(pages ?? 1));
  const limit = Math.min(100, Number(limits ?? 10));
  return { page, limit, skip: (page - 1) * limit };
}
