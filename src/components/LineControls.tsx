import { useId, useState } from "react";
import type { Line, MusicSettings, ResampleSettings } from "../App";
import { LineRenderer } from "./LineRenderer";
import { RadioSet } from "./RadioSet";
import { TextInput } from "./TextInput";
import { resampleCoords } from "../lineResampling";
import { Button } from "./Button";
import { Select } from "./Select";

interface LineControlsProps {
    activeLine: Line|undefined,
    setActiveLine: (value: Line)=>void,
    removeLine: (id: string)=>void,
    resampleSettings: ResampleSettings,
    setResampleSettings: (value: ResampleSettings)=>void,
    musicSettings: MusicSettings,
    setMusicSettings: (value: MusicSettings)=>void,
}

export function LineControls({activeLine, setActiveLine, removeLine, resampleSettings, setResampleSettings: setResampleSettingsRaw, musicSettings, setMusicSettings: setMusicSettingsRaw}: LineControlsProps) {
    const id = useId();

    /* Override the settings setters to also update the active line (if present) */
    function setResampleSettings(value: ResampleSettings) {
        setResampleSettingsRaw(value);
        if(activeLine) setActiveLine({
            ...activeLine,
            /* Apply the resampling */
            coordinatesResampled: resampleCoords(activeLine.coordinatesRaw, value),
            resampleSettings: value,
            musicSettings: { ...musicSettings },
        });
    }
    function setMusicSettings(value: MusicSettings) {
        setMusicSettingsRaw(value);
        if(activeLine) setActiveLine({
            ...activeLine,
            resampleSettings: { ...resampleSettings },
            musicSettings: value,
        });
    }

    /* Needed for inputting a float value */
    const [resampleDistanceValue, setResampleDistanceValue] = useState<string>(resampleSettings.distance.toString());
    return (<>
        <LineRenderer line={activeLine} />
        <section>
            <Button onClick={()=>{
                if (activeLine){
                    removeLine(activeLine?.id);
                }
            }}>Remove</Button>
            <br />
            <label htmlFor={id+'name'}>Name: </label><TextInput id={id+'name'} value={activeLine?.name || ''} onChange={(ev)=>{if(activeLine) setActiveLine({...activeLine, name: ev.target.value})}} />
        </section>
        <section>
            <h2>Resampling Settings</h2>
            <label htmlFor={id+'smoothingFactor'}>Smoothing Factor:</label><input id={id+'smoothingFactor'} type='range' min={0} max={100} value={resampleSettings.smoothingFactor * 100} onChange={(ev)=>setResampleSettings({...resampleSettings, smoothingFactor: parseInt(ev.target.value)/100})} />
            <br />
            <RadioSet legend='Resample Mode: ' options={{'count': 'Note Count', 'distance': 'Distance'}} checked={resampleSettings.mode} onChange={(value)=>setResampleSettings({...resampleSettings, mode: value})}/>
            <br />
            {resampleSettings.mode === 'count' && <>
                <label htmlFor={id+'count'}>Number of samples: </label><TextInput id={id+'count'} type='number' size={3} value={resampleSettings.count} onChange={(ev)=>setResampleSettings({...resampleSettings, count: parseInt(ev.target.value)})}/>
            </>}
            {resampleSettings.mode === 'distance' && <>
                <label htmlFor={id + 'distance'}>Distance between samples: </label><TextInput id={id + 'distance'} size={5} pattern='\\d+\\.?\\d*' value={resampleDistanceValue} onChange={(ev) => {
                    /* Guarantee the text entered matches the format of a positive float */
                    const value = parseFloat(ev.target.value);
                    if (ev.target.value.match(/^\d*\.?\d*$/)) {
                        setResampleDistanceValue(ev.target.value);
                    }
                    if (value && value >= 0) {
                        setResampleSettings({ ...resampleSettings, distance: parseFloat(ev.target.value) });
                    }
                }} />
                <Select options={{'meters': 'm', 'kilometers': 'km', 'feet': 'ft', 'miles': 'mi'}} value={resampleSettings.units} onChange={(value)=>setResampleSettings({...resampleSettings, units: value})}/>
            </>}
        </section>
        <section>
            <h2>Music Settings</h2>
            <RadioSet legend='Synth: ' options={{'classic': 'Classic', 'duo': 'Duo'}} checked={musicSettings.synth} onChange={(value)=>setMusicSettings({...musicSettings, synth: value})}/>
            <label htmlFor={id+'lowNote'}>Low Note: </label><TextInput id={id+'lowNote'} type='number' size={3} value={musicSettings.lowNote} onChange={(ev)=>setMusicSettings({...musicSettings, lowNote: parseInt(ev.target.value)})}/>
            <br />
            <label htmlFor={id+'highNote'}>High Note: </label><TextInput id={id+'highNote'} type='number' size={3} value={musicSettings.highNote} onChange={(ev)=>setMusicSettings({...musicSettings, highNote: parseInt(ev.target.value)})}/>
        </section>
    </>);
}