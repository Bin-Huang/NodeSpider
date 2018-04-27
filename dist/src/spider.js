"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const pRetry = require("p-retry");
const uuid = require("uuid");
const queue_1 = require("./queue");
const defaultOption = {
    concurrency: 20,
    queue: new queue_1.default(),
    pool: new Set(),
    heartbeat: 4000,
};
const e = {
    statusChange: "statusChange",
    addTask: "addTask",
    taskDone: "taskDone",
    queueEmpty: "queueEmpty",
    heartbeat: "heartbeat",
    goodbye: "goodbye",
};
/**
 * class of NodeSpider
 * @class NodeSpider
 */
class NodeSpider extends events_1.EventEmitter {
    /**
     * create an instance of NodeSpider
     * @param option
     */
    constructor(option = {}) {
        super();
        const opts = Object.assign({}, defaultOption, option);
        this._STATE = {
            opts,
            currentTasks: [],
            pipeStore: [],
            planStore: [],
            queue: opts.queue,
            heartbeat: setInterval(() => this.emit(e.heartbeat), opts.heartbeat),
            pool: opts.pool,
            status: "vacant",
        };
        this.on(e.queueEmpty, () => {
            if (this._STATE.currentTasks.length === 0) {
                changeStatus("vacant", this);
            }
        });
        this.on(e.addTask, () => {
            if (this._STATE.status === "vacant") {
                changeStatus("active", this);
            }
            startTask(this);
        });
        this.on(e.heartbeat, () => startTask(this));
        this.on(e.taskDone, () => {
            if (this._STATE.status === "active") {
                startTask(this);
            }
            else if (this._STATE.status === "end" && this._STATE.currentTasks.length === 0) {
                for (const pipe of this._STATE.pipeStore) {
                    pipe.end();
                }
                clearInterval(this._STATE.heartbeat);
                this.emit(e.goodbye);
            }
        });
    }
    /**
     * 终止爬虫
     */
    end() {
        changeStatus("end", this);
    }
    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    has(url) {
        if (typeof url !== "string") {
            throw new TypeError(`the parameter of method isExist should be a string`);
        }
        return this._STATE.pool.has(url);
    }
    /**
     * 过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组
     * @param urlArray {array}
     * @returns {array}
     */
    filter(urlArray) {
        if (!Array.isArray(urlArray)) {
            throw new TypeError("the parameter of the method filter is required, and can only be an array of strings");
        }
        else {
            const s = new Set(urlArray);
            const result = [];
            for (const url of s) {
                if (typeof url !== "string") {
                    throw new TypeError("the parameter of the method filter is required, and can only be an array of strings");
                }
                if (!this.has(url)) {
                    result.push(url);
                }
            }
            return result;
        }
    }
    /**
     * add new plan
     * @param  {IPlan}  plan plan object
     * @return {void}
     */
    plan(plan) {
        if (this._STATE.planStore.find((p) => p.name === plan.name)) {
            throw new TypeError(`method add: there already have a plan named "${plan.name}"`);
        }
        this._STATE.planStore.push(plan);
    }
    /**
     * connect new pipe
     * @param  {IPipe}  target pipe object
     * @return {void}
     */
    pipe(newPipe) {
        if (this._STATE.pipeStore.find((p) => p.name === newPipe.name)) {
            throw new TypeError(`method connect: there already have a pipe named "${name}"`);
        }
        this._STATE.pipeStore.push(newPipe);
    }
    /**
     * add new tasks, return tasks' uuids
     * @param planName target plan name
     * @param url url(s)
     * @param info attached information
     */
    add(planName, url, info) {
        const plan = this._STATE.planStore.find((p) => p.name === planName);
        if (!plan) {
            throw new TypeError(`method queue: no such plan named "${planName}"`);
        }
        const urls = Array.isArray(url) ? url : [url];
        const tasks = urls.map((u) => ({ uid: uuid(), url: u, planName, info }));
        for (const task of tasks) {
            this._STATE.queue.add(task);
            this._STATE.pool.add(task.url);
            this.emit(e.addTask, task);
        }
        return tasks.map((t) => t.uid);
    }
    /**
     * filter new tasks and add, return tasks' uuids
     * @param planName target plan name
     * @param url url(s)
     * @param info attached information
     */
    addU(planName, url, info) {
        const urls = Array.isArray(url) ? url : [url];
        return this.add(planName, this.filter(urls), info);
    }
    // public download(path: string, url: string, filename?: string) {
    //     if (typeof path !== "string") {
    //         throw new TypeError(`method download: the parameter 'path' should be a string`);
    //     }
    //     if (typeof url !== "string") {
    //         throw new TypeError(`method download: the parameter 'url' should be a string`);
    //     }
    //     // 如果不存在与该path相对应的 download plan，则新建一个
    //     if (! this._STATE.planStore.has(path)) {
    //         const newPlan = downloadPlan({
    //             callback: (err, current, s) => {
    //                 if (err) {
    //                     return s.retry(current, 3, () => console.log(err));
    //                 }
    //             },
    //             path,
    //         });
    //         this.plan(name, newPlan);
    //     }
    //     // 添加下载链接 url 到队列
    //     this.add(path, url, { filename });
    // }
    /**
     * Save data through a pipe
     * @param  {string} pipeName pipe name
     * @param  {any}    data     data you need to save
     * @return {void}
     */
    save(pipeName, data) {
        if (typeof pipeName !== "string") {
            throw new TypeError(`methdo save: the parameter "pipeName" should be a string`);
        }
        if (typeof data !== "object") {
            throw new TypeError(`method save: the parameter "data" should be an object`);
        }
        const pipe = this._STATE.pipeStore.find((p) => p.name === pipeName);
        if (!pipe) {
            throw new TypeError(`method save: no such pipe named ${pipeName}`);
        }
        if (!pipe.items) {
            pipe.items = Object.keys(data);
        }
        const d = (Array.isArray(pipe.items)) ?
            pipe.items.map((item) => (typeof data[item] !== "undefined") ? data[item] : null)
            : Object.entries(pipe.items).map(([item, fn]) => (typeof data[item] !== "undefined") ? fn(data[item]) : null);
        pipe.write(d);
    }
}
exports.default = NodeSpider;
function changeStatus(status, spider) {
    const preStatus = spider._STATE.status;
    spider._STATE.status = status;
    spider.emit(e.statusChange, status, preStatus);
}
async function startTask(spider) {
    if (spider._STATE.status === "active") {
        const maxConcurrency = spider._STATE.opts.concurrency;
        const currentTasksNum = spider._STATE.currentTasks.length;
        if (maxConcurrency - currentTasksNum > 0) {
            const currentTask = spider._STATE.queue.next();
            if (!currentTask) {
                spider.emit(e.queueEmpty);
            }
            else {
                spider._STATE.currentTasks.push(currentTask);
                startTask(spider); // 不断递归，使爬虫并发任务数量尽可能达到最大限制
                const plan = spider._STATE.planStore.find((p) => p.name === currentTask.planName);
                await pRetry(() => plan.process(currentTask, spider), { retries: plan.retries })
                    .catch((err) => plan.catch(err, currentTask, spider));
                spider._STATE.currentTasks = spider._STATE.currentTasks.filter(({ uid }) => uid !== currentTask.uid);
                spider.emit(e.taskDone, currentTask);
            }
        }
    }
}
//# sourceMappingURL=spider.js.map