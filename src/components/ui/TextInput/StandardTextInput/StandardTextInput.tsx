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

    onChangeText?: (text: string) => string
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


    const StyTextInputContainer = styled.View`
        padding: 0 4px;
    `

    const StyTextInput = styled.TextInput`
        font-size: 18px;
    `

    const handleInputTextchanged = (text: string) => {
        console.log(text)
        setInputValue(text)
    }


    const [inputValue, setInputValue] = useState<string>(text)


    return <View style={styles.container}>
        <TextInput
            style={styles.textInput}

            placeholder={`"collection name"`}
            placeholderTextColor={"#dddddd"}

            value={inputValue}

            onChangeText={(text: string) => handleInputTextchanged(text)}
        />
    </View>
}

export default StandardTextinput


const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,

        borderColor: "#fff",
        borderBottomWidth: 2,
    },
    textInput: {
        fontSize: 24,
        color: "white",

    }

})
