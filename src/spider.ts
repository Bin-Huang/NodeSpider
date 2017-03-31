// TODO: request 传入 opts，以及更多的 option，类似 proxy
// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// TODO: 解决 save 方法保存json格式不好用的问题： 没有[],直接也没有逗号隔开
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 当一个页面 url 指向已存在资源路径，但是添加了不同的查询语句，将跳过去重
import * as charset from "charset";
import * as cheerio from "cheerio";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import List from "./List";
import { JsonTable, TxtTable } from "./Table";

interface IOption {
    multiTasking: number;
    multiDownload: number;
    jq: boolean;
    preToUtf8: boolean;
    defaultRetry: number;
    defaultDownloadPath: string;
}

interface ITask {
    url: string;
    callback: (err, currentTask, $) => void;
    jq ?: boolean;
    preToUtf8 ?: boolean;

    info ?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: ITask) => void;
    };
}

interface IDownload {
    url: string;
    path: string;
    callback?: () => void;

    info ?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: ITask) => void;
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
    jq: true,
    multiDownload: 2,
    multiTasking: 20,
    preToUtf8: true,
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
class NodeSpider extends EventEmitter {
    protected _OPTION: IOption;
    protected _TODOLIST: List <ITask> ;
    protected _DOWNLOAD_LIST: List <IDownload>;
    protected _STATUS: IStatus;
    protected _TABLE: object;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts = {}) {
        super();
        Object.assign(defaultOption, opts);
        this._OPTION = defaultOption;
        this._STATUS = {
            _currentMultiDownload: 0,   // 当前进行的下载的数量
            _currentMultiTask: 0, // 当前正在进行的任务数量
            _working: false,
        };

        this._TODOLIST = new List <ITask> ();
        this._DOWNLOAD_LIST = new List <IDownload> ();

        this._TABLE = {};

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
     * 向爬虫的 todo-list 添加新的任务(不检查是否重复链接)
     * @param {ITask} task
     * @memberOf NodeSpider
     */
    public addTask(task: ITask) {
        let newTask: ITask = {
            callback: task.callback,
            info: {
                finalErrorCallback: null,
                maxRetry: null,
                retried: 0,
            },
            url: task.url,
        };
        if (typeof task.jq !== "undefined") {
            newTask.jq = task.jq
        }

        this._TODOLIST.add(newTask.url, newTask);
    }

    public download(task: IDownload) {
        task.info = {
            finalErrorCallback: null,
            maxRetry: null,
            retried: 0,
        };
        this._DOWNLOAD_LIST.add(task.url, task);
    }

    /**
     * 检测链接是否已添加过
     * @param {stirng} url 待检查的链接
     * @returns {boolean}
     * @memberOf NodeSpider
     */
    public check(url: string) {
        const inTodoList = this._TODOLIST.check(url);
        const inDownloadList = this._DOWNLOAD_LIST.check(url);
        return inTodoList || inDownloadList;
    }

    /**
     * launch the spider with a url and callback
     * @param url the first url to crawle
     * @param callback
     */
    public start(url, callback) {
        // TODO: init check

        if (url && callback) {
            this.addTask({
                url,
                callback,
            });
        }

        this._STATUS._working = true;
        this._fire();
    }

    /**
     * retry a task
     * @param task the task which want to retry
     * @param maxRetry max retry count of this task
     * @param finalErrorCallback callback calling when retry count eval to max retry count
     */

    // TODO: retry download task error: add to todolist
    public retry(task: ITask, maxRetry= this._OPTION.defaultRetry , finalErrorCallback: (task: ITask) => void) {

        if (!finalErrorCallback) {
            finalErrorCallback = () => {
                this.save("log", task);
            };
        }

        if (task.info.maxRetry === null) {
            task.info.maxRetry = maxRetry;
            task.info.finalErrorCallback = finalErrorCallback;
        }

        if (task.info.maxRetry > task.info.retried) {
            task.info.retried += 1;
            // 将 error 和 response 信息删除，节省排队时的内存占用
            (task as any).response = null;
            (task as any).error = null;
            this._TODOLIST.jump(task.url, task);
        } else {
            task.info.finalErrorCallback(task);
        }

    }

    public decode(st, encoding) {
        return iconv.decode(st, encoding);
    }

    public save(item, data) {
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
            this._TABLE[item] = new TxtTable(item, header);
            this._TABLE[item].add(data);
        } else {
            this._TABLE[item] = new JsonTable(item, header);
            this._TABLE[item].add(data);
        }
    }

    protected _fire() {
        while (this._STATUS._currentMultiDownload < this._OPTION.multiDownload) {
            if (this._DOWNLOAD_LIST.done()) {
                break;
            } else {
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
        while(this._STATUS._currentMultiTask < this._OPTION.multiTasking) {
            if (this._TODOLIST.done()) {
                break;
            } else {
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

    protected _loadJq(body: string, task: ITask) {
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
                // 如果是锚，等效与当前 url 路径
                if (newUrl && newUrl[0] === "#") {
                    return result.push(task.url);
                }
                // 如果是相对路径，补全路径为绝对路径
                if (newUrl && !/^https?:\/\//.test(newUrl)) {
                    newUrl = url.resolve(task.url, newUrl);
                }
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
            if (! newUrls) {
                return false;
            }

            newUrls.map((url) => {
                if (url && ! thisSpider.check(url)) {
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

    protected async _asyncCrawling(currentTask: ITask) {
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
                                response.body = this.decode(response.body, encoding);
                            }
                        }

                        // 根据任务设置和全局设置，确定是否加载jQ
                        if (currentTask.jq !== undefined) {
                            $ = this._loadJq(response.body, currentTask);
                        } else if (this._OPTION.jq) {
                            $ = this._loadJq(response.body, currentTask);
                        }
                    } catch (err) {
                        error = err;
                    }
                }
                (currentTask as any).response = response;
                (currentTask as any).error = error;

                currentTask.callback(error, currentTask, $);
            },
        );
    }

    // TODO: 文件名解析
    protected async _asyncDownload(currentTask: IDownload) {
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

    }

}

export = NodeSpider;
