import { useId, type ReactNode } from "react";
import styled from "styled-components";
import { buttonStyles } from "./Button";

interface RadioSetProps<T extends string|number> {
    legend?: ReactNode,
    name?: string,
    options: Record<T, ReactNode>,
    checked: T,
    onChange: (value: T)=>void
}

const FieldSetStyled = styled.fieldset`
    border: none;
    min-width: max-content;

    legend {
        float: left;
    }

    input {
        opacity: 0;
        position: fixed;
        left: 1000vw;
        top: 1000vh;
    }
    label {
        ${buttonStyles}
    }
    label:nth-of-type(1) {
        border-radius: 1000rem 0 0 1000rem;
        border-inline-end-width: 1px;
    }
    label:nth-last-of-type(1) {
        border-radius: 0 1000rem 1000rem 0;
        border-inline-start-width: 1px;
    }
    
    input:checked + label {
        border-color: var(--foreground);
        background-color: var(--foreground);
        color: var(--background);
    }
    input + label:hover, input:focus + label {
        border-color: var(--foreground-light);
        color: var(--foreground-light);
    }
`;

export function RadioSet<T extends string|number>({legend, name, options, checked, onChange}: RadioSetProps<T>) {
    const id = useId();
    name = name ?? id;

    return (
        <FieldSetStyled>
            {legend && <legend>{legend}</legend>}
            {Object.keys(options).map((key) => {
                return (<><input id={id + key} type='radio' name={name} value={key} checked={key === checked} onChange={(ev)=>{onChange(ev.target.value as T)}}/><label htmlFor={id + key}>{options[key as T]}</label></>)
            })}
        </FieldSetStyled>
    );
}