import { useEffect, useState } from "react";
import { Book } from "../../interfaces/Collection";
import { SortByOptions, SortingOptions } from "../../interfaces/OrderByBar";



const useMyBooks = (): [
    Book[],
    string,
    { name: string, updatedAt: string, createdAt: string, },
    boolean,
    (newBook: Book) => void,
    (myBookId: number) => void,
    (updatedBook: Book) => void,
    (books: Book[], sortBy: string, sortAsc: boolean) => void
] => {

    const bookSortOptions: {
        name: string;
        updatedAt: string;
        createdAt: string;
    } = {
        name: "Name",
        updatedAt: "Updated",
        createdAt: "Created",
    }

    //todo hold state for filtering
    const [myBooks, setMyBooks] = useState<Book[]>([])
    const [myBookSortBY, setMyBookSortBY] = useState<string>("updatedAt")
    const [myBookDisplayedSortBy, setMyBookDisplayedSortBy] = useState("Updated")
    const [myBookSortAsc, setMyBookSortAsc] = useState<boolean>(false)


    async function sortMyBooks(Books: Book[], sortBy: string, sortAsc: boolean) {

        console.log(`sortBy: ${sortBy}\nsortAsc: ${sortAsc}`)

        let sortedCollecitons: Book[] = []

        switch (sortBy) {
            case "name":
                if (sortAsc) { sortedCollecitons = Books.sort((a, b) => a.name < b.name ? 1 : -1); }
                else { sortedCollecitons = Books.sort((a, b) => a.name > b.name ? 1 : -1); }
                break;
            case "createdAt":
                if (sortAsc) { sortedCollecitons = Books.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1); }
                else { sortedCollecitons = Books.sort((a, b) => a.createdAt > b.createdAt ? 1 : -1); }
                break;
            case "updatedAt":
                if (sortAsc) { sortedCollecitons = Books.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedCollecitons = Books.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
            default:
                if (sortAsc) { sortedCollecitons = Books.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedCollecitons = Books.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
        }

        setMyBooks(sortedCollecitons)
        setMyBookSortBY(sortBy)
        setMyBookSortAsc(sortAsc)

    }

    //LEFT-OFF SET UP SORTING OPTIOSN TO PASS AS PARAMS
    //LEFT-OFF set up hooks folder

    async function getMyBooks(): Promise<Book[]> {
        //TODO - get myBooks from async storage
        const Books: Book[] = [
            {
                recordId: 1,
                id: "book1",
                name: "book1",
                color: "red",
                isFavorite: false,
    
                isLocked: false,
    
                createdAt: new Date(),
                updatedAt: new Date(),
    
                pages: [],
            },
            {
                recordId: 2,
                id: "book2",
                name: "Book 2",
                color: "green",
                isFavorite: false,
    
                isLocked: false,
    
                createdAt: new Date(),
                updatedAt: new Date("2024-01-20"),
    
                pages: [],
            },
            {
                recordId: 3,
                id: "book2",
                name: "Book 2",
                color: "teal",
                isFavorite: false,
    
                isLocked: false,
    
                createdAt: new Date(),
                updatedAt: new Date("2024-02-01"),
    
                pages: [],
            },
    
        ]
        return Books
    }
    async function getMyBookSortDetail(): Promise<SortingOptions> {
        //TODO - get myBookSortDetail from async storage
        let sortingOptions: SortingOptions = {
            sortBy: "createdAt",
            sortAsc: false,
        }


        return sortingOptions
    }

    async function handleSetUpBooks() {

        let MY_BOOKS: Book[] = await getMyBooks()
        let MY_BOOKS_SORT_DETAIL = await getMyBookSortDetail()

        await sortMyBooks(MY_BOOKS, MY_BOOKS_SORT_DETAIL.sortBy, MY_BOOKS_SORT_DETAIL.sortAsc)
    }

    useEffect(() => { handleSetUpBooks() }, [])

    const addBook = (newBook: Book): void => {

        let newMyBooks = [...myBooks, newBook]
        //todo - need to get max of record ids and then get + 1;
        //TODO - Save newMyBooks to AsyncStorage

        setMyBooks(newMyBooks)
    }

    const updateBook = (updatedBook: Book): void => {

        let newMyBooks = [...myBooks].filter((Book) => Book.recordId != updatedBook.recordId)

        newMyBooks.push(updatedBook)

        //TODO - Save newMyBooks to AsyncStorage

        setMyBooks(newMyBooks)
    }
    const removeBook = (myBookId: number): void => {

        let newMyBooks = [...myBooks].filter((Book) => Book.recordId != myBookId)

        //TODO - Save newMyBooks to AsyncStorage

        setMyBooks(newMyBooks)
    }



    return [
        myBooks,
        myBookSortBY,
        bookSortOptions,
        myBookSortAsc,
        addBook,
        removeBook,
        updateBook,
        sortMyBooks
    ]

}

export default useMyBooks