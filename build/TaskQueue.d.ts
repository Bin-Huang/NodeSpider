export default class TaskQueue<T> {
    protected _SET: Set<any>;
    protected key: string;
    private _QUEUE;
    /**
     * 为任务排队设计的队列
     * @param {string} key 元素的标识符，用来判断元素是否已经存在
     */
    constructor(key: string);
    /**
     * 向队列添加新元素，并记录标识符。
     * @param item {*} 待添加的元素。必须包含队列需要的标识符成员，否则报错
     */
    add(item: T): void;
    /**
     * 向队列添加新元素并插队，以及记录标识符
     * @param item {*} 待添加的元素。必须包含标识符成员，否则报错
     */
    jump(item: T): void;
    /**
     * 查询队列是否已添加过标识符为输入参数的元素（即使元素已被提取）
     * @param id {string} 需要查询的标识符
     * @return {boolean}
     */
    check(id: string): boolean;
    /**
     * 从清单中单向读取一个元素. 每次调用都会按顺序返回不同的项目
     * @returns {T} 当前的项目
     */
    next(): T;
    /**
     * 返回清单中未读取元素的数量
     * @returns {number}
     */
    getLength(): number;
    /**
     * 返回清单中所有添加过的元素数量（包括已读取和未读取）
     * @returns {number}
     */
    getSize(): number;
    /**
     * 判断是否已读取清单中所有任务,如果没有未读取任务，返回true
     * @returns {boolean}
     * @memberOf taskQueue
     */
    isDone(): boolean;
}
