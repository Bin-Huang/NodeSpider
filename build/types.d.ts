import Spider from "./spider";
export declare type IPlan = (task: ITask, spider: Spider) => Promise<any>;
export interface IQueue {
    add: (task: ITask) => void;
    jump: (task: ITask) => void;
    next: () => ITask | null;
    getNum: () => number;
}
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
export interface IState {
    queue: IQueue;
    pool: IPool;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, IPipe>;
    option: IDefaultOptionInput;
    working: boolean;
    currentTotalConnections: number;
}
export interface IDefaultOptionInput {
    concurrency?: number;
    queue?: IQueue;
    pool?: IPool;
}
export interface ITask {
    url: string;
    planName: string;
    hasRetried?: number;
    info?: any;
}
export interface ICurrent extends ITask {
    info: any;
}
