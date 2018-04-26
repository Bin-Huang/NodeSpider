"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class TxtPipe {
    constructor(opts) {
        this.name = opts.name;
        this.items = opts.items;
        this.stream = fs.createWriteStream(opts.path);
        this.header = [];
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    write(data) {
        if (this.header.length === 0) {
            this.header = Object.keys(data);
            this.write(this.header);
        }
        const items = this.header.map((key) => data[key]);
        const chunk = items.reduce((str, c) => `${str}\t${c}`) + "\n";
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