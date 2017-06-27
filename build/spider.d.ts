/// <reference types="node" />
import { EventEmitter } from "events";
import decode from "./decode";
import loadJQ from "./loadJQ";
import { jsonPipe, txtPipe } from "./pipe";
import Queue from "./queue";
import { ICurrentCrawl, ICurrentDownload, IDownloadPlanInput, IPipe, IPlanInput, IRule, IState, THandleError } from "./types";
/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    static decode: typeof decode;
    static loadJQ: typeof loadJQ;
    static Queue: typeof Queue;
    static txtPipe: typeof txtPipe;
    static jsonPipe: typeof jsonPipe;
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
    filter(urlArray: string[]): any[];
    /**
     * Retry the task within the maximum number of retries
     * @param {ITask} task The task which want to retry
     * @param {number} maxRetry Maximum number of retries for this task
     * @param {function} finalErrorCallback The function called when the maximum number of retries is reached
     */
    retry(current: ICurrentCrawl | ICurrentDownload, maxRetry?: number, finalErrorCallback?: (current: ICurrentCrawl | ICurrentDownload) => void): void | Error;
    plan(item: IRule | IPlanInput): symbol;
    downloadPlan(item: THandleError | IDownloadPlanInput): symbol;
    /**
     * 添加待爬取链接到队列，并指定爬取计划。
     * @param planKey 指定的爬取计划
     * @param url 待爬取的链接（们）
     * @param special （可选）针对当前链接的特别设置，将覆盖与plan重复的设置
     */
    queue(planKey: symbol, url: string | string[], special?: any): number[];
    pipe(pipeObject: IPipe): symbol;
    save(pipeKey: symbol, data: any): Error;
}
