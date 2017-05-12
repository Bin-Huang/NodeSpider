export declare class TxtTable {
    /**
     * Creates an instance of TxtTable.
     * @param {string} path 写入文件路径
     * @memberOf TxtTable
     */
    header: string[];
    private stream;
    constructor(path: any);
    /**
     * 根据表头写入新数据
     * @param {Object} data
     */
    add(data: any): void;
    close(): void;
}
export declare class JsonTable {
    header: string[];
    private stream;
    private space;
    constructor(path: string, space?: number);
    add(data: any): void;
    close(): void;
}
