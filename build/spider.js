"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const defaultPlan_1 = require("./defaultPlan");
const queue_1 = require("./queue");
// TODO C save as single file
const defaultOption = {
    maxConnections: 20,
    queue: queue_1.default,
    rateLimit: 2,
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
        ParameterOptsCheck(opts);
        const finalOption = Object.assign({}, defaultOption, opts);
        this._STATE = {
            currentConnections: {},
            currentTotalConnections: 0,
            option: finalOption,
            pipeStore: new Map(),
            planStore: new Map(),
            queue: new finalOption.queue(),
            timer: null,
            working: true,
        };
        this.on("empty", () => {
            if (this._STATE.currentTotalConnections === 0) {
                this.emit("vacant"); // queue为空，当前异步连接为0，说明爬虫已经空闲，触发事件
            }
        });
        this.on("vacant", () => {
            if (this._STATE.timer) {
                clearInterval(this._STATE.timer);
                this._STATE.timer = null;
            }
        });
        this.on("queueTask", (task) => {
            if (this._STATE.timer) {
                return;
            }
            if (typeof this._STATE.option.maxConnections === "number") {
                this._STATE.timer = setInterval(() => {
                    timerCallbackWhenMaxIsNumber(this);
                }, this._STATE.option.rateLimit);
            }
            else {
                this._STATE.timer = setInterval(() => {
                    timerCallbackWhenMaxIsObject(this);
                }, this._STATE.option.rateLimit);
            }
        });
    }
    /**
     * 终止爬虫
     */
    end() {
        // 爬虫不再定时从任务队列获得新任务
        if (this._STATE.timer) {
            clearInterval(this._STATE.timer);
        }
        // 关闭注册的pipe
        for (const pipe of this._STATE.pipeStore.values()) {
            pipe.close();
        }
        // TODO C 更多，比如修改所有method来提醒开发者已经end
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
        return this._STATE.queue.check(url);
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
     * add new plan or pipe, and return a corresponding key.
     * @param item planObject or PipeObject
     */
    add(item) {
        if (!item.name) {
            throw new TypeError("");
        }
        const name = item.name;
        if (this._STATE.planStore.has(name)) {
            // TODO C 重名报错
        }
        if (this._STATE.pipeStore.has(name)) {
            // TODO C 重名报错
        }
        // 如果参数item是plan
        if (item.process) {
            const newPlan = item;
            // 当设置 maxConnections 是一个对象（即对不同type进行同时连接限制），如果添加的plan的type不存在设置，报错
            if (typeof this._STATE.option.maxConnections === "object") {
                if (typeof this._STATE.option.maxConnections[name] === "undefined") {
                    throw new Error(`
                        The plan's name "${name}" don't exist in the option maxConnections.
                    `);
                }
            }
            // 如果plan类型是第一次添加，在state中初始化一个该类型的当前连接数信息
            if (typeof this._STATE.currentConnections[name] === "undefined") {
                this._STATE.currentConnections[name] = 0;
            }
            // 添加plan到planStore
            this._STATE.planStore.set(name, newPlan);
            return;
        }
        // 如果参数iten是一个pipe
        if (item.add && item.close) {
            const newPipe = item;
            this._STATE.pipeStore.set(name, newPipe);
            return;
        }
        // 如果参数不是pipe或者plan，报错
        throw new TypeError(`Spider.prototype.add:
            The parameter's type is unknown.It should be a planObject or pipeObject.
        `);
    }
    retry(current, maxRetry, finalErrorCallback) {
        // 过滤出current重要的task基本信息
        const retryTask = {
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
        this._STATE.queue.jumpTask(retryTask, current.planName); // 插队到队列，重新等待执行
    }
    /**
     * add new default plan, and return a corresponding key.
     * @param option default plan's option
     */
    plan(name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(`method plan: failed to add new plan.
            then parameter "name" should be a string`);
        }
        if (typeof callback !== "function") {
            throw new TypeError(`method plan: failed to add new plan.
            then parameter "callback" should be a function`);
        }
        if (this._STATE.planStore.has(name)) {
            throw new TypeError(`method plan: Can not add new plan named "${name}".
            There is already a plan called "${name}".`);
        }
        return this.add(defaultPlan_1.defaultPlan({
            name,
            callbacks: [
                NodeSpider.preToUtf8,
                NodeSpider.preLoadJq,
                callback,
            ],
        }));
    }
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planName 指定的爬取计划
     * @param url 待爬取的链接（们）
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    queue(planName, url, info) {
        const plan = this._STATE.planStore.get(planName);
        if (!plan) {
            throw new TypeError(`method queue: no such plan named "${planName}"`);
        }
        // 添加到队列
        const newTasks = [];
        if (!Array.isArray(url)) {
            newTasks.push({ url, planName, info });
        }
        else {
            url.map((u) => {
                if (typeof u !== "string") {
                    throw new TypeError(`the parameter "url" should be a string or an string array`);
                }
                newTasks.push({ url: u, planName, info });
            });
        }
        for (const task of newTasks) {
            this._STATE.queue.addTask(task, planName);
            this.emit("queueTask", task);
        }
        this._STATE.working = true;
        return this._STATE.queue.getTotalUrlsNum();
    }
    // item可以是字符串路径，也可以是对象。若字符串则保存为 txt 或json
    // 如果是对象，则获得对象的 header 属性并对要保存路径进行检测。通过则调用对象 add 方法。
    // 每一个人都可以开发 table 对象的生成器。只需要提供 header 和 add 接口。其他由开发者考虑如何完成。
    save(pipeName, data) {
        // if (typeof pipeName !== "symbol") {
        //     throw new TypeError(`
        //         """save(pipeKey, data)"""
        //         The parameter pipeKey should be a symbol returned from calling the method pipe!
        //     `);
        // }
        if (typeof data !== "object") {
            throw new TypeError(`
                """save(pipeKey, data)"""
                The parameter data should be a object!
            `);
        }
        const pipe = this._STATE.pipeStore.get(pipeName);
        if (pipe) {
            pipe.add(data);
        }
        else {
            return new TypeError(`
                The pipeKey you passed map to nothing. No such pipeKey is linked to a defined pipe.
                The parameter pipeKey should be the return of the method pipe
            `);
        }
    }
}
NodeSpider.preToUtf8 = defaultPlan_1.preToUtf8;
NodeSpider.preLoadJq = defaultPlan_1.preLoadJq;
exports.default = NodeSpider;
/**
 * 尝试从queue获得一个task，使其对应的type存在于规定的type数组。如果存在满足的任务，则返回[type, task]，否则[null, null]
 * @param types 规定的type数组
 * @param queue nodespider的queue
 */
function getTaskByTypes(types, queue) {
    let newTask = null;
    let newTaskType = null;
    for (const type of types) {
        const t = queue.nextTask(type);
        if (t) {
            newTask = t;
            newTaskType = type;
            break;
        }
    }
    return [newTaskType, newTask];
}
/**
 * 执行新任务，并记录连接数（执行时+1，执行后-1)
 * @param type task 对应plan的type
 * @param task 需要执行的任务
 * @param self nodespider实例（this）
 */
function startTask(type, task, self) {
    const plan = self._STATE.planStore.get(task.planName);
    const current = Object.assign({}, task, { info: task.info });
    task.info = typeof task.info === "undefined" ? {} : task.info;
    self._STATE.currentConnections[type]++;
    self._STATE.currentTotalConnections++;
    plan.process(task, self).then(() => {
        self._STATE.currentConnections[type]--;
        self._STATE.currentTotalConnections--;
    }).catch((e) => {
        // 如果计划执行失败，这是非常严重的，因为直接会导致爬虫不能完成开发者制定的任务
        self._STATE.currentConnections[type]--;
        self._STATE.currentTotalConnections--;
        self.end(); // 停止爬虫并退出，以提醒并便于开发者debug
        console.error(`An error is threw from plan execution.
            Check your callback function, or create an issue in the planGenerator's repository`);
        throw e;
    });
}
/**
 * 注意，使用时需要将this指向nodespider实例 bind(this)
 */
function timerCallbackWhenMaxIsNumber(self) {
    // 检查是否达到最大连接限制，是则终止接下来的操作
    if (self._STATE.option.maxConnections <= self._STATE.currentTotalConnections) {
        return;
    }
    // 获得所有 type 组成的数组
    const types = [];
    for (const type in self._STATE.currentConnections) {
        if (self._STATE.currentConnections.hasOwnProperty(type)) {
            types.push(type);
        }
    }
    // 尝试获得新任务
    const [type, task] = getTaskByTypes(types, self._STATE.queue);
    // 如果成功获得新任务，则执行。否则，则说明queue中没有新的任务需要执行
    if (type && task) {
        startTask(type, task, self);
    }
    else {
        self.emit("empty");
    }
}
function timerCallbackWhenMaxIsObject(self) {
    // 获得连接数未达到最大限制的 type 组成的数组
    const types = [];
    for (const type in self._STATE.currentConnections) {
        if (self._STATE.currentConnections.hasOwnProperty(type)) {
            const current = self._STATE.currentConnections[type];
            const max = self._STATE.option.maxConnections[type];
            if (current < max) {
                types.push(type);
            }
        }
    }
    // 如果所有type对应的连接数均已达到最大限制，则终止后面的操作
    if (types.length === 0) {
        return;
    }
    // 尝试获得新任务
    const [type, task] = getTaskByTypes(types, self._STATE.queue);
    // 如果成功获得新任务，则执行。否则，则说明queue中没有新的任务需要执行
    if (type && task) {
        startTask(type, task, self);
    }
    else {
        self.emit("empty"); // 说明queue已为空，触发事件
    }
}
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
    // check property maxConnection
    const maxConnections = opts.maxConnections;
    if (maxConnections && typeof maxConnections !== "number" && typeof maxConnections !== "object") {
        throw new TypeError(`option.maxConnections is no required, but it must be a number.
            { maxConnections: ${opts.maxConnections} }
        `);
    }
    if (maxConnections && typeof maxConnections === "object") {
        for (const key in opts.maxConnections) {
            if (opts.maxConnections.hasOwnProperty(key)) {
                const max = opts.maxConnections[key];
                if (typeof max !== "number") {
                    throw new TypeError(`all of option.maxConnection's property's value should be number.
                        But in you option, it is that: { maxConnections: {..., {${key}: ${max}},...} }
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
    if (opts.queue) {
    }
    return null;
}
