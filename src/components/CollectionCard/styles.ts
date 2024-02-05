import styled from "styled-components/native";
import { colors } from "../../assets";


export const StyPressableArea = styled.Pressable`
    position: absolute;

    width: 100%;
    height: 100%;
    
    z-index: 999;
`;
export const StyCollectionCard = styled.View`
    height: 100px;
    background-color: ${colors.generalColors.light};
    border-radius: 8px;

    overflow: hidden;
    `;
export const StyCollectionColorBar = styled.View`
    height: 20px;
    `;
export const StyCollectionInnerDiv = styled.View`
    flex: 1;
    padding: 5px 10px;
    `;