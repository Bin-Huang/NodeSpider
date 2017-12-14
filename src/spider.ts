import { EventEmitter } from "events";
import * as isAbsoluteUrl from "is-absolute-url";
import * as request from "request";
import { clearInterval } from "timers";
import { defaultPlan, IDefaultPlanOptionCallback } from "./plan/defaultPlan";
import downloadPlan from "./plan/downloadPlan";
import Queue from "./queue";
import { entries } from "./tools";
import {
    IOption,
    IOptionInput,
    IPipe,
    IPlan,
    IQueue,
    IState,
    ITask,
} from "./types";

const defaultOption: IOption = {
    concurrency: 20,
    queue: Queue,
    alive: false,
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    public _STATE: IState;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts: IOptionInput = {}) {
        super();
        ParameterOptsCheck(opts);
        const finalOption = Object.assign({}, defaultOption, opts);
        this._STATE = {
            currentTotalConnections: [],
            option: finalOption,
            pipeStore: new Map(),
            planStore: new Map(),
            queue: new finalOption.queue(),
            status: "active",
            startAt: new Date(),
            endIn: null,
            heartbeat: (finalOption.alive) ? setInterval(() => this.emit("heartbeat"), 5000) : null,
        };

        this.on("empty", () => {
            if (this._STATE.currentTotalConnections.length === 0) {
                this.emit("vacant");   // queue为空，当前异步连接为0，说明爬虫已经空闲，触发事件
            }
        });

        this.on("queueTask", (task: ITask) => {
            // this.work();
        });

    }

    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    public isExist(url: string) {
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
    public filter(urlArray: string[]) {
        if (! Array.isArray(urlArray)) {
            throw new TypeError("the parameter of the method filter is required, and can only be an array of strings");
        } else {
            const s = new Set(urlArray);
            const result = [];
            for (const url of s) {
                if (typeof url !== "string") {
                    throw new TypeError(
                        "the parameter of the method filter is required, and can only be an array of strings",
                    );
                }
                if (! this.isExist(url)) {
                    result.push(url);
                }
            }
            return result;
        }
    }

    /**
     * add new plan
     * @param  {IPlan}  newPlan plan object
     * @return {void}
     */
    public plan(name: string, newPlan: IPlan): NodeSpider {
        if (! name || ! newPlan) {
            // TODO: 修改参数检验
            throw new TypeError("method add: the parameter isn't a plan object");
        }
        if (this._STATE.planStore.has(name)) {
            throw new TypeError(`method add: there already have a plan named "${name}"`);
        }

        if (typeof newPlan === "object") {
            if (typeof newPlan.process === "function") {
                // 添加plan到planStore
                this._STATE.planStore.set(name, newPlan);
            } else {
                throw new TypeError("不是一个plan对象");
            }
        } else if (typeof newPlan === "function") {
            return this.plan(name, defaultPlan({ callback: newPlan }));
        } else {
            throw new TypeError("newplan 必须是一个plan对象，或者函数");
        }

        return this;
    }

    /**
     * connect new pipe
     * @param  {IPipe}  newPipe pipe object
     * @return {this}
     */
    public pipe(name: string, newPipe: {store: IPipe, items: string[]|{[index: string]: (v: any) => any}}): NodeSpider {
        if (typeof name !== "string") {
            throw new TypeError("method connect: the parameter isn't a pipe object");
        }
        if (this._STATE.pipeStore.has(name)) {
            throw new TypeError(`method connect: there already have a pipe named "${name}"`);
        }

        if (typeof newPipe !== "object") {
            throw new TypeError("// TODO:");
        }
        if (Array.isArray(newPipe.items)) {
            for (const item of newPipe.items) {
                if (typeof item !== "string") { throw new Error("// TODO:"); }
            }
            this._STATE.pipeStore.set(name, newPipe);
        } else if (typeof newPipe.items === "object") {
            for (const f of entries(newPipe.items)[1]) {
                if (typeof f !== "function") { throw new Error("// TODO:"); }
            }
            this._STATE.pipeStore.set(name, newPipe);
        } else {
            throw new Error("// TODO:");
        }

        // 如果参数iten是一个pipe
        return this;
    }

    public retry(current: ITask, maxRetry: number, finalErrorCallback?: () => any) {
        // 过滤出current重要的task基本信息
        const retryTask: ITask = {
            hasRetried: current.hasRetried,
            info: current.info,
            planName: current.planName,
            url: current.url,
        };
        if (typeof retryTask.hasRetried !== "number") {
            retryTask.hasRetried = 0;
        }
        if (! finalErrorCallback) {
            finalErrorCallback = () =>  { throw new Error(` ${current.url}达到最大重试次数，但依然出错`); };
        }
        if (retryTask.hasRetried >= maxRetry) {
            return finalErrorCallback();
        }
        retryTask.hasRetried ++;
        this._STATE.queue.jump(retryTask);    // 插队到队列，重新等待执行
    }

    // tslint:disable-next-line:max-line-length
    /**
     * Add url(s) to the queue and specify a plan. These task will be performed as planned when it's turn. Eventually only absolute url(s) can be added to the queue, the other will be returned in an array.
     * @param planName the name of specified plan
     * @param url url or array of urls
     * @param info (Optional). Attached information for this url
     * @returns {array}
     */
    public add(planName: string, url: string | string[], info?: any): any[] {
        const plan = this._STATE.planStore.get(planName);
        if (! plan) {
            throw new TypeError(`method queue: no such plan named "${planName}"`);
        }
        const noPassList: any[] = [];   // 因为格式不对、未能添加的成员队列
        if (! Array.isArray(url)) {
            url = [ url ];
        }
        url.map((u) => {
            if (typeof u !== "string" || ! isAbsoluteUrl(u)) {
                noPassList.push(u);
            } else {
                const newTask = { url: u, planName, info };
                this._STATE.queue.add(newTask);
                this.emit("queueTask", newTask);
                this.work();
            }
        });

        return noPassList;
    }

    public download(path: string, url: string, filename?: string) {
        if (typeof path !== "string") {
            throw new TypeError(`method download: the parameter 'path' should be a string`);
        }
        if (typeof url !== "string") {
            throw new TypeError(`method download: the parameter 'url' should be a string`);
        }
        // 如果不存在与该path相对应的 download plan，则新建一个
        if (! this._STATE.planStore.has(path)) {
            const newPlan = downloadPlan({
                callback: (err, current, s) => {
                    if (err) {
                        return s.retry(current, 3, () => console.log(err));
                    }
                },
                path,
            });
            this.plan(path, newPlan);
        }
        // 添加下载链接 url 到队列
        this.add(path, url, filename);
    }

    /**
     * Save data through a pipe
     * @param  {string} pipeName pipe name
     * @param  {any}    data     data you need to save
     * @return {void}
     */
    public save(pipeName: string, data: {[index: string]: any}) {
        if (typeof pipeName !== "string") {
            throw new TypeError(`methdo save: the parameter "pipeName" should be a string`);
        }
        if (typeof data !== "object") {
            throw new TypeError(`method save: the parameter "data" should be an object`);
        }
        const pipe = this._STATE.pipeStore.get(pipeName);
        if (!pipe) {
            throw new TypeError("//TODO:");
        }

        const { items, store } = pipe;
        let processedData: {[index: string]: any} = {};
        if (Array.isArray(items)) {
            processedData = items.map((item) => data[item]);
        } else {
            const keys = entries(items)[0];
            processedData = keys.map((key) => items[key](data[key]));
        }

        if (store.format) {
            store.write(store.format(processedData));
        } else {
            store.write(processedData.toString());
        }
    }

    public active() {
        if (this._STATE.status === "pause") {
            this._STATE.status = "active";
            this.work();
        }
    }

    public pause() {
        if (this._STATE.status === "active") {
            this._STATE.status = "pause";
        }
    }

    /**
     * 终止爬虫
     */
    public end() {
        this._STATE.status = "end";
        // 关闭注册的pipe
        for (const pipe of this._STATE.pipeStore.values()) {
            pipe.store.close();
        }
        // TODO C 更多，比如修改所有method来提醒开发者已经end
    }

    private work() {
        if (this._STATE.status !== "active") {
            if (this._STATE.currentTotalConnections.length === 0) {
                if (this._STATE.status === "pause") {
                    console.log("\nnodespider is pausing\n");
                    // TODO
                } else if (this._STATE.status === "end") {
                    if (this._STATE.heartbeat) {
                        clearInterval(this._STATE.heartbeat);
                        this._STATE.heartbeat = null;
                    }
                    this._STATE.endIn = new Date();
                    console.log("\nnodespider has ended\n");
                }
            }
            return ;
        }

        const count = this._STATE.option.concurrency - this._STATE.currentTotalConnections.length;
        if (count <= 0) {
            return ;
        }
        const task = this._STATE.queue.next();
        if (! task) { return this.emit("empty"); }

        this._STATE.currentTotalConnections.push(task);
        const plan = this._STATE.planStore.get(task.planName) as IPlan;
        plan.process(task, this).then(() => {
            const ix = this._STATE.currentTotalConnections.findIndex((t) => t.url === task.url);
            this._STATE.currentTotalConnections.splice(ix, 1);

            this.work();
        }).catch((e: Error) => {
            // 如果计划执行失败，这是非常严重的，因为直接会导致爬虫不能完成开发者制定的任务
            const ix = this._STATE.currentTotalConnections.findIndex((t) => t.url === task.url);
            this._STATE.currentTotalConnections.splice(ix, 1);

            this.end(); // 停止爬虫并退出，以提醒并便于开发者debug
            console.error(`An error is threw from plan execution.
                Check your callback function, or create an issue in the planGenerator's repository`);
            throw e;
        });
    }
}

/**
 * to check whether the parameter option is legal to initialize a spider, if not return the error
 * @param opts the option object
 */
function ParameterOptsCheck(opts: IOptionInput): null {
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
    if (opts.queue) {

    }
    return null;
}
