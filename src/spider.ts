// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// mysql 插件
// redis queue
// TODO B 注册pipe和queue可能存在异步操作，此时应该封装到promise或async函数。但依然存在问题：当还没注册好，就调动了queue或者save
// TODO C plan 和 pipe 返回的key应该是唯一的，由算法生成

import * as charset from "charset";
import * as cheerio from "cheerio";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import preLoadJq from "./preLoadJq";
import preToUtf8 from "./preToUtf8";
import Queue from "./queue";
import * as stream from "stream";
import {
    IDefaultOption,
    IPipe,
    IState,
    ITask,
    IPlanProcessTaskInput,

    IDefaultCallback,
    IDefaultPlanInput,
    IDefaultPlan,
    IDefaultCurrent,

    IDownloadCallback,
    IDownloadPlanInput,
    IDownloadPlan,
    IDownloadCurrent,

    IPipeCallback,
    IPipePlanInput,
    IPipePlan,
    IPipeCurrent,
} from "./types";
import { Plan, defaultPlan } from "./plan";

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
        current: IDefaultCurrent|IDownloadCurrent,
        maxRetry = 1,
        finalErrorCallback?: (current: IDefaultCurrent|IDownloadCurrent) => void,
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
            finalErrorCallback = (currentTask: IDefaultCurrent | IDownloadCurrent) => {
                console.log("达到最大重试次数，但依旧错误");
            };
        }
        if (task.hasRetried >= task.maxRetry) {
            return finalErrorCallback(current);
        }

        // 判断是哪种任务，crawl or download?
        let jumpFun = null;
        if (this._STATE.planStore.has(task.planKey)) {
            jumpFun = this._STATE.queue.jumpTask;
        } else if (this._STATE.dlPlanStore.has(task.planKey)) {
            jumpFun = this._STATE.queue.jumpDownload;
        } else {
            return new Error("unknown plan");
        }

        // 重新添加到队列
        task.hasRetried ++;
        jumpFun(task);
    }

    public plan(item: IDefaultCallback|IDefaultPlanInput): symbol {
        // 当只传入一个rule函数，则包装成 IPlanInput 对象
        if (typeof item === "function") {
            item = {callback: item};
        }
        // 类型检测
        if (typeof item !== "object") {
            throw new Error("参数类型错误，只能是函数或则对象");
        }
        if (! item.callback) {
            throw new Error("参数缺少rule成员");
        }

        // 默认值填充
        const pre = item.pre || [
            preToUtf8(),
            preLoadJq(),
        ];
        // TODO B 删掉默认的设置 encoding ?????
        const request = Object.assign({encoding: null}, item.request);
        const info = item.info || {};
        const callback = item.callback;

        // 在爬虫中注册plan并返回key
        const id = this._STATE.planStore.size + 1;
        const key = Symbol("plan" + id);
        this._STATE.planStore.set(key, defaultPlan({request, pre, callback, info}));
        return key;
    }

    public pipePlan(planOpts: IPipePlanInput): symbol {
        // 未完待续
        return Symbol("sdklfjsl");
    }

    public downloadPlan(item: IDownloadCallback | IDownloadPlanInput): symbol {
        // 如果参数是函数，包裹成 IDownloadPlanInput 对象
        if (typeof item === "function") {
            item = {callback: item};
        }
        // 参数类型检测
        if (typeof item !== "object") {
            throw new Error("参数类型错误，只能是函数或则对象");
        }
        if (! item.callback) {
            throw new Error("参数缺少callback成员");
        }
        // 默认值填充
        const callback = item.callback;
        const path = item.path || "";
        const request = item.request || {};
        const use = item.use || [];
        const info = item.info || {};

        // 在爬虫中注册并返回key
        // TODO C uuid
        const id = this._STATE.dlPlanStore.size + 1;
        const key = Symbol("downloadPlan" + id);
        this._STATE.dlPlanStore.set(key, {callback, path, request, use, info});
        return key;
    }
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planKey 指定的爬取计划
     * @param url 待爬取的链接（们）
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    public queue(planKey: symbol, url: string | string[], special?: any): number[] {
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
                this._STATE.queue.addTask({url, planKey, special});
            } else {
                this._STATE.queue.addDownload({url, planKey, special});
            }
        } else {
            url.map((u) => {
                if (typeof u !== "string") {
                    return new Error("url数组中存在非字符串成员");
                }
                if (toCrawl) {
                    this._STATE.queue.addTask({url: u, planKey});
                } else {
                    this._STATE.queue.addDownload({url: u, planKey});
                }
            });
        }

        this._STATE.working = true;
        return [
            this._STATE.queue.getWaitingTaskNum(),
            this._STATE.queue.getWaitingDownloadTaskNum(),
            this._STATE.queue.getWaitingTaskNum(),
            this._STATE.queue.getTotalUrlsNum(),
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
    if (self._STATE.queue.getWaitingTaskNum() !== 0) {
        let task = self._STATE.queue.nextCrawlTask();
        self._STATE.currentMultiTask ++;

        const plan = self._STATE.planStore.get(task.planKey);
        const specialOpts = Object.assign({}, plan.options, task.special);

        const t: IPlanProcessTaskInput = {
            ... task,
            specialOpts,
        };

        plan.process(t, self).then(() => {
            self._STATE.currentMultiTask --;
        }).catch((e) => {
            console.log(e);
            self._STATE.currentMultiTask --;
        });

    }
}

function startDownload(self: NodeSpider) {
    if (self._STATE.queue.getWaitingDownloadTaskNum() !== 0) {
        const task = self._STATE.queue.nextDownloadTask();

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

// async function _asyncCrawling(task: ITask, self: NodeSpider) {
//     // 获得该任务指定的计划对象
//     const plan = self._STATE.planStore.get(task.planKey);
//     if (! plan) {
//         return new Error("unknown plan");
//     }

//     // 真正执行的爬取计划 = 任务指定的计划 + 该任务特别设置。由两者合并覆盖而成
//     const specialPlan: IDefaultPlan = Object.assign({}, plan, task.special);

//     // request
//     Object.assign(specialPlan.request, {url: task.url});
//     const {error, response, body} = await requestAsync(specialPlan.request);

//     let current: IDefaultCurrent = Object.assign(task, {
//         response,
//         plan,
//         body,
//         error,
//         info: specialPlan.info,
//     });

//     // 如果没有错误，按顺序执行预处理函数，对current进行预处理
//     if (! error) {
//         for (const preFun of specialPlan.pre) {
//             let result = preFun(error, current);
//             if (result instanceof Promise) {
//                 result = await result;
//             }
//         }
//     }

//     // 执行该计划的爬取策略函数，根据开发者定义的抓取规则进行操作
//     const result = specialPlan.callback(error, current);
//     if (result instanceof Promise) {
//         await result;
//     }
//     // 结尾的清理工作
//     current = null;
// }

// // TODO B current and test
// function _asyncDownload(task: ITask, self: NodeSpider) {
//     return new Promise((resolve, reject) => {
//         // 获得任务指定的计划对象
//         const plan = self._STATE.dlPlanStore.get(task.planKey);
//         if (! plan) {
//             return new Error("unknown plan");
//         }
//         // request
//         const specialPlan = Object.assign({}, plan, task.special);

//         let isError = false;    // for whether need to call handleFinish when finish

//         Object.assign(specialPlan.request, {url: task.url});
//         let stream: fs.ReadStream = request(specialPlan.request);
//         // TODO B 统一的事件发生器 emit， 不然current为空
//         stream.on("error", (error, current) => {
//             isError = true;
//             stream.close();
//             write.close();
//             plan.callback(error, current);
//         });

//         // 获得文件名
//         const filename = task.url.slice(task.url.lastIndexOf("/") + 1);
//         const write = fs.createWriteStream(plan.path + filename);

//         // TODO B 灵感写法，未必正确
//         // TODO C 错误处理
//         for (const pl of plan.use) {
//             stream = stream.pipe(pl);   // 灵感写法
//             stream.on("error", (error, current) => {
//                 isError = true;
//                 stream.close();
//                 write.close();
//                 plan.callback(error, current);
//             });
//         }
//         stream.pipe(write);

//         write.on("error", (error, current) => {
//             isError = true;
//             stream.close();
//             write.close();
//             plan.callback(error, current);
//         });
//         write.on("finish", (error, current) => {
//             if (! isError) {
//                 plan.callback(error, current);
//             }
//             resolve();
//         });

//     });
// }

type TPipePlanApi1 = (input: stream.Stream, callback: IPipeCallback) => symbol;
type TPipePlanApi2 = (planOpts: IPipePlanInput) => symbol;
