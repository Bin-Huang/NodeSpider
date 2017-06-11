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
const url = require("url");
const decode_1 = require("./decode");
const loadJQ_1 = require("./loadJQ");
const pipe_1 = require("./pipe");
const plan_1 = require("./plan");
const queue_1 = require("./queue");
const defaultOption = {
    multiDownload: 2,
    multiTasking: 20,
    queue: new queue_1.default(),
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
            currentMultiDownload: 0,
            currentMultiTask: 0,
            dlPlanStore: new Map(),
            option: Object.assign({}, defaultOption, opts),
            pipeStore: new Map(),
            planStore: new Map(),
            queue: this._STATE.option.queue,
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
            const multiTaskingIsEmtpy = (this._STATE.currentMultiTask === 0);
            const multiDownloadIsEmtpy = (this._STATE.currentMultiDownload === 0);
            if (this._STATE.queue.isAllCompleted() && multiDownloadIsEmtpy && multiTaskingIsEmtpy) {
                this.emit("end");
            }
            else {
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
    isExist(url) {
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
    retry(current, maxRetry = this._STATE.option.defaultRetry, finalErrorCallback) {
        // TODO C 参数检验
        const task = {
            hasRetried: current.hasRetried,
            maxRetry: current.maxRetry,
            planKey: current.planKey,
            special: current.special,
            url: current.url,
        };
        if (!task.hasRetried) {
            task.hasRetried = 1;
        }
        if (!task.maxRetry) {
            task.maxRetry = maxRetry;
        }
        finalErrorCallback = (finalErrorCallback) ? finalErrorCallback : (current) => {
            // TODO C 更好的报错
            return new Error("达到最大重试次数，依旧错误");
        };
        if (task.hasRetried >= task.maxRetry) {
            return finalErrorCallback(current);
        }
        // 判断是哪种任务，crawl or download?
        let jumpFun = null;
        if (this._STATE.planStore.has(task.planKey)) {
            jumpFun = this._STATE.queue.jumpCrawl;
        }
        else if (this._STATE.dlPlanStore.has(task.planKey)) {
            jumpFun = this._STATE.queue.jumpDownload;
        }
        else {
            return new Error("unknown plan");
        }
        // 重新添加到队列
        task.hasRetried++;
        jumpFun(task);
    }
    plan(item) {
        if (typeof item === "function") {
            const newPlan = new plan_1.Plan(item, null, null, null);
            const id = this._STATE.planStore.size + 1;
            const key = Symbol("plan" + id);
            this._STATE.planStore.set(key, newPlan);
            return key;
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
            const id = this._STATE.planStore.size + 1;
            const key = Symbol("plan" + id);
            this._STATE.planStore.set(key, newPlan);
            return key;
        }
        throw new Error("参数错误");
    }
    downloadPlan(item) {
        if (typeof item === "function") {
            const newPlan = new plan_1.DownloadPlan(item);
            const id = this._STATE.dlPlanStore.size + 1;
            const key = Symbol("downloadPlan" + id);
            this._STATE.dlPlanStore.set(key, newPlan);
            return key;
        }
        if (typeof item === "object") {
            if (!item.handleError) {
                throw new Error("参数缺少handleError成员");
            }
            // TODO: 参数检验
            const newPlan = new plan_1.DownloadPlan(item.handleError, item.handleFinish, item.path, item.request, item.use, item.info);
            const id = this._STATE.dlPlanStore.size + 1;
            const key = Symbol("downloadPlan" + id);
            this._STATE.dlPlanStore.set(key, newPlan);
            return key;
        }
        throw new Error("参数错误");
    }
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planKey 指定的爬取计划
     * @param url 待爬取的链接（们）
     */
    queue(planKey, url) {
        // 参数检验
        if (typeof planKey !== "symbol" || typeof url !== "string" || !Array.isArray(url)) {
            return new TypeError("queue 参数错误");
        }
        // 确定添加到哪个队列(crawlQueue还是downloadQueue?)
        let addToQueue = null;
        if (this._STATE.planStore.has(planKey)) {
            addToQueue = this._STATE.queue.addCrawl;
        }
        else if (this._STATE.dlPlanStore.has(planKey)) {
            addToQueue = this._STATE.queue.addDownload;
        }
        else {
            return new RangeError("plan 不存在");
        }
        // 添加到队列
        if (!Array.isArray(url)) {
            addToQueue({ url, plan: planKey });
        }
        else {
            url.map((u) => {
                addToQueue({ url, plan: planKey });
            });
        }
    }
    // 关于pipeGenerator
    // 提供 add、close、init
    // 当第一次被save调用时，先触发init后再add（这样就不会生成空文件）
    // 爬虫生命周期末尾，自动调用close清理工作
    pipe(pipeObject) {
        // TODO C 检测参数是否符合Ipipe
        const id = this._STATE.pipeStore.size + 1;
        const key = Symbol("pipe" + id);
        this._STATE.pipeStore.set(key, pipeObject);
        return key;
    }
    // item可以是字符串路径，也可以是对象。若字符串则保存为 txt 或json
    // 如果是对象，则获得对象的 header 属性并对要保存路径进行检测。通过则调用对象 add 方法。
    // 每一个人都可以开发 table 对象的生成器。只需要提供 header 和 add 接口。其他由开发者考虑如何完成。
    save(pipeKey, data) {
        if (!this._STATE.pipeStore.has(pipeKey)) {
            return new Error("unknowed pipe");
        }
        const pipe = this._STATE.pipeStore.get(pipeKey);
        pipe.add(data);
    }
    /**
     * 火力全开，不断尝试启动新任务，直到当前任务数达到最大限制数
     */
    _fire() {
        while (this._STATE.currentMultiDownload < this._STATE.option.multiDownload) {
            if (this._STATE.queue.isDownloadCompleted()) {
                break;
            }
            else {
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
            }
            else {
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
    _asyncCrawling(task) {
        return __awaiter(this, void 0, void 0, function* () {
            const plan = this._STATE.planStore.get(task.planKey);
            if (!plan) {
                return new Error("unknown plan");
            }
            // request
            const requestOpts = plan.request || {};
            const specialOpts = task.special || {};
            const item = Object.assign({ encoding: null }, requestOpts, specialOpts, { url: task.url });
            const { error, response, body } = yield requestAsync(item);
            let current = Object.assign({
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
                    result = yield result;
                }
                current = result;
            }
            // 根据开发者定义的抓取规则进行操作
            const result = plan.rule(error, current);
            if (result instanceof Promise) {
                yield result;
            }
            // 结尾的清理工作
            current = null;
        });
    }
    _asyncDownload(task) {
        return new Promise((resolve, reject) => {
            const plan = this._STATE.dlPlanStore.get(task.planKey);
            if (!plan) {
                return new Error("unknown plan");
            }
            // request
            const requestOpts = plan.request || {};
            const specialOpts = task.special || {};
            const item = Object.assign({ encoding: null }, requestOpts, specialOpts, { url: task.url });
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
            stream.on("error", (error, current) => {
                plan.handleError(error, current);
                reject();
            });
            write.on("error", (error, current) => {
                plan.handleError(error, current);
                reject();
            });
            write.on("drain", (current) => {
                plan.handleFinish(current);
                resolve();
            });
        });
    }
}
NodeSpider.decode = decode_1.default;
NodeSpider.loadJQ = loadJQ_1.default;
NodeSpider.Queue = queue_1.default;
NodeSpider.txtPipe = pipe_1.txtPipe;
NodeSpider.jsonPipe = pipe_1.jsonPipe;
exports.default = NodeSpider;
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
function requestAsync(item) {
    return new Promise((resolve, reject) => {
        request(item, (error, response, body) => {
            resolve({ error, response, body });
        });
    });
}
