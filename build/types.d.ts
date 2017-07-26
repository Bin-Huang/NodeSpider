/// <reference types="node" />
import * as fs from "fs";
export interface IPlan {
    option: any;
    type: string;
    info: any;
    process: (task: ITask) => Promise<{} | null | void>;
}
export interface IQueue {
    addTask: (newTask: ITask, type: string) => void;
    jumpTask: (newTask: ITask, type: string) => void;
    check: (url: string) => boolean;
    getWaitingTaskNum: (type: string) => number;
    getTotalUrlsNum: () => number;
    nextTask: (type: string) => ITask | null;
}
export interface IPipe {
    add: (data: any) => void;
    close: () => void;
}
export interface IState {
    queue: IQueue;
    planStore: Map<symbol, IPlan>;
    pipeStore: Map<symbol, IPipe>;
    option: IDefaultOption;
    working: boolean;
    timer: NodeJS.Timer | null;
    currentConnections: {
        [key: string]: number;
    };
    currentTotalConnections: number;
}
export declare type queueClass = new () => IQueue;
export interface IDefaultOption {
    maxConnections: number | {
        [key: string]: number;
    };
    rateLimit: number;
    queue: queueClass;
}
export interface ITask {
    url: string;
    planKey: symbol;
    special?: any;
    maxRetry?: number;
    hasRetried?: number;
    info?: any;
}
export interface IRequestOpts {
}
export declare type IDownloadCallback = (err: Error, current: IDownloadCurrent) => void | Promise<void>;
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
export declare type IPipeCallback = (err: Error, current: IPipeCurrent) => void | Promise<void>;
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
