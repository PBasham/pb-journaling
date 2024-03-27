/*========================================
        Import Dependencies
========================================*/
import React, { FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import styled from "styled-components/native"
import { StyColorOptinBall, StyColorOptionSelectedBall } from "./styles"

interface AddCollectionModalProps {
    color: string
    selectedColor: string
    setSelectedColor: React.Dispatch<React.SetStateAction<any>>
}

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