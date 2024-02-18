import { useEffect, useState } from "react";
import { Book, Collection } from "../../interfaces/Collection";
import { SortByOptions, SortingOptions } from "../../interfaces/OrderByBar";



const useMyCollections = (): [
    Collection[],
    string,
    { name: string, updatedAt: string, createdAt: string, },
    boolean,
    (newCollection: Collection) => void,
    (myCollectionId: number) => void,
    (updatedCollection: Collection) => void,
    (collections: Collection[], sortBy: string, sortAsc: boolean) => void
] => {

    const collectionSortOptions: {
        name: string;
        updatedAt: string;
        createdAt: string;
    } = {
        name: "Name",
        updatedAt: "Updated",
        createdAt: "Created",
    }

    //todo hold state for filtering
    const [myCollections, setMyCollections] = useState<Collection[]>([])
    const [myCollectionSortBY, setMyCollectionSortBY] = useState<string>("updatedAt")
    const [myCollectionSortAsc, setMyCollectionSortAsc] = useState<boolean>(false)


    async function sortMyCollections(collections: Collection[], sortBy: string, sortAsc: boolean) {

        let sortedCollecitons: Collection[] = []

        switch (sortBy) {
            case "name":
                if (sortAsc) { sortedCollecitons = collections.sort((a, b) => a.name < b.name ? 1 : -1); }
                else { sortedCollecitons = collections.sort((a, b) => a.name > b.name ? 1 : -1); }
                break;
            case "createdAt":
                if (sortAsc) { sortedCollecitons = collections.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1); }
                else { sortedCollecitons = collections.sort((a, b) => a.createdAt > b.createdAt ? 1 : -1); }
                break;
            case "updatedAt":
                if (sortAsc) { sortedCollecitons = collections.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedCollecitons = collections.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
            default:
                if (sortAsc) { sortedCollecitons = collections.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedCollecitons = collections.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
        }

        setMyCollections(sortedCollecitons)
        setMyCollectionSortBY(sortBy)
        setMyCollectionSortAsc(sortAsc)

    }

    //LEFT-OFF SET UP SORTING OPTIOSN TO PASS AS PARAMS
    //LEFT-OFF set up hooks folder

    async function getMyCollections(): Promise<Collection[]> {
        //TODO - get myCollections from async storage
        const collections: Collection[] = [
            {
                recordId: 1,
                id: "col1",
                name: "This is my book and blah blah blah",
                color: "#fab70d",
                isFavorite: false,
                createdAt: new Date(),
                updatedAt: new Date("2024-01-05"),

                books: [],
                notes: [],

                isLocked: false,

            },
            {
                recordId: 2,
                id: "col2",
                name: "zzzzzzzzzzzzzzzzzzzzz",
                color: null,
                isFavorite: false,
                createdAt: new Date(),
                updatedAt: new Date("2024-02-01"),

                books: [],
                notes: [],

                isLocked: false,

            },
            {
                recordId: 3,
                id: "col3",
                name: "UUUUUUUUU",
                color: null,
                isFavorite: false,
                createdAt: new Date(),
                updatedAt: new Date("2024-01-01"),

                books: [],
                notes: [],

                isLocked: false,

            },
        ];
        return collections
    }
    async function getMyCollectionSortDetail(): Promise<SortingOptions> {
        //TODO - get myCollectionSortDetail from async storage
        let sortingOptions: SortingOptions = {
            sortBy: "createdAt",
            sortAsc: false,
        }


        return sortingOptions
    }

    async function handleSetUpCollections() {

        let MY_COLLECTIONS: Collection[] = await getMyCollections()
        let MY_COLLECTIONS_SORT_DETAIL = await getMyCollectionSortDetail()

        await sortMyCollections(MY_COLLECTIONS, MY_COLLECTIONS_SORT_DETAIL.sortBy, MY_COLLECTIONS_SORT_DETAIL.sortAsc)

        //setMyCollections(MY_COLLECTIONS)
        //setMyCollectionSortBY(MY_COLLECTIONS_SORT_DETAIL.sortBy)
        //setMyCollectionSortAsc(MY_COLLECTIONS_SORT_DETAIL.sortAsc)

    }

    useEffect(() => { handleSetUpCollections() }, [])

    const addCollection = (newCollection: Collection): void => {

        let newMyCollections = [...myCollections, newCollection]
        //todo - need to get max of record ids and then get + 1;
        //TODO - Save newMyCollections to AsyncStorage

        setMyCollections(newMyCollections)
    }

    const updateCollection = (updatedCollection: Collection): void => {

        let newMyCollections = [...myCollections].filter((collection) => collection.recordId != updatedCollection.recordId)

        newMyCollections.push(updatedCollection)

        //TODO - Save newMyCollections to AsyncStorage

        setMyCollections(newMyCollections)
    }
    const removeCollection = (myCollectionId: number): void => {

        let newMyCollections = [...myCollections].filter((collection) => collection.recordId != myCollectionId)

        //TODO - Save newMyCollections to AsyncStorage

        setMyCollections(newMyCollections)
    }



    return [
        myCollections,
        myCollectionSortBY,
        collectionSortOptions,
        myCollectionSortAsc,
        addCollection,
        removeCollection,
        updateCollection,
        sortMyCollections
    ]

}

export default useMyCollections