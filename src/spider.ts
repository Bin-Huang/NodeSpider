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
import { jsonPipe, txtPipe } from "./pipe";
import { Plan } from "./plan";
import Queue from "./queue";
import {
    ICrawlCurrentTask,
    ICrawlQueueItem,
    ICrawlTaskInput,
    ICurrentCrawl,
    IDownloadCurrentTask,
    IDownloadQueueItem,
    IDownloadTaskInput,
    IGlobalOption,
    IPipe,
    IPlanInput,
    IRule,
    IState,
    ITask,
} from "./types";

const defaultOption: IGlobalOption = {
    defaultDownloadPath: "",
    defaultRetry: 3,
    multiDownload: 2,
    multiTasking: 20,
    preprocessing: [decode, loadJQ],
    queue: new Queue(),
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    public static decode = decode;
    public static loadJQ = loadJQ;
    public static Queue = Queue;
    public static txtPipe = txtPipe;
    public static jsonPipe = jsonPipe;

    protected _STATE: IState;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts = {}) {
        super();

        this._STATE = {
            currentMultiDownload: 0,   // 当前进行的下载的数量
            currentMultiTask: 0, // 当前正在进行的任务数量
            dlPlanStore: new Map(),
            option: Object.assign({}, defaultOption, opts),
            pipeStore: new Map(),
            planStore: new Map(),
            queue: this._STATE.option.queue,
            working: true,
        };

        // 每开始一个任务，状态中对应当前异步任务数的记录值加1
        this.on("start_a_task", (type: "crawl" | "download") => {
            if (type === "crawl") {
                this._STATE.currentMultiTask ++;
            } else if (type === "download") {
                this._STATE.currentMultiDownload --;
            }
        });
        // 每完成一个任务，状态中对应当前异步任务数的记录值减1
        this.on("done_a_task", (type: "crawl" | "download") => {
            if (type === "crawl") {
                this._STATE.currentMultiTask --;
            } else if (type === "download") {
                this._STATE.currentMultiDownload --;
            }
        });
        // 完成一个任务后，判断是否存在未进行任务、进行中未完成任务，如果都不存在则触发“end”事件，否则“火力全开”
        this.on("done_a_task", (type: "crawl" | "download") => {
            const multiTaskingIsEmtpy: boolean = (this._STATE.currentMultiTask === 0);
            const multiDownloadIsEmtpy: boolean = (this._STATE.currentMultiDownload === 0);
            if (this._STATE.queue.isAllCompleted() && multiDownloadIsEmtpy && multiTaskingIsEmtpy) {
                this.emit("end");
            } else {
                this._fire();
            }
        });
        // 在爬虫的生命周期末尾，需要进行一些收尾工作，比如关闭table
        this.on("end", () => {
            const values = this._STATE.pipeStore.values();
            for (const item of values) {
                item.close();
            }
        });
    }

    // /**
    //  * Add new crawling-task to spider's todo-list (regardless of whether the link has been added)
    //  * @param {ITask} task
    //  * @returns {number} the number of urls has been added.
    //  */
    // public addTask(task: ICrawlTaskInput) {
    //     // TODO:  addTask 会习惯在 task 中直接声明 callback匿名函数，这种大量重复的匿名函数会消耗内存。
    //     if (typeof task.strategy !== "function") {
    //         return console.log("need function");
    //     }
    //     let urls;
    //     if (Array.isArray(task.url)) {
    //         urls = task.url;
    //     } else {
    //         urls = [ task.url ];
    //     }
    //     urls.map((u)  => {
    //         if (typeof u !== "string") {
    //             return console.log("must be string");
    //         }
    //         const newTask = {
    //             ... task,
    //             url: u,
    //         };
    //         newTask.url = u;
    //         this._STATE.crawlQueue.add(newTask);
    //     });

    //     this._STATE.working = true;
    //     this._fire();
    //     return this._STATE.crawlQueue.getSize();
    // }

    // /**
    //  * add new download-task to spider's download-list.
    //  * @param task
    //  */
    // public addDownload(task: IDownloadTaskInput) {
    //     let urls;
    //     if (Array.isArray(task.url)) {
    //         urls = task.url;
    //     } else {
    //         urls = [ task.url ];
    //     }
    //     urls.map((u) => {
    //         if (typeof u !== "string") {
    //             return console.log("must need string");
    //         }
    //         const newTask = {
    //             ...task,
    //             url: u,
    //         };

    //         this._STATE.queue.addDownload(newTask);
    //     });
    //     return this._STATE.downloadQueue.getSize();
    // }

    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    public isExist(url: string) {
        if (typeof url !== "string") {
            throw new Error("method check need a string-typed param");
        }
        return this._STATE.queue.check(url);
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
            const s = new Set(urlArray);
            const result = [];
            for (const url of s) {
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
    public retry(task: ICrawlCurrentTask, maxRetry = this._STATE.option.defaultRetry, finalErrorCallback = (task) => this.save("log.json", task)) {
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
                this._STATE.downloadQueue.jump(task);
            } else {
                // 清理
                task.body = null;
                task.response = null;
                task.error = null;
                this._STATE.crawlQueue.jump(task);
            }
        } else {
            task._INFO.finalErrorCallback(task);
        }

    }

    public plan(item: IRule|IPlanInput): symbol {
        if (typeof item === "function") {
            const newPlan = new Plan(item, null, null, null);
            const id = this._STATE.planStore.size + 1;
            const key = Symbol("plan" + id);
            this._STATE.planStore.set(key, newPlan);
            return key;
        }
        if (typeof item === "object") {
            if (! item.rule) {
                throw new Error("参数缺少rule成员");
            }
            const rule = item.rule;
            const request = item.request || null;
            const use = item.use || null;
            const info = item.info || null;
            const newPlan = new Plan(rule, request, use, info);
            const id = this._STATE.planStore.size + 1;
            const key = Symbol("plan" + id);
            this._STATE.planStore.set(key, newPlan);
            return key;
        }
        throw new Error("参数错误");
    }

    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planKey 指定的爬取计划
     * @param url 待爬取的链接（们）
     */
    public queue(planKey: symbol, url: string | string[]) {
        // 参数检验
        if (typeof planKey !== "symbol" || typeof url !== "string" || !Array.isArray(url)) {
            return new TypeError("queue 参数错误");
        }
        // 确定添加到哪个队列(crawlQueue还是downloadQueue?)
        let addToQueue = null;
        if (this._STATE.planStore.has(planKey)) {
            addToQueue = this._STATE.queue.addCrawl;
        } else if (this._STATE.dlPlanStore.has(planKey)) {
            addToQueue = this._STATE.queue.addDownload;
        } else {
            return new RangeError("plan 不存在");
        }
        // 添加到队列
        if (! Array.isArray(url)) {
            addToQueue({url, plan: planKey});
        } else {
            url.map((u) => {
                addToQueue({url, plan: planKey});
            });
        }
    }

    // 关于pipeGenerator
    // 提供 add、close、init
    // 当第一次被save调用时，先触发init后再add（这样就不会生成空文件）
    // 爬虫生命周期末尾，自动调用close清理工作
    public pipe(pipeObject: IPipe): symbol {
        // TODO C 检测参数是否符合Ipipe

        const id = this._STATE.pipeStore.size + 1;
        const key = Symbol("pipe" + id);
        this._STATE.pipeStore.set(key, pipeObject);
        return key;
    }

    // item可以是字符串路径，也可以是对象。若字符串则保存为 txt 或json
    // 如果是对象，则获得对象的 header 属性并对要保存路径进行检测。通过则调用对象 add 方法。
    // 每一个人都可以开发 table 对象的生成器。只需要提供 header 和 add 接口。其他由开发者考虑如何完成。
    public save(pipeKey: symbol, data: any) {
        if (! this._STATE.pipeStore.has(pipeKey)) {
            return new Error("unknowed pipe");
        }
        const pipe = this._STATE.pipeStore.get(pipeKey);
        pipe.add(data);
    }

    /**
     * 火力全开，不断尝试启动新任务，直到当前任务数达到最大限制数
     */
    protected _fire() {
        while (this._STATE.currentMultiDownload < this._STATE.option.multiDownload) {
            if (this._STATE.queue.isDownloadCompleted()) {
                break;
            } else {
                const task = this._STATE.queue.getTask();
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
            if (this._STATE.queue.isDownloadCompleted()) {
                break;
            } else {
                const task = this._STATE.queue.getTask();
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

    protected async _asyncCrawling(task: ITask) {
        const plan = this._STATE.planStore.get(task.planKey);
        if (! plan) {
            return new Error("unknown plan");
        }
        // request
        const requestOpts = plan.request || {};
        const specialOpts = task.special || {};
        const item = Object.assign({ encoding: null }, requestOpts, specialOpts, {url: task.url});
        const {error, response, body} = await requestAsync(item);

        let current: ICurrentCrawl = Object.assign({
            response,
            plan,
            body,
            error,
        }, task);

        const use = (plan.use) ? plan.use : [
            NodeSpider.decode(),
            NodeSpider.loadJQ(),
        ];
        // 按顺序执行预处理函数，对current进行预处理
        for (const preFun of use) {
            let result = preFun(this, current);
            if (result instanceof Promise) {
                result = await result;
            }
            current = result;
        }

        // 根据开发者定义的抓取规则进行操作
        const result = plan.rule(error, current);
        if (result instanceof Promise) {
            await result;
        }
        // 结尾的清理工作
        current = null;
    }

    protected  _asyncDownload(task: ITask) {
        return new Promise((resolve, reject) => {
            const plan = this._STATE.dlPlanStore.get(task.planKey);
            if (! plan) {
                return new Error("unknown plan");
            }
            // request
            const requestOpts = plan.request || {};
            const specialOpts = task.special || {};
            const item = Object.assign({ encoding: null }, requestOpts, specialOpts, {url: task.url});

            const stream = require(item);

            // TODO C add support to transform middle
            // if (plan.use) {
            //     for (const item of plan.use) {
            //         stream.pipe(item);
            //     }
            // }

            // 获得文件名
            const urlObj = url.parse(task.url);
            const pathname = urlObj.pathname;
            const filename = pathname.slice(pathname.lastIndexOf("/"));

            const write = fs.createWriteStream(plan.path + filename);
            stream.pipe(write);

            // TODO B 事件报错及完成情况反馈: 未完成
            stream.on("error", (e) => {
                plan.handleError(e);
                reject();
            });
            write.on("error", (e) => {
                plan.handleError(e);
                reject();
            });
            write.on("drain", () => {
                plan.finishCallback();
                resolve();
            });

        });
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

async function asyncDownload(task: IDownloadQueueItem) {
    return new Promise((resolve, reject) => {
        const nameIndex = task.url.lastIndexOf("/");
        const fileName = task.url.slice(nameIndex);

        if (! task.path) {
            task.path = this._STATE.option.defaultDownloadPath;
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

function requestAsync(item) {
    return new Promise<{error: Error, response, body: string}>((resolve, reject) => {
        request(item, (error, response, body) => {
            resolve({error, response, body});
        });
    });
}
