/*========================================
        Import Dependencies
========================================*/
import { Ionicons } from "@expo/vector-icons"
import React, { FC, useState } from 'react'
import { View, StyleSheet, Pressable, Touchable } from 'react-native'
import { BodyText, HeaderThree } from "../text"
import { StyOrderByBar } from "./styles"
import { SortByOptions } from "../../../interfaces/OrderByBar"
import styled from "styled-components/native"
import { colors } from "../../../assets"

interface OrderByBarProps {
    sortBy?: string
    sortAsc?: boolean
    sortOptions: { [key: string]: any }
    onPress: (sortBy: string, orderBy: boolean) => void
}

const SortBar: FC<OrderByBarProps> = (props: OrderByBarProps) => {

    const {
        sortBy = "updatedAt",
        sortAsc = false,
        sortOptions,

        onPress: handleUpdateSort,
    } = props;

    //TODO - Need to save into AsyncStorage direction of filter    
    //*Main Functions
    const handleChangeSortDir = () => { handleUpdateSort(sortBy, !sortAsc) }
    //* Handling UI
    let displayedOption = sortOptions[sortBy];

    const [isSortByDDOptionsOpen, setIsSortByDDOptionsOpen] = useState<boolean>(false)

    const StySortByOptionFloatBox = styled.View`
    position: absolute;

    top: 0;
    right: 20px;

    padding: 10px 0;
    background-color: #474747;
    border-radius: 5px;
    
    z-index: 999;
    
    `
    const StySortByOptionFloatBoxInner = styled.View`
        gap: 10px;        
    `

    const StySortByOptionBox = styled.Pressable`
        padding: 10px 20px;
        width: 100%;
    `

    const SortByOptions_Click = () => {
        console.log("Open options")
        setIsSortByDDOptionsOpen(true)
    }

    const handleCloseSortByOptionsDD = (newOption: string | null) => {


        //todo - if is not null, and if is different, change it
        if (newOption !== null && newOption !== sortBy) {handleUpdateSort(newOption, sortAsc)}

        
        setIsSortByDDOptionsOpen(false)
    }

    //LEFTOFF - getting touch response from buttons and organizing them
    return <>

        {isSortByDDOptionsOpen ?
            <Pressable
                onPress={() => {handleCloseSortByOptionsDD(null)}}
                style={[StyleSheet.absoluteFill, { zIndex: 999,backgroundColor: "black", opacity: .5 }]}
            >
            </Pressable>
            :
            null
        }

        <StyOrderByBar>
            <HeaderThree
                text={`${[displayedOption]}`}
                textStyles={{ borderRightWidth: 2, paddingRight: 20, height: 30 }}
                onPress={SortByOptions_Click}
            />
            {isSortByDDOptionsOpen ? <StySortByOptionFloatBox>
                <StySortByOptionFloatBoxInner>
                    {Object.keys(sortOptions).map((key: string, idx: number) => {

                        return (
                            <StySortByOptionBox
                                key={idx}
                                style={({ pressed }: { pressed: boolean }) => [
                                    pressed ? { backgroundColor: "#606060" } : { backgroundColor: "#474747" }
                                ]}
                                onPress={() => { handleCloseSortByOptionsDD(key) }}
                            >

                                <HeaderThree
                                    text={`${sortOptions[key]}`}
                                    textColor="white"
                                />
                            </StySortByOptionBox>
                        )
                    })
                    }
                </StySortByOptionFloatBoxInner>
            </StySortByOptionFloatBox> : null}
            <Ionicons
                name={`arrow-${sortAsc ? "down" : "up"}-outline`}
                size={24}
                color="black"
                onPress={handleChangeSortDir}
            />
        </StyOrderByBar>
    </>
}

export default SortBar;
