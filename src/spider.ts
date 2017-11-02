import { EventEmitter } from "events";
import * as isAbsoluteUrl from "is-absolute-url";
import * as request from "request";
import { defaultPlan, IDefaultPlanOptionCallback, preLoadJq, preToUtf8 } from "./plan/defaultPlan";
import downloadPlan from "./plan/downloadPlan";
import Queue from "./queue";
import {
    ICurrent,
    IDefaultOption,
    IDefaultOptionInput,
    IPipe,
    IPlan,
    IQueue,
    IState,
    ITask,
} from "./types";

const defaultOption: IDefaultOption = {
    concurrency: 20,
    queue: Queue,
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    public static preToUtf8 = preToUtf8;
    public static preLoadJq = preLoadJq;
    public _STATE: IState;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts: IDefaultOptionInput = {}) {
        super();
        ParameterOptsCheck(opts);
        const finalOption = Object.assign({}, defaultOption, opts);
        this._STATE = {
            currentTotalConnections: 0,
            option: finalOption,
            pipeStore: new Map(),
            planStore: new Map(),
            queue: new finalOption.queue(),
            working: true,
        };

        this.on("empty", () => {
            if (this._STATE.currentTotalConnections === 0) {
                this.emit("vacant");   // queue为空，当前异步连接为0，说明爬虫已经空闲，触发事件
            }
        });

        this.on("queueTask", (task: ITask) => {
            // this.work();
        });

    }

    /**
     * 终止爬虫
     */
    public end() {
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
    public add(newPlan: IPlan) {
        if (! newPlan.name || ! newPlan.process) {
            throw new TypeError("method add: the parameter isn't a plan object");
        }
        if (this._STATE.planStore.has(newPlan.name)) {
            throw new TypeError(`method add: there already have a plan named "${newPlan.name}"`);
        }
        // 添加plan到planStore
        this._STATE.planStore.set(newPlan.name, newPlan);
        return ;
    }

    /**
     * connect new pipe
     * @param  {IPipe}  newPipe pipe object
     * @return {void}
     */
    public connect(newPipe: IPipe) {
        if (! newPipe.name) {
            throw new TypeError("method connect: the parameter isn't a pipe object");
        }
        if (this._STATE.pipeStore.has(newPipe.name)) {
            throw new TypeError(`method connect: there already have a pipe named "${newPipe.name}"`);
        }
        // 如果参数iten是一个pipe
        this._STATE.pipeStore.set(newPipe.name, newPipe);
        return ;
    }

    public retry(current: ITask, maxRetry: number, finalErrorCallback?: () => any) {
        // 过滤出current重要的task基本信息
        const retryTask = {
            hasRetried: current.hasRetried,
            info: current.info,
            planName: current.planName,
            url: current.url,
        };
        if (! retryTask.hasRetried) {
            retryTask.hasRetried = 0;
        }
        if (! finalErrorCallback) {
            finalErrorCallback = () => {
                throw new Error(`
                    ${current.url}达到最大重试次数，但依然出错
                `);
            };
        }
        if (retryTask.hasRetried >= maxRetry) {
            return finalErrorCallback();
        }
        retryTask.hasRetried ++;
        this._STATE.queue.jumpTask(retryTask);    // 插队到队列，重新等待执行
    }

    /**
     * add new default plan
     * @param option default plan's option
     */
    public plan(name: string, callback: IDefaultPlanOptionCallback) {
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
            There are already a plan called "${name}".`);
        }
        return this.add(defaultPlan({
            callbacks: [
                NodeSpider.preToUtf8,
                NodeSpider.preLoadJq,
                callback,
            ],
            name,
        }));
    }

    // tslint:disable-next-line:max-line-length
    /**
     * Add url(s) to the queue and specify a plan. These task will be performed as planned when it's turn. Eventually only absolute url(s) can be added to the queue, the other will be returned in an array.
     * @param planName the name of specified plan
     * @param url url or array of urls
     * @param info (Optional). Attached information for this url
     * @returns {array}
     */
    public queue(planName: string, url: string | string[], info?: any): any[] {
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
                this._STATE.queue.addTask(newTask);
                this.emit("queueTask", newTask);
                this.work();
            }
        });

        this._STATE.working = true;
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
                name: path,
                path,
            });
            this.add(newPlan);
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
    public save(pipeName: string, data: any) {
        if (typeof pipeName !== "string") {
            throw new TypeError(`methdo save: the parameter "pipeName" should be a string`);
        }
        if (typeof data !== "object") {
            throw new TypeError(`method save: the parameter "data" should be an object`);
        }
        const pipe = this._STATE.pipeStore.get(pipeName);
        if (! pipe) {
            throw new TypeError(`method save: no such pipe named ${pipeName}`);
        } else {
            pipe.add(data);
        }
    }
    private work() {
        const count = this._STATE.option.concurrency - this._STATE.currentTotalConnections;
        if (count <= 0) {
            return ;
        }
        const task = this._STATE.queue.nextTask();
        if (! task) { return this.emit("empty"); }

        this._STATE.currentTotalConnections ++;
        const plan = this._STATE.planStore.get(task.planName) as IPlan;
        const current: ICurrent = {
            ... task,
            info: (typeof task.info === "undefined") ? {} : task.info,
        };
        plan.process(task, this).then(() => {
            this._STATE.currentTotalConnections --;
            this.work();
        }).catch((e: Error) => {
            // 如果计划执行失败，这是非常严重的，因为直接会导致爬虫不能完成开发者制定的任务
            this._STATE.currentTotalConnections --;
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
function ParameterOptsCheck(opts: IDefaultOptionInput): null {
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
