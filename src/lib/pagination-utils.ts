/**
 * Pagination utilities for server actions
 *
 * Provides consistent pagination across all list endpoints
 */

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}

/**
 * Default pagination limits
 */
export const PAGINATION_DEFAULTS = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
} as const;

/**
 * Normalize pagination parameters
 * Ensures valid page numbers and limits
 */
export function normalizePaginationParams(params?: PaginationParams): {
    page: number;
    limit: number;
} {
    const page = Math.max(
        PAGINATION_DEFAULTS.DEFAULT_PAGE,
        params?.page || PAGINATION_DEFAULTS.DEFAULT_PAGE
    );

    const limit = Math.min(
        PAGINATION_DEFAULTS.MAX_LIMIT,
        Math.max(
            PAGINATION_DEFAULTS.MIN_LIMIT,
            params?.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT
        )
    );

    return { page, limit };
}

/**
 * Calculate Prisma skip/take from page and limit
 */
export function getPrismaSkipTake(page: number, limit: number): {
    skip: number;
    take: number;
} {
    return {
        skip: (page - 1) * limit,
        take: limit,
    };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
    total: number,
    page: number,
    limit: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}

/**
 * Complete pagination helper
 * Takes raw params and returns normalized params plus Prisma skip/take
 */
export function preparePagination(params?: PaginationParams): {
    page: number;
    limit: number;
    skip: number;
    take: number;
} {
    const { page, limit } = normalizePaginationParams(params);
    const { skip, take } = getPrismaSkipTake(page, limit);

    return { page, limit, skip, take };
}

/**
 * Create a paginated response
 *
 * @example
 * const contacts = await prisma.contact.findMany({ where, skip, take });
 * const total = await prisma.contact.count({ where });
 * return createPaginatedResponse(contacts, total, page, limit);
 */
export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResponse<T> {
    return {
        data,
        pagination: buildPaginationMeta(total, page, limit),
    };
}
