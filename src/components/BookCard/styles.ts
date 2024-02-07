import styled from "styled-components/native";
import { colors } from "../../assets";


export const StyPressableArea = styled.Pressable`
    position: absolute;

    width: 100%;
    height: 100%;
    
    z-index: 999;
`;
export const StyBookCard = styled.View`

    flex-direction: row;

    height: 90px;
    width: 45%;
    background-color: ${colors.generalColors.light};
    border-radius: 8px;

    overflow: hidden;
    `;
export const StyBookColorBar = styled.View`
    height: 100%;
    width: 20px;
    background-color: #ababab;
    `;
export const StyBookInnerDiv = styled.View`
    flex: 1;
    padding: 5px 10px;
    `;