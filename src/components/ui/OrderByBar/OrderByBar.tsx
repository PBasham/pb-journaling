/*========================================
        Import Dependencies
========================================*/
import { Ionicons } from "@expo/vector-icons"
import React, { FC } from 'react'
import { View, StyleSheet } from 'react-native'
import { HeaderThree } from "../text"
import { StyOrderByBar } from "./styles"

interface OrderByBarProps {

}

const OrderByBar: FC<OrderByBarProps> = ({ }) => {

    return <StyOrderByBar>
        <HeaderThree text="Filter" textStyles={{ borderRightWidth: 2, paddingRight: 20, height: 30 }} />
        <Ionicons
            name={`arrow-down-outline`}
            size={24}
            color="black"
            onPress={() => { console.log("Change filter direction!") }}
        />
    </StyOrderByBar>
}

export default OrderByBar;
