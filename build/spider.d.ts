/// <reference types="node" />
import { EventEmitter } from "events";
import Queue from "./queue";
import { ICurrent, IDownloadCurrent, IPipe, IState } from "./types";
import { IDefaultPlanCurrent, IDefaultPlanOptionCallback, IDefaultPlanOptionInput } from "./defaultPlan";
import Plan from "./plan";
/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    static Queue: typeof Queue;
    _STATE: IState;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts?: {});
    /**
     * Check whether the url has been added
     * @param {string} url
     * @returns {boolean}
     */
    isExist(url: string): boolean;
    /**
     * 过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组
     * @param urlArray {array}
     * @returns {array}
     */
    filter(urlArray: string[]): string[];
    /**
     * Retry the task within the maximum number of retries
     * @param {ITask} task The task which want to retry
     * @param {number} maxRetry Maximum number of retries for this task
     * @param {function} finalErrorCallback The function called when the maximum number of retries is reached
     */
    retry(current: ICurrent, maxRetry?: number, finalErrorCallback?: (current: IDefaultPlanCurrent | IDownloadCurrent) => void): any;
    plan(item: Plan | IDefaultPlanOptionCallback | IDefaultPlanOptionInput): symbol;
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planKey 指定的爬取计划
     * @param url 待爬取的链接（们）
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    queue(planKey: symbol, url: string | string[], special?: any): number[];
    pipe(pipeObject: IPipe): symbol;
    save(pipeKey: symbol, data: any): Error | undefined;
}
