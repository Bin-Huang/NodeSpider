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
    heartbeat: 2000,
    genUUID: uuid,
    stillAlive: false,
};
const event = {
    statusChange: "statusChange",
    addTask: "addTask",
    taskStart: "taskStart",
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
            heartbeat: setInterval(() => this.emit(event.heartbeat), opts.heartbeat),
            pool: opts.pool,
            status: "vacant",
        };
        this.on(event.queueEmpty, () => {
            if (this._STATE.currentTasks.length === 0) {
                changeStatus("vacant", this);
            }
        });
        this.on(event.addTask, () => work(this));
        this.on(event.taskDone, () => work(this));
        this.on(event.heartbeat, () => work(this));
    }
    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    has(url) {
        if (typeof url !== "string") {
            throw new TypeError(`url is required and must be a string`);
        }
        return this._STATE.pool.has(url);
    }
    /**
     * 过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组
     * @param urls {array}
     * @returns {array}
     */
    filter(urls) {
        if (!Array.isArray(urls)) {
            throw new TypeError(`urls is required and must be an array of strings`);
        }
        else {
            const s = new Set(urls);
            const result = [];
            for (const url of s) {
                if (typeof url !== "string") {
                    throw new TypeError(`urls is required and must be an array of strings`);
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
            throw new TypeError(`The plan named "${plan.name}" already exists`);
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
            throw new TypeError(`The pipe named "${name}" already exists`);
        }
        this._STATE.pipeStore.push(newPipe);
    }
    /**
     * add new tasks, return tasks' uuids
     * @param planName target plan name
     * @param url url(s)
     * @param info attached information
     */
    add(planName, url, info = {}) {
        const plan = this._STATE.planStore.find((p) => p.name === planName);
        if (!plan) {
            throw new TypeError(`No such plan named "${planName}"`);
        }
        const urls = Array.isArray(url) ? url : [url];
        const tasks = urls.map((u) => ({
            uid: this._STATE.opts.genUUID(),
            url: u,
            planName,
            info: JSON.parse(JSON.stringify(info)),
        }));
        for (const task of tasks) {
            this._STATE.queue.add(task);
            this._STATE.pool.add(task.url);
            this.emit(event.addTask, task);
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
    /**
     * Save data through a pipe
     * @param  {string} pipeName pipe name
     * @param  {any}    data     data you need to save
     * @return {void}
     */
    save(pipeName, data) {
        if (typeof pipeName !== "string") {
            throw new TypeError(`pipeName is required and must be a string`);
        }
        if (typeof data !== "object") {
            throw new TypeError(`data is required and must be a object`);
        }
        const pipe = this._STATE.pipeStore.find((p) => p.name === pipeName);
        if (!pipe) {
            throw new TypeError(`No such pipe named ${pipeName}`);
        }
        if (!pipe.items) {
            pipe.items = Object.keys(data);
        }
        const d = (Array.isArray(pipe.items)) ?
            pipe.items.map((item) => (typeof data[item] !== "undefined") ? data[item] : null)
            : Object.entries(pipe.items).map(([item, fn]) => (typeof data[item] !== "undefined") ? fn(data[item]) : null);
        pipe.write(d);
    }
    pause() {
        changeStatus("pause", this);
    }
    active() {
        changeStatus("active", this);
    }
    end() {
        changeStatus("end", this);
    }
}
exports.default = NodeSpider;
function changeStatus(status, spider) {
    const preStatus = spider._STATE.status;
    spider._STATE.status = status;
    spider.emit(event.statusChange, status, preStatus);
}
async function startTask(task, spider) {
    spider._STATE.currentTasks.push(task);
    spider.emit(event.taskStart, task);
    const plan = spider._STATE.planStore.find((p) => p.name === task.planName);
    await pRetry(() => plan.process(task, spider), { retries: plan.retries })
        .catch((err) => plan.catch(err, task, spider));
    spider._STATE.currentTasks = spider._STATE.currentTasks.filter(({ uid }) => uid !== task.uid);
    spider.emit(event.taskDone, task);
}
function isFullyLoaded(spider) {
    const maxConcurrency = spider._STATE.opts.concurrency;
    const currentTasksNum = spider._STATE.currentTasks.length;
    return currentTasksNum >= maxConcurrency;
}
async function work(spider) {
    if (spider._STATE.status === "active" && !isFullyLoaded(spider)) {
        const task = spider._STATE.queue.next();
        if (task) {
            startTask(task, spider);
            work(spider);
        }
        else {
            spider.emit(event.queueEmpty);
        }
    }
    else if (spider._STATE.status === "vacant" && !isFullyLoaded(spider)) {
        const task = spider._STATE.queue.next();
        if (task) {
            startTask(task, spider);
            work(spider);
            changeStatus("active", spider);
        }
        else {
            spider.emit(event.queueEmpty);
            if (!spider._STATE.opts.stillAlive) {
                spider.end();
            }
        }
    }
    else if (spider._STATE.status === "end" && spider._STATE.currentTasks.length === 0) {
        for (const pipe of spider._STATE.pipeStore) {
            pipe.end();
        }
        clearInterval(spider._STATE.heartbeat);
        spider.emit(event.goodbye);
    }
}
//# sourceMappingURL=spider.js.map