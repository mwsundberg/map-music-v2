import { useEffect, useRef, useState } from 'react';
import TextInput from './TextInput';

/** The amount scrolled and any modifier keys held while scrolling */
type ScrollEventProperties = {
	/** Positive or negative integer, usually 1 */
	scrollAmount: number,
	ctrlKey: boolean,
	shiftKey: boolean,
	altKey: boolean,
}

/** The function that is applied on scroll */
export type ScrollableInputMutator<T> = (value: T, properties: ScrollEventProperties)=>T;

type ScrollableInputProps = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'|'value'> & ({
	type: 'number',
	value: number|'',

	/** A function that mutates the state given a positive or negative scroll distance and modifier keys. Must be wrapped in `useCallback` to avoid rebinding an event listener on every input */
	scrollMutator?: ScrollableInputMutator<number>,
} | {
	type?: 'text',
	value: string,

	/** A function that mutates the state given a positive or negative scroll distance and modifier keys. Must be wrapped in `useCallback` to avoid rebinding an event listener on every input */
	scrollMutator?: ScrollableInputMutator<string>,
});

/* Get the native input value setter instead of react's overwritten one */
/* Trick taken from SO: https://stackoverflow.com/a/46012210/3196151 */
/* @ts-ignore */
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

/** Text input that can be modified by scrolling the mouse wheel over it, modification given as a function of the current value, the amount scrolled, and the modifier keys held */
export default function ScrollableInput({scrollMutator, type='text', onFocus, onBlur, ...props}: ScrollableInputProps) {
	/* Only want an active scroll listener when the input is focused, so need to coordinate adding the listener with a useEffect hook.
	 * Manual listener adding is also needed since react scroll listeners aren't cancelable */
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(()=>{
		if(isFocused && scrollMutator) {
			console.log('attaching new scroll listener');

			/* Unmount the wheel event listener with an AbortController */
			const cleanupController = new AbortController();

			/* The wheel event listener itself, passing a simplified version of the event to scrollMutator then generating a fake input event with the result */
			inputRef.current?.addEventListener('wheel', (ev) => {
				ev.preventDefault();

				/* If pixel scrolling, move 1 tick per 10 pixels scrolled, otherwise just treat the scroll event as a single input */
				ev.deltaMode;
				let scrollAmount = -Math.sign(ev.deltaY);
				if(ev.deltaMode === 0) scrollAmount = (scrollAmount > 0)? Math.ceil(ev.deltaY / 10) : Math.floor(ev.deltaY / 10);

				/* Modifier translation */
				const properties: ScrollEventProperties = {
					scrollAmount,
					ctrlKey: ev.ctrlKey,
					shiftKey: ev.shiftKey,
					altKey: ev.altKey,
				};

				/* Value parsing */
				/* @ts-ignore (doesn't know ev.target is an input element) */
				const oldValue = (type === 'number')? parseFloat(ev.target.value) : ev.target.value;

				/* Call the mutation function */
				/* @ts-ignore (doesn't know ev.target is an input element) */
				const newValue = scrollMutator(oldValue, properties);

				/* Trigger a fake manual value onChange event */
				/* Trick taken from SO: https://stackoverflow.com/a/46012210/3196151 */
				/* @ts-ignore */
				nativeInputValueSetter.call(ev.target, newValue);
				ev.target?.dispatchEvent(new Event('input', { bubbles: true }));
			}, { passive: false, signal: cleanupController.signal });

			/* useEffect cleanup with the AbortController */
			return ()=>cleanupController.abort();
		}
	}, [isFocused, type, scrollMutator]);


	return <TextInput ref={inputRef}
		type={type}
		onFocus={(ev)=>{
			setIsFocused(true);

			/* Call the onFocus of the caller */
			if(onFocus) onFocus(ev);
		}}
		onBlur={(ev)=>{
			setIsFocused(false);

			/* Call the onBlur of the caller */
			if(onBlur) onBlur(ev);
		}}
		{...props} />;
}