/// <reference types="node" />
import Spider from "./spider";
export declare type IPlan = (task: ITask, spider: Spider) => Promise<any>;
export interface IQueue {
    add: (task: ITask) => void;
    jump: (task: ITask) => void;
    next: () => ITask | null;
    getLength: () => number;
}
export interface IPool {
    add: (url: string) => void;
    has: (url: string) => boolean;
    size: number;
}
export interface IPipe {
    write: (data: any) => any;
    end: (data?: any) => any;
    convert?: (data: {
        [index: string]: any;
    }) => any;
}
export declare type IStatus = "active" | "end" | "pause" | "vacant";
export declare type IPipeItems = string[] | {
    [index: string]: (data: any) => any;
};
export interface IState {
    queue: IQueue;
    pool: IPool;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, {
        items: IPipeItems;
        pipe: IPipe;
    }>;
    opts: IOpts;
    currentTasks: ITask[];
    status: IStatus;
    heartbeat: NodeJS.Timer;
}
export interface IOptions {
    concurrency?: number;
    queue?: IQueue;
    pool?: IPool;
}
export interface IOpts {
    concurrency: number;
    queue: IQueue;
    pool: IPool;
}
export interface ITask {
    uid: string;
    url: string;
    planName: string;
    hasRetried?: number;
    info?: {
        [index: string]: any;
    };
}
