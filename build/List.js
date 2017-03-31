"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LinkedQueue_1 = require("./LinkedQueue");
class List {
    constructor() {
        this._SET = new Set();
        this._QUEUE = new LinkedQueue_1.default();
    }
    /**
     * 添加新的项目到清单末尾（不管唯一标识码是否重复，建议添加前先 check）
     * @param {string} id 新项目的唯一标识符
     * @param {*} item 新项目的值
     * @memberOf List
     */
    add(id, item) {
        this._QUEUE.add(item);
        this._SET.add(id);
    }
    /**
     * 添加新的项目到清单开头（不管唯一标识码是否重复，建议添加前先 check）
     * @param {string} id 新的项目的唯一标识码
     * @param {*} item 新项目的值
     */
    jump(id, item) {
        this._QUEUE.jump(item);
        this._SET.add(id);
    }
    /**
     * 根据 id 查询清单是否已存在项目(无论项目是否已被提取)
     * @param {string} id 项目的唯一标识符
     * @returns {boolean}
     * @memberOf List
     */
    check(id) {
        return this._SET.has(id);
    }
    /**
     * 从清单中读取一个项目. 每次调用都会按顺序返回不同的项目
     * @returns {T} 当前的项目
     * @memberOf List
     */
    next() {
        return (this._QUEUE.next());
    }
    /**
     * 返回清单中未读取项目的数量
     * @returns {number}
     */
    getLength() {
        return this._QUEUE.getLength();
    }
    /**
     * 返回清单中所有项目的数量（包括已读取和未读取）
     * @returns {number}
     */
    getSize() {
        return this._SET.size;
    }
    /**
     * 判断是否已完成清单中所有任务
     * @returns {boolean} 当没有更多任务时，返回 true
     * @memberOf List
     */
    done() {
        return this._QUEUE.empty();
    }
}
exports.default = List;
