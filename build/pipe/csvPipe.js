"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class CsvPipe {
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
        const chunk = items.reduce((str, c) => `${str},${c}`) + "\n";
        this.stream.write(chunk);
    }
    end() {
        this.stream.end();
    }
}
function csvPipe(opts) {
    return new CsvPipe(opts);
}
exports.default = csvPipe;
//# sourceMappingURL=csvPipe.js.map