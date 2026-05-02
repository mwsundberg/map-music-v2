/* Preset locations */
export const mapPresets = [
    {name: "Grand Canyon",            viewState: {latitude: 35.8102593, longitude: -113.6302593, zoom: 11}},
    {name: "Vancouver Mountains",     viewState: {latitude: 49.3822072, longitude: -123.1363749, zoom: 12}},
    {name: "University of Rochester", viewState: {latitude: 43.1289624, longitude: -77.62912500, zoom: 16}},
    {name: "Mount Everest",           viewState: {latitude: 27.9881199, longitude:  86.91622030, zoom: 11}},
    {name: "Death Valley",            viewState: {latitude: 36.3885879, longitude: -116.8938400, zoom: 10}},
    {name: "Shenandoah River",        viewState: {latitude: 38.8879720, longitude: -78.36221690, zoom: 12}},
    {name: "Appalachian Mountains",   viewState: {latitude: 37.0133000, longitude: -81.48799896, zoom: 11}},
];

/** Elevation coloring definitions */
export const elevationColorMap = {
    [-410]: 'hsl(78, 30%, 41%)',
    [   0]: 'hsl(70, 32%, 91%)',
    [2300]: 'hsl(60, 64%, 30%)',
    [3901]: 'hsl(47, 97%, 51%)',
    [5586]: 'hsl(17, 87%, 47%)',
    [8840]: 'hsl(343, 90%, 96%)',
}