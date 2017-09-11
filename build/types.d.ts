/// <reference types="node" />
export interface IPlan {
    type: string;
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
    hasRetried?: number;
    info?: any;
}
export interface IRequestOpts {
}
