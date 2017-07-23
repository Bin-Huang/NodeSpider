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
            if (!this._END) {
                throw new Error("致命错误");
            }
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
            this._HEAD = current.next; // 丢弃头链环，回收已遍历链节的内存
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
/**
 * 为NodeSpider量身定做的taskqueue
 */
// tslint:disable-next-line:max-classes-per-file
class Queue {
    constructor() {
        this.urlPool = new Set();
        this.typeQueue = new Map();
    }
    /**
     * 添加新的任务到指定type队列末尾。如果type队列不存在则新建
     * @param newTask
     * @param type
     */
    addTask(newTask, type) {
        if (!this.typeQueue.has(type)) {
            this.typeQueue.set(type, new LinkedQueue()); // 当type对应的任务队列不存在，则新建
        }
        this.urlPool.add(newTask.url);
        this.typeQueue.get(type).add(newTask);
    }
    /**
     * 将新的任务插队到指定type队列头部。如果type队列不存在则新建
     * @param newTask
     * @param type
     */
    jumpTask(newTask, type) {
        if (!this.typeQueue.has(type)) {
            this.typeQueue.set(type, new LinkedQueue()); // 当type对应的任务队列不存在，则新建
        }
        this.urlPool.add(newTask.url);
        this.typeQueue.get(type).jump(newTask);
    }
    /**
     * 检测一个url是否添加过，是则返回true
     * @param url
     */
    check(url) {
        return this.urlPool.has(url);
    }
    /**
     * 获得指定type队列的排队任务数量
     * @param type
     */
    getWaitingTaskNum(type) {
        if (!this.typeQueue.has(type)) {
            throw new Error("the type is not existed in the queue");
        }
        const num = this.typeQueue.get(type).getLength();
        return num;
    }
    /**
     * 获得所有添加到排队的url数（不包含重复添加）
     */
    getTotalUrlsNum() {
        return this.urlPool.size;
    }
    /**
     * 返回下一个任务。如果type对应的排队不存在，或该排队没有新任务，都会返回 null
     * @param type 任务类型type
     */
    nextTask(type) {
        if (!this.typeQueue.has(type)) {
            return null;
        }
        const result = this.typeQueue.get(type).next();
        if (!result) {
            return null;
        }
        return result;
    }
}
exports.default = Queue;
