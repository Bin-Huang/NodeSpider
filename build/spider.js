"use strict";
// TODO: request 传入 opts，以及更多的 option，类似 proxy
// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// 简单上手的回掉函数 + 自由定制的事件驱动
// mysql 插件
// redis queue
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const fs = require("fs");
const request = require("request");
const decode_1 = require("./decode");
const loadJQ_1 = require("./loadJQ");
const plan_1 = require("./plan");
const Table_1 = require("./Table");
const TaskQueue_1 = require("./TaskQueue");
const defaultOption = {
    crawlQueue: new TaskQueue_1.default("url"),
    defaultDownloadPath: "",
    defaultRetry: 3,
    downloadQueue: new TaskQueue_1.default("url"),
    multiDownload: 2,
    multiTasking: 20,
    preprocessing: [decode_1.default, loadJQ_1.default],
};
/**
 * class of NodeSpider
 * @class NodeSpider
 */
class NodeSpider extends events_1.EventEmitter {
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts = {}) {
        super();
        this._STATE = {
            crawlQueue: this._STATE.option.crawlQueue,
            currentMultiDownload: 0,
            currentMultiTask: 0,
            downloadQueue: this._STATE.option.downloadQueue,
            option: Object.assign({}, defaultOption, opts),
            tables: new Map(),
            working: true,
        };
        // 每开始一个任务，状态中对应当前异步任务数的记录值加1
        this.on("start_a_task", (type) => {
            if (type === "crawl") {
                this._STATE.currentMultiTask++;
            }
            else if (type === "download") {
                this._STATE.currentMultiDownload--;
            }
        });
        // 每完成一个任务，状态中对应当前异步任务数的记录值减1
        this.on("done_a_task", (type) => {
            if (type === "crawl") {
                this._STATE.currentMultiTask--;
            }
            else if (type === "download") {
                this._STATE.currentMultiDownload--;
            }
        });
        // 完成一个任务后，判断是否存在未进行任务、进行中未完成任务，如果都不存在则触发“end”事件，否则“火力全开”
        this.on("done_a_task", (type) => {
            const crawlTaskAllDone = (this._STATE.crawlQueue.getLength() === 0);
            const downloadTaskAllDone = (this._STATE.downloadQueue.getLength() === 0);
            const multiTaskingIsEmtpy = (this._STATE.currentMultiTask === 0);
            const multiDownloadIsEmtpy = (this._STATE.currentMultiDownload === 0);
            if (crawlTaskAllDone && downloadTaskAllDone && multiDownloadIsEmtpy && multiTaskingIsEmtpy) {
                this.emit("end");
            }
            else {
                this._fire();
            }
        });
        // 在爬虫的生命周期末尾，需要进行一些收尾工作，比如关闭table
        // TODO: 目前仅限 txttable 和 jsontable，更多插件形式的要怎么接入
        this.on("end", () => {
            const values = this._STATE.tables.values();
            for (const item of values) {
                item.close();
            }
        });
    }
    /**
     * Add new crawling-task to spider's todo-list (regardless of whether the link has been added)
     * @param {ITask} task
     * @returns {number} the number of urls has been added.
     */
    addTask(task) {
        // TODO:  addTask 会习惯在 task 中直接声明 callback匿名函数，这种大量重复的匿名函数会消耗内存。
        if (typeof task.strategy !== "function") {
            return console.log("need function");
        }
        let urls;
        if (Array.isArray(task.url)) {
            urls = task.url;
        }
        else {
            urls = [task.url];
        }
        urls.map((u) => {
            if (typeof u !== "string") {
                return console.log("must be string");
            }
            const newTask = Object.assign({}, task, { url: u });
            newTask.url = u;
            this._STATE.crawlQueue.add(newTask);
        });
        this._STATE.working = true;
        this._fire();
        return this._STATE.crawlQueue.getSize();
    }
    /**
     * add new download-task to spider's download-list.
     * @param task
     */
    addDownload(task) {
        let urls;
        if (Array.isArray(task.url)) {
            urls = task.url;
        }
        else {
            urls = [task.url];
        }
        urls.map((u) => {
            if (typeof u !== "string") {
                return console.log("must need string");
            }
            const newTask = Object.assign({}, task, { url: u });
            this._STATE.downloadQueue.add(newTask);
        });
        return this._STATE.downloadQueue.getSize();
    }
    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    isExist(url) {
        if (typeof url !== "string") {
            throw new Error("method check need a string-typed param");
        }
        const isExistCrawlQueue = this._STATE.crawlQueue.check(url);
        const isExistDownloadQueue = this._STATE.downloadQueue.check(url);
        return isExistCrawlQueue || isExistDownloadQueue;
    }
    /**
     * 过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组
     * @param urlArray {array}
     * @returns {array}
     */
    filter(urlArray) {
        if (!Array.isArray(urlArray)) {
            throw new Error("method filter need a array-typed param");
        }
        else {
            const s = new Set(urlArray);
            const result = [];
            for (const url of s) {
                if (!this.isExist) {
                    result.push(url);
                }
            }
            return result;
        }
    }
    /**
     * Retry the task within the maximum number of retries
     * @param {ITask} task The task which want to retry
     * @param {number} maxRetry Maximum number of retries for this task
     * @param {function} finalErrorCallback The function called when the maximum number of retries is reached
     */
    retry(task, maxRetry = this._STATE.option.defaultRetry, finalErrorCallback = (task) => this.save("log.json", task)) {
        if (task._INFO === undefined) {
            task._INFO = {
                retried: 0,
                maxRetry,
                finalErrorCallback,
            };
        }
        if (task._INFO.maxRetry > task._INFO.retried) {
            task._INFO.retried += 1;
            if (task.path) {
                // 清理
                this._STATE.downloadQueue.jump(task);
            }
            else {
                // 清理
                task.body = null;
                task.response = null;
                task.error = null;
                this._STATE.crawlQueue.jump(task);
            }
        }
        else {
            task._INFO.finalErrorCallback(task);
        }
    }
    plan(item) {
        if (typeof item === "function") {
            const newPlan = new plan_1.Plan(item, null, null, null);
            const id = this._STATE.planStore.push(newPlan);
            return id - 1;
        }
        if (typeof item === "object") {
            if (!item.rule) {
                throw new Error("参数缺少rule成员");
            }
            const rule = item.rule;
            const request = item.request || null;
            const use = item.use || null;
            const info = item.info || null;
            const newPlan = new plan_1.Plan(rule, request, use, info);
            const id = this._STATE.planStore.push(newPlan);
            return id - 1;
        }
        throw new Error("参数错误");
    }
}
NodeSpider.decode = decode_1.default;
NodeSpider.loadJQ = loadJQ_1.default;
exports.default = NodeSpider;
{
}
save(item, data);
{
    // TODO: 如果item为对象，则为数据库。通过用户在 item 中自定义的标识符来判断是否已存在
    // 暂时只完成保存到文本的功能，所以默认 item 为文件路径字符串
    if (typeof item === "string") {
        if (!this._STATE.tables[item]) {
            // 如果不存在，则新建一个table实例
            // 根据路径中的文件后缀名，决定新建哪种table
            if (/.txt$/.test(item)) {
                this._STATE.tables[item] = new Table_1.TxtTable(item);
            }
            else {
                this._STATE.tables[item] = new Table_1.JsonTable(item);
            }
        }
        item = this._STATE.tables[item];
    }
    if (item.header === null) {
        return item.add(data);
    }
    else {
        const thisHeader = Object.keys(data);
        // 保证 data 与 table 的header 完全一致，不能多也不能少
        // 如果不匹配，则报错
        item.header.map((u) => {
            if (thisHeader.indexOf(u) === -1) {
                return new Error("header do not match");
            }
        });
        thisHeader.map((u) => {
            if (item.header.indexOf(u) === -1) {
                return new Error("header do not match");
            }
        });
        // 一切正常，则传给 item
        return item.add(data);
    }
}
_fire();
{
    while (this._STATE.currentMultiDownload < this._STATE.option.multiDownload) {
        if (this._STATE.downloadQueue.isDone()) {
            break;
        }
        else {
            const task = this._STATE.downloadQueue.next();
            this.emit("start_a_task", "download");
            asyncDownload(task)
                .then(() => {
                this.emit("done_a_task", "download");
            })
                .catch((error) => {
                console.log(error);
                this.emit("done_a_task", "download");
                // TODO: 错误处理
            });
        }
    }
    while (this._STATE.currentMultiTask < this._STATE.option.multiTasking) {
        if (this._STATE.crawlQueue.isDone()) {
            break;
        }
        else {
            const task = this._STATE.crawlQueue.next();
            this.emit("start_a_task", "crawl");
            asyncCrawling(task)
                .then(() => {
                this.emit("done_a_task", "crawl");
            })
                .catch((error) => {
                console.log(error);
                this.emit("done_a_task", "crawl");
                // TODO: 错误处理
            });
        }
    }
}
/**
 * request promise. resolve({error, response})
 * @param opts {url, method, encoding}
 */
function asyncRequest(opts) {
    return new Promise((resolve, reject) => {
        request(opts, (error, response) => {
            resolve({ error, response });
        });
    });
}
function asyncCrawling(task) {
    return __awaiter(this, void 0, void 0, function* () {
        // first, request
        let { error, response } = yield this._asyncRequest({
            encoding: null,
            method: "GET",
            url: task.url,
        });
        // 为什么 currentTask.response.body 已经存在, 还要一个 currentTask.body?
        // currentTask.response.body 为请求返回的原始body（二进制），供开发者查询
        // currentTask.body 则是正文字符串，供开发者使用
        let currentTask = Object.assign({ $: null, body: response.body.toString(), error,
            response }, task);
        // then, clear
        error = null;
        response = null;
        // operate preprocessing
        if (!currentTask.error) {
            try {
                for (const pre of this._STATE.option.preprocessing) {
                    currentTask = yield pre(this, currentTask);
                }
            }
            catch (err) {
                currentTask.error = err;
            }
        }
        // operate strategy, then clear
        // TODO: if there are a bug, is it can be throwed?
        yield currentTask.strategy(currentTask.error, currentTask, currentTask.$);
        currentTask = null;
    });
}
function asyncDownload(task) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const nameIndex = task.url.lastIndexOf("/");
            const fileName = task.url.slice(nameIndex);
            if (!task.path) {
                task.path = this._STATE.option.defaultDownloadPath;
            }
            let savePath;
            if (task.path[task.path.length - 1] === "/") {
                savePath = task.path.slice(0, task.path.length - 1) + fileName;
            }
            else {
                savePath = task.path + fileName;
            }
            const download = request(task.url);
            const write = fs.createWriteStream(savePath);
            download.on("error", (error) => {
                reject(error);
            });
            write.on("error", (error) => {
                reject(error);
            });
            download.pipe(write);
            write.on("finish", () => {
                resolve();
            });
        });
    });
}
