import { useState } from 'react';
import styled from 'styled-components';

type TextInputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

const InputStyled = styled.input`
	background-color: transparent;
	border: none;
	color: var(--foreground-text);
	border-bottom: 2px solid var(--foreground);

	&:not(:focus-within) {
		-webkit-appearance: textfield;
	}

	&:focus-within {
		outline: none;
		border-color: var(--foreground-light);
	}
`;

/* Get the native input value setter instead of react's overwritten one */
/* Trick taken from SO: https://stackoverflow.com/a/46012210/3196151 */
/* @ts-ignore */
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

export default function TextInput({value, onInput, onFocus, onKeyDown, ...props}: TextInputProps) {
	/* Store the state on focus so it can be restored if the user hits escape */
	const [initialState, setInitialState] = useState(value);

	return <InputStyled type='text' value={value}
		onInput={(ev)=>{
			/* Prevents entering invalid characters into an empty input */
			/* @ts-ignore (ev.target isn't interpreted as an HTMLInputElement) */
			if(ev.target.validity.badInput || ev.target.validity.patternMismatch) {
				/* @ts-ignore (same as above) */
				ev.target.value = value;
			}

			/* Call the onInput of the caller */
			if(onInput) onInput(ev);
		}}
		onFocus={(ev) => {
			/* Store the initial state */
			setInitialState(ev.target.value);

			/* Call the onFocus of the caller */
			if(onFocus) onFocus(ev);
		}}
		onKeyDown={(ev)=>{
			/* Listen for enter or escape */
			if(ev.key === 'Enter') {
				/* Deselect the input */
				/* @ts-ignore (Typescript isn't aware this is an input element) */
				ev.target.blur();

			} else if(ev.key === 'Escape') {
				/* Restore initial state */
				/* Trick taken from SO: https://stackoverflow.com/a/46012210/3196151 */
				/* @ts-ignore */
				nativeInputValueSetter.call(ev.target, initialState);
				ev.target.dispatchEvent(new Event('input', { bubbles: true }));

				/* Deselect the input */
				/* @ts-ignore (Typescript isn't aware this is an input element) */
				ev.target.blur();
			}

			/* Call the onKeyDown of the caller */
			if(onKeyDown) onKeyDown(ev);
		}}
	{...props} />;
}