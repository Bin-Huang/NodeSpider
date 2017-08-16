import { IPlan, ITask } from "./types";
export default function downloadPlan(opts: IDownloadPlanOpion): DownloadPlan;
export interface IDownloadPlanOpion {
    request?: any;
    path: string;
    ext: string;
    callback: (err: Error | null, current: ITask) => void;
    type?: string;
}
export declare class DownloadPlan implements IPlan {
    option: IDownloadPlanOpion;
    type: string;
    constructor(option: IDownloadPlanOpion);
    process(task: ITask): Promise<{}>;
}
