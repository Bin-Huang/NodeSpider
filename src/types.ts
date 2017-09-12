import * as fs from "fs";
import NodeSpider from "./spider";

export interface IPlan {
    // process 不能抛出错误，否则将导致爬虫终止。所有错误应该以参数传递到callback，由开发者自行处理
    name: string;
    process: (task: ITask) => Promise<{}|null|void>;
    option?: any;
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
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, IPipe>;
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
    planName: string;
    hasRetried?: number;
    info?: any;
}

export interface ICurrent extends ITask {
    info: {[index: string]: any};
    retry: (maxRetry: number, finalErrorCallback: () => any) => void;
    queue: (planName: string, url: string|string[]) => void;
}

// ====== request options ======
export interface IRequestOpts {

}
