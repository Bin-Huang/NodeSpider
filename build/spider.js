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
     * Add new crawling-task to spider's todo-list (regardless of whether the link has been added)
     * @param {ITask} task
     * @returns {number} the number of urls has been added.
     */
    addTask(task) {
        // TODO:  addTask 会习惯在 task 中直接声明 callback匿名函数，这种大量重复的匿名函数会消耗内存。
        if (typeof task.url !== "string" || typeof task.callback !== "function") {
            throw new Error("method addTask params : {url: string, callback: function");
        }
        task._INFO = {
            maxRetry: null,
            finalErrorCallback: null,
            retried: null,
        };
        this._TODOLIST.add(task.url, task);
        return this._TODOLIST.getSize();
    }
    /**
     * add new download-task to spider's download-list.
     * @param task
     */
    addDownload(task) {
        // TODO: 清理空间
        if (!task.path) {
            task.path = this._OPTION.defaultDownloadPath;
        }
        if (!task._INFO) {
            task._INFO = {
                maxRetry: null,
                retried: null,
                finalErrorCallback: null,
            };
        }
        this._DOWNLOAD_LIST.add(task.url, task);
    }
    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    check(url) {
        if (typeof url !== "string") {
            throw new Error("method check need a string-typed param");
        }
        const inTodoList = this._TODOLIST.check(url);
        const inDownloadList = this._DOWNLOAD_LIST.check(url);
        return inTodoList || inDownloadList;
    }
    /**
     * 过滤掉一个数组中所有已被添加的链接，返回一个新数组
     * @param urlArray
     * @returns {array}
     */
    filter(urlArray) {
        if (!Array.isArray(urlArray)) {
            throw new Error("method filter need a array-typed param");
        }
        else {
            let result = [];
            // TODO: 使用专门过滤的数组方法
            urlArray.map((u) => {
                if (!this.check(u)) {
                    result.push(u);
                }
            });
            return result;
        }
    }
    /**
     * launch the spider with url(s) and callback
     * @param {string|array} url the first url(s) to crawle
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
     * Retry the task within the maximum number of retries
     * @param {ITask} task The task which want to retry
     * @param {number} maxRetry Maximum number of retries for this task
     * @param {function} finalErrorCallback The function called when the maximum number of retries is reached
     */
    retry(task, maxRetry = this._OPTION.defaultRetry, finalErrorCallback = (task) => this.save("log.json", task)) {
        if (task._INFO.maxRetry === null) {
            task._INFO.maxRetry = maxRetry;
            task._INFO.finalErrorCallback = finalErrorCallback;
        }
        if (task._INFO.maxRetry > task._INFO.retried) {
            task._INFO.retried += 1;
            if (task.path) {
                // 清理
                this._DOWNLOAD_LIST.jump(task.url, task);
            }
            else {
                // 清理
                task.body = null;
                task.response = null;
                task.error = null;
                this._TODOLIST.jump(task.url, task);
            }
        }
        else {
            task._INFO.finalErrorCallback(task);
        }
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
        // 返回当前节点（们）链接的的绝对路径(array)
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
        /**
         * 获得选中节点（们）的 src 路径（自动补全）
         * @returns {array}
         */
        $.prototype.src = function () {
            let result = [];
            $(this).each(function () {
                let newUrl = $(this).attr("src");
                // 如果是相对路径，补全路径为绝对路径
                if (newUrl && !/^https?:\/\//.test(newUrl)) {
                    newUrl = url.resolve(task.url, newUrl);
                }
                result.push(newUrl);
            });
            return result;
        };
        const thisSpider = this;
        /**
         * 添加选定节点（们）中的链接到 todo-list, 并自动补全路径、跳过重复链接
         * @param {null|function|object}  option 回掉函数或设置对象
         * option 为可选参数，空缺时新建任务的回调函数
         * 可以传入函数作为任务的回掉函数
         * 也可以是一个包括设置的对象，如果对象中不存在callback成员，则默认当前任务的callback
         */
        $.prototype.todo = function (option) {
            let newUrls = $(this).url();
            newUrls = thisSpider.filter(newUrls);
            if (typeof option === "undefined") {
                newUrls.map((u) => {
                    thisSpider.addTask({
                        callback: task.callback,
                        url: u,
                    });
                });
            }
            else if (typeof option === "function") {
                newUrls.map((u) => {
                    thisSpider.addTask({
                        callback: option,
                        url: u,
                    });
                });
            }
            else if (typeof option === "object") {
                option.callback = option.callback ? option.callback : task.callback;
                newUrls.map((u) => {
                    let newTask = Object.assign({}, option);
                    newTask.url = u;
                    thisSpider.addTask(newTask);
                });
            }
        };
        /**
         * 添加选定节点（们）中的链接到 download-list, 并自动补全路径、跳过重复链接
         * @param {null|string|object}  option 路径或设置对象
         * option 为可选参数，空缺时新建任务的 path 默认为默认保存路径
         * 可以传入字符串作为下载内容的保存路径
         * 也可以是一个包括设置的对象，如果对象中不存在path成员，则为默认保存路径
         */
        $.prototype.download = function (option) {
            let newUrls = $(this).url();
            newUrls = thisSpider.filter(newUrls);
            if (typeof option === "undefined") {
                newUrls.map((u) => {
                    thisSpider.addDownload({
                        path: thisSpider._OPTION.defaultDownloadPath,
                        url: u,
                    });
                });
            }
            else if (typeof option === "string") {
                newUrls.map((u) => {
                    thisSpider.addDownload({
                        path: option,
                        url: u,
                    });
                });
            }
            else if (typeof option === "object") {
                option.path = option.path ? option.path : thisSpider._OPTION.defaultDownloadPath;
                newUrls.map((u) => {
                    let newTask = Object.assign({}, option);
                    newTask.url = u;
                    thisSpider.addDownload(newTask);
                });
            }
            return $;
        };
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
                                currentTask.body = iconv.decode(response.body, encoding);
                            }
                        }
                        // 根据任务设置和全局设置，确定是否加载jQ
                        if (currentTask.jq !== undefined) {
                            $ = this._loadJq(currentTask.body, currentTask);
                        }
                        else if (this._OPTION.jq) {
                            $ = this._loadJq(currentTask.body, currentTask);
                        }
                    }
                    catch (err) {
                        error = err;
                    }
                }
                currentTask.response = response;
                currentTask.error = error;
                currentTask.callback(error, currentTask, $);
                currentTask = null;
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
