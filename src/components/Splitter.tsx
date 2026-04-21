import { useRef, useState, type ReactNode } from "react"
import styled from "styled-components";

interface SplitterProps extends Partial<SplitterStyleProps> {
    /** Setter for the split property, value in [0,1] range */
    setSplit?: (value: number)=>void

    /** Left or Top, depending upon `vertical` value */
    slot1: ReactNode,
    /** Right or Bottom */
    slot2: ReactNode,
}
interface SplitterStyleProps {
    /** Defaults to horizontal splitting */
    vertical: boolean,

    /** Percentage split in [0,1] range */
    split: number,

    /** Draggable gutter width as a CSS calc value */
    gutter: string,

    /** Minimum slot dimensions as a CSS calc value */
    slot1min: string,
    slot2min: string,
}

const WrapperStyled = styled.div<SplitterStyleProps>`
    width: 100%;
    height: 100%;
    display: grid;
    ${(p) => (p.vertical?'grid-template-rows':'grid-template-columns')}:
        clamp(calc(${(p) => p.slot1min}),
              ${(p) => (p.split * 100)}%,
              calc(100% - ${(p) => p.slot2min}))
        calc(${(p) => p.gutter})
        1fr;
`;

const GrabberStyled = styled.div<{vertical: boolean, gutter: string}>`
    z-index: 100;
    margin: 0 calc(-0.75 * ${(p) => p.gutter});
    cursor: ${(p) => (p.vertical?'row-resize':'col-resize')};
`;

export function Splitter({vertical = false, split, setSplit, gutter = '5px', slot1, slot1min = '0px', slot2, slot2min = '0px'}: SplitterProps) {
    let middleElement = <GrabberStyled
        className='gutter' {...{ vertical, gutter }}
        onPointerMove={(ev) => {
            /* When the left mouse button is held */
            if (ev.buttons === 1) {
                /* Get wrapper dimensions */
                const wrapperBounds = wrapperRef.current?.getBoundingClientRect();
                if (wrapperBounds === undefined) return;
                const [wrapperLower, wrapperUpper] = vertical ? [wrapperBounds.top, wrapperBounds.bottom] : [wrapperBounds.left, wrapperBounds.right];

                /* Get mouse location relative */
                const mouseCoord = vertical ? ev.clientY : ev.clientX;

                /* Account for dragger width and  */
                const mousePercent = (mouseCoord - wrapperLower) / (wrapperUpper - wrapperLower);

                /* Pass value up the chain */
                setSplit?.(mousePercent);
            }
        }}></GrabberStyled>;
    /* Completely uncontrolled input */
    if(split === undefined && setSplit === undefined) {
        [split, setSplit] = useState(0.5);
    }

    /* Completely static, setSplit does nothing */
    if(split !== undefined && setSplit === undefined) {
        middleElement = <div></div>;
    }

    /* Nonsense */
    if(split === undefined && setSplit !== undefined) {
        throw new Error('Invalid args to Splitter');
    }

    /* Fallback to cover unset split (not needed since completely uncontrolled and nonsense cases should cover it already) */
    if(split === undefined) split = 0.5;

    const wrapperRef = useRef(null);

    return (
        <WrapperStyled ref={wrapperRef} {...{vertical, split, gutter, slot1min, slot2min}}>
            <div>
                {slot1}
            </div>
            {middleElement}
            <div>
                {slot2}
            </div>
        </WrapperStyled>
    );
}