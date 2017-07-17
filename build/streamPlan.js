"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const plan_1 = require("./plan");
function streamPlan(opts) {
    if (typeof opts === "function") {
        opts = { callback: opts };
    }
    else if (typeof opts === "object") {
        if (typeof opts.callback !== "function") {
            throw new Error("新建streamPlan错误，参数对象需要携带函数类型的callback成员");
        }
    }
    else {
        throw new Error("新建streamPlan错误，参数类型只能是对象或者函数");
    }
    // 过滤掉opts中无关的成员
    const planOption = {
        callback: opts.callback,
        info: opts.info || {},
        request: opts.request || {},
    };
    return new plan_1.default("streamPlan", planOption, process);
}
exports.default = streamPlan;
function process(task, self) {
    return new Promise((resolve, reject) => {
        const requestOpts = Object.assign({ url: task.url }, task.specialOpts.request);
        const req = request(requestOpts);
        req.on("complete", resolve);
        req.on("error", resolve);
        // 为什么不直接监听request的close事件以resolve？
        // 当req流关闭时，下游可能还有操作，此时不能直接resolve进入下一个任务
        // 所以要把resovle当前任务的工作交给开发者自行决定
        const current = Object.assign({}, task, { info: task.specialOpts.info, plan: self._STATE.planStore.get(task.planKey), specialOpts: task.specialOpts });
        task.specialOpts.callback(req, current);
    });
}
