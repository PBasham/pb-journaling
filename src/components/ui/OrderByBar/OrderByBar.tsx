/*========================================
        Import Dependencies
========================================*/
import { Ionicons } from "@expo/vector-icons"
import React, { FC, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { HeaderThree } from "../text"
import { StyOrderByBar } from "./styles"

interface OrderByBarProps {
    filterBy?: "name" | "createdAt" | "updatedAt"
    sortAsc?: boolean
    onPress: (sortBy: string, orderBy: boolean) => void
}

const OrderByBar: FC<OrderByBarProps> = (props: OrderByBarProps) => {

    //TODO - Need to save into AsyncStorage direction of filter

    const {
        filterBy: filter = "updated",
        sortAsc: sort = false,

        onPress,
    } = props;

    const [filterBy, setFilterBy] = useState(filter)
    const [sortAsc, setSortAsc] = useState(sort)

    const handleChangeSortDir = () => {
        setSortAsc(!sortAsc);
        onPress(filterBy, sortAsc)
    }

    return <StyOrderByBar>
        <HeaderThree
            text="Filter"
            textStyles={{ borderRightWidth: 2, paddingRight: 20, height: 30 }}
            onPress={() => {console.log("Change my filter")}}
        />
        <Ionicons
            name={`arrow-${sortAsc ? "down" : "up"}-outline`}
            size={24}
            color="black"
            onPress={handleChangeSortDir}
        />
    </StyOrderByBar>
}

export default OrderByBar;
