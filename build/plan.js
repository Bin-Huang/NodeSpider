"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spider_1 = require("./spider");
// TODO A 重要思想
// plan 内容应该足够的详细，包含缺省值的默认值
// 所有对开发者开放的api函数，如nodespider的开放api方法，必须保证参数的完整性。
class Plan {
    // TODO C 包括下面参数的类型
    constructor(rule, request, use, info) {
        request = request || {};
        this.request = Object.assign({ encoding: null }, request);
        this.use = use || [
            spider_1.default.decode(),
            spider_1.default.loadJQ(),
        ];
        this.info = info || {};
        this.rule = rule;
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
