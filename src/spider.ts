// TODO: request 传入 opts，以及更多的 option，类似 proxy
// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// TODO: 解决 save 方法保存json格式不好用的问题： 没有[],直接也没有逗号隔开
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite

import * as charset from "charset";
import * as cheerio from "cheerio";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import { JsonTable, TxtTable } from "./Table";
import TaskQueue from "./TaskQueue";

interface IOption {
    multiTasking: number;
    multiDownload: number;
    defaultRetry: number;
    defaultDownloadPath: string;

    crawlQueue: TaskQueue<ICrawlTask>;
    downloadQueue: TaskQueue<IDownloadTask>;

    jq: boolean;
    preToUtf8: boolean;
}

interface ICrawlTask{
    url: string;
    strategy: (err: Error, currentTask: ICrawlTask, $) => void;

    jq ?: boolean;
    preToUtf8 ?: boolean;

    _INFO ?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: ICrawlTask) => void;
    };

    response?: any;
    error?: Error;
    body?: string;
}

interface IDownloadTask {
    url: string;
    path?: string;
    callback?: (err: Error, currentTask: IDownloadTask) => void;

    _INFO ?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: ICrawlTask) => void;
    };
}

interface IStatus {
    _working: boolean;
    _currentMultiTask: number;
    _currentMultiDownload: number;
}
// 简单上手的回掉函数 + 自由定制的事件驱动

const defaultOption: IOption = {
    defaultDownloadPath: "",
    defaultRetry: 3,
    multiDownload: 2,
    multiTasking: 20,
    crawlQueue: new TaskQueue<ICrawlTask>("url"),
    downloadQueue: new TaskQueue<IDownloadTask>("url"),
    jq: true,
    preToUtf8: true,
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
class NodeSpider extends EventEmitter {
    protected _OPTION: IOption;
    protected _CRAWL_QUEUE: TaskQueue <ICrawlTask> ;
    protected _DOWNLOAD_QUEUE: TaskQueue <IDownloadTask>;
    protected _STATUS: IStatus;
    protected _TABLES: object;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts = {}) {
        super();
        this._OPTION =  Object.assign({}, defaultOption, opts);

        this._STATUS = {
            _currentMultiDownload: 0,   // 当前进行的下载的数量
            _currentMultiTask: 0, // 当前正在进行的任务数量
            _working: false,
        };

        this._CRAWL_QUEUE = this._OPTION.crawlQueue;
        this._DOWNLOAD_QUEUE = this._OPTION.downloadQueue;

        this._TABLES = [];

        this.on("start_a_task", () => this._STATUS._currentMultiTask ++);
        this.on("done_a_task", () => {
            this._STATUS._currentMultiTask --;
            this._fire();
        });
        this.on("start_a_download", () => this._STATUS._currentMultiDownload ++);
        this.on("done_a_download", () => {
            this._STATUS._currentMultiDownload --;
            this._fire();
        });
    }

    /**
     * Add new crawling-task to spider's todo-list (regardless of whether the link has been added)
     * @param {ITask} task
     * @returns {number} the number of urls has been added.
     */
    public addTask(task: ICrawlTask) {
        // TODO:  addTask 会习惯在 task 中直接声明 callback匿名函数，这种大量重复的匿名函数会消耗内存。
        if (typeof task.strategy !== "function") {
            return console.log("need function");
        }
        let urls;
        if (Array.isArray(task.url)) {
            urls = task.url;
        } else {
            urls = [ task.url ];
        }
        urls.map((u) => {
            if (typeof u !== "string") {
                return console.log("must be string");
            }
            let newTask = Object.assign({}, task);
            newTask.url = u;
            newTask._INFO = {
                finalErrorCallback: null,
                maxRetry: null,
                retried: null,
            };
            this._CRAWL_QUEUE.add(task);
        });
        return this._CRAWL_QUEUE.getSize();
    }

    /**
     * add new download-task to spider's download-list.
     * @param task
     */
    public addDownload(task: IDownloadTask) {
        let urls;
        if (Array.isArray(task.url)) {
            urls = task.url;
        } else {
            urls = [ task.url ];
        }
        urls.map((u) => {
            if (typeof u !== "string") {
                return console.log("must need string");
            }
            let newTask = Object.assign({}, task);
            task._INFO = {
                maxRetry: null,
                retried: null,
                finalErrorCallback: null,
            };
            this._DOWNLOAD_QUEUE.add(task);
        });
        return this._DOWNLOAD_QUEUE.getSize();
    }

    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    public check(url: string) {
        if (typeof url !== "string") {
            throw new Error("method check need a string-typed param");
        }
        const inTodoList = this._CRAWL_QUEUE.check(url);
        const inDownloadList = this._DOWNLOAD_QUEUE.check(url);
        return inTodoList || inDownloadList;
    }

    /**
     * 过滤掉一个数组中所有已被添加的链接，返回一个新数组
     * @param urlArray
     * @returns {array}
     */
    public filter(urlArray: string[]) {
        if (! Array.isArray(urlArray)) {
            throw new Error("method filter need a array-typed param");
        } else {
            let result = urlArray.filter((u) => {
                return this.check(u);
            });
            return result;
        }
    }

    /**
     * launch the spider with url(s) and callback
     * @param {string|array} url the first url(s) to crawle
     * @param callback
     */
    public start(url, callback) {
        if (! url || ! callback) {
            throw new Error("params url and callback is required in method start");
        }
        if (! Array.isArray(url)) {
            url = [url];
        }
        url.map((u) => {
            if (typeof u !== "string") {
                throw new Error("param url mush be a string or array of string");
            }
            if (! this.check(u)) {
                this.addTask({
                    strategy: callback,
                    url: u,
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
    public retry(task: ICrawlTask, maxRetry = this._OPTION.defaultRetry, finalErrorCallback = (task) => this.save("log.json", task)) {

        if (task._INFO.maxRetry === null) {
            task._INFO.maxRetry = maxRetry;
            task._INFO.finalErrorCallback = finalErrorCallback;
        }

        if (task._INFO.maxRetry > task._INFO.retried) {
            task._INFO.retried += 1;

            if ((task as IDownloadTask).path) {
                // 清理
                this._DOWNLOAD_QUEUE.jump((task as IDownloadTask));
            } else {
                // 清理
                task.body = null;
                task.response = null;
                task.error = null;
                this._CRAWL_QUEUE.jump(task);
            }
        } else {
            task._INFO.finalErrorCallback(task);
        }

    }

    // item可以是字符串路径，也可以是对象。若字符串则保存为 txt 或json
    // 如果是对象，则获得对象的 header 属性并对要保存路径进行检测。通过则调用对象 add 方法。
    // 每一个人都可以开发 table 对象的生成器。只需要提供 header 和 add 接口。其他由开发者考虑如何完成。
    public save(item, data) {
        // TODO: 如果item为对象，则为数据库。通过用户在 item 中自定义的标识符来判断是否已存在
        // 暂时只完成保存到文本的功能，所以默认 item 为文件路径字符串
        if (typeof item === "string") {
            if (! this._TABLES[item]) {
                // 如果不存在，则新建一个table实例
                // 根据路径中的文件后缀名，决定新建哪种table
                if (/.txt$/.test(item)) {
                    this._TABLES[item] = new TxtTable(item);
                } else {
                    this._TABLES[item] = new JsonTable(item);
                }
            }
            item = this._TABLES[item];
        }

        if (item.header === null) {
            return item.add(data);
        } else {
            let thisHeader = Object.keys(data);
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

    /**
     * 火力全开，尝试不断启动新任务，让当前任务数达到最大限制数
     */
    protected _fire() {
        while (this._STATUS._currentMultiDownload < this._OPTION.multiDownload) {
            if (this._DOWNLOAD_QUEUE.isDone()) {
                break;
            } else {
                const task = this._DOWNLOAD_QUEUE.next();
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
            if (this._CRAWL_QUEUE.isDone()) {
                break;
            } else {
                const task = this._CRAWL_QUEUE.next();
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

    protected _loadJq(body: string, task: ICrawlTask) {
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
        $.prototype.src = function() {
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
                        strategy: task.strategy,
                        url: u,
                    });
                });
            } else if (typeof option === "function") {
                newUrls.map((u) => {
                    thisSpider.addTask({
                        strategy: option,
                        url: u,
                    });
                });
            } else if (typeof option === "object") {
                option.callback = option.callback ? option.callback : task.strategy;
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
            } else if (typeof option === "string") {
                newUrls.map((u) => {
                    thisSpider.addDownload({
                        path: option,
                        url: u,
                    });
                });
            } else if (typeof option === "object") {
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

    protected async _asyncCrawling(currentTask: ICrawlTask) {
        return new Promise((resolve, reject) => {
            let $ = null;
            request(
                {
                    encoding: null,
                    method: "GET",
                    url: currentTask.url,
                },
                (error, response) => {
                    if (! error) {
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
                            } else if (this._OPTION.jq) {
                                $ = this._loadJq(currentTask.body, currentTask);
                            }
                        } catch (err) {
                            error = err;
                        }
                    }
                    currentTask.response = response;
                    currentTask.error = error;

                    currentTask.strategy(error, currentTask, $);
                    currentTask = null;
                    resolve();
                },
            );
        });
    }

    protected async _asyncDownload(currentTask: IDownloadTask) {
        return new Promise((resolve, reject) => {
            let nameIndex = currentTask.url.lastIndexOf("/");
            let fileName = currentTask.url.slice(nameIndex);

            if (! currentTask.path) {
                currentTask.path = this._OPTION.defaultDownloadPath;
            }

            let savePath;
            if (currentTask.path[currentTask.path.length - 1] === "/") {
                savePath = currentTask.path.slice(0, currentTask.path.length - 1) + fileName;
            } else {
                savePath = currentTask.path + fileName;
            }

            const download = request(currentTask.url);
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

    }

}

export = NodeSpider;
