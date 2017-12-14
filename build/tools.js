"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function entries(obj) {
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
exports.entries = entries;
