import { IQueue, ITask } from "./types";

interface ILinkNode {
    value: any;
    next: ILinkNode;
}

/**
 * 可遍历的链表类
 */
class LinkedQueue {
    protected _HEAD: ILinkNode;
    protected _END: ILinkNode;
    protected _LENGTH: number;

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
    public add(value: any) {
        const newLinkNode: ILinkNode = {
            value,
            next: null,
        };
        this._LENGTH++;
        if (this._HEAD) {
            this._END.next = newLinkNode;
            this._END = newLinkNode;
        } else {
            this._HEAD = this._END = newLinkNode;
        }
    }

    /**
     * 返回当前头节点的值，并抛弃头节点
     * @returns
     * @returns {*} value
     * @memberOf LinkedQueue
     */
    public next() {
        const current = this._HEAD;
        if (!current) {
            return null;
        } else {
            this._HEAD = this._HEAD.next; // 丢弃头链环，回收已遍历链节的内存

            // 当链表中无元素时，保证 _END 为 null
            if (! this._HEAD) {
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
    public jump(value) {
        const newLinkNode: ILinkNode = {
            value,
            next: null,
        };
        this._LENGTH++;

        if (this._HEAD) {
            newLinkNode.next = this._HEAD;
            this._HEAD = newLinkNode;
        } else {
            this._HEAD = this._END = newLinkNode;
        }
    }

    /**
     * 返回链表的长度
     * @returns
     * @memberOf LinkedQueue
     */
    public getLength() {
        return this._LENGTH;
    }

    /**
     * 判断队列是否为空
     * @returns {boolean} 当没有节点时，返回 true
     * @memberOf LinkedQueue
     */
    public isEmpty() {
        if (this._HEAD) {
            return false;
        } else {
            return true;
        }
    }
}

/**
 * 为NodeSpider量身定做的taskqueue
 */
// tslint:disable-next-line:max-classes-per-file
export default class Queue implements IQueue {
    protected urlPool: Set<string>;
    protected crawlQueue: LinkedQueue;
    protected downloadQueue: LinkedQueue;
    constructor() {
        this.urlPool = new Set();
        this.crawlQueue = new LinkedQueue();
        this.downloadQueue = new LinkedQueue();
    }
    public addCrawl(newTask: ITask) {
        this.urlPool.add(newTask.url);
        this.crawlQueue.add(newTask);
    }
    public addDownload(newTask: ITask) {
        this.urlPool.add(newTask.url);
        this.downloadQueue.add(newTask);
    }
    public jumpCrawl(newTask: ITask) {
        this.urlPool.add(newTask.url);
        this.crawlQueue.jump(newTask);
    }
    public jumpDownload(newTask: ITask) {
        this.urlPool.add(newTask.url);
        this.downloadQueue.jump(newTask);
    }
    public check(url: string) {
        return this.urlPool.has(url);
    }
    public crawlWaitingNum() {
        return this.crawlQueue.getLength();
    }
    public downloadWaitingNum() {
        return this.downloadQueue.getLength();
    }
    public totalWaitingNum() {
        return this.crawlQueue.getLength() + this.downloadQueue.getLength();
    }
    public allUrlNum() {
        return this.urlPool.size;
    }
    public isCrawlCompleted() {
        return this.crawlQueue.isEmpty();
    }
    public isDownloadCompleted() {
        return this.downloadQueue.isEmpty();
    }
    public isAllCompleted() {
        return this.crawlQueue.isEmpty() && this.downloadQueue.isEmpty();
    }
    public getCrawlTask() {
        const result = this.crawlQueue.next();
        if (! result) {
            return null;
        }
        return result;
    }
    public getDownloadTask() {
        const result = this.downloadQueue.next();
        if (! result) {
            return null;
        }
        return result;
    }
}
