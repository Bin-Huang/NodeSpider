import * as fs from "fs";
import Spider from "./spider";

export type IPlan = (task: ITask, spider: Spider) => Promise<any>;

export interface IQueue {
  add: (task: ITask) => void;
  jump: (task: ITask) => void;
  next: () => ITask|null;
  getNum: () => number;
}

// TODO: 除了url，还可以是其他的嘛
export interface IPool {
  add: (url: string) => void;
  has: (url: string) => boolean;
  size: () => number;
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
    option: IDefaultOptionInput;
    working: boolean;
    currentTotalConnections: number;
}

// for parameter option, when initialize an instance  of NodeSpider.
export interface IDefaultOptionInput {
    concurrency?: number;
    queue?: IQueue;
    pool?: IPool;
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
