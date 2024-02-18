/*========================================
        Import Dependencies
========================================*/
import React, { FC } from 'react'
import { View, StyleSheet } from 'react-native'

import styled from "styled-components/native";
import { BodyText, SubText, SubierText } from "../ui/text";
import { colors } from "../../assets";

import { StyNoteCard } from "./styles";
import { Note } from "../../interfaces/Collection";
import { cardColors } from "../../assets/styling/colors";
import { getRelativeDate } from "../../utilities/date-helpers";



const NoteCard: FC<Note> = (props: Note) => {

    const {
        collectionRef,
        bookRef,
        recordId,
        id,
        title,
        feeling,
        text,
        color,
        isFavorite,
        isLocked,
        lockType,
        password,
        pin,

        createdAt,
        updatedAt,

    } = props;

    
    let formatedDate = getRelativeDate(updatedAt);

    return <StyNoteCard >
    <BodyText textAlignment="left" text={title} />
    <SubierText textAlignment="left" text={`${updatedAt.toDateString()}`} />
    <SubText lines={1} textStyles={{ marginTop: "auto", marginBottom: "auto" }} textAlignment="left" text={text} />
</StyNoteCard>

}

export default NoteCard;


