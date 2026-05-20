import { useEffect, useMemo, useRef, useState } from 'react'
import type { Line } from '../App'
import { useMap } from 'react-map-gl/maplibre';
import { getElevations, resampleCoords } from '../lineResampling';
import elevationColor from '../elevationColor';
import { minAndMax, rescaleFrom0To1 } from '../utils';

interface LineRendererProps {
    line: Line|undefined,
    /** The size to draw the note dots */
    noteDotRadius?: number,
}


export default function LineRenderer({line, noteDotRadius = 10, ...props}: LineRendererProps) {    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* Need a map ref to resample the elevations along the line for the detailed elevation layer */
    const {default: mapRef} = useMap();

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

    /* Resample at a higher resolution to draw the elevation profile, with the notes drawn in as a separate layer (so lines with fewer notes still look pretty)
     * The `elevationsResampled` return is in the 0-1 range already, but we still need the min and max elevations for drawing in the note circles at the right height */
    const [minElevation, maxElevation, elevationsResampled] = useMemo(()=>{
        if(line && mapRef) {
            const lineResampled = resampleCoords(line.coordinatesRaw, {...line.resampleSettings, mode: 'count', count: Math.round(width / 4)});
            const elevationsResampledRaw = getElevations(mapRef, lineResampled);

            /* Get the min and max elevations */
            const [minElevation, maxElevation] = minAndMax(elevationsResampledRaw);

            /* Rescale the elevations to the [0,1] range */
            const elevationsResampled = rescaleFrom0To1(elevationsResampledRaw);

            return [minElevation, maxElevation, elevationsResampled];
        } else return [undefined, undefined, undefined];
    }, [line?.id, width]);

    /* Rerender whenever the dimensions or line changes */
    useEffect(()=>{
        if(canvasRef.current && width && height) {
            const ctx = canvasRef.current.getContext('2d')!;
            ctx.clearRect(0, 0, width, height);

            if(line && elevationsResampled) {
                /** Helper functions to convert [0,1] range coordinates to the canvas value, accounting for the radius of the dots too */
                const noteDotRadiusWithBorder = noteDotRadius + 2;
                const calcX = (x: number) => ((width - 2 * noteDotRadius) * x + noteDotRadius);
                const calcY = (y: number) => ((height - 2 * noteDotRadiusWithBorder) - (height - 2 * noteDotRadiusWithBorder) * y + noteDotRadiusWithBorder);

                /* Draw the elevations profile (inset slightly so the overlayed dots aren't clipped off the edge) */
                ctx.beginPath();
                ctx.fillStyle = 'white';
                ctx.moveTo(0, height);
                ctx.lineTo(0, calcY(elevationsResampled[0]));
                for(let i = 0; i < elevationsResampled.length; i++) {
                    ctx.lineTo(
                        calcX(i / (elevationsResampled.length - 1)),
                        calcY(elevationsResampled[i])
                    );
                }
                ctx.lineTo(width, calcY(elevationsResampled[elevationsResampled.length - 1]));
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fill();

                /* Draw the notes themselves as colored circles at each sampled elevation, drawing them twice to get a white border underneath each one */
                for(let i = 0; i < line.elevations.length; i++) {
                    ctx.beginPath();
                    ctx.fillStyle = 'white';
                    ctx.arc(
                        calcX(i / (line.elevations.length - 1)),
                        calcY((line.elevations[i] - minElevation) / (maxElevation - minElevation)),
                        noteDotRadiusWithBorder,
                        0,
                        2 * Math.PI
                    );
                    ctx.closePath();
                    ctx.fill();
                }
                for(let i = 0; i < line.elevations.length; i++) {
                    ctx.beginPath();
                    ctx.fillStyle = elevationColor(line.elevations[i]);
                    ctx.arc(
                        calcX(i / (line.elevations.length - 1)),
                        calcY((line.elevations[i] - minElevation) / (maxElevation - minElevation)),
                        noteDotRadius,
                        0,
                        2 * Math.PI
                    );
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    }, [width, height, line, elevationsResampled]);

    return (
        <canvas ref={canvasRef} width={width} height={height} {...props} style={{width: '100%', height: '100px'}}></canvas>
    )
}