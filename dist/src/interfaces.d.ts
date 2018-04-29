/// <reference types="node" />
import Spider from "./spider";
export interface IPlan {
    name: string;
    retries: number;
    process: (task: ITask, spider: Spider) => Promise<any>;
    catch: (error: Error, task: ITask, spider: Spider) => any;
}
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
    name: string;
    items: IPipeItems;
    write: (data: any[]) => any;
    end: () => any;
}
export declare type IPipeItems = string[] | {
    [index: string]: (data: any) => any;
};
export declare type IStatus = "active" | "end" | "pause" | "vacant";
export interface IState {
    queue: IQueue;
    pool: IPool;
    planStore: IPlan[];
    pipeStore: IPipe[];
    opts: IOpts;
    currentTasks: ITask[];
    status: IStatus;
    heartbeat: NodeJS.Timer;
}
export interface IOptions {
    concurrency?: number;
    queue?: IQueue;
    pool?: IPool;
    heartbeat?: number;
    genUUID?: () => string;
}
export interface IOpts {
    concurrency: number;
    queue: IQueue;
    pool: IPool;
    heartbeat: number;
    genUUID: () => string;
}
export interface ITask {
    uid: string;
    url: string;
    planName: string;
    info?: {
        [index: string]: any;
    };
}
