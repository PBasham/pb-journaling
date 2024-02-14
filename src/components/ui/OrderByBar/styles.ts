import styled from "styled-components/native";

export const StyOrderByBar = styled.View`
    flex: 1;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;

    margin: 30px 0;
    padding: 0 20px;
    `;
export const StySortByOptionFloatBox = styled.View`
    position: absolute;

    top: 0;
    right: 20px;

    padding: 10px 0;
    background-color: #474747;
    border-radius: 5px;
    
    z-index: 999;
    
    `
export const StySortByOptionFloatBoxInner = styled.View`
        gap: 10px;        
    `

export const StySortByOptionBox = styled.Pressable`
        padding: 10px 20px;
        width: 100%;
    `

export const StyHeaderDiv = styled.View`    
        flex: 1;
    `