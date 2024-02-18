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

import { SortHeaderBar } from "../../components/ui/OrderByBar";
import { BookCard } from "../../components/BookCard";
import { SortByOptions, SortingOptions } from "../../interfaces/OrderByBar";

import { useMyBooks, useMyCollections } from "../../hooks";
import { useMyNotes } from "../../hooks/useMyNotes";


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

    //TODO - set up state for each sections Filter/sort order

    const [myCollections, myCollectionSortBY, collectionSortOptions, myCollectionSortAsc, addCollection, removeCollection, updateCollection, sortMyCollections] = useMyCollections()

    const [myBooks, myBookSortBY, bookSortOptions, myBookSortAsc, addBook, removeBook, updateBook, sortMyBooks] = useMyBooks()

    const [ myNotes, myNoteSortBY, noteSortOptions, myNoteSortAsc, addNote, removeNote, updateNote, sortMyNotes ] = useMyNotes()




    

    useEffect(() => {
        handleSetUpData()

    }, [])

    const handleSetUpData = async () => {}

    const handleUpdateCollectionSortOrder = async (sortBy: string, sortAsc: boolean) => {
        sortMyCollections(myCollections, sortBy, sortAsc)
    }

    const handleUpdateMyBooksSortOrder = async (sortBy: string, sortAsc: boolean) => {
        sortMyBooks(myBooks, sortBy, sortAsc)
    }

    //TODO - Set up functions to handle that state change, and update async storage with new filter/sort order type for section


    return (
        <>
            {/* <SafeAreaView edges={['top']} children={<TopBar hasDotsButton />} /> */}
            <SafeAreaView edges={['top']} />
            <CollectionScreenContainer >
                <CollectionScreenContainerInner>
                    <TopBar hasDotsButton />
                    <SortHeaderBar
                        sortBy={myCollectionSortBY}
                        sortAsc={myCollectionSortAsc}
                        sortOptions={collectionSortOptions}
                        header="Collections"

                        onPress={handleUpdateCollectionSortOrder}
                    />
                    <CollectionsDiv children={myCollections!.map((collection) => {
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
                    />

                    <SortHeaderBar
                        sortBy={myBookSortBY}
                        sortAsc={myBookSortAsc}
                        sortOptions={bookSortOptions}
                        header="Books"

                        onPress={handleUpdateMyBooksSortOrder}
                    />


                    <BooksDiv children={myBooks.map((book) => {
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
                        })} />


                    <SortHeaderBar
                        sortBy={myNoteSortBY}
                        sortAsc={myNoteSortAsc}
                        sortOptions={noteSortOptions}
                        header="Notes"

                        onPress={() => console.log("Pressity press press")}
                    />


                    <NotesDiv children={myNotes.map((note) => {
                            return <NoteCard key={`${note.id}-${note.createdAt}`}>
                                <BodyText textAlignment="left" text={note.title} />
                                <SubierText textAlignment="left" text={`${note.updatedAt.toDateString()}`} />
                                <SubText lines={1} textStyles={{ marginTop: "auto", marginBottom: "auto" }} textAlignment="left" text={note.text} />
                            </NoteCard>
                        })}
                    />
                </CollectionScreenContainerInner>
            </CollectionScreenContainer>
        </>
    )
}

export default Collections