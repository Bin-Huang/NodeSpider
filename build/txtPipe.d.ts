export declare class TxtPipe {
    /**
     * Creates an instance of TxtTable.
     * @param {string} path 写入文件路径
     * @memberOf TxtTable
     */
    header: string[];
    private stream;
    constructor(path: any, header: string[]);
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    add(data: any): void;
    close(): void;
}
