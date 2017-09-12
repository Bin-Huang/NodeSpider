/// <reference types="node" />
export interface IPlan {
    process: (task: ITask) => Promise<{} | null | void>;
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
    info: {
        [index: string]: any;
    };
    retry: (maxRetry: number, finalErrorCallback: () => any) => void;
    queue: (planName: string, url: string | string[]) => void;
}
export interface IRequestOpts {
}
