import { IPlan, ITask } from "./types";
export default function downloadPlan(name: string, opts: IDownloadPlanOpion): DownloadPlan;
/**
 * s.queue(dlPlan, "http://img.com/my.jpg"); ==> img.com!my.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "name.jpg"); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", "*.png"); ===> img.com!my.jpg.png
 * s.queue(dlPlan, "http://img.com/my.jpg", {fileName: "name.jpg"}); ===> name.jpg
 * s.queue(dlPlan, "http://img.com/my.jpg", {ext: ".png"}); ===> img.com!my.jpg.png
 */
export interface IDownloadPlanOpion {
    request?: any;
    path: string;
    callback: (err: Error | null, current: ITask) => void;
}
export declare class DownloadPlan implements IPlan {
    option: IDownloadPlanOpion;
    name: string;
    constructor(name: string, option: IDownloadPlanOpion);
    process(task: ITask): Promise<{}>;
}
