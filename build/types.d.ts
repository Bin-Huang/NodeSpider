/// <reference types="node" />
import Spider from "./spider";
export interface IPlan {
    process: (task: ITask, spider: Spider) => Promise<{} | null | void>;
    option: any;
}
export interface IPipe {
    format?: (data: any) => any;
    write: (data: any) => void;
    close: () => void;
}
export interface IState {
    queue: IQueue;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, {
        items: string[] | {
            [index: string]: (v: any) => any;
        };
        store: IPipe;
    }>;
    option: IOption;
    currentTotalConnections: ITask[];
    status: "active" | "pause" | "end";
    startAt: Date;
    endIn: Date | null;
    heartbeat: NodeJS.Timer | null;
}
export declare type queueClass = new () => IQueue;
export interface IOptionInput {
    concurrency?: number;
    queue?: queueClass;
    alive?: boolean;
}
export interface IOption {
    concurrency: number;
    queue: queueClass;
    alive: boolean;
}
export interface ITask {
    url: string;
    planName: string;
    hasRetried?: number;
    info?: any;
}
export interface IQueue {
    add: (newTask: ITask) => void;
    jump: (newTask: ITask) => void;
    check: (url: string) => boolean;
    getWaitingTaskNum: () => number;
    getTotalUrlsNum: () => number;
    next: () => ITask | null;
}
