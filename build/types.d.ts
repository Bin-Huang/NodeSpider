import { Plan } from "./plan";
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
    dlPlanStore: Map<symbol, Plan>;
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
    plan: symbol;
    special?: any;
}
