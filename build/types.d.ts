/// <reference types="node" />
import * as fs from "fs";
import Plan from "./plan";
export interface IQueue {
    addTask: (newTask: ITask, type: string) => void;
    jumpTask: (newTask: ITask, type: string) => void;
    check: (url: string) => boolean;
    getWaitingTaskNum: (type: string) => number | null;
    getTotalUrlsNum: () => number;
    nextTask: (type: string) => ITask | null;
}
export interface IPipe {
    add: (data: any) => void;
    close: () => void;
}
export interface IState {
    queue: IQueue;
    planStore: Map<symbol, Plan>;
    pipeStore: Map<symbol, IPipe>;
    option: IDefaultOption;
    working: boolean;
    timer: NodeJS.Timer;
    currentConnections: Map<string, number>;
    currentTotalConnections: number;
    maxConnections: Map<string, number>;
}
export declare type queueClass = new () => IQueue;
export interface IDefaultOption {
    maxTotalConnections: number;
    rateLimit: number;
    queue: queueClass;
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
