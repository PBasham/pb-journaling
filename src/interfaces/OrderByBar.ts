export interface OrderByObj {
    sortBy: filterByOptions
    sortAsc: boolean
}

export type  filterByOptions = "name" | "createdAt" | "updatedAt"