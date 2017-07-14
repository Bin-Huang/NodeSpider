"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
class Plan {
    constructor(type, options, process) {
        this.type = type;
        this.options = options;
        this.process = process;
    }
}
exports.Plan = Plan;
// TODO C 考虑是否使用类继承的方式，代替type
// TODO C 考虑是否支持，或者删除 special
function defaultPlan(opts) {
    // opts 成员存在性检测
    return new Plan("default", opts, (task, self) => __awaiter(this, void 0, void 0, function* () {
        const requestOpts = Object.assign({ url: task.url }, task.specialOpts.request);
        const { error, response, body } = yield requestAsync(requestOpts);
        let current = Object.assign(task, {
            response,
            plan: self._STATE.planStore.get(task.planKey),
            body,
            error,
            info: task.specialOpts.info,
        });
        // 如果没有错误，按顺序执行预处理函数，对current进行预处理
        // if (! error) {
        //     for (const preFun of task.specialOpts.pre) {
        //         let result = preFun(error, current);
        //         if (result instanceof Promise) {
        //             result = await result;
        //         }
        //     }
        // }
        // 执行该计划的爬取策略函数，根据开发者定义的抓取规则进行操作
        const result = task.specialOpts.callback(error, current);
        if (result instanceof Promise) {
            yield result;
        }
        // 结尾的清理工作
        current = null;
    }));
}
exports.defaultPlan = defaultPlan;
function requestAsync(requestOpts) {
    return new Promise((resolve, reject) => {
        request(requestOpts, (error, response, body) => {
            resolve({ error, response, body });
        });
    });
}