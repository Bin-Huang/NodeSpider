import * as request from "request";
import preLoadJq from "./preLoadJq";
import preToUtf8 from "./preToUtf8";
import NodeSpider from "./spider";
import { IPlan, IRequestOpts, ITask } from "./types";

// for 函数defaultPlan的设置参数
export interface IDefaultPlanOptionInput {
    type?: string;
    callback: IDefaultPlanOptionCallback;
    request?: IRequestOpts;
    pre?: IDefaultPlanOptionCallback[];
}
// for 传递给Plan真正的设置
export interface IDefaultPlanOption {
    request: IRequestOpts;
    pre: IDefaultPlanOptionCallback[];
    callback: IDefaultPlanOptionCallback;
}
// for defaultPlan设置中的callback
export type IDefaultPlanOptionCallback = (err: Error, current: ICurrent) => any|Promise<any>;

// current crawl task; for `rule` function in the plan
export interface ICurrent extends ITask {
    response: any;
    body: string;
    [propName: string]: any;
}

/**
 * 默认值 type: "default", info: {}, option: {request: {encoding: null}, pre: [preToUtf8(), preLoadJq()], callback }
 * @param planOptionInput
 */

export default function defaultPlan(planOptionInput: IDefaultPlanOptionCallback|IDefaultPlanOptionInput): IPlan {
    // 当只传入一个rule函数，则包装成 IPlanInput 对象
    if (typeof planOptionInput === "function") {
        planOptionInput = {callback: planOptionInput};
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
        preToUtf8(),
        preLoadJq(),
    ];
    const request = Object.assign({encoding: null}, planOptionInput.request);
    const callback = planOptionInput.callback;
    const planOption: IDefaultPlanOption = { request, callback, pre };

    const type = planOptionInput.type || "default";

    return new DefaultPlan(type, planOption);
}

export class DefaultPlan implements IPlan {
    public option: IDefaultPlanOption;
    public type: string;
    constructor(type: string, option: IDefaultPlanOption) {
        this.option = option;
        this.type = type;
    }
    public async process(task: ITask) {
        const {error, response, body}: any = await requestAsync({
            ...this.option.request,
            url: task.url,
        });
        let current: ICurrent = Object.assign(task, {
            response,
            body,
        });
        // 如果没有错误，按顺序执行预处理函数，对current进行预处理
        if (! error) {
            for (const preFun of this.option.pre) {
                const result = preFun(error, current);
                if (result instanceof Promise) {
                    await result;
                }
            }
        }

        // 执行该计划的爬取策略函数，根据开发者定义的抓取规则进行操作
        try {
            const result = this.option.callback(error, current);
            if (result instanceof Promise) {
                await result;
            }
        } catch (e) {
            console.error("defaultPlan: there are an error from callback function");
            throw e;
        }
        // 结尾的清理工作
        current = null;
        // task = null;
    }
}

function requestAsync(opts: IRequestOpts) {
    return new Promise((resolve, reject) => {
        request(opts, (error: Error, response: any, body: any) => {
            resolve({error, response, body});
        });
    });
}
