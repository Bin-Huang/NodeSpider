"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const tools_1 = require("./tools");
function csvPipe(path) {
    const pipe = fs.createWriteStream(path);
    pipe.format = csvFormat;
    return pipe;
}
exports.csvPipe = csvPipe;
const csvFormat = (() => {
    let isFirst = true;
    return (items) => {
        let chunk = "";
        if (isFirst) {
            isFirst = false;
            chunk += tools_1.entries(items)[0].join(",") + ",\n";
        }
        chunk += tools_1.entries(items)[1].join(",") + ",\n";
        return chunk;
    };
})();
function txtPipe(path) {
    const pipe = fs.createWriteStream(path);
    pipe.format = txtFormat;
    return pipe;
}
exports.txtPipe = txtPipe;
const txtFormat = (() => {
    let isFirst = true;
    return (items) => {
        let chunk = "";
        if (isFirst) {
            isFirst = false;
            chunk += tools_1.entries(items)[0].join("\t") + "\n";
        }
        chunk += tools_1.entries(items)[1].join("\t") + "\n";
        return chunk;
    };
})();
function jsonPipe(path) {
    const pipe = fs.createWriteStream(path);
    pipe.format = jsonFormat;
    const streamClose = pipe.close;
    pipe.close = () => {
        pipe.write("\n]");
        streamClose.call(pipe);
    };
    return pipe;
}
exports.jsonPipe = jsonPipe;
const jsonFormat = (() => {
    let first = true;
    return (items) => {
        let chunk = "";
        if (first) {
            first = false;
            chunk += "[\n";
        }
        else {
            chunk = ",\n";
        }
        chunk += JSON.stringify(items);
        return chunk;
    };
})();
