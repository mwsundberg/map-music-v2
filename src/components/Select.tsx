import type { ReactNode } from "react";
import styled from "styled-components";

interface SelectProps<T extends string|number> {
    value: T,
    options: Record<T, ReactNode>,
    onChange: (value: T)=>void
}

const SelectStyled = styled.select`
    background-color: transparent;
	color: var(--foreground-text);
	border: none;
	border-bottom: 2px solid var(--foreground);

    &:focus-within {
        outline: none;
        border-color: var(--foreground-light);
    }
`;
const OptionStyled = styled.option`
    background-color: var(--background);
`;

export function Select<T extends string|number>({value, options, onChange}: SelectProps<T>) {
    return (
        <SelectStyled
            value={value}
            onChange={(ev) => {onChange(ev.target.value as T)}}>
            {Object.keys(options).map((key) => (
                <OptionStyled key={key} value={key}>{options[key as T]}</OptionStyled>
            ))}
        </SelectStyled>
    );
}