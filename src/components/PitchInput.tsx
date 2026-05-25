import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Frequency } from 'tone';
import TextInput from './TextInput';

type PitchInputProps = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'value'|'onChange'> & {
    /** Midi note number, optionally with decimals */
    value: number,
    /** Passed a midi note number, even if entering hz or another unit */
    onChange: (value: number)=>void,
}

const PitchNotationStyled = styled.span`
    border-radius: 1000rem;
    border: 1px solid var(--foreground-text);
    padding: 0.15em 0.75ch;
`;

/* Regex to recognize a valid input */
const validInputPattern = '\\d{0,5}[Hh]?[Zz]?|[CDEFGABcdefgab](bb|b|#|x)?(-?[1-4]?|1?\\d?)';
const hzInput = /^(\d{1,5}hz)$/i;
const midiInput = /^(\d{1,3})$/;
const standardInput = /^([CDEFGAB](bb|b|#|x)?(-[1-4]|[0-9]|10|11))$/i;

/* Check if a frequency is an exact note */
function hzToNotePrecise(hz: number): string|undefined {
    const note = Frequency(hz, 'hz').toNote();
    if(hz === Frequency(note).toFrequency()) return note;
}

/** Convert a midi note to standard pitch notation and display it inline */
export default function PitchInput({value, onChange, ...props}: PitchInputProps) {
    /* Internal state */
    const [input, setInput] = useState<string>(hzToNotePrecise(value) ?? value + 'Hz');

    /* Validation and state passing */
    let inputValue: number|undefined;
    if(input.match(hzInput)) inputValue = parseInt(input);
    if(input.match(midiInput)) inputValue = Frequency(parseInt(input), 'midi').toFrequency();
    if(input.match(standardInput)) inputValue = Frequency(input.substring(0,1).toUpperCase() + input.substring(1).toLowerCase()).toFrequency();

    /* Update back and forth between the prop state and internal */
    useEffect(()=>{
        if(inputValue !== undefined && value !== inputValue) {
            onChange(inputValue);
        }
    }, [inputValue]);

    useEffect(()=>{
        if(value !== inputValue) setInput(hzToNotePrecise(value) ?? value + 'Hz');
    }, [value]);


    return (<>
        <TextInput
            pattern={validInputPattern}
            size={6}
            value={input}
            onChange={(ev)=>{
                if(ev.target.validity.patternMismatch) return;
                setInput(ev.target.value);
            }}
            onBlur={()=>{
                /* When entering a midi note or standard note notation, convert it to standard notation */
                if (input.match(midiInput) || input.match(standardInput)) {
                    setInput(Frequency(inputValue, 'hz').toNote());
                }
            }} 
            {...props} />
        { /* When entering something not in standard notation, show the standard notation equivalent next to it */
        (!!inputValue && !input.match(standardInput)) && <>
            {' '}
            <PitchNotationStyled>
                {hzToNotePrecise(inputValue)? '':'~'}
                {Frequency(inputValue, 'hz').toNote()}
            </PitchNotationStyled>
        </>}
    </>);
}