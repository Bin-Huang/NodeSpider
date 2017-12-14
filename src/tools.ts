
export function entries(obj: {[index: string]: any}): [string[], any[]] {
    const keys = [];
    const values = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
            values.push(obj[key]);
        }
    }
    return [keys, values];
}
