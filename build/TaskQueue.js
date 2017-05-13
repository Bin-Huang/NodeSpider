"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 可遍历的链表类
 */
class LinkedQueue {
    constructor() {
        this._HEAD = null;
        this._END = this._HEAD;
        this._LENGTH = 0;
    }
    /**
     * 将新的值作为尾结点添加到链表
     * @param {*} value
     * @memberOf LinkedQueue
     */
    add(value) {
        const newLinkNode = {
            value,
            next: null,
        };
        this._LENGTH++;
        if (this._HEAD) {
            this._END.next = newLinkNode;
            this._END = newLinkNode;
        }
        else {
            this._HEAD = this._END = newLinkNode;
        }
    }
    /**
     * 返回当前头节点的值，并抛弃头节点
     * @returns
     * @returns {*} value
     * @memberOf LinkedQueue
     */
    next() {
        const current = this._HEAD;
        if (!current) {
            return null;
        }
        else {
            this._HEAD = this._HEAD.next; // 丢弃头链环，回收已遍历链节的内存
            // 当链表中无元素时，保证 _END 为 null
            if (!this._HEAD) {
                this._END = null;
            }
            this._LENGTH--;
            return current.value;
        }
    }
    /**
     * 将新的值作为头节点添加到链表（插队）
     * @param {any} value
     * @memberOf LinkedQueue
     */
    jump(value) {
        const newLinkNode = {
            value,
            next: null,
        };
        this._LENGTH++;
        if (this._HEAD) {
            newLinkNode.next = this._HEAD;
            this._HEAD = newLinkNode;
        }
        else {
            this._HEAD = this._END = newLinkNode;
        }
    }
    /**
     * 返回链表的长度
     * @returns
     * @memberOf LinkedQueue
     */
    getLength() {
        return this._LENGTH;
    }
    /**
     * 判断队列是否为空
     * @returns {boolean} 当没有节点时，返回 true
     * @memberOf LinkedQueue
     */
    isEmpty() {
        if (this._HEAD) {
            return false;
        }
        else {
            return true;
        }
    }
}
// tslint:disable-next-line:max-classes-per-file
class TaskQueue {
    /**
     * 为任务排队设计的队列
     * @param {string} key 元素的标识符，用来判断元素是否已经存在
     */
    constructor(key) {
        this._SET = new Set();
        this._QUEUE = new LinkedQueue();
        this.key = key;
    }
    /**
     * 向队列添加新元素，并记录标识符。
     * @param item {*} 待添加的元素。必须包含队列需要的标识符成员，否则报错
     */
    add(item) {
        const id = item[this.key];
        if (typeof id === "undefined") {
            throw new Error("class TaskQueue method add: item have not key");
        }
        this._QUEUE.add(item);
        this._SET.add(id);
    }
    /**
     * 向队列添加新元素并插队，以及记录标识符
     * @param item {*} 待添加的元素。必须包含标识符成员，否则报错
     */
    jump(item) {
        const id = item[this.key];
        if (typeof id === "undefined") {
            throw new Error("class TaskQueue method jump: item have not key");
        }
        this._QUEUE.jump(item);
        this._SET.add(id);
    }
    /**
     * 查询队列是否已添加过标识符为输入参数的元素（即使元素已被提取）
     * @param id {string} 需要查询的标识符
     * @return {boolean}
     */
    check(id) {
        return this._SET.has(id);
    }
    /**
     * 从清单中单向读取一个元素. 每次调用都会按顺序返回不同的项目
     * @returns {T} 当前的项目
     */
    next() {
        return (this._QUEUE.next());
    }
    /**
     * 返回清单中未读取元素的数量
     * @returns {number}
     */
    getLength() {
        return this._QUEUE.getLength();
    }
    /**
     * 返回清单中所有添加过的元素数量（包括已读取和未读取）
     * @returns {number}
     */
    getSize() {
        return this._SET.size;
    }
    /**
     * 判断是否已读取清单中所有任务,如果没有未读取任务，返回true
     * @returns {boolean}
     * @memberOf taskQueue
     */
    isDone() {
        return this._QUEUE.isEmpty();
    }
}
exports.default = TaskQueue;
