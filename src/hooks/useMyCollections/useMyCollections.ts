import { useEffect, useState } from "react";
import { Book, Collection } from "../../interfaces/Collection";
import { SortByOptions, SortingOptions } from "../../interfaces/OrderByBar";
import AsyncStorage from '@react-native-async-storage/async-storage';



const useMyCollections = (): [
    Collection[],
    string,
    { name: string, updatedAt: string, createdAt: string, },
    boolean,
    (newCollection: Collection) => Promise<boolean>,
    (myCollectionId: number) => void,
    (updatedCollection: Collection) => void,
    (collections: Collection[], sortBy: string, sortAsc: boolean) => void,
    () => Promise<number>
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

    /**
     * Takes collection, sets up sorting by direction and chosen type. ie: "Created"
     * @param collections Array of Collection
     * @param sortBy Property that array will be sorted by.
     * @param sortAsc Direction for sort.
     */
    async function sortMyCollections(collections: Collection[], sortBy: string, sortAsc: boolean) {
        console.log("Entered sortMyCollections()")
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

        console.log("Setting states")
        setMyCollections(sortedCollecitons)
        setMyCollectionSortBY(sortBy)
        setMyCollectionSortAsc(sortAsc)

    }

    //LEFT-OFF SET UP SORTING OPTIOSN TO PASS AS PARAMS
    //LEFT-OFF set up hooks folder

    async function getMyCollections(): Promise<Collection[]> {
        console.log("Entered getMyCollections()")
        //TODO - get myCollections from async storage
        try {
            console.log("Getting my-collections from AsyncStorage")
            const jsonValue = await AsyncStorage.getItem("my-collections")
            console.log(`Returned JsonValue: ${jsonValue}`)
            if (!jsonValue) { return [] }
            const parsedJson: Collection[] = JSON.parse(jsonValue)
            console.log(`Parsed Data: ${parsedJson}`)
            return parsedJson
        }
        catch (ex) {
            console.log(`Error Parseing Data 'my-collections' from AsyncStorage: ${ex}`)
            return []
        }
        // const collections: Collection[] = [
        //     {
        //         recordId: 1,
        //         id: "col1",
        //         name: "This is my book and blah blah blah",
        //         color: "#fab70d",
        //         isFavorite: false,
        //         createdAt: new Date(),
        //         updatedAt: new Date("2024-01-05"),

        //         isLocked: false,
        //     },
        //     {
        //         recordId: 2,
        //         id: "col2",
        //         name: "zzzzzzzzzzzzzzzzzzzzz",
        //         color: null,
        //         isFavorite: false,
        //         createdAt: new Date(),
        //         updatedAt: new Date("2024-02-01"),

        //         isLocked: false,
        //     },
        //     {
        //         recordId: 3,
        //         id: "col3",
        //         name: "UUUUUUUUU",
        //         color: null,
        //         isFavorite: false,
        //         createdAt: new Date(),
        //         updatedAt: new Date("2024-01-01"),

        //         isLocked: false,
        //     },
        // ];

    }
    async function getMyCollectionSortDetail(): Promise<SortingOptions> {
        console.log("Entered getMyCollectionSortDetail()")
        try {
            const jsonValue = await AsyncStorage.getItem("collections-sorting-options")

            let parsedJson: SortingOptions

            if (!jsonValue) {
                const sortingOptions: SortingOptions = {
                    sortBy: "createdAt",
                    sortAsc: false,
                }
                await AsyncStorage.setItem("collections-sorting-options", JSON.stringify(sortingOptions))
                parsedJson = sortingOptions

            } else { parsedJson = JSON.parse(jsonValue) }


            return parsedJson
        }
        catch (ex) {
            console.log(ex)

            const sortingOptions: SortingOptions = {
                sortBy: "createdAt",
                sortAsc: false,
            }


            return sortingOptions
        }


    }

    async function handleSetUpCollections() {
        console.log("Entered handleSetUpCollections()")
        let MY_COLLECTIONS: Collection[] = await getMyCollections()
        let MY_COLLECTIONS_SORT_DETAIL = await getMyCollectionSortDetail()

        await sortMyCollections(MY_COLLECTIONS, MY_COLLECTIONS_SORT_DETAIL.sortBy, MY_COLLECTIONS_SORT_DETAIL.sortAsc)

    }

    useEffect(() => {
        // AsyncStorage.clear()
        handleSetUpCollections()
    }, [])


    /** Gets Collections from AsyncStorage and returns max recordId + 1 */
    const getNextRecordId = async (): Promise<number> => {
        try {
            const value = await AsyncStorage.getItem("my-collections")
            if (!value) { return -1 }

            const jsonData: Collection[] = JSON.parse(value)

            const maxRecordId = jsonData.reduce((acc, coll) => {
                acc = (acc === undefined || coll.recordId > acc.recordId) ? coll : acc
                return acc
            })


            return maxRecordId.recordId + 1
            //return 1

        }
        catch (ex) {
            console.log(ex)
            return -1
        }
    }

    const addCollection = async (newCollection: Collection): Promise<boolean> => {

        const newMyCollections = [...myCollections, newCollection]

        try {
            console.log(`Trying to Add collection to AsyncStorage 'my-collections': newCollection - ${newCollection}"`)
            await AsyncStorage.setItem("my-collections", JSON.stringify(newMyCollections))
            setMyCollections(newMyCollections)
            return true
        } catch (e) {
            console.log(`There was an error setting "my-collections" in AsyncStorate. Error: ${e}`)

            return false
        }

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

    //TODO LEFT OFF setting up Getting Books and Notes for A collection

    //* Collection Books
    const [myBooks, setMyBooks] = useState<Book[]>([])
    const [myBookSortBY, setMyBookSortBY] = useState<string>("updatedAt")
    const [myBookSortAsc, setMyBookSortAsc] = useState<boolean>(false)

    //* Collection Notes


    return [
        myCollections,
        myCollectionSortBY,
        collectionSortOptions,
        myCollectionSortAsc,
        addCollection,
        removeCollection,
        updateCollection,
        sortMyCollections,
        getNextRecordId
    ]

}

export default useMyCollections


