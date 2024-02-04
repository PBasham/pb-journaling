/*========================================
        Import Dependencies
========================================*/
import React, { FC } from 'react'
import { View, StyleSheet } from 'react-native'

import styled from "styled-components/native";
import { BodyText, SubText, SubierText } from "../ui/text";
import { colors } from "../../assets";

import { StyCollectionCard, StyCollectionColorBar, StyCollectionInnerDiv } from "./styles";
import { Collection } from "../../interfaces/Collection";



const CollectionCard: FC<Collection> = (props: Collection) => {

    const {
        recordId,
        id,

        name,
        color = "#ababab",
        isFavorite,

        isLocked,
        lockType,
        password,
        pin,

        createdAt,
        updatedAt,

        books,
        notes,
    } = props;

    //LEFT OFF getting correct date format for - note from today, less then a week, over a week

    const today = new Date();
    
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1)
    
    let weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7)

    
    let formatedDate: string = updatedAt.toLocaleDateString();
    
    if ( updatedAt.getDate() == today.getDate() ) {formatedDate = updatedAt.toLocaleTimeString()}
    else if ( updatedAt > weekAgo ) {formatedDate = updatedAt.toDateString()}

    console.log(`new Date(): ${new Date()}`)
    console.log(`today: ${today}`)
    console.log(`weekAgo: ${weekAgo}`)
    console.log(`formatedDate: ${formatedDate}`)


    // if (updatedAt.getDate() == today.getDate()) { formatedDate = updatedAt.toTimeString() }
    // else if (updatedAt.getDate() < today.getDate() -7) { formatedDate = updatedAt.toDateString() }

        return <StyCollectionCard >
            <StyCollectionColorBar style={{ backgroundColor: color == null ? "#ababab" : color }} />
            <StyCollectionInnerDiv>
                <BodyText textAlignment="left" text={name} />
                <SubierText textAlignment="left" text={`${formatedDate}`} />
                <SubText textAlignment="left" text={`${books.length} Books, ${notes.length} Notes`} />
            </StyCollectionInnerDiv>
        </StyCollectionCard>

}

export default CollectionCard;

const styles = StyleSheet.create({
    container: {

    }
})


