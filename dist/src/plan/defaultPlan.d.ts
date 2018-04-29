/// <reference types="got" />
/// <reference types="node" />
import * as got from "got";
import * as http from "http";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";
export interface ICurrent extends ITask {
    response: got.Response<Buffer>;
    body: string;
}
export declare type IHandle = (current: ICurrent, spider: Spider) => any | Promise<any>;
export interface IOption {
    name: string;
    handle: IHandle;
    catch?: (error: Error, task: ITask, spider: Spider) => any;
    retries?: number;
    toUtf8?: boolean;
    requestOpts?: http.RequestOptions;
}
export interface IDefaultPlan {
    (name: string, handle: IHandle): IPlan;
    (option: IOption): IPlan;
}
export default function defaultPlan(option: IOption): IPlan;
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
export declare function toUtf8(res: got.Response<Buffer>): string;