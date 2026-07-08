import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollableInputMutator } from './ScrollableInput';
import ScrollableInput from './ScrollableInput';

type ScrollableNumberInputProps = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'|'value'|'step'|'onChange'|'min'|'max'> & {
	type?: 'number',
	step?: number|'any',
	min?: number,
	max?: number,
	value: number|undefined,
	onChange: Function,
	/** Only pass valid inputs to onChange, when false if the input is invalid the last valid input will be preserved, when true undefined will be passed */
	passInvalidState?: boolean,

	/* When scrolling (when holding a modifier key or not), how much to increase/decrease by (set to 0 to disable) */
	ctrlMultiplier?: number,
	normalMultiplier?: number,
	shiftMultiplier?: number,
	ctrlShiftMultiplier?: number,
} & ({
	passInvalidState?: false,
	onChange: (value: number)=>void
} | {
	passInvalidState: true,
	onChange: (value: number|undefined)=>void
})

export default function NumberInput({step = 'any', min, max, value: valueRaw, onChange, passInvalidState,
	/* Defaults are 0.1, 1, 10, 100, or step appropriate values */
	ctrlMultiplier = (step === 'any')? 0.1:step,
	normalMultiplier = (step === 'any' || step < 1)? 1:step,
	shiftMultiplier = (step === 'any' || step < 1)? 10:(step * 10),
	ctrlShiftMultiplier = (step === 'any' || step < 1)? 100:(step * 100),
	...props}: ScrollableNumberInputProps) {
	/* Convert value from `number|undefined` into `number|NaN` */
	const value = valueRaw ?? NaN;

	/* Internal state store to accomodate invalid inputs without having to pass invalid inputs to the value/onChange state */
	const [inputValue, setInputValue] = useState(value);

	/* Previous state value to prevent deadlocks between prop and internal state updating each other */
	const previousValue = useRef(value);

	/* Process a scroll event by incrementing by the amount selected by the modifier keys */
	const scrollMutator: ScrollableInputMutator<number> = useCallback((value, {scrollAmount, ctrlKey, shiftKey}) => {
		/* Adjust the value while clamping to min and max */
		function applyMultiplier(multiplier: number) {
			const newValue = (value || 0) + scrollAmount * multiplier;
			if(min !== undefined && newValue < min) return min;
			else if(max !== undefined && newValue > max) return max;
			else return newValue;
		}
		if(ctrlKey && shiftKey) return applyMultiplier(ctrlShiftMultiplier);
		else if(ctrlKey) return applyMultiplier(ctrlMultiplier);
		else if(shiftKey) return applyMultiplier(shiftMultiplier);
		else return applyMultiplier(normalMultiplier);
	}, [ctrlShiftMultiplier, ctrlMultiplier, shiftMultiplier, normalMultiplier]);

	/* Sync prop state and internal state */
	useEffect(()=>{
		/* Early exit for all states in sync */
		if(value === inputValue) {
			previousValue.current = value;
			return;
		}

		/* Set prop state (internal updated) */
		/* Checking the internal value since the prop will be automatically different if not passing invalid state */
		if(previousValue.current !== inputValue) {
			if(isNaN(inputValue) && passInvalidState) onChange(undefined);
			else if(!isNaN(inputValue)) onChange(inputValue);
			previousValue.current = inputValue;
		} 
		/* Set internal state (prop changed) */
		else {
			setInputValue(value);
			previousValue.current = value;
		}
	}, [inputValue, value, passInvalidState]);


	return <ScrollableInput
		type='number' step={step} min={min} max={max}
		value={isNaN(inputValue)? '':inputValue}
		scrollMutator={scrollMutator}
		onChange={(ev)=>{
			/* Actual bad inputs don't change state as to not clear the input on typoing */
			if(ev.target.value === '' && ev.target.validity.badInput) { return; }
			setInputValue(parseFloat(ev.target.value));
		}}
		onBlur={()=>{
			/* Reset to the last valid value if currently invalid */
			if(isNaN(inputValue)) setInputValue(value);
		}}
		{...props} />;
}