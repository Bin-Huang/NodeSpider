"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// TODO: request 传入 opts，以及更多的 option，类似 proxy
// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// TODO: 解决 save 方法保存json格式不好用的问题： 没有[],直接也没有逗号隔开
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 当一个页面 url 指向已存在资源路径，但是添加了不同的查询语句，将跳过去重
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// TODO: 使用 jsdom 是否可以模拟 js 点击与浏览器环境
const charset = require("charset");
const cheerio = require("cheerio");
const events_1 = require("events");
const fs = require("fs");
const iconv = require("iconv-lite");
const request = require("request");
const url = require("url");
const List_1 = require("./List");
const Table_1 = require("./Table");
// 简单上手的回掉函数 + 自由定制的事件驱动
const defaultOption = {
    defaultDownloadPath: "",
    defaultRetry: 3,
    jq: true,
    multiDownload: 2,
    multiTasking: 20,
    preToUtf8: true,
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
        Object.assign(defaultOption, opts);
        this._OPTION = defaultOption;
        this._STATUS = {
            _currentMultiDownload: 0,
            _currentMultiTask: 0,
            _working: false,
        };
        this._TODOLIST = new List_1.default();
        this._DOWNLOAD_LIST = new List_1.default();
        this._TABLE = {};
        this.on("start_a_task", () => this._STATUS._currentMultiTask++);
        this.on("done_a_task", () => {
            this._STATUS._currentMultiTask--;
            this._fire();
        });
        this.on("start_a_download", () => this._STATUS._currentMultiDownload++);
        this.on("done_a_download", () => {
            this._STATUS._currentMultiDownload--;
            this._fire();
        });
    }
    /**
     * 向爬虫的 todo-list 添加新的任务(不检查是否重复链接)
     * 只添加任务需要的成员所组成的任务到list，并不是直接将参数传入list
     * @param {ITask} task
     * @memberOf NodeSpider
     */
    addTask(task) {
        let newTask = {
            callback: task.callback,
            info: {
                finalErrorCallback: null,
                maxRetry: null,
                retried: 0,
            },
            url: task.url,
        };
        if (typeof task.jq !== "undefined") {
            newTask.jq = task.jq;
        }
        if (typeof task.preToUtf8 !== "undefined") {
            newTask.preToUtf8 = task.preToUtf8;
        }
        this._TODOLIST.add(newTask.url, newTask);
    }
    download(task) {
        let newTask = {
            info: {
                finalErrorCallback: null,
                maxRetry: null,
                retried: 0,
            },
            path: task.path,
            url: task.url,
        };
        this._DOWNLOAD_LIST.add(newTask.url, newTask);
    }
    /**
     * 检测链接是否已添加过
     * @param {stirng} url 待检查的链接
     * @returns {boolean}
     * @memberOf NodeSpider
     */
    check(url) {
        const inTodoList = this._TODOLIST.check(url);
        const inDownloadList = this._DOWNLOAD_LIST.check(url);
        return inTodoList || inDownloadList;
    }
    /**
     * launch the spider with url(s) and callback
     * @param {string|array} url the first url to crawle
     * @param callback
     */
    start(url, callback) {
        if (!url || !callback) {
            throw new Error("params url and callback is required in method start");
        }
        if (!Array.isArray(url)) {
            url = [url];
        }
        url.map((u) => {
            if (typeof u !== "string") {
                throw new Error("param url mush be a string or array of string");
            }
            if (!this.check(u)) {
                this.addTask({
                    url: u,
                    callback,
                });
            }
        });
        this._STATUS._working = true;
        this._fire();
    }
    /**
     * retry the task
     * @param task the task which want to retry
     * @param maxRetry max retry count of this task. default: this._OPTION.defaultRetry
     * @param finalErrorCallback callback calling when retry count eval to max retry count. default: save log
     */
    retry(task, maxRetry = this._OPTION.defaultRetry, finalErrorCallback = (task) => this.save("log.json", task)) {
        if (task.info.maxRetry === null) {
            task.info.maxRetry = maxRetry;
            task.info.finalErrorCallback = finalErrorCallback;
        }
        if (task.info.maxRetry > task.info.retried) {
            task.info.retried += 1;
            // 将 error 和 response 信息删除，节省排队时的内存占用
            task.response = null;
            task.error = null;
            if (task.path) {
                this._DOWNLOAD_LIST.jump(task.url, task);
            }
            else {
                this._TODOLIST.jump(task.url, task);
            }
        }
        else {
            task.info.finalErrorCallback(task);
        }
    }
    decode(st, encoding) {
        return iconv.decode(st, encoding);
    }
    save(item, data) {
        // TODO: 如果item为对象，则为数据库。通过用户在 item 中自定义的标识符来判断是否已存在
        // 暂时只完成保存到文本的功能，所以默认 item 为文件路径字符串
        if (this._TABLE[item]) {
            this._TABLE[item].add(data);
            return true;
        }
        // 如果不存在，则新建一个table实例
        let header = Object.keys(data);
        // 根据路径中的文件后缀名，决定新建哪种table
        if (/.txt$/.test(item)) {
            this._TABLE[item] = new Table_1.TxtTable(item, header);
            this._TABLE[item].add(data);
        }
        else {
            this._TABLE[item] = new Table_1.JsonTable(item, header);
            this._TABLE[item].add(data);
        }
    }
    /**
     * 火力全开，尝试不断启动新任务，让当前任务数达到最大限制数
     */
    _fire() {
        while (this._STATUS._currentMultiDownload < this._OPTION.multiDownload) {
            if (this._DOWNLOAD_LIST.done()) {
                break;
            }
            else {
                const task = this._DOWNLOAD_LIST.next();
                this.emit("start_a_download");
                this._asyncDownload(task)
                    .then(() => {
                    this.emit("done_a_download");
                })
                    .catch((error) => {
                    console.log(error);
                    this.emit("done_a_download");
                    // TODO: 错误处理
                });
            }
        }
        while (this._STATUS._currentMultiTask < this._OPTION.multiTasking) {
            if (this._TODOLIST.done()) {
                break;
            }
            else {
                const task = this._TODOLIST.next();
                this.emit("start_a_task");
                this._asyncCrawling(task)
                    .then(() => {
                    this.emit("done_a_task");
                })
                    .catch((error) => {
                    console.log(error);
                    this.emit("done_a_task");
                    // TODO: 错误处理
                });
            }
        }
    }
    _loadJq(body, task) {
        let $ = cheerio.load(body);
        // 扩展：添加 url 方法
        // 返回当前节点（们）链接的的绝对路径数组
        // 自动处理了锚和 javascript: void(0)
        $.prototype.url = function () {
            let result = [];
            $(this).each(function () {
                let newUrl = $(this).attr("href");
                // 如果是类似 'javascirpt: void(0)' 的 js 代码，直接跳过
                if (/^javascript/.test(newUrl)) {
                    return false;
                }
                // 如果是相对路径，补全路径为绝对路径
                if (newUrl && !/^https?:\/\//.test(newUrl)) {
                    newUrl = url.resolve(task.url, newUrl);
                }
                // 去除连接中的查询和锚
                let u = url.parse(newUrl);
                newUrl = u.protocol + u.auth + u.host + u.pathname;
                result.push(newUrl);
            });
            return result;
        };
        const thisSpider = this;
        // 扩展 jQ
        // 添加当前节点（们）链接到 todo-list，自动去重、补全路径
        $.prototype.todo = function (option) {
            let callback = (typeof option === "function") ? option : task.callback;
            let newUrls = $(this).url();
            if (!newUrls) {
                return false;
            }
            newUrls.map((url) => {
                if (url && !thisSpider.check(url)) {
                    let newTask = {
                        url,
                        callback,
                    };
                    if (typeof option === "object") {
                        Object.assign(newTask, option);
                    }
                    thisSpider.addTask(newTask);
                }
            });
        };
        return $;
    }
    _asyncCrawling(currentTask) {
        return __awaiter(this, void 0, void 0, function* () {
            let $ = null;
            request({
                encoding: null,
                method: "GET",
                url: currentTask.url,
            }, (error, response) => {
                if (!error) {
                    try {
                        // 根据任务设置和全局设置，确定如何编码正文
                        let preToUtf8 = this._OPTION.preToUtf8;
                        if (currentTask.preToUtf8 !== undefined) {
                            preToUtf8 = currentTask.preToUtf8;
                        }
                        if (preToUtf8) {
                            let encoding = charset(response.headers, response.body);
                            if (encoding) {
                                response.body = this.decode(response.body, encoding);
                            }
                        }
                        // 根据任务设置和全局设置，确定是否加载jQ
                        if (currentTask.jq !== undefined) {
                            $ = this._loadJq(response.body, currentTask);
                        }
                        else if (this._OPTION.jq) {
                            $ = this._loadJq(response.body, currentTask);
                        }
                    }
                    catch (err) {
                        error = err;
                    }
                }
                currentTask.response = response;
                currentTask.error = error;
                currentTask.callback(error, currentTask, $);
            });
        });
    }
    // TODO: 文件名解析
    _asyncDownload(currentTask) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const download = request(currentTask.url);
                // TODO: 路径是否存在？
                // TODO: 文件名解析
                const write = fs.createWriteStream(currentTask.path);
                // TODO: 本地空间是否足够 ?
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
}
module.exports = NodeSpider;
