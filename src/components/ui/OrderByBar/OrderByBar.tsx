/*========================================
        Import Dependencies
========================================*/
import { Ionicons } from "@expo/vector-icons"
import React, { FC, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { HeaderThree } from "../text"
import { StyOrderByBar } from "./styles"

interface OrderByBarProps {
    filterBy: "name" | "created" | "updated"
    sortAsc: boolean
}

const OrderByBar: FC<OrderByBarProps> = (props: OrderByBarProps) => {

    //TODO - Need to save into AsyncStorage direction of filter

    const {
        filterBy: filter = "updated",
        sortAsc: sort = false,
    } = props;

    const [filterBy, setFilterBy] = useState(filter)
    const [sortAsc, setSortAsc] = useState(sort)

    const handleChangeSortDir = () => {
        setSortAsc(!sortAsc);
        //TODO - send this back to parent that holds sort direction and update list
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
