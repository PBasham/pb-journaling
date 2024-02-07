/*========================================
        Import Dependencies
========================================*/
import React, { FC } from 'react'
import { View, StyleSheet } from 'react-native'

import styled from "styled-components/native";
import { BodyText, SubText, SubierText } from "../ui/text";
import { colors } from "../../assets";

import { StyPressableArea, StyBookCard, StyBookColorBar, StyBookInnerDiv } from "./styles";
import { Book } from "../../interfaces/Collection";
import { cardColors } from "../../assets/styling/colors";
import { getRelativeDate } from "../../utilities/date-helpers";



const BookCard: FC<Book> = (props: Book) => {

    const {
        collectionRef,

        recordId,
        id,
        name,
        color = cardColors.colorBar.default,
        isFavorite,

        isLocked,
        lockType,
        password,
        pin,

        updatedAt,
        createdAt,

        pages,

    } = props;

    
    let formatedDate = getRelativeDate(updatedAt);

    return <StyBookCard  >
        <StyPressableArea onPress={() => console.log("I've been pressed (BookCard)")} />
        <StyBookColorBar style={{ backgroundColor: color == null ? "#ababab" : color }} />
        <StyBookInnerDiv>
            <BodyText textAlignment="left" text={name} />
            <SubierText textAlignment="left" text={`${formatedDate}`} />
            <SubText textAlignment="left" text={`${pages.length} Pages`} />
        </StyBookInnerDiv>
    </StyBookCard>

}

export default BookCard;


