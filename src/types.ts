import * as fs from "fs";
import Spider from "./spider";

export type IPlan = (task: ITask, spider: Spider) => Promise<any>;

// nodespider's queue;
export interface IQueue {
    addTask: (newTask: ITask) => void;
    jumpTask: (newTask: ITask) => void;

    check: (url: string) => boolean;

    getWaitingTaskNum: () => number;
    getTotalUrlsNum: () => number;

    nextTask: () => ITask|null;
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
    working: boolean;
    currentTotalConnections: number;
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

export interface ICurrent extends ITask {
    info: any;
}
