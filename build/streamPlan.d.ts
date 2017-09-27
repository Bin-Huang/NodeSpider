import * as request from "request";
import Spider from "./spider";
import { IPlan, IRequestOptionInput, ITask } from "./types";
export interface IStreamPlanOption extends IRequestOptionInput {
    callback: (err: Error | null, current: IStreamPlanCurrent, s: Spider) => void;
    name: string;
}
export interface IStreamPlanCurrent extends ITask {
    res: request.Request;
    [propName: string]: any;
}
export default function streamPlan(option: IStreamPlanOption): StreamPlan;
export declare class StreamPlan implements IPlan {
    option: IStreamPlanOption;
    name: string;
    constructor(name: string, option: IStreamPlanOption);
    process(task: ITask, spider: Spider): Promise<{}>;
}
