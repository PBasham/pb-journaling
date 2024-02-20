/*========================================
        Import Dependencies
========================================*/
import { FC } from "react"
import { View, StyleSheet, Pressable, Dimensions } from 'react-native'
import { AntDesign } from "@expo/vector-icons"
import { colors } from "../../../../assets"
import styled from "styled-components/native"
/*========================================
        Import Styles
========================================*/

 
interface RoundIconBtnProps {
    antIconName?: string
    size?: number
    iconColor?: string
    style?: any
    onPress: () => void
}
// justifyContent: 'center',
//         alignItems: "center",
//         borderRadius: 50,
//         width: 50,
//         height: 50,
//         // Shadow --
//         elevation: 10,
//         shadowColor: colors.buttonColors.shadow,
//         shadowOffset: {
//             width: 0,
//             height: 0,
//         },
//         shadowRadius: 5,
//         shadowOpacity: .4,
//         // ----------
//         backgroundColor: colors.buttonColors.background,
const StyRoundIconBtn = styled.Pressable`
    position: absolute;
    bottom: 0;
    right: 0;


    justify-content: center;
    align-items: center;
    
    margin-right: 20px;
    margin-bottom: 20px;
    
    border-radius: 50px;
    width: 50px;
    height: 50px;
    background-color: ${colors.buttonColors.background};
    
    
    
    z-index: 999;
`


const RoundIconBtn: FC<RoundIconBtnProps> = ({
    antIconName,
    size,
    iconColor,
    style,
    onPress,
}) => {

    return (
        <StyRoundIconBtn onPress={onPress}
            style={styles.button}
            >
            <AntDesign
            // @ts-ignore
                name={antIconName}
                size={size || 24}
                color={iconColor || colors.buttonColors.shadow}
            />
        </StyRoundIconBtn>
    )
}

export default RoundIconBtn

const styles = StyleSheet.create({
    button: {
        // Shadow --
        elevation: 10,
        shadowColor: colors.buttonColors.shadow,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowRadius: 5,
        shadowOpacity: .4,
        
    }
})