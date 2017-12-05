"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class TxtPipe {
    constructor(opts) {
        const { path, header } = opts;
        if (typeof path !== "string") {
            throw new TypeError('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err) => {
            if (err) {
                throw err;
            }
            this.header = header;
            this.stream = fs.createWriteStream(path);
            // 写入表头字段
            let chunk = "";
            for (const key in this.header) {
                if (this.header.hasOwnProperty(key)) {
                    if (chunk !== "") {
                        chunk += "\t";
                    }
                    chunk += key;
                }
            }
            chunk += "\n";
            this.stream.write(chunk);
        });
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    write(data) {
        let chunk = "";
        // 按顺序写入符合关键字段的数据，不存在于关键字列表的数据将被无视
        for (const key in this.header) {
            if (this.header.hasOwnProperty(key)) {
                if (chunk !== "") {
                    chunk += "\t";
                }
                chunk += data[key];
            }
        }
        chunk += "\n";
        this.stream.write(chunk);
    }
    // TODO: 调用 close 将关闭写入流，如果流中还有未写完的内容，将导致内容遗失。
    // 解决思路：监听流的事件（如 drain）并记录为类的成员，close 中判断信号成员来决定何时关闭流
    close() {
        this.stream.close();
    }
}
function txtPipe(opts) {
    return new TxtPipe(opts);
}
exports.default = txtPipe;
