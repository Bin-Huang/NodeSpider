/// <reference types="node" />
import * as http from "http";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";
/**
 * s.queue(dlPlan, "http://img.com/my.jpg"); ==> img.com!my.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "*.png"); ===> img.com!my.jpg.png
 * s.queue(dlPlan, "http://img.com/my.jpg", {fileName: "name.jpg"}); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", {ext: ".png"}); ===> img.com!my.jpg.png
 */
export interface ICurrent extends ITask {
    filepath: string;
}
export interface IOption {
    name: string;
    path: string;
    retries?: number;
    callback?: (current: ICurrent, s: Spider) => Promise<any> | any;
    catch?: (error: Error, task: ITask, spider: Spider) => any;
    requestOpts?: http.RequestOptions;
}
export default function downloadPlan(option: IOption): IPlan;
