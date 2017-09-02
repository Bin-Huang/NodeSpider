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
const preLoadJq_1 = require("./preLoadJq");
const preToUtf8_1 = require("./preToUtf8");
/**
 * 默认值 type: "default", info: {}, option: {request: {encoding: null}, pre: [preToUtf8(), preLoadJq()], callback }
 * @param planOptionInput
 */
function defaultPlan(planOptionInput) {
    // 当只传入一个rule函数，则包装成 IPlanInput 对象
    if (typeof planOptionInput === "function") {
        planOptionInput = { callback: planOptionInput };
    }
    // 类型检测
    if (typeof planOptionInput !== "object") {
        throw new TypeError(`\
            failed to create new default plan
            the parameter can only be a function or an object
        `);
    }
    if (typeof planOptionInput.callback !== "function") {
        throw new TypeError(`\
            failed to create new default plan
            the object of options should include the required member: 'callback' function
        `);
    }
    // 填充plan设置默认值
    const pre = planOptionInput.pre || [
        preToUtf8_1.default(),
        preLoadJq_1.default(),
    ];
    const request = Object.assign({ encoding: null }, planOptionInput.request);
    const callback = planOptionInput.callback;
    const planOption = { request, callback, pre };
    const type = planOptionInput.type || "default";
    return new DefaultPlan(type, planOption);
}
exports.default = defaultPlan;
class DefaultPlan {
    constructor(type, option) {
        this.option = option;
        this.type = type;
    }
    process(task) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error, response, body } = yield requestAsync(Object.assign({}, this.option.request, { url: task.url }));
            let current = Object.assign(task, {
                response,
                body,
            });
            // 如果没有错误，按顺序执行预处理函数，对current进行预处理
            if (!error) {
                for (const preFun of this.option.pre) {
                    const result = preFun(error, current);
                    if (result instanceof Promise) {
                        yield result;
                    }
                }
            }
            // 执行该计划的爬取策略函数，根据开发者定义的抓取规则进行操作
            try {
                const result = this.option.callback(error, current);
                if (result instanceof Promise) {
                    yield result;
                }
            }
            catch (e) {
                throw e;
            }
            // 结尾的清理工作
            current = null;
            // task = null;
        });
    }
}
exports.DefaultPlan = DefaultPlan;
function requestAsync(opts) {
    return new Promise((resolve, reject) => {
        request(opts, (error, response, body) => {
            resolve({ error, response, body });
        });
    });
}
