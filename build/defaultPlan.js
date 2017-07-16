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
const plan_1 = require("./plan");
const preLoadJq_1 = require("./preLoadJq");
const preToUtf8_1 = require("./preToUtf8");
// TODO C 考虑是否使用类继承的方式，代替type
function defaultPlan(planOptionInput) {
    // 当只传入一个rule函数，则包装成 IPlanInput 对象
    if (typeof planOptionInput === "function") {
        planOptionInput = { callback: planOptionInput };
    }
    // 类型检测
    if (typeof planOptionInput !== "object") {
        throw new Error("参数类型错误，只能是函数或则对象");
    }
    if (typeof planOptionInput.callback !== "function") {
        throw new Error("plan缺失callback成员");
    }
    // 填充plan设置默认值
    const pre = planOptionInput.pre || [
        preToUtf8_1.default(),
        preLoadJq_1.default(),
    ];
    const request = Object.assign({ encoding: null }, planOptionInput.request);
    const info = planOptionInput.info || {};
    const callback = planOptionInput.callback;
    const planOption = { request, callback, pre, info };
    return new plan_1.default("default", planOption, processFun);
}
exports.default = defaultPlan;
function processFun(task, self) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestOpts = Object.assign({ url: task.url }, task.specialOpts.request);
        const { error, response, body } = yield requestAsync(requestOpts);
        let current = Object.assign(task, {
            response,
            body,
            error,
            info: task.specialOpts.info,
            plan: self._STATE.planStore.get(task.planKey),
        });
        // 如果没有错误，按顺序执行预处理函数，对current进行预处理
        if (!error) {
            for (const preFun of task.specialOpts.pre) {
                const result = preFun(error, current);
                if (result instanceof Promise) {
                    yield result;
                }
            }
        }
        // 执行该计划的爬取策略函数，根据开发者定义的抓取规则进行操作
        const result = task.specialOpts.callback(error, current);
        if (result instanceof Promise) {
            yield result;
        }
        // 结尾的清理工作
        current = null;
        // task = null;
    });
}
function requestAsync(opts) {
    return new Promise((resolve, reject) => {
        request(opts, (error, response, body) => {
            resolve({ error, response, body });
        });
    });
}