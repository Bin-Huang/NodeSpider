import { DownloadPlan, Plan } from "./plan";
import NodeSpider from "./spider";
export interface IQueue {
    addCrawl: (newTask: ITask) => void;
    addDownload: (newTask: ITask) => void;
    jumpCrawl: (newTask: ITask) => void;
    jumpDownload: (newTask: ITask) => void;
    check: (url: string) => boolean;
    crawlWaitingNum: () => number;
    downloadWaitingNum: () => number;
    totalWaitingNum: () => number;
    allUrlNum: () => number;
    isCrawlCompleted: () => boolean;
    isDownloadCompleted: () => boolean;
    isAllCompleted: () => boolean;
    getTask: () => ITask;
}
export interface IPipe {
    add: (data: any) => void;
    close: () => void;
}
export interface IPublicOption {
}
export interface ICrawlOption extends IPublicOption {
    preprocessing?: any[];
}
export interface ICrawlTaskInput extends ICrawlOption {
    url: string | string[];
    strategy: (err: Error, currentTask: ICrawlCurrentTask, $) => any;
}
export interface ICrawlQueueItem extends ICrawlTaskInput {
    url: string;
    _INFO?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: ICrawlCurrentTask) => any;
    };
}
export interface ICrawlCurrentTask extends ICrawlQueueItem {
    response: any;
    error: Error;
    body: string;
    $: any;
}
export interface IDownloadOption extends IPublicOption {
}
export interface IDownloadTaskInput extends IDownloadOption {
    url: string | string[];
    path?: string;
    callback?: (err: Error, currentTask: IDownloadCurrentTask) => void;
}
export interface IDownloadQueueItem extends IDownloadTaskInput {
    url: string;
    _INFO?: {
        maxRetry: number;
        retried: number;
        finalErrorCallback: (currentTask: IDownloadCurrentTask) => void;
    };
}
export interface IDownloadCurrentTask extends IDownloadQueueItem {
}
export interface IState {
    queue: IQueue;
    planStore: Map<symbol, Plan>;
    dlPlanStore: Map<symbol, DownloadPlan>;
    pipeStore: Map<symbol, IPipe>;
    option: IGlobalOption;
    working: boolean;
    currentMultiTask: number;
    currentMultiDownload: number;
}
export interface IGlobalOption extends ICrawlOption, IDownloadOption {
    multiTasking: number;
    multiDownload: number;
    defaultRetry: number;
    defaultDownloadPath: string;
    queue: IQueue;
    preprocessing: any[];
}
export interface ITask {
    url: string;
    planKey: symbol;
    special?: any;
    maxRetry?: number;
    hasRetried?: number;
}
export interface ICurrentCrawl extends ITask {
    plan: Plan;
    response: any;
    body: string;
    error: Error;
}
export declare type IRule = (err: Error, current: ICurrentCrawl) => void | Promise<void>;
export interface IPlanInput {
    rule: IRule;
    request?: any;
    use?: any[];
    info?: any;
}
export declare type TPreOperation = (thisSpider: NodeSpider, current: ICurrentCrawl) => ICurrentCrawl | Promise<ICurrentCrawl>;
