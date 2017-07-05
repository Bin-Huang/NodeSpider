// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// 简单上手的回掉函数 + 自由定制的事件驱动
// mysql 插件
// redis queue
// TODO: 更好的模块接口
// TODO B 完成 special

import * as charset from "charset";
import * as cheerio from "cheerio";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import { DownloadPlan, Plan } from "./plan";
import Queue from "./queue";
import {
    ICurrentCrawl,
    ICurrentDownload,
    IDefaultOption,
    IDownloadPlanInput,
    IPipe,
    IPlanInput,
    IRule,
    IState,
    ITask,
    THandleError,
} from "./types";

const defaultOption: IDefaultOption = {
    multiDownload: 2,
    multiTasking: 20,
    queue: new Queue(),
    rateLimit: 2,
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    public static Queue = Queue;

    public _STATE: IState;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts = {}) {
        super();
        // TODO B opts 检测是否合法
        this._STATE = {
            currentMultiDownload: 0,   // 当前进行的下载的数量
            currentMultiTask: 0, // 当前正在进行的任务数量
            dlPlanStore: new Map(),
            option: Object.assign({}, defaultOption, opts),
            pipeStore: new Map(),
            planStore: new Map(),
            queue: null,
            working: true,
        };
        this._STATE.queue = this._STATE.option.queue;

        // 在爬虫的生命周期末尾，需要进行一些收尾工作，比如关闭table
        this.on("end", () => {
            const values = this._STATE.pipeStore.values();
            for (const item of values) {
                item.close();
            }
        });

        setInterval(() => {
            if (this._STATE.currentMultiTask < this._STATE.option.multiTasking) {
                startCrawl(this);
            }
            if (this._STATE.currentMultiDownload < this._STATE.option.multiDownload) {
                startDownload(this);
            }
        }, this._STATE.option.rateLimit);
    }

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
    public retry(
        current: ICurrentCrawl|ICurrentDownload,
        maxRetry = 1,
        finalErrorCallback?: (current: ICurrentCrawl|ICurrentDownload) => void,
    ) {
        const task = {
            hasRetried: current.hasRetried,
            maxRetry: current.maxRetry,
            planKey: current.planKey,
            special: current.special,
            url: current.url,
        };
        if (! task.hasRetried) {
            task.hasRetried = 0;
        }
        if (! task.maxRetry) {
            task.maxRetry = maxRetry;
        }
        if (! finalErrorCallback) {
            finalErrorCallback = (currentTask: ICurrentCrawl | ICurrentDownload) => {
                console.log("达到最大重试次数，但依旧错误");
            };
        }
        if (task.hasRetried >= task.maxRetry) {
            return finalErrorCallback(current);
        }

        // 判断是哪种任务，crawl or download?
        let jumpFun = null;
        if (this._STATE.planStore.has(task.planKey)) {
            jumpFun = this._STATE.queue.jumpCrawl;
        } else if (this._STATE.dlPlanStore.has(task.planKey)) {
            jumpFun = this._STATE.queue.jumpDownload;
        } else {
            return new Error("unknown plan");
        }

        // 重新添加到队列
        task.hasRetried ++;
        jumpFun(task);
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

    public downloadPlan(item: THandleError|IDownloadPlanInput): symbol {
        if (typeof item === "function") {
            const newPlan = new DownloadPlan(item);
            const id = this._STATE.dlPlanStore.size + 1;
            const key = Symbol("downloadPlan" + id);
            this._STATE.dlPlanStore.set(key, newPlan);
            return key;
        }
        if (typeof item === "object") {
            if (! item.handleError) {
                throw new Error("参数缺少handleError成员");
            }
            // TODO: 其他参数检验
            const newPlan = new DownloadPlan(
                item.handleError,
                item.handleFinish,
                item.path,
                item.request,
                item.use,
                item.info,
            );

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
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    public queue(planKey: symbol, url: string | string[], special?: any): number[] {
        // TODO B special 应该更智能的覆盖 plan
        // 参数检验
        if (typeof planKey !== "symbol") {
            throw new TypeError("queue 参数错误");
        }

        // 确定添加到哪个队列(crawlQueue还是downloadQueue?)
        let toCrawl = null; // True代表addCrawl，False代表addDownload
        if (this._STATE.planStore.has(planKey)) {
            toCrawl = true;
        } else if (this._STATE.dlPlanStore.has(planKey)) {
            toCrawl = false;
        } else {
            throw new RangeError("plan 不存在");
        }

        // 添加到队列
        // TODO C 完善 special: 过滤掉其中不相干的成员？
        if (!Array.isArray(url)) {
            if (toCrawl) {
                this._STATE.queue.addCrawl({url, planKey, special});
            } else {
                this._STATE.queue.addDownload({url, planKey, special});
            }
        } else {
            url.map((u) => {
                if (typeof u !== "string") {
                    return new Error("url数组中存在非字符串成员");
                }
                if (toCrawl) {
                    this._STATE.queue.addCrawl({url: u, planKey});
                } else {
                    this._STATE.queue.addDownload({url: u, planKey});
                }
            });
        }

        this._STATE.working = true;
        // this._fire();
        return [
            this._STATE.queue.crawlWaitingNum(),
            this._STATE.queue.downloadWaitingNum(),
            this._STATE.queue.crawlWaitingNum(),
            this._STATE.queue.allUrlNum(),
        ];
    }

    // 关于pipeGenerator
    // 提供 add、close、init
    // 当第一次被save调用时，先触发init后再add（这样就不会生成空文件）
    // 爬虫生命周期末尾，自动调用close清理工作
    public pipe(pipeObject: IPipe): symbol {
        if (typeof pipeObject !== "object" || ! pipeObject.add || !pipeObject.close) {
            throw new Error("不符合pipe");
        }

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

}

function requestAsync(item) {
    return new Promise<{error: Error, response, body: string}>((resolve, reject) => {
        request(item, (error, response, body) => {
            resolve({error, response, body});
        });
    });
}

function startCrawl(self: NodeSpider) {
    if (! self._STATE.queue.isCrawlCompleted()) {
        const task = self._STATE.queue.getCrawlTask();
        self._STATE.currentMultiTask ++;
        _asyncCrawling(task, self)
            .then(() => {
                self._STATE.currentMultiTask --;
            })
            .catch((e) => {
                console.log(e);
                self._STATE.currentMultiTask --;
            });
    }
}

function startDownload(self: NodeSpider) {
    if (! self._STATE.queue.isDownloadCompleted()) {
        const task = self._STATE.queue.getDownloadTask();

        self._STATE.currentMultiDownload ++;
        // 【【这里的错误处理思想】】
        // 所有可能的错误，应该交给开发者编写的plan来处理
        // 比如在rule中处理错误，或者是在handleError中处理
        // 所以此处catch的错误，必须要再额外处理，只需要触发终止当前任务的事件即可
        _asyncDownload(task, self)
            .then(() => {
                self._STATE.currentMultiDownload --;
            })
            .catch((e) => {
                console.log(e);
                self._STATE.currentMultiDownload --;
            });
    }
}

async function _asyncCrawling(task: ITask, self: NodeSpider) {
    const plan = self._STATE.planStore.get(task.planKey);
    if (! plan) {
        return new Error("unknown plan");
    }
    // request
    const requestOption = Object.assign(plan.request, task.special, {url: task.url});
    const {error, response, body} = await requestAsync(requestOption);

    let current: ICurrentCrawl = Object.assign({
        response,
        plan,
        body,
        error,
    }, task);

    // 按顺序执行预处理函数，对current进行预处理
    if (! error) {
        for (const preFun of plan.use) {
            let result = preFun(self, current);
            if (result instanceof Promise) {
                result = await result;
            }
            current = result;
        }
    }

    // 根据开发者定义的抓取规则进行操作
    const result = plan.rule(error, current);
    if (result instanceof Promise) {
        await result;
    }
    // 结尾的清理工作
    current = null;
}

function _asyncDownload(task: ITask, self: NodeSpider) {
    return new Promise((resolve, reject) => {
        const plan = self._STATE.dlPlanStore.get(task.planKey);
        if (! plan) {
            return new Error("unknown plan");
        }
        // request
        const requestOpts = plan.request;
        const specialOpts = task.special;
        const item = Object.assign(requestOpts, specialOpts, {url: task.url});

        let isError = false;    // for whether need to call handleFinish when finish

        let stream: fs.ReadStream = request(item);
        stream.on("error", (error, current) => {
            isError = true;
            stream.close();
            write.close();
            plan.handleError(error, current);
        });

        // 获得文件名
        const filename = task.url.slice(task.url.lastIndexOf("/") + 1);
        const write = fs.createWriteStream(plan.path + filename);

        // TODO B 灵感写法，未必正确
        // TODO C 错误处理
        for (const pl of plan.use) {
            stream = stream.pipe(pl);   // 灵感写法
            stream.on("error", (error, current) => {
                isError = true;
                stream.close();
                write.close();
                plan.handleError(error, current);
            });
        }
        stream.pipe(write);

        write.on("error", (error, current) => {
            isError = true;
            stream.close();
            write.close();
            plan.handleError(error, current);
        });
        write.on("finish", (current) => {
            if (! isError) {
                plan.handleFinish(current);
            }
            resolve();
        });

    });
}
