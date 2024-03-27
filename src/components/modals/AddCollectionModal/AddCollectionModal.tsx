/*========================================
        Import Dependencies
========================================*/
import React, { FC, useState } from 'react'
import { View, StyleSheet, Modal, TextInput } from 'react-native'
import styled from "styled-components/native"
import { colors } from "../../../assets"
import { BodyText, HeaderThree, HeaderTwo, SubText } from "../../ui/text"
import { StandardTextInput } from "../../ui"
import { ColorOption } from "./ColorOption"

interface AddCollectionModalProps {

}

const StyFloatBoxModal = styled.Modal`
    
`

const StyFloatBoxInner = styled.View`
    flex: 1;

    justify-content: center;
    align-items: center;

    background-color: #00000030;
    `
const StyModalFloatBox = styled.View`
    padding: 10px;
    width: 80%;

    background-color: #616060;
    border-radius: 5px;

    z-index: 999;
    `
const StyModalFloatBoxHeader = styled.View`
    min-height: 10px;
    padding: 10px 0;
    /* border-bottom-width: 2px;
    border-bottom-color: white; */
`
const StyModalFloatBoxColorsDiv = styled.View`
position: relative;
flex-direction: row;
flex-wrap: wrap;
/* justify-content: center; */
align-items: center;
gap: 20px;

min-height: 10px;
min-width: 80%;
margin-top: 20px;
margin-bottom: 10px;
padding: 10px;
/* background-color: wheat; */

`


const StyModalFloatBoxBtnsDiv = styled.View`
    flex-direction: row;

`
const StyModalFloatBoxBtn = styled.Pressable`
    padding: 10px;
    width: 50%;
`


const AddCollectionModal: FC<AddCollectionModalProps> = ({ }) => {

    const [isModalOpen, setIsModalOpen] = useState<boolean>(true)

    const [selectedColor, setSelectedColor] = useState<string>("")

    const colorOptions: string[] = [
        "white",
        "red",
        "orange",
        "yellow",
        "lime",
        "green",
        "teal",
        "lightblue",
        "cyan",
        "blue",
        "purple",
        "pink",
    ]


    return (
        <Modal
            animationType="fade"
            visible={isModalOpen}
            transparent={true}
        >
            <StyFloatBoxInner>

                <StyModalFloatBox>
                    <HeaderTwo text="Create Collection" textAlignment="left" textColor="white" />
                    <StyModalFloatBoxHeader>
                        {/* Put text input here */}
                        <StandardTextInput />
                    </StyModalFloatBoxHeader>
                    <HeaderTwo text="Color" textColor={colors.textColors.light} textAlignment="left" />
                    <StyModalFloatBoxColorsDiv>
                        {colorOptions.map((color, idx) => {
                            
                            return <ColorOption key={`${idx}-${color}`} color={color} selectedColor={selectedColor} setSelectedColor={setSelectedColor}/>
                        })}
                    </StyModalFloatBoxColorsDiv>
                    <StyModalFloatBoxBtnsDiv>
                        <StyModalFloatBoxBtn><HeaderThree text="Cancel" textColor="#e8e8e8" /></StyModalFloatBoxBtn>
                        <StyModalFloatBoxBtn><HeaderThree text="Create" textColor="#e8e8e8" /></StyModalFloatBoxBtn>
                    </StyModalFloatBoxBtnsDiv>
                </StyModalFloatBox>
            </StyFloatBoxInner>
        </Modal>
    )
}

export default AddCollectionModal