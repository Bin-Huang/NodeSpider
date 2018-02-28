import * as fs from "fs";
import Spider from "./spider";

export type IPlan = (task: ITask, spider: Spider) => Promise<any>;

export interface IQueue {
  add: (task: ITask) => void;
  jump: (task: ITask) => void;
  next: () => ITask|null;
  getLength: () => number;
}
// TODO: 除了url，还可以是其他的嘛
export interface IPool {
  add: (url: string) => void;
  has: (url: string) => boolean;
  size: number;
}

export interface IPipe {
    name: string;
    add: (data: any) => void;
    close: () => void;
}

// NodeSpider' state
export interface IState {
    queue: IQueue;
    pool: IPool;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, IPipe>;
    opts: IOpts;
    working: boolean;
    currentTasks: ITask[];
}

// 用于初始化时的函数参数
export interface IOptions {
    concurrency?: number;
    queue?: IQueue;
    pool?: IPool;
}
// 记录在state中的设置
export interface IOpts {
    concurrency: number;
    queue: IQueue;
    pool: IPool;
}

// for task object in the queue;在queue保存的task
export interface ITask {
    uid: string;
    url: string;
    planName: string;
    hasRetried?: number;
    info?: {[index: string]: any};
}
