import styled from "styled-components";


const InputStyled = styled.input`
	background-color: transparent;
	border: none;
	color: var(--foreground-text);
	border-bottom: 2px solid var(--foreground);
	-webkit-appearance: textfield;

    &:focus-within {
        outline: none;
        border-color: var(--foreground-light);
    }
`;

export function TextInput(props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
) {
    return <InputStyled type='text' {...props} />;
}