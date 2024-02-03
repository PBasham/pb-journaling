import React, { FunctionComponent } from "react";
import styled from "styled-components/native";
import { StyleSheet, Text, View } from "react-native";
// components --------------------------------------------------
import { Container } from "../../components/shared";
import { HeaderOne, BodyText, SubText, HeaderTwo, HeaderThree } from "../../components/ui/text";
import { TopBar } from "../../components/ui";

// misc --------------------------------------------------
// colors
import { colors, generalColors, textColors } from "../../assets";
import { SafeAreaView } from "react-native-safe-area-context";
import { Collection } from "../../interfaces/Collection";
import { SubierText } from "../../components/ui/text/SubierText";

const CollectionScreenContainer = styled.ScrollView`
    //justify-content: space-between;

    gap: 20px;

    padding-left: 20px;
    padding-right: 20px;
    padding-top: 40px;
    padding-bottom: 40px;
    
    width: 100%;
    height: 100%;
    /* background-color: ${colors.generalColors.light}; */
    background-color: #f3f3f3;
`;

const CollectionsDiv = styled.View`
    
    min-height: 60px;

    border-radius: 8px;
    background-color: ${colors.generalColors.light};

    overflow: hidden;
`;
const CollectionColorBar = styled.View`
    
    min-height: 20px;
    background-color: #f4f430;
`;
const CollectionInnerDiv = styled.View`
    flex: 1;

    padding: 10px;

`;





const CollectionCard = styled.View`

    
`;


const BooksDiv = styled(Container)`

    flex: 1;

    background-color: lightgreen;

`;

const NotesDiv = styled(Container)`

    flex: 1;

    background-color: gray;

`;

const Collections: FunctionComponent = () => {



    const collections: Collection[] = [
        {
            recordId: 1,
            id: "col1",
            name: "Col 1",
            color: "yellow",
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date(),

            books: [],
            notes: [],

            isLocked: false,

        },

    ]





    return (
        <>
            <SafeAreaView edges={['top']} children={<TopBar hasDotsButton />} />
            <CollectionScreenContainer >

                <CollectionsDiv>
                    <CollectionColorBar/>
                    <CollectionInnerDiv>

                    <BodyText textAlignment="left" text="My Collection"/>
                    <SubierText textAlignment="left" text="Tue 11:15am"/>
                    <SubText textAlignment="left" text="1 Book, 2 Notes"/>


                    </CollectionInnerDiv>


                </CollectionsDiv>
                
                <BooksDiv></BooksDiv>
                <NotesDiv></NotesDiv>

            </CollectionScreenContainer>
        </>
    )
}

export default Collections