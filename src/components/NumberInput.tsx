import { useEffect, useRef, useState } from "react";
import TextInput from "./TextInput";

type ScrollableNumberInputProps = Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'value'|'step'|'onChange'|'min'|'max'> & {
    step?: number|'any',
    min?: number,
    max?: number,
    value: number|'',
    onChange: (value: number)=>void,

    /* When scrolling (when holding a modifier key or not), how much to increase/decrease by (set to 0 to disable, negative numbers are set to default values) */
    ctrlMultiplier?: number,
    normalMultiplier?: number,
    shiftMultiplier?: number,
    ctrlShiftMultiplier?: number,
}

export default function NumberInput({step = 'any', min, max, value, onChange,
    /* Defaults are 0.1, 1, 10, 100, or step appropriate values */
    ctrlMultiplier = (step === 'any')? 0.1:step,
    normalMultiplier = (step === 'any' || step < 1)? 1:step,
    shiftMultiplier = (step === 'any' || step < 1)? 10:(step * 10),
    ctrlShiftMultiplier = (step === 'any' || step < 1)? 100:(step * 100),
    ...props}: ScrollableNumberInputProps) {

    /* On scroll, increment the value by the appropriate multiplier after correcting for the scroll step size */
    function onWheel(ev: WheelEvent) {
        ev.preventDefault();
        
        /* If pixel scrolling, move 1 tick per 10 pixels scrolled, otherwise just treat the scroll event as a single input */
        ev.deltaMode;
        let scrollAmount = -Math.sign(ev.deltaY);
        if(ev.deltaMode === 0) scrollAmount = (scrollAmount > 0)? Math.ceil(ev.deltaY / 10):Math.floor(ev.deltaY / 10);

        /* Adjust the value accordingly */
        console.log(value)
        const applyMultiplier = (multiplier: number)=>onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, (value || 0) + scrollAmount * multiplier)));
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
    }, [isFocused, value])
    
    return <TextInput ref={inputRef} type='number' step={step} min={min} max={max} value={value} onChange={(ev) => onChange(parseFloat(ev.target.value))} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} {...props} />
}