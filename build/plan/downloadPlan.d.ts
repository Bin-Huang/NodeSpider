/// <reference types="node" />
import * as http from "http";
import { ITask } from "../interfaces";
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
    path: string;
    callback?: (err: Error | null, current: ICurrent, s: Spider) => Promise<any> | any;
    requestOpts?: http.RequestOptions;
}
export default function downloadPlan(option: IOption | string): (task: ITask, spider: Spider) => Promise<{}>;
