import { IPlan, IRequestOpts, ITask } from "./types";
export interface IDefaultPlanOptionInput {
    callback: IDefaultPlanOptionCallback | IDefaultPlanOptionCallback[];
    type?: string;
    request?: IRequestOpts;
}
export interface IDefaultPlanOption {
    request: IRequestOpts;
    callback: IDefaultPlanOptionCallback[];
}
export declare type IDefaultPlanOptionCallback = (err: Error, current: ICurrent) => any | Promise<any>;
export interface ICurrent extends ITask {
    response: any;
    body: string;
    [propName: string]: any;
}
/**
 * 默认值 type: "default", info: {}, option: {request: {encoding: null}, pre: [preToUtf8(), preLoadJq()], callback }
 * @param planOptionInput
 */
export declare function defaultPlan(planOptionInput: IDefaultPlanOptionCallback | IDefaultPlanOptionInput): IPlan;
export declare class DefaultPlan implements IPlan {
    option: IDefaultPlanOption;
    type: string;
    constructor(type: string, option: IDefaultPlanOption);
    process(task: ITask): Promise<void>;
}
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export declare function preLoadJq(error: Error, currentTask: ICurrent): void;
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
export declare function preToUtf8(error: Error, currentTask: ICurrent): void;
