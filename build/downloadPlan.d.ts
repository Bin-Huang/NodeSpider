import { IPlan, ITask } from "./types";
export default function downloadPlan(opts: any): any;
export interface IDownloadPlanOpion {
    request: any;
    saveFolder: string;
    fileExt: string;
    callback: (err: Error | null, current: ITask) => void;
}
export declare class DownloadPlan implements IPlan {
    option: IDownloadPlanOpion;
    type: string;
    constructor(type: string, option: IDownloadPlanOpion);
    process(task: ITask): Promise<{}>;
}
