import LinkedQueue from "./LinkedQueue";
export default class List<T> {
    protected _SET: Set<any>;
    protected _QUEUE: LinkedQueue;
    constructor();
    /**
     * 添加新的项目到清单末尾（不管唯一标识码是否重复，建议添加前先 check）
     * @param {string} id 新项目的唯一标识符
     * @param {*} item 新项目的值
     * @memberOf List
     */
    add(id: string, item: T): void;
    /**
     * 添加新的项目到清单开头（不管唯一标识码是否重复，建议添加前先 check）
     * @param {string} id 新的项目的唯一标识码
     * @param {*} item 新项目的值
     */
    jump(id: string, item: T): void;
    /**
     * 根据 id 查询清单是否已存在项目(无论项目是否已被提取)
     * @param {string} id 项目的唯一标识符
     * @returns {boolean}
     * @memberOf List
     */
    check(id: string): boolean;
    /**
     * 从清单中读取一个项目. 每次调用都会按顺序返回不同的项目
     * @returns {*} 当前的项目
     * @memberOf List
     */
    next(): T;
    /**
     * 返回清单中未读取项目的数量
     * @returns {number}
     */
    getLength(): number;
    /**
     * 返回清单中所有项目的数量（包括已读取和未读取）
     * @returns {number}
     */
    getSize(): number;
}
