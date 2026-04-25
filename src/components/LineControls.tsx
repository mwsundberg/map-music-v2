import { useId, useState } from "react";
import type { Line, MusicSettings, ResampleSettings } from "../App";
import { LineRenderer } from "./LineRenderer";
import { RadioSet } from "./RadioSet";
import { TextInput } from "./TextInput";
import { resampleCoords } from "../lineResampling";

interface LineControlsProps {
    activeLine: Line|undefined,
    setActiveLine: (value: Line)=>void,
    resampleSettings: ResampleSettings,
    setResampleSettings: (value: ResampleSettings)=>void,
    musicSettings: MusicSettings,
    setMusicSettings: (value: MusicSettings)=>void,
}

export function LineControls({activeLine, setActiveLine, resampleSettings, setResampleSettings: setResampleSettingsRaw, musicSettings, setMusicSettings: setMusicSettingsRaw}: LineControlsProps) {
    const id = useId();

    /* Override the settings setters to also update the active line (if present) */
    const setResampleSettings = (value: ResampleSettings) => {
        setResampleSettingsRaw(value);
        if(activeLine) setActiveLine({
            ...activeLine,
            /* Apply the resampling */
            coordinatesResampled: resampleCoords(activeLine.coordinatesRaw, value),
            resampleSettings: value,
            musicSettings: { ...musicSettings },
        });
    };
    const setMusicSettings = (value: MusicSettings) => {
        setMusicSettingsRaw(value);
        if(activeLine) setActiveLine({
            ...activeLine,
            resampleSettings: { ...resampleSettings },
            musicSettings: value,
        });
    };

    /* Needed for inputting a float value */
    const [resampleDistanceValue, setResampleDistanceValue] = useState<string>(resampleSettings.distance.toString());
    return (<>
        <LineRenderer line={activeLine} />
        <section>
            <label htmlFor={id+'name'}>Name: </label><TextInput id={id+'name'} value={activeLine?.name || ''} onChange={(ev)=>{if(activeLine) setActiveLine({...activeLine, name: ev.target.value})}} />
        </section>
        <section>
            <h2>Resampling Settings</h2>
            <label htmlFor={id+'smoothingFactor'}>Smoothing Factor:</label><input id={id+'smoothingFactor'} type='range' min={0} max={100} value={resampleSettings.smoothingFactor * 100} onChange={(ev)=>setResampleSettings({...resampleSettings, smoothingFactor: parseInt(ev.target.value)/100})} />
            <br />
            <RadioSet legend='Resample Mode: ' options={{'count': 'Count', 'distance': 'Distance'}} checked={resampleSettings.mode} onChange={(value)=>setResampleSettings({...resampleSettings, mode: value})}/>
            <br />
            {resampleSettings.mode === 'count' && <>
                <label htmlFor={id+'count'}>Number of samples: </label><TextInput id={id+'count'} type='number' value={resampleSettings.count} onChange={(ev)=>setResampleSettings({...resampleSettings, count: parseInt(ev.target.value)})}/>
            </>}
            {resampleSettings.mode === 'distance' && <>
                <label htmlFor={id + 'distance'}>Distance between samples (m): </label><TextInput id={id+'distance'} pattern='\\d+\\.?\\d*' value={resampleDistanceValue} onChange={(ev) => {
                    /* Guarantee the text entered matches the format of a positive float */
                    const value = parseFloat(ev.target.value);
                    if(ev.target.value.match(/^\d*\.?\d*$/)) {
                        setResampleDistanceValue(ev.target.value);
                    }
                    if(value && value >= 0) {
                        setResampleSettings({ ...resampleSettings, distance: parseFloat(ev.target.value) });
                    }
                    }} />
            </>}
        </section>
        <section>
            <h2>Music Settings</h2>
            <RadioSet legend='Synth: ' options={{'classic': 'Classic', 'duo': 'Duo'}} checked={musicSettings.synth} onChange={(value)=>setMusicSettings({...musicSettings, synth: value})}/>
            <label htmlFor={id+'lowNote'}>Low Note: </label><TextInput id={id+'lowNote'} type='number' value={musicSettings.lowNote} onChange={(ev)=>setMusicSettings({...musicSettings, lowNote: parseInt(ev.target.value)})}/>
            <br />
            <label htmlFor={id+'highNote'}>High Note: </label><TextInput id={id+'highNote'} type='number' value={musicSettings.highNote} onChange={(ev)=>setMusicSettings({...musicSettings, highNote: parseInt(ev.target.value)})}/>
        </section>
    </>);
}