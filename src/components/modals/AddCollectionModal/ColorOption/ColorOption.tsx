/*========================================
        Import Dependencies
========================================*/
import React, { FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import styled from "styled-components/native"

interface AddCollectionModalProps {
    color: string
    selectedColor: string
    setSelectedColor: React.Dispatch<React.SetStateAction<any>>
}



const StyColorOptinBall = styled.Pressable`
    justify-content: center;
    align-items: center;

    width: 14%;
    aspect-ratio: 1;

    border-radius: 50px;

`
const StyColorOptionSelectedBall = styled.View`
    background-color: #000;
    width: 10px;
    aspect-ratio: 1;
    border-radius: 50px;
`


const ColorOption: FC<AddCollectionModalProps> = (props: AddCollectionModalProps) => {

    const {
        color,
        selectedColor,
        setSelectedColor,
    } = props



    const [isSelected, setIsSelected] = useState<boolean>(false)

    useEffect(() => {
        if (color === selectedColor) { setIsSelected(true) }
        else { setIsSelected(false) }
    }, [selectedColor])

    const handleColorOptionPressed = () => {setSelectedColor(color)}

    return <StyColorOptinBall
        style={{ backgroundColor: color }}
        onPress={handleColorOptionPressed}
    >
        {isSelected ? <StyColorOptionSelectedBall/> : null}

    </StyColorOptinBall>



}

export default ColorOption