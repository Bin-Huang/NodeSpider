"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
class Table {
    /**
     * Creates an instance of Table.
     * @param {Array} header the header of Table
     *
     * @memberOf Table
     */
    constructor(header) {
        if (!Array.isArray(header)) {
            throw new Error('To create a Table must need an array-typed parameter');
        }
        this.header = header;
    }
}
class TxtTable extends Table {
    /**
     * Creates an instance of TxtTable.
     * @param {string} path 写入文件路径
     * @param {array} header 表头
     *
     * @memberOf TxtTable
     */
    constructor(path, header) {
        if (typeof path !== 'string' || !Array.isArray(header))
            throw new Error('the string-typed parameter "path" and array-typed "header" is required');
        super(header);
        fs.ensureFileSync(path, (err) => {
            if (err)
                throw err;
        });
        this.stream = fs.createWriteStream(path);
        let header_string = header.join('\t');
        header_string += '\n';
        this.stream.write(header_string);
    }
    /**
     * 根据表头写入新数据
     *
     * @param {Object} data
     *
     * @memberOf TxtTable
     */
    add(data) {
        let chunk = '';
        for (let item of this.header) {
            chunk += data[item] + '\t';
        }
        chunk += '\n';
        this.stream.write(chunk);
    }
}
class JsonTable extends Table {
    /**
     * Creates an instance of TxtTable.
     * @param {string} path 写入文件路径
     * @param {array} header 表头
     *
     * @memberOf TxtTable
     */
    constructor(path, header) {
        if (typeof path !== 'string' || !Array.isArray(header)) {
            throw new Error('the string-typed parameter "path" and array-typed "header" is required');
        }
        super(header);
        fs.ensureFileSync(path, (err) => {
            if (err)
                throw err;
        });
        this.path = path;
    }
    /**
     * 根据表头写入新数据
     *
     * @param {Object} data
     *
     * @memberOf TxtTable
     */
    add(data) {
        fs.writeJsonSync(this.path, data, { flag: 'a' });
    }
}
exports = { TxtTable, JsonTable };
