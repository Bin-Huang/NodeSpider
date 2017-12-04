import * as fs from "fs";
import Spider from "./spider";

export interface IPlan {
    // process 不能抛出错误，否则将导致爬虫终止。所有错误应该以参数传递到callback，由开发者自行处理
    process: (task: ITask, spider: Spider) => Promise<{}|null|void>;
    option: any;
}

export interface IPipe {
    name: string;
    add: (data: any) => void;
    close: () => void;
}

// NodeSpider' state
export interface IState {
    queue: IQueue;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, IPipe>;
    option: IDefaultOption;
    currentTotalConnections: ITask[];
}

export type queueClass = new () => IQueue;

// for parameter option, when initialize an instance  of NodeSpider.
export interface IDefaultOptionInput {
    concurrency?: number;
    queue?: queueClass;
}
export interface IDefaultOption extends IDefaultOptionInput {
    concurrency: number;
    queue: queueClass;
}

// for task object in the queue;在queue保存的task
export interface ITask {
    url: string;
    planName: string;
    hasRetried?: number;
    info?: any;
}

// nodespider's queue;
export interface IQueue {
    add: (newTask: ITask) => void;
    jump: (newTask: ITask) => void;

    check: (url: string) => boolean;

    getWaitingTaskNum: () => number;
    getTotalUrlsNum: () => number;

    next: () => ITask|null;
}
