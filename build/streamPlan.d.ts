import * as request from "request";
import { IPlan, ITask } from "./types";
export declare type TStreamPlanOptionCallback = (req: request.Request, current: ITask) => void;
export interface IStreamPlanOptionInput {
    type?: string;
    request?: any;
    callback: TStreamPlanOptionCallback;
}
export interface IStreamPlanOption {
    request: any;
    callback: TStreamPlanOptionCallback;
}
export default function streamPlan(opts: TStreamPlanOptionCallback | IStreamPlanOptionInput): StreamPlan;
export declare class StreamPlan implements IPlan {
    option: IStreamPlanOption;
    type: string;
    constructor(type: string, option: IStreamPlanOption);
    process(task: ITask): Promise<{}>;
}
