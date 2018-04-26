"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class JsonPipe {
    constructor(opts) {
        this.name = opts.name;
        this.items = opts.items;
        this.space = (typeof opts.space !== "undefined") ? opts.space : 4;
        this.stream = fs.createWriteStream(opts.path);
        this.isFirst = true;
    }
    write(data) {
        const str = JSON.stringify(data, null, this.space);
        if (this.isFirst) {
            this.stream.write(`[\n${str}`);
            this.isFirst = false;
        }
        else {
            this.stream.write(`,\n${str}`);
        }
    }
    end() {
        this.stream.end("\n]");
    }
}
function jsonPipe(opts) {
    return new JsonPipe(opts);
}
exports.default = jsonPipe;
//# sourceMappingURL=jsonPipe.js.map