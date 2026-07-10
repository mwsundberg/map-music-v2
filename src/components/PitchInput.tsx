import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Frequency } from 'tone';
import type { ScrollableInputMutator } from './ScrollableInput';
import ScrollableInput from './ScrollableInput';

type PitchInputProps = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'value'|'onChange'|'type'> & {
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
const hzInput = /^(\d{1,5}\s?hz)$/i; /* Range: (0, 30000] Unsure if this is the actual limit */
const midiInput = /^(\d{1,3})$/; /* Range: [-37, 156] */
const standardInput = /^([CDEFGAB])(bb|b|#|x)?(-[1-4]|[0-9]|10|11)$/i; /* Range: [C-4, B11] */

/** Check if a frequency is an exact note, returns note string or undefined */
function hzToNotePrecise(hz: number): string|undefined {
	const note = Frequency(hz, 'hz').toNote();
	if(hz === Frequency(note).toFrequency()) return note;
}

/** Incrementer function for Hz */
const hzScrollMutator: ScrollableInputMutator<string> = (valueRaw, {scrollAmount, ctrlKey, shiftKey})=>{
	let value = parseInt(valueRaw);

	/* If super bulk editing (CtrlShift) increment by 1000 */
	if(ctrlKey && shiftKey) {
		value += scrollAmount * 1000;
	}
	/* For bulk editing (Shift) increment by 100 */
	else if(shiftKey) {
		value += scrollAmount * 100;
	}
	/* For fine editing (Ctrl) increment by 1 */
	else if(ctrlKey) {
		value += scrollAmount * 1;
	}
	/* For normal editing (None) increment by 10 */
	else {
		value += scrollAmount * 10;
	}

	/* Clamp to valid range */
	value = Math.max(Math.min(value, 30000), 1);

	return value.toString() + 'Hz';
};

/** Incrementer function for midi note */
const midiScrollMutator: ScrollableInputMutator<string> = (valueRaw, {scrollAmount, shiftKey})=>{
	let value = parseInt(valueRaw);

	/* If bulk editing (Shift/CtrlShift) increment by an octave */
	if(shiftKey) {
		/* Increment by an octave */
		value += scrollAmount * 12;
	}
	/* For fine or normal editing (Ctrl/None) increment by an accidental */
	else {
		value += scrollAmount * 1;
	}

	/* Clamp to valid range */
	console.log(value)
	value = Math.max(Math.min(value, 156), -37);

	return value.toString();
};

/** Incrementer function for standard pitch notation note */
const standardScrollMutator: ScrollableInputMutator<string> = (value, properties)=>{
	/* Convert the note into midi scale and then call the midi scroll mutator */
	return Frequency(parseInt(midiScrollMutator(Frequency(value).toMidi().toString(), properties)), 'midi').toNote();
};


/** Input for midi note, standard pitch notation, or Hz, yields a value in Hz */
export default function PitchInput({value, onChange, ...props}: PitchInputProps) {
	/* Convert value from `number` into standard pitch notation or '\d+Hz' */
	const valueString = hzToNotePrecise(value) ?? value + 'Hz';

	/* Internal state and tracker of previous state to simplify syncing props */
	const [input, setInput] = useState<string>(valueString);
	const previousValue = useRef<number|undefined>(value);

	/* Validation and parsing, plus assigning the scroll mutator to use */
	let inputType: 'hz'|'midi'|'standard'|'invalid' = 'invalid';
	let scrollMutator = undefined;
	let inputValue: number|undefined = undefined;
	if(input.match(hzInput)) {
		inputType = 'hz';
		inputValue = parseInt(input);
		scrollMutator = hzScrollMutator;
	} else if(input.match(midiInput)) {
		inputType = 'midi';
		inputValue = Frequency(parseInt(input), 'midi').toFrequency();
		scrollMutator = midiScrollMutator;
	} else if(input.match(standardInput)) {
		inputType = 'standard';
		inputValue = Frequency(input.substring(0,1).toUpperCase() + input.substring(1).toLowerCase()).toFrequency();
		scrollMutator = standardScrollMutator;
	}

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
		<ScrollableInput
			pattern={validInputPattern}
			size={6}
			value={input}
			scrollMutator={scrollMutator}
			onChange={(ev)=>{
				if(ev.target.validity.patternMismatch) return;
				setInput(ev.target.value);
			}}
			onBlur={()=>{
				/* When entering a midi note or standard note notation, convert it to standard notation */
				if (inputType === 'midi' || inputType === 'standard') {
					setInput(Frequency(inputValue, 'hz').toNote());
				}
			}} 
			{...props} />
		{ /* When entering something not in standard notation, show the standard notation equivalent next to it */
		(!!inputValue && !(inputType === 'standard')) && <>
			{' '}
			<PitchNotationStyled>
				{hzToNotePrecise(inputValue)? '':'~'}
				{Frequency(inputValue, 'hz').toNote()}
			</PitchNotationStyled>
		</>}
	</>);
}