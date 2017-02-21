
/**
 * 链环（链节）类
 */
class Link {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}
/**
 * 可遍历的链表类（我叫它纸巾类）
 */
class Chain {
    constructor() {
        this.head = null;
        this.end = this.head;
        this._length = 0;
    }
    // 在尾部增加新的链环
    add(value) {
        let new_link = new Link(value);
        this._length++;
        if (this.head) {
            this.end.next = new_link;
            this.end = new_link;
        } else {
            this.head = this.end = new_link;
        }
    }
    // 返回头链环的值，并抛弃头链环（让第二个链环成为头链环）（你可以理解为抽面巾纸）
    next() {
        let current = this.head;
        if (!current) return null;else {
            this.head = this.head.next; //丢弃头链环，回收已遍历链节的内存
            this._length--;
            return current.value;
        }
    }
}
/**
 * 清单类 for todo_list、download_list
 */
class List {
    constructor() {
        this.store = new Set();
        this.data = new Chain(); //待完成的爬取任务的队列
    }
    // 添加新的爬取任务。如果链接是添加过的，自动取消
    add({ url, opts, callback, info }) {
        if (this.store.has(url)) return false; //如果已经存在，返回 false
        this.store.add(url);
        this.data.add({ url, opts, callback, info });
        return true;
    }
    // 获得新的爬取任务
    get() {
        return this.data.next();
    }
}

module.exports = List;