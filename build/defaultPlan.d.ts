import Spider from "./spider";
import { IPlan, IRequestOptionInput, ITask } from "./types";
export interface IDefaultPlanOption extends IRequestOptionInput {
    callbacks: IDefaultPlanOptionCallback[];
    name: string;
}
export declare type IDefaultPlanOptionCallback = (err: Error, current: IDefaultPlanCurrent, spider: Spider) => any | Promise<any>;
export interface IDefaultPlanCurrent extends ITask {
    response: any;
    body: string;
    [propName: string]: any;
}
/**
 * 默认值 type: "default", info: {}, option: {request: {encoding: null}, pre: [preToUtf8(), preLoadJq()], callback }
 * @param planOptionInput
 */
export declare function defaultPlan(option: IDefaultPlanOption): DefaultPlan;
export declare class DefaultPlan implements IPlan {
    option: IDefaultPlanOption;
    name: string;
    constructor(name: string, option: IDefaultPlanOption);
    process(task: ITask, spider: Spider): Promise<void>;
}
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export declare function preLoadJq(error: Error, currentTask: IDefaultPlanCurrent): void;
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
export declare function preToUtf8(error: Error, currentTask: IDefaultPlanCurrent): void;
