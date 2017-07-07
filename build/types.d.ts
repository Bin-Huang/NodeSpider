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
    getCrawlTask: () => ITask;
    getDownloadTask: () => ITask;
}
export interface IPipe {
    add: (data: any) => void;
    close: () => void;
}
export interface IState {
    queue: IQueue;
    planStore: Map<symbol, IPlan>;
    dlPlanStore: Map<symbol, IDownloadPlan>;
    pipeStore: Map<symbol, IPipe>;
    option: IDefaultOption;
    working: boolean;
    currentMultiTask: number;
    currentMultiDownload: number;
}
export interface IDefaultOption {
    multiTasking: number;
    multiDownload: number;
    rateLimit: number;
    queue: IQueue;
}
export interface ITask {
    url: string;
    planKey: symbol;
    special?: any;
    maxRetry?: number;
    hasRetried?: number;
}
export interface ICurrentCrawl extends ITask {
    plan: IPlan;
    response: any;
    body: string;
    error: Error;
    info: any;
    [propName: string]: any;
}
export interface ICurrentDownload extends ITask {
    plan: IDownloadPlan;
    error: Error;
    info: any;
    [propName: string]: any;
}
export declare type IRule = (err: Error, current: ICurrentCrawl) => void | Promise<void>;
export declare type TPreOperation = (thisSpider: NodeSpider, current: ICurrentCrawl) => ICurrentCrawl | Promise<ICurrentCrawl>;
export interface IPlanInput {
    rule: IRule;
    request?: any;
    pre?: TPreOperation[];
    info?: any;
}
export interface IPlan extends IPlanInput {
    request: any;
    rule: IRule;
    pre: TPreOperation[];
    info: any;
}
export declare type THandleError = (err: Error, current: ICurrentDownload) => void | Promise<void>;
export declare type THandleFinish = (current: ICurrentDownload) => void | Promise<void>;
export interface IDownloadPlanInput {
    handleError: THandleError;
    handleFinish?: THandleFinish;
    path?: string;
    request?: any;
    pre?: any[];
    info?: any;
}
export interface IDownloadPlan extends IDownloadPlanInput {
    handleError: THandleError;
    handleFinish: THandleFinish;
    path: string;
    request: any;
    pre: any;
    info: any;
}
