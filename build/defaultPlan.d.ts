import Plan from "./plan";
import { IRequestOpts, ITask } from "./types";
export interface IDefaultPlanOptionInput {
    callback: IDefaultPlanOptionCallback;
    multi?: number;
    request?: IRequestOpts;
    pre?: IDefaultPlanOptionCallback[];
    info?: any;
}
export interface IDefaultPlanOption extends IDefaultPlanOptionInput {
    request: IRequestOpts;
    pre: IDefaultPlanOptionCallback[];
    callback: IDefaultPlanOptionCallback;
    info: any;
}
export declare type IDefaultPlanOptionCallback = (err: Error, current: IDefaultPlanCurrent) => any | Promise<any>;
export interface IDefaultPlanCurrent extends ITask {
    plan: Plan;
    response: any;
    body: string;
    error: Error;
    info: any;
    specialOpts: IDefaultPlanOption;
    [propName: string]: any;
}
export default function defaultPlan(planOptionInput: IDefaultPlanOptionCallback | IDefaultPlanOptionInput): Plan;
