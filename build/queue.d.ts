import { IQueue, ITask } from "./types";
/**
 * 为NodeSpider量身定做的taskqueue
 */
export default class Queue implements IQueue {
    protected urlPool: Set<string>;
    private crawlQueue;
    private downloadQueue;
    constructor();
    addTask(newTask: ITask): void;
    addDownload(newTask: ITask): void;
    jumpTask(newTask: ITask): void;
    jumpDownload(newTask: ITask): void;
    check(url: string): boolean;
    getWaitingTaskNum(): number;
    getWaitingDownloadTaskNum(): number;
    getTotalUrlsNum(): number;
    nextCrawlTask(): any;
    nextDownloadTask(): any;
}
