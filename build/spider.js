"use strict";
// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// mysql 插件
// redis queue
// TODO B 注册pipe和queue可能存在异步操作，此时应该封装到promise或async函数。但依然存在问题：当还没注册好，就调动了queue或者save
// TODO C 兼容新 plan 系统的 queue
// TODO C 更良好的报错提示
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const uuid = require("uuid");
const defaultPlan_1 = require("./defaultPlan");
const queue_1 = require("./queue");
const plan_1 = require("./plan");
const defaultOption = {
    maxTotalConnections: 20,
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
            currentConnections: new Map(),
            currentTotalConnections: 0,
            maxConnections: new Map(),
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
        this._STATE.timer = setInterval(() => {
            if (this._STATE.currentTotalConnections >= this._STATE.option.maxTotalConnections) {
                return; // 当全局连接数达到设置的最大连接数限制，则直接返回
            }
            let targetType = null;
            let newTask = null;
            const planTypes = this._STATE.currentConnections.keys();
            for (const type of planTypes) {
                const current = this._STATE.currentConnections.get(type);
                const max = this._STATE.maxConnections.get(type);
                if (current < max) {
                    const task = this._STATE.queue.nextTask(type);
                    if (task) {
                        targetType = type;
                        newTask = task;
                    }
                    break; // 每次定时器启动，只开始一个指定计划当前连接数未达到最大的新任务。
                }
            }
            if (targetType && newTask) {
                const plan = this._STATE.planStore.get(newTask.planKey);
                if (!plan) {
                    console.log("不应该出现的错误。从queue中获得的task，根据key获得planStore中plan，plan却不存在");
                    return;
                }
                const specialOpts = Object.assign({}, plan.options, newTask.special);
                const t = Object.assign({}, newTask, { specialOpts });
                const current = this._STATE.currentConnections.get(targetType);
                this._STATE.currentConnections.set(targetType, current + 1);
                this._STATE.currentTotalConnections++;
                plan.process(t, this).then(() => {
                    this._STATE.currentConnections.set(targetType, current - 1);
                    this._STATE.currentTotalConnections--;
                }).catch((e) => {
                    console.log(e);
                    this._STATE.currentConnections.set(targetType, current - 1);
                    this._STATE.currentTotalConnections--;
                });
            }
        }, this._STATE.option.rateLimit);
    }
    end() {
        // 爬虫不再定时从任务队列获得新任务
        clearInterval(this._STATE.timer);
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
            maxRetry: current.maxRetry,
            planKey: current.planKey,
            special: current.special,
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
        const plan = current.plan;
        task.hasRetried++;
        this._STATE.queue.jumpTask(task, plan.type); // 插队到队列，重新等待执行
    }
    plan(item) {
        let newPlan = item;
        if (item instanceof plan_1.default) {
            newPlan = item;
        }
        else {
            newPlan = defaultPlan_1.default(item);
        }
        const key = Symbol(`${newPlan.type}-${uuid()}`);
        this._STATE.planStore.set(key, newPlan);
        // TODO C 单元测试
        if (!this._STATE.currentConnections.has(newPlan.type)) {
            this._STATE.currentConnections.set(newPlan.type, 0);
            this._STATE.maxConnections.set(newPlan.type, newPlan.multi);
        }
        return key;
    }
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planKey 指定的爬取计划
     * @param url 待爬取的链接（们）
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    queue(planKey, url, special) {
        // 参数检验
        if (typeof planKey !== "symbol") {
            throw new TypeError("queue 参数错误");
        }
        const plan = this._STATE.planStore.get(planKey);
        if (!plan) {
            throw new Error("指定plan不存在");
        }
        // 添加到队列
        // TODO C 完善 special: 过滤掉其中不相干的成员？
        if (!Array.isArray(url)) {
            this._STATE.queue.addTask({ url, planKey, special }, plan.type);
        }
        else {
            url.map((u) => {
                if (typeof u !== "string") {
                    return new Error("url数组中存在非字符串成员");
                }
                this._STATE.queue.addTask({ url: u, planKey, special }, plan.type);
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
