import { useRef, useState, type PointerEvent, type PointerEventHandler, type ReactNode } from "react"
import styled from "styled-components";

type splitConfigsAllowed = {
    /** Percentage split in [0,1] range */
    split: number,
    setSplit?: (value: number)=>void
} | {
    /* Make it so there's never a `setSplit` without a `split` */
    split?: undefined,
    setSplit?: undefined
};

type SplitterProps = splitConfigsAllowed & {
    /** Defaults to horizontal splitting */
    vertical?: boolean,

    /** Draggable gutter width as a CSS calc value */
    gutter?: string,

    /** Left or Top, depending upon `vertical` value, plus minimum split dimensions as a CSS calc value */
    slot1: ReactNode,
    slot1min?: string,
    /** Right or Bottom */
    slot2: ReactNode,
    slot2min?: string,
};

/* The style related props from above with $ prefixes as to not polute the DOM with attributes */
interface SplitterStyleProps {
    $vertical: boolean,
    $split: number,
    $gutter: string,
    $slot1min: string,
    $slot2min: string,
}
const WrapperStyled = styled.div.attrs<SplitterStyleProps>((p) => ({
    /* The magic of the splitter. Everything is driven by the dimensions of the first pane, which is clamped between `slot1min` and `100%-slot2min` */
    style: {
        [p.$vertical?'gridTemplateRows':'gridTemplateColumns']:
            `clamp(calc(${p.$slot1min}),
                   calc(${p.$split * 100}% - ${p.$gutter} / 2),
                   calc(100% - ${p.$slot2min}))
            calc(${p.$gutter})
            1fr`
    },
}))`
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: grid;
`;

const GutterStyled = styled.div<{$vertical: boolean, $gutter: string}>`
    z-index: 1;
    margin: 0 calc(-0.75 * ${(p) => p.$gutter});
    cursor: ${(p) => (p.$vertical?'row-resize':'col-resize')};
`;

const PaneStyled = styled.div`
    z-index: 0;
`;

export function Splitter({vertical = false, split, setSplit, gutter = '6px', slot1, slot1min = '0px', slot2, slot2min = '0px'}: SplitterProps) {
    /* The middle element is swapped out for an unstyled variant if the Splitter is fixed */
    const gutterElementRef = useRef<HTMLDivElement>(null);
    const grabbingRef = useRef(false);
    let gutterElement = <GutterStyled ref={gutterElementRef} className='gutter' $vertical={vertical} $gutter={gutter}></GutterStyled>;

    /* Listen for click dragging on the wrapper element that started in the gutter */
    let onWrapperPointerMove: PointerEventHandler<HTMLDivElement>|undefined = (ev: PointerEvent<HTMLDivElement>) => {
        if(ev.buttons === 1 && grabbingRef.current) {
            /* If currently in the middle of a mouse move that started over the grabber element */
            /* Get wrapper dimensions */
            const wrapperBounds = ev.currentTarget.getBoundingClientRect();
            const wrapperLower = vertical? wrapperBounds.top : wrapperBounds.left;

            /* Get mouse location relative */
            const mouseCoord = vertical? ev.clientY : ev.clientX;
            const mousePercent = (mouseCoord - wrapperLower) / ev.currentTarget.offsetWidth;

            /* Pass value up the chain */
            setSplit?.(mousePercent);

        } else if(ev.buttons === 1 && gutterElementRef.current?.contains(ev.target as Node)) {
            /* If starting a mouse move */
            grabbingRef.current = true;

        } else {
            /* Mouse isn't held down or we aren't starting or continuing a grabber drag */
            grabbingRef.current = false;
        }
    };

    /* Completely uncontrolled input */
    const [uncontrolledSplit, setUncontrolledSplit] = useState(0.5);
    if(split === undefined && setSplit === undefined) {
        [split, setSplit] = [uncontrolledSplit, setUncontrolledSplit];
    }

    /* Completely static, setSplit does nothing */
    if(split !== undefined && setSplit === undefined) {
        gutterElement = <div></div>;
        onWrapperPointerMove = undefined;
    }
    return (
        <WrapperStyled $vertical={vertical} $split={split} $gutter={gutter} $slot1min={slot1min} $slot2min={slot2min} onPointerMove={onWrapperPointerMove}>
            <PaneStyled>
                {slot1}
            </PaneStyled>
            {gutterElement}
            <PaneStyled>
                {slot2}
            </PaneStyled>
        </WrapperStyled>
    );
}