import NodeSpider from "./spider";

// TODO C 每一个类型都应该有注释

export interface IQueue {
    addTask: (newTask: ITask) => void;
    addDownload: (newTask: ITask) => void;
    jumpTask: (newTask: ITask) => void;
    jumpDownload: (newTask: ITask) => void;

    check: (url: string) => boolean;

    getWaitingTaskNum: () => number;
    getWaitingDownloadTaskNum: () => number;
    getTotalUrlsNum: () => number;

    nextCrawlTask: () => ITask;
    nextDownloadTask: () => ITask;
}

export interface IPipe {
    add: (data: any) => void;
    close: () => void;
}

// import TaskQueue from "./TaskQueue";

// NodeSpider' state
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

// for parameter option, when initialize an instance  of NodeSpider.
export interface IDefaultOption {
    multiTasking: number;
    multiDownload: number;
    // defaultRetry: number;
    // defaultDownloadPath: string;

    rateLimit: number;
    queue: IQueue;

    // preprocessing: any[];
}

// for task object in the queue;
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

// TODO C 重命名 use、rule、info？
export type IRule = (err: Error, current: ICurrentCrawl) => void | Promise<void>;
export type TPreOperation = (current: ICurrentCrawl) => ICurrentCrawl | Promise<ICurrentCrawl>;
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

export type THandleError = (err: Error, current: ICurrentDownload) => void | Promise<void>;
export type THandleFinish = (current: ICurrentDownload) => void | Promise<void>;
export interface IDownloadPlanInput {
    handleError: THandleError;
    handleFinish?: THandleFinish;
    path?: string;
    request?: any;
    pre?: any[] ;
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
