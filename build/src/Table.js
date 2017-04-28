import * as fs from "fs-extra";
export class TxtTable {
    constructor(path) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        fs.ensureFileSync(path, (err) => {
            if (err) {
                throw err;
            }
        });
        this.header = null;
        this.hasHeader = false;
        this.stream = fs.createWriteStream(path);
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    add(data) {
        // TODO: 参数检测
        if (!this.hasHeader && this.header) {
            this.hasHeader = true;
            this.header = Object.keys(data);
            let headerString = this.header.join("\t");
            headerString += "\n";
            this.stream.write(headerString);
        }
        let chunk = "";
        for (let item of this.header) {
            chunk += data[item] + "\t";
        }
        chunk += "\n";
        this.stream.write(chunk);
    }
}
// tslint:disable-next-line:max-classes-per-file
export class JsonTable {
    constructor(path) {
        if (typeof path !== "string") {
            throw new Error('the string-typed parameter "path" is required');
        }
        // tslint:disable-next-line:curly
        fs.ensureFileSync(path, (err) => {
            if (err)
                throw err;
        });
        this.path = path;
        this.header = null;
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     * @memberOf TxtTable
     */
    add(data) {
        if (this.header === null) {
            this.header = Object.keys(data);
        }
        fs.writeJsonSync(this.path, data, { flag: "a" });
    }
}
