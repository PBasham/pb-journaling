export interface SortingOptions {
    sortBy: SortByOptions
    sortAsc: boolean
}

export type  SortByOptions = "name" | "createdAt" | "updatedAt"
export type  SortByDisplayedOptions = "Name" | "Created" | "Updated"