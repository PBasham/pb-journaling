import React, { FunctionComponent } from "react";
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


const CollectionScreenContainer = styled.ScrollView`
    flex: 1;
   
    /* width: 100%;
    height: 100%; */
    background-color: ${colors.generalColors.background};
`;
const CollectionScreenContainerInner = styled.View`
    gap: 20px;

    padding-left: 20px;
    padding-right: 20px;
    padding-top: 40px;
    padding-bottom: 40px;
`;

const CollectionsDiv = styled.View`
    gap: 20px;

    
    min-height: 80px;
    `;

const BooksDiv = styled.View`
    flex: 1;
    justify-content: space-between;
    align-items: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
`;
const BookCard = styled.View`

    flex-direction: row;

    height: 90px;
    width: 45%;
    background-color: ${colors.generalColors.light};
    border-radius: 8px;

    overflow: hidden;
    `;
const BookColorBar = styled.View`
    height: 100%;
    width: 20px;
    background-color: #ababab;
    `;
const BookInnerDiv = styled.View`
    flex: 1;
    padding: 5px 10px;
    `;



const NotesDiv = styled.View`
    flex: 1;

    gap: 20px;
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

const FilterDividerBar = styled.View`
    flex: 1;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    
    margin: 30px 0;
`;


const Collections: FunctionComponent = () => {

    const collections: Collection[] = [
        {
            recordId: 1,
            id: "col1",
            name: "Col 1",
            color: null,
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date(),

            books: [],
            notes: [],

            isLocked: false,

        },
        {
            recordId: 2,
            id: "col1",
            name: "Col 2",
            color: null,
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date(),

            books: [],
            notes: [],

            isLocked: false,

        },
    ]

    const books: Book[] = [
        {
            recordId: 1,
            id: "book1",
            name: "book1",
            color: "#ababab",
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
            color: "#ababab",
            isFavorite: false,

            isLocked: false,

            createdAt: new Date(),
            updatedAt: new Date(),

            pages: [],
        },
        {
            recordId: 3,
            id: "book2",
            name: "Book 2",
            color: "#ababab",
            isFavorite: false,

            isLocked: false,

            createdAt: new Date(),
            updatedAt: new Date(),

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



    return (
        <>
            <SafeAreaView edges={['top']} children={<TopBar hasDotsButton />} />
            <CollectionScreenContainer >
                <CollectionScreenContainerInner>
                    <CollectionsDiv>

                        {collections.map((collection) => {
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

                    <DividerBar />
                    <BooksDiv>
                        {books.map((book) => {



                            return <BookCard key={`${book.recordId}-${book.createdAt}`}>
                                <BookColorBar />
                                <BookInnerDiv>
                                    <BodyText textAlignment="left" text={book.name} />
                                    <SubierText textAlignment="left" text="Tue 11:15am" />
                                    <SubText textAlignment="left" text={`${book.pages.length} Pages`} />
                                </BookInnerDiv>
                            </BookCard>
                        })}


                    </BooksDiv>

                    <FilterDividerBar>
                        <HeaderThree text="Filter" textStyles={{ borderRightWidth: 2, paddingRight: 20, height: 30 }} />
                        <Ionicons
                            name={`arrow-down-outline`}
                            size={24}
                            color="black"
                            onPress={() => { console.log("Change filter direction!") }}
                        />
                    </FilterDividerBar>

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