import * as Apjson from "apjson";
import * as fs from "fs-extra";
import { IPipe } from "./types";

class TxtTable {
    /**
     * Creates an instance of TxtTable.
     * @param {string} path 写入文件路径
     * @memberOf TxtTable
     */
    public header: string[];
    private stream: fs.WriteStream;
    constructor(path: string, header: string[]) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err: Error) => {
            if (err) {
                throw err;
            }
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
    public add(data: any) {
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
    public close() {
        this.stream.close();
    }
}

// tslint:disable-next-line:max-classes-per-file
class JsonTable {
    private stream: fs.WriteStream;
    private space: string;
    private closeSign: boolean;
    private first: boolean;
    constructor(path: string, space: number = 2) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err) => {
            if (err) {
                throw err;
            }
            this.stream = fs.createWriteStream(path);
            this.space = "";
            while (space > 0) {
                space --;
                this.space += " ";
            }
            this.stream.write("[");
            this.closeSign = false;
            this.first = true;
        });
    }
    public add(data: any) {
        if (this.closeSign) {
            throw new Error("Apjson WARN: can not append any more, because it has been closed.");
        }
        let newStr = JSON.stringify(data, null, this.space + this.space);
        if (this.first) {
            this.first = false;
            newStr = "\n" + newStr;
        } else {
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
    public close() {
        this.closeSign = true;
    }
}

// tslint:disable-next-line:max-classes-per-file
class CsvPipe {
    /**
     * Creates an instance of csv pipe.
     * @param {string} path 写入文件路径
     * @memberOf TxtTable
     */
    public header: string[];
    private stream: any;
    constructor(path: string, header: string[]) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err: Error) => {
            if (err) {
                throw err;
            }
            this.header = header;
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
    public add(data: any) {
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
    public close() {
        this.stream.close();
    }
}

export function txtPipe(path: string, header: string[]): IPipe {
    return new TxtTable(path, header);
}
export function jsonPipe(path: string, space?: number): IPipe {
    return new JsonTable(path, space);
}
export function csvPipe(path: string, header: string[]): IPipe {
    return new CsvPipe(path, header);
}
