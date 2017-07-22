import * as request from "request";
import Plan from "./plan";
import { ICurrent } from "./types";
export declare type TStreamPlanOptionCallback = (req: request.Request, current: ICurrent) => void;
export interface IStreamPlanOptionInput {
    multi?: number;
    request?: any;
    callback: TStreamPlanOptionCallback;
    info?: any;
}
export interface IStreamPlanOption extends IStreamPlanOptionInput {
    request: any;
    callback: TStreamPlanOptionCallback;
    info: any;
}
export default function streamPlan(opts: TStreamPlanOptionCallback | IStreamPlanOptionInput): Plan;
