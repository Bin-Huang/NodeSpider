// TODO: 更好的报错机制: 报错建议？以及去除多余的 console.error
// BUG: 使用url.resolve补全url，可能导致 'http://www.xxx.com//www.xxx.com' 的问题。补全前，使用 is-absolute-url 包判断, 或考录使用 relative-url 代替
// TODO: 使用 node 自带 stringdecode 代替 iconv-lite
// mysql 插件
// redis queue
// TODO B 注册pipe和queue可能存在异步操作，此时应该封装到promise或async函数。但依然存在问题：当还没注册好，就调动了queue或者save

import * as charset from "charset";
import * as cheerio from "cheerio";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as stream from "stream";
import * as url from "url";
import * as uuid from "uuid";
import defaultPlan from "./defaultPlan";
import Queue from "./queue";
import {
    ICurrent,

    IDefaultOption,
    IDownloadCallback,
    IDownloadCurrent,
    IDownloadPlan,

    IDownloadPlanInput,
    IPipe,
    IPipeCallback,
    IPipeCurrent,

    IPipePlan,
    IPipePlanInput,
    IPlanTask,
    IState,
    ITask,
} from "./types";
import {
    IDefaultPlanCurrent,
    IDefaultPlanOptionCallback,
    IDefaultPlanOptionInput,
} from "./defaultPlan";
import Plan from "./plan";

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
        current: ICurrent,
        maxRetry = 1,
        finalErrorCallback?: (current: IDefaultPlanCurrent|IDownloadCurrent) => void,
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
            finalErrorCallback = (currentTask: IDefaultPlanCurrent | IDownloadCurrent) => {
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

    public plan(item: Plan|IDefaultPlanOptionCallback|IDefaultPlanOptionInput): symbol {
        let newPlan = item;
        if (item instanceof Plan) {
            newPlan = item;
        } else {
            newPlan = defaultPlan(item);
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

        const key = Symbol("pipe-" + uuid());
        this._STATE.pipeStore.set(key, pipeObject);
        return key;
    }

    // item可以是字符串路径，也可以是对象。若字符串则保存为 txt 或json
    // 如果是对象，则获得对象的 header 属性并对要保存路径进行检测。通过则调用对象 add 方法。
    // 每一个人都可以开发 table 对象的生成器。只需要提供 header 和 add 接口。其他由开发者考虑如何完成。
    public save(pipeKey: symbol, data: any) {
        const pipe = this._STATE.pipeStore.get(pipeKey);
        if (pipe) {
            pipe.add(data);
        } else {
            return new Error("unknowed pipe");
        }
    }

}

function startCrawl(self: NodeSpider) {
    if (self._STATE.queue.getWaitingTaskNum() !== 0) {
        const task = self._STATE.queue.nextCrawlTask();
        self._STATE.currentMultiTask ++;

        const plan = self._STATE.planStore.get(task.planKey);
        if (! plan) {
            throw new Error("planKey 对应的 plan 不存在");
        }
        const specialOpts = Object.assign({}, plan.options, task.special);

        const t: IPlanTask = {
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

type TPipePlanApi1 = (input: stream.Stream, callback: IPipeCallback) => symbol;
type TPipePlanApi2 = (planOpts: IPipePlanInput) => symbol;
