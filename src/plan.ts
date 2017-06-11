import { IRule, TPreOperation } from "./types";

export class Plan {
    public rule: IRule;
    // TODO C 更完善的类型提示
    public request: any;
    public use: TPreOperation[];
    public info: any;
    // TODO C 包括下面参数的类型
    constructor(rule: IRule, request: any, use: any[], info: any) {
        this.rule = rule;
        this.request = request || null;
        this.use = use || null;
        this.info = info || null;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class DownloadPlan {
    public path: string;
    // TODO C 更完善的类型提示
    public request: any;
    public use: any[];
    public info: any;
    public handleError: any;
    public finishCallback: any;
    constructor(finishCallback, handleError, path, request, use, info) {
        this.path = path;
        this.request = request || null;
        this.use = use || null;
        this.info = info || null;
        this.handleError = handleError;
        this.finishCallback = finishCallback;
    }
}
