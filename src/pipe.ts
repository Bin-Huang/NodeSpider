import * as fs from "fs-extra";
import { entries } from "./tools";
import { IPipe } from "./types";

export function csvPipe(path: string): IPipe {
    const pipe = fs.createWriteStream(path);
    (pipe as IPipe).format = csvFormat;
    return pipe;
}
const csvFormat = (() => {
    let isFirst = true;
    return (items: object): string => {
        let chunk = "";
        if (isFirst) {
            isFirst = false;
            chunk += entries(items)[0].join(",") + ",\n";
        }
        chunk += entries(items)[1].join(",") + ",\n";
        return chunk;
    };
})();

export function txtPipe(path: string): IPipe {
    const pipe = fs.createWriteStream(path);
    (pipe as IPipe).format = txtFormat;
    return pipe;
}
const txtFormat = (() => {
    let isFirst = true;
    return (items: object): string => {
        let chunk = "";
        if (isFirst) {
            isFirst = false;
            chunk += entries(items)[0].join("\t") + "\n";
        }
        chunk += entries(items)[1].join("\t") + "\n";
        return chunk;
    };
})();

export function jsonPipe(path: string): IPipe {
    const pipe = fs.createWriteStream(path);
    (pipe as IPipe).format = jsonFormat;
    const streamClose = pipe.close;
    pipe.close = () => {
        pipe.write("\n]");
        streamClose.call(pipe);
    };
    return pipe;
}
const jsonFormat = (() => {
    let first = true;
    return (items: object): string => {
        let chunk = "";
        if (first) {
            first = false;
            chunk += "[\n";
        } else {
            chunk = ",\n";
        }
        chunk += JSON.stringify(items);
        return chunk;
    };
})();
