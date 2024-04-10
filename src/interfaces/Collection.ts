export interface Collection {
    recordId: number

    id?: string
    
    name: string // name of colleciton
    color: string | null
    isFavorite: boolean

    isLocked: boolean
    lockType?: LockType
    password?: string
    pin?: string

    createdAt: Date
    updatedAt: Date

    bookCount: number
    noteCount: number

    //books: Book[]
    //notes: Note[]

}


export interface Book {
    collectionRef?: number | -1

    recordId: number
    id?: string

    name: string // name of colleciton
    color: string | null
    isFavorite: boolean

    isLocked: boolean
    lockType?: LockType
    password?: string
    pin?: string

    updatedAt: Date
    createdAt: Date

    pages: Page[]
}

export interface BaseNote {
    collectionRef?: number | -1
    
    recordId: number
    id?: string

    title: string
    feeling: string
    text: string
    isFavorite: boolean
    
    isLocked: boolean
    lockType?: LockType
    password?: string
    pin?: string
    
    createdAt: Date
    updatedAt: Date
}
export interface Note extends BaseNote {
    color: string | null

}
export interface Page extends BaseNote {
    bookRef: number
    pageNumber: number

    pageColor?: string
}

export type LockType = "password" | "pin" | undefined