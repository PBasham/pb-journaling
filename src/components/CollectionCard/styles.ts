import styled from "styled-components/native";
import { colors } from "../../assets";



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