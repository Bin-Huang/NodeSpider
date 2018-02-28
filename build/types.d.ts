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
    name: string;
    add: (data: any) => void;
    close: () => void;
}
export interface IState {
    queue: IQueue;
    pool: IPool;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, IPipe>;
    opts: IOpts;
    working: boolean;
    currentTasks: ITask[];
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
