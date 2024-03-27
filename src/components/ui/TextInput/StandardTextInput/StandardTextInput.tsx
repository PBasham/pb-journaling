/*========================================
        Import Dependencies
========================================*/
import React, { FC, useState } from 'react'
import { View, StyleSheet, TextInput, TextInputProps } from 'react-native'
import { colors } from "../../../../assets"
import { Rect } from "react-native-safe-area-context"
import styled from "styled-components/native"


interface StandardTextinputProps {
    placeholderText?: string
    placeholderColor?: string

    text?: string
    textColor?: string

    backgroundColor?: string

    containerStyles?: object
    textInputStyles?: object
    textInputProps?: TextInputProps

    /* Not Implimtented */
    onChangeText?: (text: string) => void
    
    onInputBlur?: (text: string) => string

}



const StandardTextinput: FC<StandardTextinputProps> = (props: StandardTextinputProps) => {

    const {
        placeholderText = "",
        placeholderColor = "white",
        text = "",
        textColor = "white",
        backgroundColor = "transparent",
        containerStyles = null,
        textInputStyles = null,

        onChangeText,
    } = props



    const handleInputTextchanged = (text: string) => {
        //console.log(text)
        setInputValue(text)
        if (onChangeText) { onChangeText(text) }
    }
    const handleOnBlur = () => {
        console.log(inputValue)
    }

    const [inputValue, setInputValue] = useState<string>(text)


    return <View style={styles.container}>
        <TextInput
            style={styles.textInput}

            placeholder={placeholderText}
            placeholderTextColor={placeholderColor}

            value={inputValue}

            onChangeText={(text: string) => handleInputTextchanged(text)}
            onBlur={handleOnBlur}
        />
    </View>
}

export default StandardTextinput


const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingBottom: 4,

        borderColor: "#fff",
        borderBottomWidth: 2,
    },
    textInput: {
        fontSize: 24,
        color: "white",

    }

})
