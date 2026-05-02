import { useEffect, useRef, useState } from 'react'
import type { Line } from '../App'

interface LineRendererProps {
    line: Line|undefined
}


export function LineRenderer({line, ...props}: LineRendererProps) {    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* Listen to get the current dimensions with a ResizeObserver */
    const [[width, height], setDimensions] = useState<[number, number]>([0, 0]);
    useEffect(()=>{
        /* Set up the ResizeObserver */
        if (canvasRef.current) {
            const resizeObserver = new ResizeObserver((entries)=>{
                for(const entry of entries) {
                    if(entry.contentRect) setDimensions([entry.contentRect.width, entry.contentRect.height])
                }
            });
            resizeObserver.observe(canvasRef.current);

            return ()=>resizeObserver.disconnect();
        }
    }, []);

    /* Rerender whenever the dimensions or line changes */
    useEffect(()=>{
        if(canvasRef.current && width && height) {
            const ctx = canvasRef.current.getContext('2d')!;
            ctx.clearRect(0, 0, width, height);

            /* Draw the elevations profile */
            if(line) {
                const [minElevation, maxElevation] = line.elevations.reduce((acc, current) =>
                    [(current < acc[0])? current : acc[0],
                     (current > acc[1])? current : acc[1]],
                    [Infinity, -Infinity]);

                ctx.beginPath();
                ctx.fillStyle = 'white';
                ctx.moveTo(0, height);
                for(let i = 0; i < line.elevations.length; i++) {
                    ctx.lineTo(width * (i / (line.elevations.length - 1)), height - height * ((line.elevations[i] - minElevation) / (maxElevation - minElevation)))
                }
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fill();

            }
        }
    }, [width, height, line]);

    return (
        <canvas ref={canvasRef} width={width} height={height} {...props} style={{width: '100%', height: '100px'}}></canvas>
    )
}