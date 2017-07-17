/// <reference types="node" />
import * as fs from "fs";
import Plan from "./plan";
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
export interface IPlanTask extends ITask {
    specialOpts: any;
}
export interface ICurrent extends IPlanTask {
    plan: Plan;
    info: any;
    specialOpts: any;
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
