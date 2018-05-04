"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class TxtPipe {
    constructor(opts) {
        this.name = opts.name;
        this.items = opts.items;
        this.stream = fs.createWriteStream(opts.path);
        this.isFirst = true;
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    write(data) {
        let chunk = "";
        if (this.isFirst) {
            this.isFirst = false;
            const headers = (Array.isArray(this.items)) ? this.items : Object.keys(this.items);
            chunk += headers.reduce((str, c) => `${str}\t${c}`) + "\n";
        }
        chunk += data.reduce((str, c) => `${str}\t${c}`) + "\n";
        this.stream.write(chunk);
    }
    end() {
        this.stream.end();
    }
}
function txtPipe(opts) {
    return new TxtPipe(opts);
}
exports.default = txtPipe;
//# sourceMappingURL=txtPipe.js.map