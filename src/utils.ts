
export function minAndMax(array: number[]): [number, number] {
    return array.reduce(([min, max], current)=>[
                (current < min)? current:min,
                (current > max)? current:max
            ], [Infinity, -Infinity]);
}

export function rescaleFrom0To1(array: number[]): number[] {
    const [min, max] = minAndMax(array);
    const range = max - min;
    return array.map((x)=>((x - min)/range));
}