"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class CsvPipe {
    constructor(path) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        this.stream = fs.createWriteStream(path);
        this.header = [];
    }
    convert(data) {
        if (this.header.length === 0) {
            this.header = Object.keys(data);
            this.write(this.header);
        }
        return this.header.map((key) => data[key]);
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    write(items) {
        // TODO: 考证：这里的实现，将会导致输出结果中每行不以逗号结尾，这可能不符合 csv 格式
        const chunk = items.reduce((str, c) => `${str},${c}`) + "\n";
        this.stream.write(chunk);
    }
    end() {
        this.stream.end();
    }
}
function csvPipe(path) {
    return new CsvPipe(path);
}
exports.default = csvPipe;
//# sourceMappingURL=csvPipe.js.map