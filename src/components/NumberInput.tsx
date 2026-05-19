import { useEffect, useRef, useState } from "react";
import TextInput from "./TextInput";

type ScrollableNumberInputProps = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'value'|'step'|'onChange'|'min'|'max'> & {
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

export default function NumberInput({step = 'any', min, max, value, onChange, passInvalidState,
    /* Defaults are 0.1, 1, 10, 100, or step appropriate values */
    ctrlMultiplier = (step === 'any')? 0.1:step,
    normalMultiplier = (step === 'any' || step < 1)? 1:step,
    shiftMultiplier = (step === 'any' || step < 1)? 10:(step * 10),
    ctrlShiftMultiplier = (step === 'any' || step < 1)? 100:(step * 100),
    ...props}: ScrollableNumberInputProps) {

    /* Internal state store to accomodate invalid inputs without having to pass invalid inputs to the value/onChange state */
    const [inputValue, setInputValue] = useState(value ?? NaN);

    /* Wrapped setter that handles whether to pass invalid state as undefined or not */
    function saveValue(newValue: number) {
        setInputValue(newValue);
        if(!isNaN(newValue)) onChange(newValue);
        else if(passInvalidState) onChange(undefined);
    }

    /* On scroll, increment the value by the appropriate multiplier after correcting for the scroll step size */
    function onWheel(ev: WheelEvent) {
        ev.preventDefault();
        
        /* If pixel scrolling, move 1 tick per 10 pixels scrolled, otherwise just treat the scroll event as a single input */
        ev.deltaMode;
        let scrollAmount = -Math.sign(ev.deltaY);
        if(ev.deltaMode === 0) scrollAmount = (scrollAmount > 0)? Math.ceil(ev.deltaY / 10):Math.floor(ev.deltaY / 10);

        /* Adjust the value accordingly */
        function applyMultiplier(multiplier: number) {
            let newValue = (value ?? min ?? 0) + scrollAmount * multiplier;
            
            if(min !== undefined && newValue < min) saveValue(min);
            else if(max !== undefined && newValue > max) saveValue(max);
            else saveValue(newValue);
        }
        if (ev.ctrlKey && ev.shiftKey) applyMultiplier(ctrlShiftMultiplier);
        else if (ev.ctrlKey) applyMultiplier(ctrlMultiplier);
        else if (ev.shiftKey) applyMultiplier(shiftMultiplier);
        else applyMultiplier(normalMultiplier);
    }

    /* Only want an active scroll listener when the input is focused, so need to coordinate adding the listener with a useEffect hook.
     * Manual listener adding is also needed since react scroll listeners aren't cancelable */
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(()=>{
        if(isFocused) {
            const input = inputRef.current;
            input?.addEventListener('wheel', onWheel, { passive: false });
            return ()=>input?.removeEventListener('wheel', onWheel);
        }
    }, [isFocused, value, ctrlMultiplier, normalMultiplier, shiftMultiplier, ctrlShiftMultiplier, passInvalidState]);

    return <TextInput ref={inputRef}
        type='number' step={step} min={min} max={max}
        value={isNaN(inputValue)? '':inputValue}
        onChange={(ev)=>{
            /* Actual bad inputs don't change state as to not clear the input on typoing */
            if(ev.target.value === '' && ev.target.validity.badInput) { return; }
            saveValue(parseFloat(ev.target.value));
        }}
        onInput={(ev)=>{
            /* Prevents entering invalid characters into an empty input */
            /* @ts-ignore (ev.target isn't interpreted as an HTMLInputElement) */
            if(ev.target.validity.badInput) {
                /* @ts-ignore (same as above) */
                ev.target.value = inputValue;
            }
        }}
        onFocus={()=>setIsFocused(true)}
        onBlur={()=>{
            setIsFocused(false);
            /* Reset to the last valid value if currently invalid */
            if(isNaN(inputValue)) setInputValue(value ?? NaN);
        }}
        {...props} />
}