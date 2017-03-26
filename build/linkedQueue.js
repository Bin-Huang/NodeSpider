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
        let newLinkNode = {
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
        let current = this._HEAD;
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
        let newLinkNode = {
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
}
exports.default = LinkedQueue;
;
