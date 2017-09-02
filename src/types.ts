import * as fs from "fs";
import NodeSpider from "./spider";

export interface IPlan {
    option: any;
    type: string;
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
    hasRetried?: number;
    info?: any;
}

// ====== request options ======
export interface IRequestOpts {

}
