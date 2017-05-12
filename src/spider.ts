// TODO: request 传入 opts，以及更多的 option，类似 proxy
// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// 简单上手的回掉函数 + 自由定制的事件驱动
// mysql 插件
// redis queue

import * as charset from "charset";
import * as cheerio from "cheerio";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import decode from "./decode";
import loadJQ from "./loadJQ";
import { JsonTable, TxtTable } from "./Table";
import TaskQueue from "./TaskQueue";
import {
    ICrawlCurrentTask,
    ICrawlQueueItem,
    ICrawlTaskInput,
    IDownloadCurrentTask,
    IDownloadQueueItem,
    IDownloadTaskInput,
    IGlobalOption,
    IStatus,
} from "./types";

const defaultOption: IGlobalOption = {
    crawlQueue: new TaskQueue<ICrawlQueueItem>("url"),
    downloadQueue: new TaskQueue<IDownloadQueueItem>("url"),
    defaultDownloadPath: "",
    defaultRetry: 3,
    multiDownload: 2,
    multiTasking: 20,
    preprocessing: [decode, loadJQ],
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
 class NodeSpider extends EventEmitter {
    protected _OPTION: IGlobalOption;
    protected _CRAWL_QUEUE: TaskQueue <ICrawlQueueItem> ;
    protected _DOWNLOAD_QUEUE: TaskQueue <IDownloadQueueItem>;
    protected _STATUS: IStatus;
    protected _TABLES: Map<string, any>;
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

        this._TABLES = new Map();

        // 每开始一个任务，状态中对应当前异步任务数的记录值加1
        this.on("start_a_task", (type: "crawl" | "download") => {
            if (type === "crawl") {
                this._STATUS._currentMultiTask ++;
            } else if (type === "download") {
                this._STATUS._currentMultiDownload --;
            }
        });
        // 每完成一个任务，状态中对应当前异步任务数的记录值减1
        this.on("done_a_task", (type: "crawl" | "download") => {
            if (type === "crawl") {
                this._STATUS._currentMultiTask --;
            } else if (type === "download") {
                this._STATUS._currentMultiDownload --;
            }
        });
        // 完成一个任务后，判断是否存在未进行任务、进行中未完成任务，如果都不存在则触发“end”事件，否则“火力全开”
        this.on("done_a_task", (type: "crawl" | "download") => {
            let crawlTaskAllDone: boolean = (this._CRAWL_QUEUE.getLength() === 0);
            let downloadTaskAllDone: boolean = (this._DOWNLOAD_QUEUE.getLength() === 0);
            let multiTaskingIsEmtpy: boolean = (this._STATUS._currentMultiTask === 0);
            let multiDownloadIsEmtpy: boolean = (this._STATUS._currentMultiDownload === 0);
            if (crawlTaskAllDone && downloadTaskAllDone && multiDownloadIsEmtpy && multiTaskingIsEmtpy) {
                this.emit("end");
            } else {
                this._fire();
            }
        });
        // 在爬虫的生命周期末尾，需要进行一些收尾工作，比如关闭table
        // TODO: 目前仅限 txttable 和 jsontable，更多插件形式的要怎么接入
        this.on("end", () => {
            let values = this._TABLES.values();
            for (let item of values) {
                item.close();
            }
        });
    }

    /**
     * Add new crawling-task to spider's todo-list (regardless of whether the link has been added)
     * @param {ITask} task
     * @returns {number} the number of urls has been added.
     */
    public addTask(task: ICrawlTaskInput) {
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
        urls.map((u)  => {
            if (typeof u !== "string") {
                return console.log("must be string");
            }
            let newTask = {
                ... task,
                url: u,
            };
            newTask.url = u;
            this._CRAWL_QUEUE.add(newTask);
        });

        this._STATUS._working = true;
        this._fire();
        return this._CRAWL_QUEUE.getSize();
    }

    /**
     * add new download-task to spider's download-list.
     * @param task
     */
    public addDownload(task: IDownloadTaskInput) {
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
            let newTask = {
                ...task,
                url: u,
            };

            this._DOWNLOAD_QUEUE.add(newTask);
        });
        return this._DOWNLOAD_QUEUE.getSize();
    }

    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    public isExist(url: string) {
        if (typeof url !== "string") {
            throw new Error("method check need a string-typed param");
        }
        const inTodoList = this._CRAWL_QUEUE.check(url);
        const inDownloadList = this._DOWNLOAD_QUEUE.check(url);
        return inTodoList || inDownloadList;
    }

    /**
     * 过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组
     * @param urlArray {array}
     * @returns {array}
     */
    public filter(urlArray: string[]) {
        if (! Array.isArray(urlArray)) {
            throw new Error("method filter need a array-typed param");
        } else {
            let s = new Set(urlArray);
            let result = [];
            for (let url of s) {
                if (! this.isExist) {
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
    public retry(task: ICrawlCurrentTask, maxRetry = this._OPTION.defaultRetry, finalErrorCallback = (task) => this.save("log.json", task)) {
        if (task._INFO === undefined) {
            task._INFO = {
                retried: 0,
                maxRetry,
                finalErrorCallback,
            };
        }

        if (task._INFO.maxRetry > task._INFO.retried) {
            task._INFO.retried += 1;

            if ((task as IDownloadCurrentTask).path) {
                // 清理
                this._DOWNLOAD_QUEUE.jump((task as IDownloadQueueItem));
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
                this.emit("start_a_task", "download");
                this._asyncDownload(task)
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
        while (this._STATUS._currentMultiTask < this._OPTION.multiTasking) {
            if (this._CRAWL_QUEUE.isDone()) {
                break;
            } else {
                const task = this._CRAWL_QUEUE.next();
                this.emit("start_a_task", "crawl");
                this._asyncCrawling(task)
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
    protected _asyncRequest(opts) {
        return new Promise((resolve, reject) => {
            request(opts, (error, response) => {
                resolve({ error, response });
            });
        });
    }

    protected async _asyncCrawling(task: ICrawlQueueItem) {
        // first, request
        let {error, response}: any = await this._asyncRequest({
            encoding: null,
            method: "GET",
            url: task.url,
        });
        let currentTask: ICrawlCurrentTask = {
            body: response.body,
            error,
            response,
            $: null,
            ... task,
        };
        // then, clear
        error = null;
        response = null;
        // operate preprocessing
        if (! currentTask.error) {
            try {
                for (let pre of this._OPTION.preprocessing) {
                    currentTask = await pre(this, currentTask.error, currentTask, currentTask.$);
                }
            } catch (err) {
                currentTask.error = err;
            }
        }
        // operate strategy, then clear
        // TODO: if there are a bug, is it can be throwed?
        await currentTask.strategy(currentTask.error, currentTask, currentTask.$);
        currentTask = null;
    }

    protected async _asyncDownload(task: IDownloadQueueItem) {
        return new Promise((resolve, reject) => {
            let nameIndex = task.url.lastIndexOf("/");
            let fileName = task.url.slice(nameIndex);

            if (! task.path) {
                task.path = this._OPTION.defaultDownloadPath;
            }

            let savePath;
            if (task.path[task.path.length - 1] === "/") {
                savePath = task.path.slice(0, task.path.length - 1) + fileName;
            } else {
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

    }
}

/**
 * create an instance of NodeSpider
 * @param option
 */
function create (option: IGlobalOption) {
    return new NodeSpider(option);
}

export {decode, loadJQ, create, NodeSpider };
