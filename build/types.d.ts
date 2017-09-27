/// <reference types="node" />
import Spider from "./spider";
export interface IPlan {
    name: string;
    process: (task: ITask, spider: Spider) => Promise<{} | null | void>;
    option?: any;
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
    name: string;
    add: (data: any) => void;
    close: () => void;
}
export interface IState {
    queue: IQueue;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, IPipe>;
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
    planName: string;
    hasRetried?: number;
    info?: any;
}
export interface ICurrent extends ITask {
    info: any;
}
export interface IRequestOptionInput {
    method?: string;
    headers?: any;
}
