import { start, Synth, DuoSynth, Frequency, now, Sequence, getTransport } from 'tone';
import type { FeatureCollection, Point } from 'geojson';
import type { Line, MusicSettings } from './useLines';
import { rescaleFrom0To1 } from './utils';

/** Generates a Tone.js Sequence from a given line */
export function makeSequence(coordinatesResampled: FeatureCollection<Point, { elevation: number }>, {synth, lowNote, highNote, noteTime, roundNotes}: MusicSettings): Sequence {
	/* Extract the elevations from the GeoJSON */
	const elevations = coordinatesResampled.features.map((point)=>point.properties.elevation);
	
	/* Select the synth */
	let toneSynth: Synth|DuoSynth;
	switch (synth) {
		case 'classic':
			toneSynth = new Synth();
			break;
		case 'duo':
			toneSynth = new DuoSynth();
			break;
	}
	toneSynth.toDestination();

	/* Rescale the elevations to the scale of `lowNote` to `highNote`, rounding to a perfect midi note if specified to */
	[lowNote, highNote] = [Math.min(lowNote, highNote), Math.max(lowNote, highNote)];
	const noteRange = highNote - lowNote;
	const notes = rescaleFrom0To1(elevations)
		.map((x)=>roundNotes?
			Frequency(x * noteRange + lowNote).toNote() :
			(x * noteRange + lowNote));

	/* Make a sequence with the notes, to be stored in the line object */
	const sequence = new Sequence((time, note)=>{
		toneSynth.triggerAttackRelease(note, noteTime/1000, time);
	}, notes, noteTime/1000);
	sequence.loop = false;

	return sequence;
}

export async function playLine({name, id, musicSequence}: Line) {
	/* Needed to recognize user activation */
	await start();
	const nowTime = now();
	console.log('playing line ' + (name ?? id), musicSequence);
	
	/* Stop prior sequence playing */
	musicSequence.stop();
	musicSequence.start(nowTime);
	getTransport().start();
}