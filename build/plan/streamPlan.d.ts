import * as request from "request";
import Spider from "../spider";
import { IPlan, ITask } from "../types";
export interface IStreamPlanOption {
    method?: string;
    headers?: any;
    callback: (err: Error | null, current: IStreamPlanCurrent, s: Spider) => void;
}
export interface IStreamPlanCurrent extends ITask {
    stream: request.Request | null;
    done: () => void;
    [propName: string]: any;
}
export default function streamPlan(option: IStreamPlanOption): StreamPlan;
export declare class StreamPlan implements IPlan {
    option: IStreamPlanOption;
    constructor(option: IStreamPlanOption);
    process(task: ITask, spider: Spider): Promise<{}>;
}
