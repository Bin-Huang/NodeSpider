/// <reference types="cheerio" />
import Spider from "../spider";
import { IPlan, ITask } from "../types";
export interface IDefaultPlanOptionInput {
    method?: string;
    headers?: any;
    callback: IDefaultPlanOptionCallback;
    toUtf8?: boolean;
    jQ?: boolean;
}
export interface IDefaultPlanOption {
    method: string;
    headers: any;
    callback: IDefaultPlanOptionCallback;
    toUtf8: boolean;
    jQ: boolean;
}
export declare type IDefaultPlanOptionCallback = (err: Error, current: IDefaultPlanCurrent, spider: Spider) => any | Promise<any>;
export interface IDefaultPlanCurrent extends ITask {
    response: any;
    body: string;
    $?: CheerioStatic;
}
export declare function defaultPlan(option: IDefaultPlanOptionInput): DefaultPlan;
export declare class DefaultPlan implements IPlan {
    option: IDefaultPlanOption;
    constructor(opts: IDefaultPlanOptionInput);
    process(task: ITask, spider: Spider): Promise<void>;
}
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export declare function loadJq(error: Error, currentTask: IDefaultPlanCurrent): void;
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
export declare function toUtf8(error: Error, currentTask: IDefaultPlanCurrent): void;
