"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class JsonPipe {
    constructor(path, space = 4) {
        if (typeof path !== "string") {
            throw new TypeError('the string-typed parameter "path" is required');
        }
        this.space = space;
        this.stream = fs.createWriteStream(path);
        this.isFirst = true;
    }
    convert(data) {
        return data;
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
function jsonPipe(path, space) {
    return new JsonPipe(path, space);
}
exports.default = jsonPipe;
//# sourceMappingURL=jsonPipe.js.map