/*========================================
        Import Dependencies
========================================*/
import React, { FC } from 'react'
import { View, StyleSheet } from 'react-native'

import styled from "styled-components/native";
import { BodyText, SubText, SubierText } from "../ui/text";
import { colors } from "../../assets";

import { StyPressableArea, StyCollectionCard, StyCollectionColorBar, StyCollectionInnerDiv } from "./styles";
import { Collection } from "../../interfaces/Collection";
import { getRelativeDate } from "../../utilities/date-helpers";



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

    let formatedDate = getRelativeDate(updatedAt);

        return <StyCollectionCard  >
            <StyPressableArea onPress={() => console.log("I've been pressed (CollectionCard)")} />
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


