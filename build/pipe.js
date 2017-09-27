"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class TxtTable {
    constructor(name, path, header) {
        if (typeof path !== "string") {
            throw new TypeError('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err) => {
            if (err) {
                throw err;
            }
            this.name = name;
            this.header = header;
            this.stream = fs.createWriteStream(path);
            // 写入表头字段
            let chunk = "";
            for (const item of this.header) {
                if (chunk !== "") {
                    chunk += "\t";
                }
                chunk += item;
            }
            chunk += "\n";
            this.stream.write(chunk);
        });
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    add(data) {
        let chunk = "";
        // 按顺序写入符合关键字段的数据，不存在于关键字列表的数据将被无视
        for (const item of this.header) {
            if (chunk !== "") {
                chunk += "\t";
            }
            chunk += data[item];
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
    constructor(name, path, space = 2) {
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
// tslint:disable-next-line:max-classes-per-file
class CsvPipe {
    constructor(name, path, header) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err) => {
            if (err) {
                throw err;
            }
            this.header = header;
            this.name = name;
            this.stream = fs.createWriteStream(path);
            // 写入表头字段
            let chunk = "";
            for (const item of this.header) {
                if (chunk !== "") {
                    chunk += ",";
                }
                chunk += item;
            }
            chunk += "\n";
            this.stream.write(chunk);
        });
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    add(data) {
        // 按顺序写入符合关键字段的数据，不存在于关键字列表的数据将被无视
        let chunk = "";
        for (const item of this.header) {
            if (chunk !== "") {
                chunk += ",";
            }
            chunk += data[item];
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
function txtPipe(name, path, header) {
    return new TxtTable(name, path, header);
}
exports.txtPipe = txtPipe;
function jsonPipe(name, path, space) {
    return new JsonTable(name, path, space);
}
exports.jsonPipe = jsonPipe;
function csvPipe(name, path, header) {
    return new CsvPipe(name, path, header);
}
exports.csvPipe = csvPipe;
