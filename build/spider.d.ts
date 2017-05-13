/// <reference types="node" />
import { EventEmitter } from "events";
import decode from "./decode";
import loadJQ from "./loadJQ";
import TaskQueue from "./TaskQueue";
import { ICrawlCurrentTask, ICrawlQueueItem, ICrawlTaskInput, IDownloadQueueItem, IDownloadTaskInput, IGlobalOption, IStatus } from "./types";
/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
    static decode: typeof decode;
    static loadJQ: typeof loadJQ;
    protected _OPTION: IGlobalOption;
    protected _CRAWL_QUEUE: TaskQueue<ICrawlQueueItem>;
    protected _DOWNLOAD_QUEUE: TaskQueue<IDownloadQueueItem>;
    protected _STATUS: IStatus;
    protected _TABLES: Map<string, any>;
    /**
     * create an instance of NodeSpider
     * @param opts
     */
    constructor(opts?: {});
    /**
     * Add new crawling-task to spider's todo-list (regardless of whether the link has been added)
     * @param {ITask} task
     * @returns {number} the number of urls has been added.
     */
    addTask(task: ICrawlTaskInput): number | void;
    /**
     * add new download-task to spider's download-list.
     * @param task
     */
    addDownload(task: IDownloadTaskInput): number;
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
    retry(task: ICrawlCurrentTask, maxRetry?: number, finalErrorCallback?: (task: any) => any): void;
    save(item: any, data: any): any;
    /**
     * 火力全开，尝试不断启动新任务，让当前任务数达到最大限制数
     */
    protected _fire(): void;
    /**
     * request promise. resolve({error, response})
     * @param opts {url, method, encoding}
     */
    protected _asyncRequest(opts: any): Promise<{}>;
    protected _asyncCrawling(task: ICrawlQueueItem): Promise<void>;
    protected _asyncDownload(task: IDownloadQueueItem): Promise<{}>;
}
