"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class JsonPipe {
    constructor(opts) {
        let { name, path, space } = opts;
        if (typeof path !== "string") {
            throw new TypeError('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err) => {
            if (err) {
                throw err;
            }
            this.stream = fs.createWriteStream(path);
            this.name = name;
            this.space = "";
            while (space > 0) {
                space--;
                this.space += " ";
            }
            this.stream.write("[");
            this.closeSign = false;
            this.first = true;
        });
    }
    add(data) {
        if (this.closeSign) {
            throw new Error("Apjson WARN: can not append any more, because it has been closed.");
        }
        let newStr = JSON.stringify(data, null, this.space + this.space);
        if (this.first) {
            this.first = false;
            newStr = "\n" + newStr;
        }
        else {
            newStr = ",\n" + newStr;
        }
        newStr = newStr.replace(/\n/g, "\n" + this.space);
        this.stream.write(newStr, () => {
            if (this.closeSign) {
                this.stream.write("\n]");
                this.stream.close();
            }
        });
    }
    close() {
        this.closeSign = true;
    }
}
function jsonPipe(opts) {
    return new JsonPipe(opts);
}
exports.default = jsonPipe;
