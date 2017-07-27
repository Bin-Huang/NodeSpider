"use strict";
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// mysql 插件
// redis queue
// TODO B 注册pipe和queue可能存在异步操作，此时应该封装到promise或async函数。但依然存在问题：当还没注册好，就调动了queue或者save
// TODO C 更良好的报错提示
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const uuid = require("uuid/v1");
const defaultPlan_1 = require("./defaultPlan");
const queue_1 = require("./queue");
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
        // TODO B opts 检测是否合法
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
        this.on("end", () => {
            // some code，如果没有需要，就删除
        });
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
    }
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
        // 触发事件，将信号传递出去
        this.emit("end");
    }
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
    // TODO C current 应该能适应所有的plan
    retry(current, maxRetry = 1, finalErrorCallback) {
        const task = {
            hasRetried: current.hasRetried,
            info: current.info,
            maxRetry: current.maxRetry,
            planKey: current.planKey,
            url: current.url,
        };
        if (!task.hasRetried) {
            task.hasRetried = 0;
        }
        if (!task.maxRetry) {
            task.maxRetry = maxRetry;
        }
        if (!finalErrorCallback) {
            finalErrorCallback = (currentTask) => {
                console.log("达到最大重试次数，但依旧错误");
            };
        }
        if (task.hasRetried >= task.maxRetry) {
            return finalErrorCallback(current);
        }
        const plan = this._STATE.planStore.get(task.planKey);
        task.hasRetried++;
        this._STATE.queue.jumpTask(task, plan.type); // 插队到队列，重新等待执行
    }
    plan(item) {
        let newPlan;
        if (typeof item.process === "function") {
            newPlan = item;
        }
        else {
            newPlan = defaultPlan_1.default(item);
        }
        if (typeof this._STATE.option.maxConnections === "object") {
            if (typeof this._STATE.option.maxConnections[newPlan.type] === "undefined") {
                throw new Error("计划type不存在于设置项maxConnections");
            }
        }
        if (typeof this._STATE.currentConnections[newPlan.type] === "undefined") {
            this._STATE.currentConnections[newPlan.type] = 0;
        }
        const key = Symbol(`${newPlan.type}-${uuid()}`);
        this._STATE.planStore.set(key, newPlan);
        return key;
    }
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planKey 指定的爬取计划
     * @param url 待爬取的链接（们）
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    queue(planKey, url, info) {
        // 参数检验
        if (typeof planKey !== "symbol") {
            throw new TypeError("queue 参数错误");
        }
        const plan = this._STATE.planStore.get(planKey);
        if (!plan) {
            throw new Error("指定plan不存在");
        }
        // 添加到队列
        if (!Array.isArray(url)) {
            this._STATE.queue.addTask({ url, planKey, info }, plan.type);
        }
        else {
            url.map((u) => {
                if (typeof u !== "string") {
                    return new Error("url数组中存在非字符串成员");
                }
                this._STATE.queue.addTask({ url: u, planKey, info }, plan.type);
            });
        }
        this._STATE.working = true;
        return this._STATE.queue.getTotalUrlsNum();
    }
    // 关于pipeGenerator
    // 提供 add、close、init
    // 当第一次被save调用时，先触发init后再add（这样就不会生成空文件）
    // 爬虫生命周期末尾，自动调用close清理工作
    pipe(pipeObject) {
        if (typeof pipeObject !== "object" || !pipeObject.add || !pipeObject.close) {
            throw new Error("不符合pipe");
        }
        const key = Symbol("pipe-" + uuid());
        this._STATE.pipeStore.set(key, pipeObject);
        return key;
    }
    // item可以是字符串路径，也可以是对象。若字符串则保存为 txt 或json
    // 如果是对象，则获得对象的 header 属性并对要保存路径进行检测。通过则调用对象 add 方法。
    // 每一个人都可以开发 table 对象的生成器。只需要提供 header 和 add 接口。其他由开发者考虑如何完成。
    save(pipeKey, data) {
        const pipe = this._STATE.pipeStore.get(pipeKey);
        if (pipe) {
            pipe.add(data);
        }
        else {
            return new Error("unknowed pipe");
        }
    }
}
NodeSpider.Queue = queue_1.default;
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
    const plan = self._STATE.planStore.get(task.planKey);
    // task可以携带info，此时将覆盖plan设置中的info。如果task没有info，则使用plan中的
    const info = task.info;
    if (typeof info === "undefined" || info === null) {
        task.info = plan.info;
    }
    self._STATE.currentConnections[type]++;
    self._STATE.currentTotalConnections++;
    plan.process(task).then(() => {
        self._STATE.currentConnections[type]--;
        self._STATE.currentTotalConnections--;
    }).catch((e) => {
        self._STATE.currentConnections[type]--;
        self._STATE.currentTotalConnections--;
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
        if (self._STATE.currentTotalConnections === 0) {
            // TODO C 爬虫工作全部完成
            // 当所有连接已经结束，将开始执行结束
        }
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
        if (self._STATE.currentTotalConnections === 0) {
            // TODO C 爬虫工作全部完成
            // 当所有连接已经结束，将开始执行结束
        }
    }
}
