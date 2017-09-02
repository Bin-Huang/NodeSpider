import { IPlan, ITask } from "./types";
export default function downloadPlan(opts: IDownloadPlanOpion): DownloadPlan;
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
    type?: string;
}
export declare class DownloadPlan implements IPlan {
    option: IDownloadPlanOpion;
    type: string;
    constructor(option: IDownloadPlanOpion);
    process(task: ITask): Promise<{}>;
}
