"use strict";
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
const isAbsoluteUrl = require("is-absolute-url");
const uuid = require("uuid");
const downloadPlan_1 = require("./plan/downloadPlan");
const queue_1 = require("./queue");
const defaultOption = {
    concurrency: 20,
    queue: new queue_1.default(),
    pool: new Set(),
};
const e = {
    statusChange: "statusChange",
    addTask: "addTask",
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
        ParameterOptsCheck(option);
        const finalOption = Object.assign({}, defaultOption, option);
        this._STATE = {
            currentTasks: [],
            opts: finalOption,
            pipeStore: new Map(),
            planStore: new Map(),
            queue: finalOption.queue,
            pool: finalOption.pool,
            status: "vacant",
            heartbeat: setInterval(() => this.emit(e.heartbeat), 4000),
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
            this.work();
        });
        this.on(e.heartbeat, this.work);
    }
    /**
     * 终止爬虫
     */
    end() {
        // 关闭注册的pipe
        changeStatus("end", this);
        for (const pipe of this._STATE.pipeStore.values()) {
            pipe.close();
        }
        clearInterval(this._STATE.heartbeat);
        this.emit(e.goodbye);
    }
    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    isExist(url) {
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
                if (!this.isExist(url)) {
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
    add(name, plan) {
        if (this._STATE.planStore.has(name)) {
            throw new TypeError(`method add: there already have a plan named "${plan.name}"`);
        }
        // 添加plan到planStore
        this._STATE.planStore.set(name, plan);
    }
    /**
     * connect new pipe
     * @param  {IPipe}  newPipe pipe object
     * @return {void}
     */
    connect(newPipe) {
        if (!newPipe.name) {
            throw new TypeError("method connect: the parameter isn't a pipe object");
        }
        if (this._STATE.pipeStore.has(newPipe.name)) {
            throw new TypeError(`method connect: there already have a pipe named "${newPipe.name}"`);
        }
        // 如果参数iten是一个pipe
        this._STATE.pipeStore.set(newPipe.name, newPipe);
        return;
    }
    retry(current, maxRetry, finalErrorCallback) {
        // 过滤出current重要的task基本信息
        const retryTask = {
            uid: current.uid,
            hasRetried: current.hasRetried,
            info: current.info,
            planName: current.planName,
            url: current.url,
        };
        if (!retryTask.hasRetried) {
            retryTask.hasRetried = 0;
        }
        if (!finalErrorCallback) {
            finalErrorCallback = () => {
                throw new Error(`
                    ${current.url}达到最大重试次数，但依然出错
                `);
            };
        }
        if (retryTask.hasRetried >= maxRetry) {
            return finalErrorCallback();
        }
        retryTask.hasRetried++;
        this._STATE.queue.jump(retryTask); // 插队到队列，重新等待执行
        this.emit(e.addTask, retryTask); // TODO: 确定让重试任务也触发“addTask”事件？
    }
    /**
     * add new default plan
     * @param option default plan's option
     */
    // public plan(name: string, callback: IDefaultPlanCallback) {
    //     if (typeof name !== "string") {
    //         throw new TypeError(`method plan: failed to add new plan.
    //         then parameter "name" should be a string`);
    //     }
    //     if (typeof callback !== "function") {
    //         throw new TypeError(`method plan: failed to add new plan.
    //         then parameter "callback" should be a function`);
    //     }
    //     if (this._STATE.planStore.has(name)) {
    //         throw new TypeError(`method plan: Can not add new plan named "${name}".
    //         There are already a plan called "${name}".`);
    //     }
    //     return this.add(name, defaultPlan({
    //         callbacks: [
    //             NodeSpider.preToUtf8,
    //             NodeSpider.preLoadJq,
    //             callback,
    //         ],
    //         name,
    //     }));
    // }
    // tslint:disable-next-line:max-line-length
    /**
     * Add url(s) to the queue and specify a plan.
     * These task will be performed as planned when it's turn.
     * Eventually only absolute url(s) can be added to the queue, the other will be returned in an array.
     * @param planName the name of specified plan
     * @param url url or array of urls
     * @param info (Optional). Attached information for this url
     * @returns {array}
     */
    queue(planName, url, info) {
        const plan = this._STATE.planStore.get(planName);
        if (!plan) {
            throw new TypeError(`method queue: no such plan named "${planName}"`);
        }
        const noPassList = []; // 因为格式不对、未能添加的成员队列
        if (!Array.isArray(url)) {
            url = [url];
        }
        url.map((u) => {
            if (typeof u !== "string" || !isAbsoluteUrl(u)) {
                noPassList.push(u);
            }
            else {
                const newTask = { uid: uuid(), url: u, planName, info };
                this._STATE.queue.add(newTask);
                this._STATE.pool.add(newTask.url);
                this.emit(e.addTask, newTask);
            }
        });
        return noPassList;
    }
    download(path, url, filename) {
        if (typeof path !== "string") {
            throw new TypeError(`method download: the parameter 'path' should be a string`);
        }
        if (typeof url !== "string") {
            throw new TypeError(`method download: the parameter 'url' should be a string`);
        }
        // 如果不存在与该path相对应的 download plan，则新建一个
        if (!this._STATE.planStore.has(path)) {
            const newPlan = downloadPlan_1.default({
                callback: (err, current, s) => {
                    if (err) {
                        return s.retry(current, 3, () => console.log(err));
                    }
                },
                path,
            });
            this.add(name, newPlan);
        }
        // 添加下载链接 url 到队列
        this.queue(path, url, filename);
    }
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
        const pipe = this._STATE.pipeStore.get(pipeName);
        if (!pipe) {
            throw new TypeError(`method save: no such pipe named ${pipeName}`);
        }
        else {
            pipe.add(data);
        }
    }
    work() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._STATE.status === "active") {
                const maxConcurrency = this._STATE.opts.concurrency;
                const currentTasksNum = this._STATE.currentTasks.length;
                if (maxConcurrency - currentTasksNum > 0) {
                    const currentTask = this._STATE.queue.next();
                    if (!currentTask) {
                        this.emit(e.queueEmpty);
                    }
                    else {
                        this._STATE.currentTasks.push(currentTask);
                        this.work(); // 不断递归，使爬虫并发任务数量尽可能达到最大限制
                        const plan = this._STATE.planStore.get(currentTask.planName);
                        try {
                            yield plan(currentTask, this);
                        }
                        catch (e) {
                            this.end(); // 停止爬虫并退出，以提醒并便于开发者debug
                            console.error(`An error is threw from plan execution.
                            Check your callback function, or create an issue in the planGenerator's repository`);
                            throw e;
                        }
                        this._STATE.currentTasks = this._STATE.currentTasks.filter(({ uid }) => uid !== currentTask.uid);
                    }
                }
            }
        });
    }
}
exports.default = NodeSpider;
/**
 * to check whether the parameter option is legal to initialize a spider, if not return the error
 * @param opts the option object
 */
function ParameterOptsCheck(opts) {
    // check type of parameter opts
    if (typeof opts !== "object") {
        throw new TypeError(`Paramter option is no required, and it should be a object.
            But ${opts} as you passed, it is a ${typeof opts}.
        `);
    }
    // check property concurrency
    const concurrency = opts.concurrency;
    if (concurrency && typeof concurrency !== "number" && typeof concurrency !== "object") {
        throw new TypeError(`option.concurrency is no required, but it must be a number.
            { concurrency: ${opts.concurrency} }
        `);
    }
    if (concurrency && typeof concurrency === "object") {
        for (const key in opts.concurrency) {
            if (opts.concurrency.hasOwnProperty(key)) {
                const max = opts.concurrency[key];
                if (typeof max !== "number") {
                    throw new TypeError(`all of option.concurrency's property's value should be number.
                        But in you option, it is that: { concurrency: {..., {${key}: ${max}},...} }
                    `);
                }
            }
        }
    }
    // check property rateLimit
    if (opts.rateLimit && typeof opts.rateLimit !== "number") {
        throw new TypeError(`option.rateLimit is no required, but it must be a number.
            { rateLimit: ${opts.rateLimit} }
        `);
    }
    // check property queue
    // TODO C how to check the queue? queue should be a class, and maybe need parameter to init?
    return null;
}
function changeStatus(status, spider) {
    const preStatus = spider._STATE.status;
    spider._STATE.status = status;
    spider.emit(e.statusChange, status, preStatus);
}
