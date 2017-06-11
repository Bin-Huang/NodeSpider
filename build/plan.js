"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO A 重要思想
// plan 内容应该足够的详细，包含缺省值的默认值
// 所有对开发者开放的api函数，如nodespider的开放api方法，必须保证参数的完整性。
class Plan {
    // TODO C 包括下面参数的类型
    constructor(rule, request, use, info) {
        this.rule = rule;
        this.request = request || {};
        this.use = use || [];
        this.info = info || {};
    }
}
exports.Plan = Plan;
// tslint:disable-next-line:max-classes-per-file
class DownloadPlan {
    constructor(handleError, handleFinish, path, request, use, info) {
        this.handleError = handleError;
        if (handleFinish) {
            this.handleFinish = handleFinish;
        }
        else {
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
exports.DownloadPlan = DownloadPlan;
