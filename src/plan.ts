import NodeSpider from "./spider";
import { IRule, THandleError, THandleFinish, TPreOperation } from "./types";

// TODO A 重要思想
// plan 内容应该足够的详细，包含缺省值的默认值

// 所有对开发者开放的api函数，如nodespider的开放api方法，必须保证参数的完整性。

export class Plan {
    public rule: IRule;
    // TODO C 更完善的类型提示
    public request: any;
    public use: TPreOperation[];
    public info: any;
    // TODO C 包括下面参数的类型
    constructor(rule: IRule, request?: any, use?: any[], info?: any) {
        request = request || {};
        this.request = Object.assign({encoding: null}, request);
        this.use = use || [
            NodeSpider.decode(),
            NodeSpider.loadJQ(),
        ];
        this.info = info || {};
        this.rule = rule;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class DownloadPlan {
    public path: string;
    // TODO C 更完善的类型提示
    public request: any;
    public use: any[];
    public info: any;
    public handleError: THandleError;
    public handleFinish: THandleFinish;
    constructor(
        handleError: THandleError,
        handleFinish?: THandleFinish,
        path?: string,
        request?, use?, info?,
    ) {
        this.handleError = handleError;
        if (handleFinish) {
            this.handleFinish = handleFinish;
        } else {
            this.handleFinish = (current) => {
                console.log(`download done! ${current.url}`);
            };
        }
        this.path = path || "";
        this.request = request || {};
        this.use = use || [];
        this.info = info || {};
    }
}
