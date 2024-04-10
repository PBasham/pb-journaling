import { useEffect, useState } from "react";
import { Note } from "../../interfaces/Collection";
import { SortByOptions, SortingOptions } from "../../interfaces/OrderByBar";



const useMyNotes = (): [
    Note[],
    string,
    { name: string, updatedAt: string, createdAt: string, },
    boolean,
    (newNote: Note) => void,
    (myNoteId: number) => void,
    (updatedNote: Note) => void,
    (Notes: Note[], sortBy: string, sortAsc: boolean) => void
] => {

    const noteSortOptions: {
        name: string;
        updatedAt: string;
        createdAt: string;
    } = {
        name: "Name",
        updatedAt: "Updated",
        createdAt: "Created",
    }

    //todo hold state for filtering
    const [myNotes, setMyNotes] = useState<Note[]>([])
    const [myNoteSortBY, setMyNoteSortBY] = useState<string>("updatedAt")
    const [myNoteSortAsc, setMyNoteSortAsc] = useState<boolean>(false)


    async function sortMyNotes(Notes: Note[], sortBy: string, sortAsc: boolean) {
        let sortedCollecitons: Note[] = []

        switch (sortBy) {
            case "name":
                if (sortAsc) { sortedCollecitons = Notes.sort((a, b) => a.title < b.title ? 1 : -1); }
                else { sortedCollecitons = Notes.sort((a, b) => a.title > b.title ? 1 : -1); }
                break;
            case "createdAt":
                if (sortAsc) { sortedCollecitons = Notes.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1); }
                else { sortedCollecitons = Notes.sort((a, b) => a.createdAt > b.createdAt ? 1 : -1); }
                break;
            case "updatedAt":
                if (sortAsc) { sortedCollecitons = Notes.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedCollecitons = Notes.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
            default:
                if (sortAsc) { sortedCollecitons = Notes.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedCollecitons = Notes.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
        }

        setMyNotes(sortedCollecitons)
        setMyNoteSortBY(sortBy)
        setMyNoteSortAsc(sortAsc)

    }

    //LEFT-OFF SET UP SORTING OPTIOSN TO PASS AS PARAMS
    //LEFT-OFF set up hooks folder

    async function getMyNotes(): Promise<Note[]> {
        //TODO - get myNotes from async storage
        const Notes: Note[] = [
            {
                // collectionRef: null,
                //bookRef: null,

                recordId: 1,
                id: "note1",

                color: "",
                title: "A book",
                feeling: "feeling",
                text: "Ipsum Lorim isffe Lorim isffe Lorim isffe Lorim isffe Lorim isffe ",

                isFavorite: false,
                isLocked: false,

                createdAt: new Date("2024-01-22"),
                updatedAt: new Date("2024-01-21"),
            },
            {
                // collectionRef: null,
                //bookRef: null,

                recordId: 2,
                id: "note2",

                color: "",
                title: "This is another book",
                feeling: "feeling",
                text: "Ipsum Lorim isffe Lorim isffe Lorim isffe Lorim isffe Lorim isffe ",

                isFavorite: false,
                isLocked: false,

                createdAt: new Date("2024-01-21"),
                updatedAt: new Date("2024-01-22"),
            },


        ]
        return Notes
    }
    async function getMyNoteSortDetail(): Promise<SortingOptions> {
        //TODO - get myNoteSortDetail from async storage
        let sortingOptions: SortingOptions = {
            sortBy: "createdAt",
            sortAsc: false,
        }


        return sortingOptions
    }

    async function handleSetUpNotes() {

        let MY_NOTES: Note[] = await getMyNotes()
        let MY_NOTES_SORT_DETAIL = await getMyNoteSortDetail()

        await sortMyNotes(MY_NOTES, MY_NOTES_SORT_DETAIL.sortBy, MY_NOTES_SORT_DETAIL.sortAsc)
    }

    useEffect(() => { handleSetUpNotes() }, [])

    const addNote = (newNote: Note): void => {

        let newMyNotes = [...myNotes, newNote]
        //todo - need to get max of record ids and then get + 1;
        //TODO - Save newMyNotes to AsyncStorage

        setMyNotes(newMyNotes)
    }

    const updateNote = (updatedNote: Note): void => {

        let newMyNotes = [...myNotes].filter((Note) => Note.recordId != updatedNote.recordId)

        newMyNotes.push(updatedNote)

        //TODO - Save newMyNotes to AsyncStorage

        setMyNotes(newMyNotes)
    }
    const removeNote = (myNoteId: number): void => {

        let newMyNotes = [...myNotes].filter((Note) => Note.recordId != myNoteId)

        //TODO - Save newMyNotes to AsyncStorage

        setMyNotes(newMyNotes)
    }



    return [
        myNotes,
        myNoteSortBY,
        noteSortOptions,
        myNoteSortAsc,
        addNote,
        removeNote,
        updateNote,
        sortMyNotes
    ]

}

export default useMyNotes