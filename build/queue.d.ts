export interface ILinkNode<T> {
    value: T;
    next: ILinkNode<T> | null;
}
/**
 * 可遍历的链表类
 */
export default class LinkedQueue<T> {
    protected _HEAD: ILinkNode<T> | null;
    protected _END: ILinkNode<T> | null;
    protected _LENGTH: number;
    constructor();
    /**
     * 将新的值作为尾结点添加到链表
     * @param {*} value
     * @memberOf LinkedQueue
     */
    add(value: T): void;
    /**
     * 返回当前头节点的值，并抛弃头节点
     * @returns
     * @returns {*} value
     * @memberOf LinkedQueue
     */
    next(): T | null;
    /**
     * 将新的值作为头节点添加到链表（插队）
     * @param {any} value
     * @memberOf LinkedQueue
     */
    jump(value: T): void;
    /**
     * 返回链表的长度
     * @returns
     * @memberOf LinkedQueue
     */
    getLength(): number;
}
