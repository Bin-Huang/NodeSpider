import { IRule, THandleError, THandleFinish, TPreOperation } from "./types";
export declare class Plan {
    rule: IRule;
    request: any;
    use: TPreOperation[];
    info: any;
    constructor(rule: IRule, request?: any, use?: any[], info?: any);
}
export declare class DownloadPlan {
    path: string;
    request: any;
    use: any[];
    info: any;
    handleError: THandleError;
    handleFinish: THandleFinish;
    constructor(handleError: THandleError, handleFinish?: THandleFinish, path?: string, request?: any, use?: any, info?: any);
}
