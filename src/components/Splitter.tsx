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

const WrapperStyled = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: grid;
`;

const GutterStyled = styled.div<{$vertical: boolean, $gutter: string}>`
    z-index: 1;
    margin: 0 calc(-0.75 * ${(p) => p.$gutter});
    cursor: ${(p) => (p.$vertical?'ns-resize':'ew-resize')};
`;

const PaneStyled = styled.div`
    z-index: 0;
    overflow: auto;
`;

export default function Splitter({vertical = false, split, setSplit, gutter = '6px', slot1, slot1min = '0px', slot2, slot2min = '0px'}: SplitterProps) {
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
            const mousePercent = (mouseCoord - wrapperLower) / (vertical? ev.currentTarget.offsetHeight : ev.currentTarget.offsetWidth);

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
    const uncontrolledSplitState = useState(0.5);
    if(split === undefined) { /* the type system guarantees that if `split` is undefined, `setSplit` can only be undefined as well */
        [split, setSplit] = uncontrolledSplitState;
    }

    /* Completely static, setSplit does nothing */
    if(split !== undefined && setSplit === undefined) {
        gutterElement = <div></div>;
        onWrapperPointerMove = undefined;
    }

    /* The magic of the splitter. Everything is driven by the dimensions of the first pane, which is clamped between `slot1min` and `100%-slot2min` */
    const splitterWrapperStyles = {
        [vertical?'gridTemplateRows':'gridTemplateColumns']:
            `clamp(calc(${slot1min}),
                   calc(${split * 100}% - ${gutter} / 2),
                   calc(100% - ${slot2min}))
            calc(${gutter})
            1fr`
    };

    return (
        <WrapperStyled style={splitterWrapperStyles} onPointerMove={onWrapperPointerMove}>
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