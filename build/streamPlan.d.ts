import * as request from "request";
import { IPlan, ITask } from "./types";
export declare type TStreamPlanOptionCallback = (req: request.Request, current: ITask) => void;
export interface IStreamPlanOptionInput {
    name?: string;
    request?: any;
    callback: TStreamPlanOptionCallback;
}
export interface IStreamPlanOption {
    request: any;
    callback: TStreamPlanOptionCallback;
}
export default function streamPlan(name: string, opts: TStreamPlanOptionCallback | IStreamPlanOptionInput): StreamPlan;
export declare class StreamPlan implements IPlan {
    option: IStreamPlanOption;
    name: string;
    constructor(name: string, option: IStreamPlanOption);
    process(task: ITask): Promise<{}>;
}
