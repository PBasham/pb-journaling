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

    updatedAt: Date
    createdAt: Date

    pages: Note[]
}

export interface Note {
    collectionRef?: number | null
    bookRef?: number | null
    
    recordId: number
    id: string

    title: string
    feeling: string
    text: string
    color: string
    isFavorite: boolean
    
    isLocked: boolean
    lockType?: LockType
    password?: string
    pin?: string

    createdAt: Date
    updatedAt: Date


}

export type LockType = "password" | "pin" | undefined