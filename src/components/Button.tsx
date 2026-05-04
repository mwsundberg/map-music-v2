import styled, { css } from "styled-components";

/** CSS for button-like objects, used by RadioSet and ButtonSet */
export const buttonStyles = css`
    background-color: transparent;
	padding: 5px 7px;
    border-radius: 1000rem;
    color: var(--foreground-text);
    font-size: 13px;
	font-family: "FontAwesome", sans-serif;
	border: 2px solid var(--foreground);
    cursor: pointer;

    &:hover, &:focus {
        border-color: var(--foreground-light);
        color: var(--foreground-light);
    }

    &:active {
        color: var(--foreground-light);
	    background-color: var(--background-dark);
    }
`;

const Button = styled.button`${buttonStyles}`;
export default Button;
