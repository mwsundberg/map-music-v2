import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { Sequence } from 'tone';
import { resampleCoords } from './lineResampling';
import { useMap, type MapRef } from 'react-map-gl/maplibre';
import { makeSequence, playLine } from './audioGeneration';
import { useMemo, useState } from 'react';

export type ResampleSettings = {
	/** How much to smooth the line, range [0,1] */
	smoothingFactor: number;
	mode: 'count' | 'distance';
	/** The number of coordinates to resample to (ignored if resampling by distance) */
	count: number;
	/** The distance and unit used to resample along (ignored if resampling by count) */
	distance: number;
	units: 'meters' | 'kilometers' | 'feet' | 'miles';
};

export type MusicSettings = {
	synth: 'classic' | 'duo';
	/* TODO Could be based on absolute elevation */
	/** Lower bounds of the remapped scale, in hz */
	lowNote: number;
	/** Upper bounds of the remapped scale, in hz */
	highNote: number;
	/** Length of a single note in ms (do the math if wanting to set the total clip length) */
	noteTime: number;
	/** Round elevation generated frequency to precise midi/pitch notation notes */
	roundNotes: boolean;
};

export type Line = {
	/** UUID made on generation from map */
	id: string;

	/** Name of the line */
	name: string | undefined;

	/** Raw input coordinates that make up the line, `{lng, lat}` objects */
	coordinatesRaw: Feature<LineString>;

	/** Resampled into evenly spaced points along the original line, with elevation and the percentage along the line of the point packed into the Feature properties */
	coordinatesResampled: FeatureCollection<Point, { lineId: string, fractionAlong: number, elevation: number }>;

	/** Tone.js Sequence rendering the line as sound */
	musicSequence: Sequence;

	/** Resampling settings */
	resampleSettings: ResampleSettings;

	/** Music generation settings */
	musicSettings: MusicSettings;
};


/** Wrapper hook that handles all state calls and side-effects */
export default function useLines(resampleSettings: ResampleSettings, musicSettings: MusicSettings, livePreview: boolean) {
	const [lines, setLines] = useState<Line[]>([]);
	
	/* Map instance is needed to get elevations from */
	const {default: mapRef} = useMap();

	/* Active line id is managed internally */
	const [activeLineId, setActiveLineId] = useState<string|undefined>(undefined);
	const activeLine = useMemo(()=>(lines.filter((l)=>(l.id === activeLineId))?.[0]),
		[lines, activeLineId]);

	/* Management functions */
	function addLine({ id, coordinatesRaw }: Pick<Line, 'id' | 'coordinatesRaw'>) {
		/* Generate derived state */
		const coordinatesResampled = resampleCoords(mapRef as MapRef, id, coordinatesRaw, resampleSettings);
		const musicSequence = makeSequence(coordinatesResampled, musicSettings);

		const newLine = {
			id: id,
			coordinatesRaw: coordinatesRaw,
			name: undefined,
			coordinatesResampled: coordinatesResampled,
			musicSequence: musicSequence,
			resampleSettings: resampleSettings,
			musicSettings: musicSettings,
		};
		setLines([...lines, newLine]);
		setActiveLineId(id);

		/* Play the audio for the line */
		if(livePreview) playLine(newLine);
	}

	function removeLine(id = activeLineId) {
		if(!id) throw new Error('Attempting to remove an unspecified line');

		setLines(lines.filter((l)=>(l.id !== id)));
		if(id === activeLineId) setActiveLineId(undefined);
	}

	function updateLine(newLine: Line) {
		setLines(lines.map((l)=>{
			if(l.id !== newLine.id) return l;

			return newLine;
		}));
	}

	function updateResampleSettings(resampleSettings: ResampleSettings, id = activeLineId) {
		if(!id) throw new Error('Attempting to update resample without a line selected');

		setLines(lines.map((l)=>{
			if(l.id !== id) return l;
			
			/* Clear the existing audio sequence if it's currently playing */
			l.musicSequence.dispose();

			/* Generate derived state */
			const coordinatesResampled = resampleCoords(mapRef as MapRef, id, l.coordinatesRaw, resampleSettings);
			const musicSequence = makeSequence(coordinatesResampled, l.musicSettings);

			return {
				...l,
				coordinatesResampled: coordinatesResampled,
				musicSequence: musicSequence,
				resampleSettings: resampleSettings,
			};
		}));
	}

	function updateMusicSettings(musicSettings: MusicSettings, id = activeLineId) {
		if (!id) throw new Error('Attempting to update music settings without a line selected');

		setLines(lines.map((l)=>{
			if(l.id !== id) return l;

			/* Clear the existing audio sequence if it's currently playing */
			l.musicSequence.dispose();

			/* Generate derived state */
			const musicSequence = makeSequence(l.coordinatesResampled, musicSettings);

			return {
				...l,
				musicSequence: musicSequence,
				musicSettings: musicSettings,
			};
		}));
	}

	return {
		lines,
		activeLineId,
		setActiveLineId,
		activeLine,
		updateLine,
		addLine,
		removeLine,
		updateResampleSettings,
		updateMusicSettings,
	};
}