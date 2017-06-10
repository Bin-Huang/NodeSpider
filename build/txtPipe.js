"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class TxtPipe {
    constructor(path, header) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        fs.ensureFileSync(path, (err) => {
            if (err) {
                throw err;
            }
        });
        this.header = header;
        this.stream = fs.createWriteStream(path);
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    add(data) {
        // TODO: 参数检测
        // 如果表头为空，说明是第一次写入文档，将获得表头并初始化写入一些内容
        if (this.header === null) {
            this.header = Object.keys(data);
            let headerString = this.header.join("\t");
            headerString += "\n";
            this.stream.write(headerString);
        }
        let chunk = "";
        for (const item of this.header) {
            chunk += data[item] + "\t";
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
exports.TxtPipe = TxtPipe;
