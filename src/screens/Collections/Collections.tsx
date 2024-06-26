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

import { SortHeaderBar } from "../../components/ui/OrderByBar";
import { SortByOptions, SortingOptions } from "../../interfaces/OrderByBar";

import { useMyBooks, useMyCollections } from "../../hooks";
import { useMyNotes } from "../../hooks/useMyNotes";
import { CollectionCard, BookCard, NoteCard } from "../../components";
import { RoundIconBtn } from "../../components/ui/buttons";
import { AddCollectionModal } from "../../components/modals";


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

    const [isScrollEnabled, setIsScrollEnabled] = useState<boolean>(true)

    const [myCollections, myCollectionSortBY, collectionSortOptions, myCollectionSortAsc, addCollection, removeCollection, updateCollection, sortMyCollections, getNextRecordId] = useMyCollections()

    const [myBooks, myBookSortBY, bookSortOptions, myBookSortAsc, addBook, removeBook, updateBook, sortMyBooks] = useMyBooks()

    const [myNotes, myNoteSortBY, noteSortOptions, myNoteSortAsc, addNote, removeNote, updateNote, sortMyNotes] = useMyNotes()






    useEffect(() => {
        handleSetUpData()

    }, [])

    const handleSetUpData = async () => {
        //TODO Get Collections

        //TODO Get Loose Books
        //TODO Get Loose Notes
    }

    const handleUpdateCollectionSortOrder = async (sortBy: string, sortAsc: boolean) => {
        sortMyCollections(myCollections, sortBy, sortAsc)
    }

    const handleUpdateMyBooksSortOrder = async (sortBy: string, sortAsc: boolean) => {
        sortMyBooks(myBooks, sortBy, sortAsc)
    }
    const handleUpdateMyNotesSortOrder = async (sortBy: string, sortAsc: boolean) => {
        sortMyNotes(myNotes, sortBy, sortAsc)
    }
    //TODO - Set up functions to handle that state change, and update async storage with new filter/sort order type for section

    const handleDisableScroll = () => [setIsScrollEnabled(false)]
    const handleEnableScroll = () => [setIsScrollEnabled(true)]

    const [isAddCollectionModalOpen, setIsAddCollectionModalOpen] = useState<boolean>(false)
    const showAddCollectionModal = () => { setIsAddCollectionModalOpen(true) }
    const hideAddCollectionModal = () => {
        //* Hide modal and reset values.
        setIsAddCollectionModalOpen(false)

    }

    return (
        <>
            {/* <SafeAreaView edges={['top']} children={<TopBar hasDotsButton />} /> */}
            <SafeAreaView edges={['top']} />
            <AddCollectionModal isModalOpen={isAddCollectionModalOpen} addCollection={addCollection} getNextRecordId={getNextRecordId} closeModal={hideAddCollectionModal} />
            <CollectionScreenContainer
                scrollEnabled={isScrollEnabled}
            >
                <CollectionScreenContainerInner>

                    <TopBar hasDotsButton />
                    <SortHeaderBar
                        sortBy={myCollectionSortBY}
                        sortAsc={myCollectionSortAsc}
                        sortOptions={collectionSortOptions}
                        header="Collections"

                        handleEnableScroll={handleEnableScroll}
                        handleDisableScroll={handleDisableScroll}

                        onPress={handleUpdateCollectionSortOrder}
                    />
                    <CollectionsDiv children={myCollections.map((collection) => {
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
                            bookCount={collection.bookCount}
                            noteCount={collection.noteCount}
                        />
                    })}
                    />

                    <SortHeaderBar
                        sortBy={myBookSortBY}
                        sortAsc={myBookSortAsc}
                        sortOptions={bookSortOptions}
                        header="Books"

                        handleEnableScroll={handleEnableScroll}
                        handleDisableScroll={handleDisableScroll}

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

                        handleEnableScroll={handleEnableScroll}
                        handleDisableScroll={handleDisableScroll}

                        onPress={handleUpdateMyNotesSortOrder}
                    />


                    <NotesDiv children={myNotes.map((note) => {
                        return <NoteCard
                            key={`${note.id}-${note.createdAt}`}
                            collectionRef={note.collectionRef}
                            recordId={note.recordId}
                            id={note.id}
                            title={note.title}
                            feeling={note.feeling}
                            text={note.text}
                            color={note.color}
                            isFavorite={note.isFavorite}
                            isLocked={note.isLocked}
                            lockType={note.lockType}
                            password={note.password}
                            pin={note.pin}
                            createdAt={note.createdAt}
                            updatedAt={note.updatedAt}

                        />
                    })}
                    />
                </CollectionScreenContainerInner>
            </CollectionScreenContainer>
            <RoundIconBtn
                antIconName="plus"
                onPress={showAddCollectionModal}
            />
        </>
    )
}

export default Collections