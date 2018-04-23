/// <reference types="node" />
/// <reference types="cheerio" />
import * as http from "http";
import { IPlan } from "../interfaces";
import Spider from "../spider";
import { ICurrent } from "./defaultPlan";
export declare type IHandle = ($: Jq, current: ICurrent, spider: Spider) => any | Promise<any>;
export interface IOption {
    name: string;
    handle: IHandle;
    catch?: (error: Error) => any;
    retries?: number;
    toUtf8?: boolean;
    requestOpts?: http.RequestOptions;
}
export interface IDefaultPlan {
    (name: string, handle: IHandle): IPlan;
    (option: IOption): IPlan;
}
export default function jqPlan(option: IOption): IPlan;
export interface Jq extends CheerioStatic {
    (selector: string): Jq;
    urls: () => string[];
}
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export declare function loadJq(currentTask: ICurrent): Jq;
