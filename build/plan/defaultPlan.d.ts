/// <reference types="got" />
/// <reference types="node" />
/// <reference types="cheerio" />
import * as got from "got";
import * as http from "http";
import Spider from "../spider";
import { IPlan, ITask } from "../types";
export interface IDefaultPlanCurrent extends ITask {
    response: got.Response<Buffer>;
    body: string;
    $?: CheerioStatic;
}
export declare type IDefaultPlanCallback = (err: Error | null, current: IDefaultPlanCurrent, spider: Spider) => any | Promise<any>;
export interface IDefaultPlanOption {
    callback: IDefaultPlanCallback;
    toUtf8?: boolean;
    jQ?: boolean;
    requestOpts?: http.RequestOptions;
}
export default function defaultPlan(option: IDefaultPlanOption | IDefaultPlanCallback): IPlan;
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export declare function preLoadJq(currentTask: IDefaultPlanCurrent): void;
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
export declare function preToUtf8(res: got.Response<Buffer>): string;
