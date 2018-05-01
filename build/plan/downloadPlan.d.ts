import Spider from "../spider";
import { IPlan, ITask } from "../types";
/**
 * s.queue(dlPlan, "http://img.com/my.jpg"); ==> img.com!my.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "*.png"); ===> img.com!my.jpg.png
 * s.queue(dlPlan, "http://img.com/my.jpg", {fileName: "name.jpg"}); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", {ext: ".png"}); ===> img.com!my.jpg.png
 */
export interface IDownloadPlanOpion {
    method?: string;
    headers?: any;
    callback: (err: Error | null, current: ITask, s: Spider) => void;
    path: string;
}
export default function downloadPlan(option: IDownloadPlanOpion): DownloadPlan;
export declare class DownloadPlan implements IPlan {
    option: IDownloadPlanOpion;
    constructor(option: IDownloadPlanOpion);
    process(task: ITask, spider: Spider): Promise<{}>;
}
