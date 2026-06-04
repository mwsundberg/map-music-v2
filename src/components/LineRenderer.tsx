import { useEffect, useMemo, useRef, useState } from 'react'
import type { Line } from '../useLines';
import { useMap } from 'react-map-gl/maplibre';
import { resampleCoords } from '../lineResampling';
import elevationColor from '../elevationColor';
import { minAndMax, rescaleFrom0To1 } from '../utils';

interface LineRendererProps {
	line: Line|undefined,
	/** The size to draw the note dots */
	noteDotRadius?: number,
	/** The elevation profile and dot borders color */
	mainColor?: string,
}


export default function LineRenderer({line, noteDotRadius = 10, mainColor='white', ...props}: LineRendererProps) {
	/* Early return for no line case */
	if(!line){
		return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" {...props} style={{width: '100%', height: '100px'}}></svg>;
	}

	const svgRef = useRef<SVGSVGElement>(null);

	/* Need a map ref to resample the elevations along the line for the detailed elevation layer */
	const {default: mapRef} = useMap();

	/* Listen to get the current dimensions with a ResizeObserver */
	const [[width, height], setDimensions] = useState<[number, number]>([0, 0]);
	useEffect(()=>{
		/* Set up the ResizeObserver */
		if (svgRef.current) {
			const resizeObserver = new ResizeObserver((entries)=>{
				for(const entry of entries) {
					if(entry.contentRect) setDimensions([entry.contentRect.width, entry.contentRect.height])
				}
			});
			resizeObserver.observe(svgRef.current);

			return ()=>resizeObserver.disconnect();
		}
	}, []);

	/* Resample at a higher resolution to draw the elevation profile, with the notes drawn in as a separate layer (so lines with fewer notes still look pretty)
	 * The `elevationsResampled` return is in the 0-1 range already, but we still need the min and max elevations for drawing in the note circles at the right height */
	const [minElevation, elevationRange, elevationsResampled] = useMemo(()=>{
		if(mapRef) {
			const lineResampled = resampleCoords(mapRef, '', line.coordinatesRaw, {...line.resampleSettings, mode: 'count', count: Math.round(width / 4)});
			const elevationsResampledRaw = lineResampled.features.map((point)=>point.properties.elevation);

			/* Get the min and max elevations */
			const [minElevation, maxElevation] = minAndMax(elevationsResampledRaw);
			const elevationRange = maxElevation - minElevation;

			/* Rescale the elevations to the [0,1] range */
			const elevationsResampled = rescaleFrom0To1(elevationsResampledRaw);

			return [minElevation, elevationRange, elevationsResampled];
		} else throw new Error(`MapRef not found in LineRenderer rendering Line '${line.name ?? line.id}'`);
	}, [line?.id, Math.round(width / 4)]);

	/* Helper functions to convert [0,1] range coordinates to the svg coordinate value, accounting for the radius of the dots too */
	const noteDotRadiusWithBorder = noteDotRadius + 2;
	const calcX = (x: number)=>((width - 2 * noteDotRadiusWithBorder) * x + noteDotRadiusWithBorder);
	const calcY = (y: number)=>((height - 2 * noteDotRadiusWithBorder) - (height - 2 * noteDotRadiusWithBorder) * y + noteDotRadiusWithBorder);


	/* The elevation profile (inset slightly so the overlayed dots aren't clipped off the edge)  */
	const elevationsResampledLastIndex = elevationsResampled.length - 1;
	const elevationProfilePath = <path fill={mainColor} d={
		`M 0 ${height}` + /* Bottom left */
		`L 0 ${calcY(elevationsResampled[0])}` + /* Start of line minus margin */
		elevationsResampled.map((el, i)=>`L ${calcX(i / elevationsResampledLastIndex)} ${calcY(el)}`).join(' ') + /* Each point along the elevation profile */
		`L ${width} ${calcY(elevationsResampled[elevationsResampledLastIndex])}` + /* End of line plus margin */
		`L ${width} ${height}` + /* Bottom right */
		'Z' /* Close path */
	} />;

	/* The notes themselves as colored circles at each sampled elevation, drawn twice so the borders are layered underneath the dots */
	const coloredDots = line.coordinatesResampled.features.map((point)=>(
		<circle key={'fill' + point.properties.fractionAlong}
			fill={elevationColor(point.properties.elevation)} r={noteDotRadius}
			cx={calcX(point.properties.fractionAlong)} cy={calcY((point.properties.elevation - minElevation) / elevationRange)} />
	));
	const borderDots = line.coordinatesResampled.features.map((point)=>(
		<circle key={'border' + point.properties.fractionAlong}
			fill={mainColor} r={noteDotRadiusWithBorder}
			cx={calcX(point.properties.fractionAlong)} cy={calcY((point.properties.elevation - minElevation) / elevationRange)} />
	));

	return (
		<svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} {...props} style={{width: '100%', height: '100px'}}>
			{elevationProfilePath}
			{borderDots}
			{coloredDots}
		</svg>
	)
}