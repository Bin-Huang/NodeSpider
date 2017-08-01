import { IPlan, IRequestOpts, ITask } from "./types";
export interface IDefaultPlanOptionInput {
    type?: string;
    callback: IDefaultPlanOptionCallback;
    request?: IRequestOpts;
    pre?: IDefaultPlanOptionCallback[];
    info?: any;
}
export interface IDefaultPlanOption {
    request: IRequestOpts;
    pre: IDefaultPlanOptionCallback[];
    callback: IDefaultPlanOptionCallback;
}
export declare type IDefaultPlanOptionCallback = (err: Error, current: ICurrent) => any | Promise<any>;
export interface ICurrent extends ITask {
    response: any;
    body: string;
    [propName: string]: any;
}
/**
 * 默认值 type: "default", info: {}, option: {request: {encoding: null}, pre: [preToUtf8(), preLoadJq()], callback }
 * @param planOptionInput
 */
export default function defaultPlan(planOptionInput: IDefaultPlanOptionCallback | IDefaultPlanOptionInput): IPlan;
export declare class DefaultPlan implements IPlan {
    option: IDefaultPlanOption;
    type: string;
    info: any;
    constructor(type: string, option: IDefaultPlanOption, info: any);
    process(task: ITask): Promise<void>;
}
