import { start, Synth, DuoSynth, Frequency, now, Sequence, getTransport } from 'tone';
import type { Line, MusicSettings } from './App';
import { rescaleFrom0To1 } from './utils';

/** Generates a Tone.js Sequence from a given line */
export function makeSequence(elevations: number[], {synth, lowNote, highNote, noteTime, roundNotes}: MusicSettings): Sequence {
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

    /* Rescale the elevations to the scale of `lowNote` to `highNote`and convert to hz frequency, rounding to a perfect midi note if specified to */
    const noteRange = highNote - lowNote;
    const notes = rescaleFrom0To1(elevations).map((x)=>Frequency(roundNotes? Math.round(x * noteRange + lowNote):(x * noteRange + lowNote), 'midi').toFrequency());

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