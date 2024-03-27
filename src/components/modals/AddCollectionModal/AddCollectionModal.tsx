/*========================================
        Import Dependencies
========================================*/
import React, { FC, useEffect, useState } from 'react'
import { Modal } from 'react-native'
import { colors } from "../../../assets"
import { HeaderThree, HeaderTwo } from "../../ui/text"
import { StandardTextInput } from "../../ui"
import { ColorOption } from "./ColorOption"
import {
    StyFloatBoxInner,
    StyModalFloatBox,
    StyModalFloatBoxHeader,
    StyModalFloatBoxColorsDiv,
    StyModalFloatBoxBtnsDiv,
    StyModalFloatBoxBtn
} from "./styles"


interface AddCollectionModalProps {
    isModalOpen: boolean
    closeModal: () => void
}



const AddCollectionModal: FC<AddCollectionModalProps> = (props: AddCollectionModalProps) => {

    // const [isModalOpen, setIsModalOpen] = useState<boolean>(true)

    const { isModalOpen, closeModal } = props

    const [selectedColor, setSelectedColor] = useState<string>("")

    const [newCollectionName, setNewCollectionName] = useState<string>("")

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

    useEffect(() => {
        setSelectedColor("")
    }, [isModalOpen])

    const collectionNameTextChange = (collectionName: string) => {
        setNewCollectionName(collectionName)
    }

    const handleCreatePress = () => {
        // name
        let hasValidName: boolean = !(newCollectionName === "")
        console.log(newCollectionName === "" ? "Need name" : newCollectionName)
        // color
        let hasValidColor: boolean = !(selectedColor === "")
        console.log(selectedColor === "" ? "Need color" : selectedColor)

        let isValid: boolean = hasValidName && hasValidColor
        if (isValid) { console.log("Can create!") }
    }

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
                        <StandardTextInput placeholderText={`"collection name"`} placeholderColor="#ddd" onChangeText={collectionNameTextChange} />
                    </StyModalFloatBoxHeader>
                    <HeaderTwo text="Color" textColor={colors.textColors.light} textAlignment="left" />
                    <StyModalFloatBoxColorsDiv>
                        {colorOptions.map((color, idx) => {

                            return <ColorOption key={`${idx}-${color}`} color={color} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
                        })}
                    </StyModalFloatBoxColorsDiv>
                    <StyModalFloatBoxBtnsDiv>
                        <StyModalFloatBoxBtn><HeaderThree text="Cancel" textColor="#e8e8e8" onPress={() => closeModal()} /></StyModalFloatBoxBtn>
                        <StyModalFloatBoxBtn><HeaderThree text="Create" textColor="#e8e8e8" onPress={() => handleCreatePress()} /></StyModalFloatBoxBtn>
                    </StyModalFloatBoxBtnsDiv>
                </StyModalFloatBox>
            </StyFloatBoxInner>
        </Modal>
    )
}

export default AddCollectionModal