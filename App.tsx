import { StyleSheet, Text, View, Dimensions } from 'react-native';

import { StatusBar } from 'expo-status-bar';

import { useFonts } from "expo-font"

import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { Collections } from "./src/screens";


export default function App() {


    let [fontsLoaded] = useFonts({
        "Lato-Regular": require("./src/assets/typography/Lato/Lato-Regular.ttf"),
        "Lato-Bold": require("./src/assets/typography/Lato/Lato-Bold.ttf"),
        "Lato-Light": require("./src/assets/typography/Lato/Lato-Light.ttf"),
    })
    
    
    
    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics} >
            <Collections />
        </SafeAreaProvider>
    );
}


const screenWidth = Dimensions.get("screen").width;

const styles = StyleSheet.create({
    styl_outterContainer: {
        flex: 1,
        backgroundColor: "#fff",

    },
    styl_innerContainer: {
        flex: 1,

        alignItems: "center",
        justifyContent: "center"
    },
    styl_topBar: {
        
        height: 60,
        width: screenWidth,

        backgroundColor: "#fad"
    }
});
