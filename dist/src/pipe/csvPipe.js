"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class CsvPipe {
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
            chunk += headers.reduce((str, c) => `${str},${c}`) + "\n";
        }
        chunk += data.reduce((str, c) => `${str},${c}`) + "\n";
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