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
        this.crawlQueue = new LinkedQueue();
        this.downloadQueue = new LinkedQueue();
    }
    addTask(newTask) {
        this.urlPool.add(newTask.url);
        this.crawlQueue.add(newTask);
    }
    addDownload(newTask) {
        this.urlPool.add(newTask.url);
        this.downloadQueue.add(newTask);
    }
    jumpTask(newTask) {
        this.urlPool.add(newTask.url);
        this.crawlQueue.jump(newTask);
    }
    jumpDownload(newTask) {
        this.urlPool.add(newTask.url);
        this.downloadQueue.jump(newTask);
    }
    check(url) {
        return this.urlPool.has(url);
    }
    getWaitingTaskNum() {
        return this.crawlQueue.getLength();
    }
    getWaitingDownloadTaskNum() {
        return this.downloadQueue.getLength();
    }
    getTotalUrlsNum() {
        return this.urlPool.size;
    }
    nextCrawlTask() {
        const result = this.crawlQueue.next();
        if (!result) {
            return null;
        }
        return result;
    }
    nextDownloadTask() {
        const result = this.downloadQueue.next();
        if (!result) {
            return null;
        }
        return result;
    }
}
exports.default = Queue;
