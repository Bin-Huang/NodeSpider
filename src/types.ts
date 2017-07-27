import * as fs from "fs";
import NodeSpider from "./spider";

// TODO C 每一个类型都应该有注释

export interface IPlan {
    option: any;
    type: string;
    info: any;
    process: (task: ITask) => Promise<{}|null|void>;
}

// nodespider's queue;
export interface IQueue {
    addTask: (newTask: ITask, type: string) => void;
    jumpTask: (newTask: ITask, type: string) => void;

    check: (url: string) => boolean;

    getWaitingTaskNum: (type: string) => number;
    getTotalUrlsNum: () => number;

    nextTask: (type: string) => ITask|null;
}

export interface IPipe {
    add: (data: any) => void;
    close: () => void;
}

// NodeSpider' state
export interface IState {
    queue: IQueue;
    planStore: Map<symbol, IPlan>;
    pipeStore: Map<symbol, IPipe>;
    option: IDefaultOption;
    working: boolean;
    timer: NodeJS.Timer|null;
    currentConnections: {[key: string]: number};
    currentTotalConnections: number;
}

export type queueClass = new () => IQueue;

// for parameter option, when initialize an instance  of NodeSpider.
export interface IDefaultOption {
    maxConnections: number|{[key: string]: number};

    rateLimit: number;
    queue: queueClass;
}

// for task object in the queue;在queue保存的task
export interface ITask {
    url: string;
    planKey: symbol;
    maxRetry?: number;
    hasRetried?: number;
    info?: any;
}

// ====== request options ======

export interface IRequestOpts {

}

// ====== default plan ======

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
