/// <reference types="node" />
/// <reference types="cheerio" />
import * as http from "http";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";
import { ICurrent } from "./requestPlan";
export declare type IHandle = ($: IJq, current: ICurrent, spider: Spider) => any | Promise<any>;
export interface IOption {
    name: string;
    handle: IHandle;
    failed?: (error: Error, task: ITask, spider: Spider) => any;
    retries?: number;
    toUtf8?: boolean;
    requestOpts?: http.RequestOptions;
}
export default function jqPlan(option: IOption): IPlan;
export interface IJq extends CheerioStatic {
    (selector: string): IJq;
    urls: () => string[];
}
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export declare function loadJq(currentTask: ICurrent): IJq;
