import Spider from "./spider";
export interface IPlan {
    name: string;
    process: (task: ITask, spider: Spider) => Promise<{} | null | void>;
    option?: any;
}
export interface IQueue {
    addTask: (newTask: ITask) => void;
    jumpTask: (newTask: ITask) => void;
    check: (url: string) => boolean;
    getWaitingTaskNum: () => number;
    getTotalUrlsNum: () => number;
    nextTask: () => ITask | null;
}
export interface IPipe {
    name: string;
    add: (data: any) => void;
    close: () => void;
}
export interface IState {
    queue: IQueue;
    planStore: Map<string, IPlan>;
    pipeStore: Map<string, IPipe>;
    option: IDefaultOption;
    working: boolean;
    currentTotalConnections: number;
}
export declare type queueClass = new () => IQueue;
export interface IDefaultOptionInput {
    concurrency?: number;
    queue?: queueClass;
}
export interface IDefaultOption extends IDefaultOptionInput {
    concurrency: number;
    queue: queueClass;
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
export interface IRequestOptionInput {
    method?: string;
    headers?: any;
}
