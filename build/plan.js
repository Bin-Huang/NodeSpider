"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Plan {
    // TODO C 包括下面参数的类型
    constructor(rule, request, use, info) {
        this.rule = rule;
        this.request = request || null;
        this.use = use || null;
        this.info = info || null;
    }
}
exports.Plan = Plan;
// tslint:disable-next-line:max-classes-per-file
class DownloadPlan {
    constructor(finishCallback, handleError, path, request, use, info) {
        this.path = path;
        this.request = request || null;
        this.use = use || null;
        this.info = info || null;
        this.handleError = handleError;
        this.finishCallback = finishCallback;
    }
}
exports.DownloadPlan = DownloadPlan;
