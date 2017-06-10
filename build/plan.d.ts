import { IRule, TPreOperation } from "./types";
export declare class Plan {
    rule: IRule;
    request: any;
    use: TPreOperation[];
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
