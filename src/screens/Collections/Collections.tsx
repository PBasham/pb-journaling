import React, { FunctionComponent, useEffect, useState } from "react";
import styled from "styled-components/native";
import { FlatList, StyleSheet, Text, View } from "react-native";
// components --------------------------------------------------
import { HeaderOne, BodyText, SubText, SubierText, HeaderTwo, HeaderThree } from "../../components/ui/text";
import { TopBar } from "../../components/ui";

// misc --------------------------------------------------
// colors
import { colors, generalColors, textColors } from "../../assets";
import { SafeAreaView } from "react-native-safe-area-context";
import { Book, Collection, Note } from "../../interfaces/Collection";
import { Ionicons } from "@expo/vector-icons";
import { CollectionCard } from "../../components/CollectionCard";

import { SortBar } from "../../components/ui/OrderByBar";
import { BookCard } from "../../components/BookCard";
import { SortByOptions, SortingOptions } from "../../interfaces/OrderByBar";

import useMyCollections from "./useCollections";


const CollectionScreenContainer = styled.ScrollView`
    flex: 1;
   
    /* width: 100%;
    height: 100%; */
    background-color: ${colors.generalColors.background};
`;
const CollectionScreenContainerInner = styled.View`
    gap: 20px;

    /* padding-left: 20px;
    padding-right: 20px; */
    //padding-top: 40px;
    padding-bottom: 40px;
`;

const CollectionsDiv = styled.View`
    gap: 20px;

    padding-left: 20px;
    padding-right: 20px;
    
    min-height: 80px;
    `;

const BooksDiv = styled.View`
    flex: 1;
    justify-content: space-between;
    align-items: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;

    padding-left: 20px;
    padding-right: 20px;
`;




const NotesDiv = styled.View`
    flex: 1;

    gap: 20px;

    padding-left: 20px;
    padding-right: 20px;
`;

const NoteCard = styled.View`
    padding: 5px 10px;

    height: 90px;
    width: 100%;
    background-color: ${colors.generalColors.light};
    border-radius: 8px;

    overflow: hidden;
    `;

const NoteInnerDiv = styled.View`
    flex: 1;
    `;


const DividerBar = styled.View`
    margin: 30px 0;
    height: 1px;
    width: 100%;
    background-color: black;
    `;




const Collections: FunctionComponent = () => {



    const books: Book[] = [
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
    const notes: Note[] = [
        {
            collectionRef: null,
            bookRef: null,

            recordId: 1,
            id: "note1",

            color: "",
            title: "book1",
            feeling: "feeling",
            text: "Ipsum Lorim isffe Lorim isffe Lorim isffe Lorim isffe Lorim isffe ",

            isFavorite: false,
            isLocked: false,

            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            collectionRef: null,
            bookRef: null,

            recordId: 2,
            id: "note2",

            color: "",
            title: "book1",
            feeling: "feeling",
            text: "Ipsum Lorim isffe Lorim isffe Lorim isffe Lorim isffe Lorim isffe ",

            isFavorite: false,
            isLocked: false,

            createdAt: new Date(),
            updatedAt: new Date(),
        },


    ]


    //TODO - set up state for each sections Filter/sort order

    const [myCollections, myCollectionSortBY, collectionSortOptions, myCollectionSortAsc, addCollection, removeCollection, updateCollection, sortMyCollections] = useMyCollections()





    const [myBooks, setMyBooks] = useState<Book[]>([])
    const [booksFilterBy, setBooksFilterBy] = useState<SortingOptions | null>(null);


    const [notesFilterBy, setNotesFilterBy] = useState<SortingOptions | null>(null);

    useEffect(() => {
        handleSetUpData()

    }, [])

    const handleSetUpData = async () => {


        let bFilter: SortingOptions = {
            sortBy: "updatedAt",
            sortAsc: true,
        }

        setBooksFilterBy(bFilter);
        let sortedBooks = await handleSortBooks([...books], bFilter.sortBy, bFilter.sortAsc)

        setMyBooks(sortedBooks);
        //--
        let nFilter: SortingOptions = {
            sortBy: "updatedAt",
            sortAsc: true,
        }

        //--




    }

    const handleUpdateCollectionSortOrder = async (sortBy: string, sortAsc: boolean) => {
        sortMyCollections(myCollections, sortBy, sortAsc)
    }



    const handleUpdateMyBooksSortOrder = async (sortBy: string, sortAsc: boolean) => {
        console.log("Entered handleUpdateMyBooksSortOrder")
        let sortedBooks: Book[] = await handleSortBooks([...myBooks], sortBy, sortAsc);
        setMyBooks(sortedBooks);
    }

    const handleSortBooks = async (books: Book[], sortBy: string, sortAsc: boolean): Promise<Book[]> => {

        let sortedBooks: Book[] = [];

        switch (sortBy) {
            case "name":
                if (sortAsc) { sortedBooks = books.sort((a, b) => a.name < b.name ? 1 : -1); }
                else { sortedBooks = books.sort((a, b) => a.name > b.name ? 1 : -1); }
                break;
            case "createdAt":
                if (sortAsc) { sortedBooks = books.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1); }
                else { sortedBooks = books.sort((a, b) => a.createdAt > b.createdAt ? 1 : -1); }
                break;
            case "updatedAt":
                if (sortAsc) { sortedBooks = books.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedBooks = books.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
            default:
                if (sortAsc) { sortedBooks = books.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
                else { sortedBooks = books.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
                break;
        }
        return sortedBooks;
    }
    //LEFT-OFF set up function for sorting notes
    // const handleUpdateMyBooksSortOrder = async (sortBy: string, sortAsc: boolean) => {
    //     console.log("Entered handleUpdateMyBooksSortOrder")
    //     let sortedBooks: Book[] = await handleSortBooks([...myBooks], sortBy, sortAsc);
    //     setMyBooks(sortedBooks);
    // }
    
    // const handleSortBooks = async (books: Book[], sortBy: string, sortAsc: boolean): Promise<Book[]> => {

    //     let sortedBooks: Book[] = [];

    //     switch (sortBy) {
    //         case "name":
    //             if (sortAsc) { sortedBooks = books.sort((a, b) => a.name < b.name ? 1 : -1); }
    //             else { sortedBooks = books.sort((a, b) => a.name > b.name ? 1 : -1); }
    //             break;
    //         case "createdAt":
    //             if (sortAsc) { sortedBooks = books.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1); }
    //             else { sortedBooks = books.sort((a, b) => a.createdAt > b.createdAt ? 1 : -1); }
    //             break;
    //         case "updatedAt":
    //             if (sortAsc) { sortedBooks = books.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
    //             else { sortedBooks = books.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
    //             break;
    //         default:
    //             if (sortAsc) { sortedBooks = books.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1); }
    //             else { sortedBooks = books.sort((a, b) => a.updatedAt > b.updatedAt ? 1 : -1); }
    //             break;
    //     }
    //     return sortedBooks;
    // }

    //TODO - Set up functions to handle that state change, and update async storage with new filter/sort order type for section


    return (
        <>
            {/* <SafeAreaView edges={['top']} children={<TopBar hasDotsButton />} /> */}
            <SafeAreaView edges={['top']} />
            <CollectionScreenContainer >
                <CollectionScreenContainerInner>
                    <TopBar hasDotsButton />
                    <SortBar
                        sortBy={myCollectionSortBY}
                        sortAsc={myCollectionSortAsc}
                        sortOptions={collectionSortOptions}
                        header="Collections"

                        onPress={handleUpdateCollectionSortOrder}
                    />
                    <CollectionsDiv>

                        {myCollections!.map((collection) => {
                            return <CollectionCard
                                key={`${collection.recordId}-${collection.id}-${collection.createdAt}`}
                                recordId={collection.recordId}
                                id={collection.id}
                                name={collection.name}
                                color={collection.color}
                                isFavorite={collection.isFavorite}
                                isLocked={collection.isLocked}
                                lockType={collection.lockType}
                                password={collection.password}
                                pin={collection.pin}
                                createdAt={collection.createdAt}
                                updatedAt={collection.updatedAt}
                                books={collection.books}
                                notes={collection.notes}
                            />
                        })}


                    </CollectionsDiv>

                    <SortBar
                        sortBy={booksFilterBy?.sortBy}
                        sortAsc={booksFilterBy?.sortAsc}
                        sortOptions={collectionSortOptions}
                        header="Books"

                        onPress={handleUpdateMyBooksSortOrder}
                    />


                    <BooksDiv>
                        {myBooks.map((book) => {
                            return <BookCard
                                key={`${book.recordId}-${book.createdAt}`}
                                collectionRef={book.collectionRef}
                                recordId={book.recordId}
                                id={book.id}
                                name={book.name}
                                color={book.color}
                                isFavorite={book.isFavorite}
                                isLocked={book.isLocked}
                                lockType={book.lockType}
                                password={book.password}
                                pin={book.pin}
                                updatedAt={book.updatedAt}
                                createdAt={book.createdAt}
                                pages={book.pages}
                            />
                        })}


                    </BooksDiv>

                    <SortBar
                        sortBy={notesFilterBy?.sortBy}
                        sortAsc={notesFilterBy?.sortAsc}
                        sortOptions={collectionSortOptions}
                        header="Notes"

                        onPress={() => console.log("Pressity press press")}
                    />


                    <NotesDiv>
                        {notes.map((note) => {
                            return <NoteCard key={`${note.id}-${note.createdAt}`}>
                                <BodyText textAlignment="left" text={note.title} />
                                <SubierText textAlignment="left" text={`${note.updatedAt.toDateString()}`} />
                                <SubText lines={1} textStyles={{ marginTop: "auto", marginBottom: "auto" }} textAlignment="left" text={note.text} />
                            </NoteCard>
                        })}
                    </NotesDiv>
                </CollectionScreenContainerInner>
            </CollectionScreenContainer>
        </>
    )
}

export default Collections