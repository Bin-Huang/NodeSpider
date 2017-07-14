import NodeSpider from "./spider";
import * as fs from "fs";
import { Plan } from "./plan";

// TODO C 每一个类型都应该有注释

// nodespider's queue; 
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

// NodeSpider' state
export interface IState {
    queue: IQueue;
    planStore: Map<symbol, Plan>;
    dlPlanStore: Map<symbol, Plan>;
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

export interface IPlanProcessTaskInput extends ITask {
    specialOpts: IDefaultPlanOption;
}

// ====== request options ======

export interface IRequestOpts {

};


// ====== default plan ======

export type IDefaultCallback = (err: Error, current: IDefaultCurrent) => void | Promise<void>;
export interface IDefaultPlanOptionInput {
    callback: IDefaultCallback;
    request?: IRequestOpts;
    pre?: IDefaultCallback[];
    info?: any;
}
export interface IDefaultPlanOption extends IDefaultPlanOptionInput {
    request: IRequestOpts;
    pre: IDefaultCallback[];
    callback: IDefaultCallback;
    info: any;
}
// current crawl task; for `rule` function in the plan
export interface IDefaultCurrent extends ITask {
    plan: Plan;
    response: any;
    body: string;
    error: Error;
    info: any;
    specialOpts: IDefaultPlanOption;
    [propName: string]: any;
}


// ====== download plan ======

export type IDownloadCallback = (err: Error, current: IDownloadCurrent) => void | Promise<void>;
export interface IDownloadPlanInput {
    callback: IDownloadCallback;
    path?: string;
    use?: any;
    request?: IRequestOpts;
    info?: any;
}
export interface IDownloadPlan extends IDownloadPlanInput {
    callback: IDownloadCallback;
    path: string;
    use?: any;
    request: IRequestOpts;
    info: any;
}
export interface IDownloadCurrent extends ITask {
    plan: IDownloadPlan;
    error: Error;
    info: any;
    [propName: string]: any;
}


// ====== pipe plan ======

export type IPipeCallback = (err: Error, current: IPipeCurrent) => void | Promise<void>;
export interface IPipePlanInput {
    pipe: fs.WriteStream;
    callback: IPipeCallback;
    request?: IRequestOpts;
    info?: any;
    use?: any;
}
export interface IPipePlan {
    pipe: fs.WriteStream;
    callback: IPipeCallback;
    request: IRequestOpts;
    info: any;
    use: any;
}
export interface IPipeCurrent extends ITask {
    plan: IPipePlan;
    error: Error;
    info: any;
    [propName: string]: any;
}