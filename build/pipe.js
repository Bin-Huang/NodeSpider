"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class TxtTable {
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
// tslint:disable-next-line:max-classes-per-file
class JsonTable {
    constructor(path, space = 2) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        fs.ensureFileSync(path, (err) => {
            if (err) {
                throw err;
            }
        });
        this.stream = fs.createWriteStream(path);
        this.space = "";
        while (space > 0) {
            space--;
            this.space += " ";
        }
        this.stream.write("[");
        this.closeSign = false;
        this.first = true;
    }
    add(data) {
        if (!this.closeSign) {
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
function txtPipe(path, header) {
    return new TxtTable(path, header);
}
exports.txtPipe = txtPipe;
function jsonPipe(path, space) {
    return new JsonTable(path, space);
}
exports.jsonPipe = jsonPipe;
