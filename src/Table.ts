import * as fs from "fs-extra";

export class TxtTable {
    /**
     * Creates an instance of TxtTable.
     * @param {string} path 写入文件路径
     * @memberOf TxtTable
     */
    public header: string[];
    private stream: any;
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
        this.stream = fs.createWriteStream(path);
    }
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    public add(data) {
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
    public close() {
        this.stream.close();
    }
}

// tslint:disable-next-line:max-classes-per-file
export class JsonTable {
    public header: string[];
    private stream;
    private space: string;

    constructor(path: string, space: number = 4) {
        this.header = null;
        this.stream = fs.createWriteStream(path);
        this.space = "";
        while (space > 0) {
            space --;
            this.space += " ";
        }
        this.stream.write("[");
    }
    public add(data) {
        let newStr = JSON.stringify(data);
        // 如果没有表头，说明是第一次写入，将获得表头并初始化写入一些内容
        if (this.header === null) {
            this.header = Object.keys(data); // 获得表头
            newStr = "\n" + newStr;
        } else {
            newStr = ",\n" + newStr;
        }
        newStr = newStr.replace("\n", "\n" + this.space);

        this.stream.write(newStr);
    }

    // TODO: 调用 close 将关闭写入流，如果流中还有未写完的内容，将导致内容遗失。
    // 解决思路：监听流的事件（如 drain）并记录为类的成员，close 中判断信号成员来决定何时关闭流
    public close() {
        this.stream.write("\n]");
        this.stream.close();
    }
}
