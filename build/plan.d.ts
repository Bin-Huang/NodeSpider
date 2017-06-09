export interface ICurrent {
    url: string;
    plan: Plan;
    response: any;
    body: any;
    error: Error;
    hasRetried?: number;
}
export declare type IRule = (err: Error, current: ICurrent) => void;
export interface IPlanInput {
    rule: IRule;
    request?: any;
    use?: any[];
    info?: any;
}
export declare class Plan {
    rule: IRule;
    request: any;
    use: any[];
    info: any;
    constructor(rule: IRule, request: any, use: any[], info: any);
}
export declare class DownloadPlan {
    path: string;
    request: any;
    use: any[];
    info: any;
    callback: any;
    constructor(callback: any, path: any, request: any, use: any, info: any);
}
