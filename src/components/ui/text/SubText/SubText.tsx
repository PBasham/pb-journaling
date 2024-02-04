// dependencies --------------------------------------------------
import React, { FunctionComponent, ReactNode } from 'react'
import { StyleProp, TextStyle } from 'react-native'
import styled from "styled-components/native"
// styling --------------------------------------------------
import { textColors } from "../../../../assets"


export interface SubTextProps {
    /** Text to display */
    text?: string
    /** Font size for text */
    fontSize?: string
    /** Color of text */
    textColor?: string
    /** Alignment for text */
    textAlignment?: "left" | "center" | "right" | " justify" | "start" | "end"
    /** Vertical Alignment for text */
    textVerticalAlignment?: "top" | "middle" | "bottom"
    /** Number of lines to show before using '...'*/
    lines?: number

    /** Additional css styling */
    textStyles?: StyleProp<TextStyle>;

    /** On press funciton for header */
    onPress?: (() => void) | ((e: any) => void)
}

const SubText: FunctionComponent<SubTextProps> = (props: SubTextProps) => {
    const {
        text,
        fontSize = "18px",
        textColor = textColors.subText,
        textAlignment = "center",
        textVerticalAlignment = "middle",

        lines,

        textStyles,

        onPress = () => console.log("I've been clicked (SubText)!")
    } = props

    const SubTextStyle = styled.Text`
    /* padding-bottom: 5px; */
    width: 100%;
    
    color: ${textColor};
    
    font-size: ${fontSize};
    text-align: ${textAlignment};
    vertical-align: ${textVerticalAlignment};
    /* font-weight: bold; */
    /* font-family: Lato-Bold; */

`

    return <SubTextStyle numberOfLines={lines} style={textStyles} onPress={onPress} >{text}</SubTextStyle>
}

export default SubText