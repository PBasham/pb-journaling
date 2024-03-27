import styled from "styled-components/native"

export const StyFloatBoxInner = styled.View`
    flex: 1;

    justify-content: center;
    align-items: center;

    background-color: #00000030;
    `
export const StyModalFloatBox = styled.View`
    padding: 10px;
    width: 80%;

    background-color: #616060;
    border-radius: 5px;

    z-index: 999;
    `
export const StyModalFloatBoxHeader = styled.View`
    min-height: 10px;
    padding: 10px 0;
`
export const StyModalFloatBoxColorsDiv = styled.View`
    position: relative;
    flex-direction: row;
    flex-wrap: wrap;

    align-items: center;
    gap: 20px;

    min-height: 10px;
    min-width: 80%;
    margin-top: 20px;
    margin-bottom: 10px;
    padding: 10px;
`

export const StyModalFloatBoxBtnsDiv = styled.View`
    flex-direction: row;

`
export const StyModalFloatBoxBtn = styled.Pressable`
    padding: 10px;
    width: 50%;
`