/// <reference types="node" />
import * as stream from "stream";
import Plan from "./plan";
import { ITask } from "./types";
export declare type TStreamPlanOptionCallback = (req: stream.Readable, current: IStreamPlanOptionCallbackCurrent, end) => void;
export interface IStreamPlanOptionInput {
    request?: any;
    callback: TStreamPlanOptionCallback;
    info?: any;
}
export interface IStreamPlanOption extends IStreamPlanOptionInput {
    request: any;
    callback: TStreamPlanOptionCallback;
    info: any;
}
export interface IStreamPlanOptionCallbackCurrent extends ITask {
    plan: Plan;
    info: any;
    specialOpts: IStreamPlanOption;
    [propName: string]: any;
}
export default function streamPlan(opts: TStreamPlanOptionCallback | IStreamPlanOptionInput): Plan;
