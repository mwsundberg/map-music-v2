import { useEffect, useRef, useState } from 'react';
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
const validInputPattern = '\\d{0,5}\s?[Hh]?[Zz]?|[CDEFGABcdefgab](bb|b|#|x)?(-?[1-4]?|\\d?|1?[01]?)';
const hzInput = /^(\d{1,5}\s?hz)$/i;
const midiInput = /^(\d{1,3})$/;
const standardInput = /^([CDEFGAB](bb|b|#|x)?(-[1-4]|[0-9]|10|11))$/i;

/* Check if a frequency is an exact note */
function hzToNotePrecise(hz: number): string|undefined {
	const note = Frequency(hz, 'hz').toNote();
	if(hz === Frequency(note).toFrequency()) return note;
}

/** Convert a midi note to standard pitch notation and display it inline */
export default function PitchInput({value, onChange, ...props}: PitchInputProps) {
	/* Convert value from `number` into standard pitch notation or '\d+Hz' */
	const valueString = hzToNotePrecise(value) ?? value + 'Hz';

	/* Internal state and tracker of previous state to simplify syncing props */
	const [input, setInput] = useState<string>(valueString);
	const previousValue = useRef<number|undefined>(value);

	/* Validation and state passing */
	let inputValue: number|undefined = undefined;
	if(input.match(hzInput)) inputValue = parseInt(input);
	if(input.match(midiInput)) inputValue = Frequency(parseInt(input), 'midi').toFrequency();
	if(input.match(standardInput)) inputValue = Frequency(input.substring(0,1).toUpperCase() + input.substring(1).toLowerCase()).toFrequency();

	/* Sync the prop state and internal state */
	useEffect(()=>{
		/* Early exit for all states in sync */
		if(value === inputValue) {
			previousValue.current = value;
			return;
		}

		/* Set prop state (internal updated) */
		/* Checking the internal value since the prop will be automatically different if the input is invalid */
		if(previousValue.current !== inputValue) {
			if(inputValue !== undefined) onChange(inputValue);
			previousValue.current = inputValue;
		} 
		/* Set internal state (prop changed) */
		else {
			setInput(valueString);
			previousValue.current = value;
		}
	}, [inputValue, value]);


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