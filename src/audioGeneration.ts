import { start, Synth, DuoSynth, Frequency, now, Sequence, getTransport } from 'tone';
import type { Line } from './App';
import { rescaleFrom0To1 } from './utils';

export async function playLine({id, name, elevations, musicSettings: {synth, lowNote, highNote, noteTime}}: Line) {
    /* Needed to recognize user activation */
    await start();
    const nowTime = now();
    console.log('playing line ' + (name ?? id), {synth, lowNote, highNote, noteTime, noteCount: elevations.length});

    /* Select the synth */
    let toneSynth;
    switch (synth) {
        case 'classic':
            toneSynth = new Synth().toDestination();
            break;
        case 'duo':
            toneSynth = new DuoSynth().toDestination();
            break;
    }

    /* Rescale the elevations to the scale of `lowNote` to `highNote`and convert to hz frequency */
    const noteRange = highNote - lowNote;
    const notes = rescaleFrom0To1(elevations).map((x)=>Frequency(x * noteRange + lowNote, 'midi').toFrequency());

    /* Play the notes */
    const sequence = new Sequence((time, note)=>{
        toneSynth.triggerAttackRelease(note, noteTime/1000, time);
    }, notes);
    sequence.loop = false;
    sequence.start(nowTime);
    getTransport().start();
}