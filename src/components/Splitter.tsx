import { useRef, type ReactNode } from "react"

interface SplitterProps {
    /** Defaults to horizontal splitting */
    vertical?: boolean,

    /** Percentage split in [0,1] */
    split?: number

    /** Left or Top, depending upon `vertical` value, and minimum dimension expressed in terms of a CSS calc value */
    slot1: ReactNode,
    slot1min?: string,
    /** Right or Bottom */
    slot2: ReactNode,
    slot2min?: string
}

export function Splitter({vertical = false, split = 0.5, slot1, slot1min = '0px', slot2, slot2min = '0px'}: SplitterProps) {
    const styles: React.CSSProperties = {
        width: '100%',
        height: '100%',
        display: 'grid',
        [vertical?'gridTemplateRows':'gridTemplateColumns']: `minmax(${slot1min}, ${split * 100}%) minmax(${slot2min}, 1fr)`
    }


    console.log({slot1min, slot2min})
    return (
        <div style={styles}>
            <div>
                {slot1}
            </div>
            <div>
                {slot2}
            </div>
        </div>
    );
}