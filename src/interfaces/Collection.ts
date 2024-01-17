export interface Collection {
    recordId: number

    id: string
    
    name: string // name of colleciton
    color: string
    isFavorite: boolean

    isLocked: boolean
    lockType?: LockType
    password?: string
    pin?: string

    createdAt: Date
    updatedAt: Date

    books: Book[]
    notes: Note[]

}


export interface Book {
    collectionRef?: number | null

    recordId: number
    id: string

    name: string // name of colleciton
    color: string
    isFavorite: boolean

    isLocked: boolean
    lockType?: LockType
    password?: string
    pin?: string

    created_at: Date
    updated_at: Date

    pages: Note[]
}

export interface Note {
    collectionRef?: number | null
    bookRef?: number | null

    name: string // name of colleciton
    color: string
    isFavorite: boolean

    isLocked: boolean
    lockType?: LockType
    password?: string
    pin?: string

    created_at: Date
    updated_at: Date

    title: string
    feeling: string
    text: string

}

export type LockType = "password" | "pin" | undefined