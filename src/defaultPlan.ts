import * as charset from "charset";
import * as cheerio from "cheerio";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import NodeSpider from "./spider";
import { IPlan, IRequestOpts, ITask } from "./types";

// for 函数defaultPlan的设置参数
export interface IDefaultPlanOptionInput {
    callback: IDefaultPlanOptionCallback | IDefaultPlanOptionCallback[];
    type?: string;
    request ?: IRequestOpts;
}
// for 传递给Plan真正的设置
export interface IDefaultPlanOption {
    request: IRequestOpts;
    callback: IDefaultPlanOptionCallback[];
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

export function defaultPlan(planOptionInput: IDefaultPlanOptionCallback|IDefaultPlanOptionInput): IPlan {
    // 当只传入一个rule函数，则包装成 IPlanInput 对象，并设置预处理函数
    if (typeof planOptionInput === "function") {
        planOptionInput = { callback: [preToUtf8, preLoadJq, planOptionInput] };
    }

    // 类型检测
    if (typeof planOptionInput !== "object") {
        throw new TypeError(`\
            failed to create new default plan
            the parameter can only be a function or an object
        `);
    }

    const request = Object.assign({encoding: null}, planOptionInput.request);
    const callback = planOptionInput.callback;
    const planOption: IDefaultPlanOption = {
        request,
        callback: (Array.isArray(callback)) ? callback : [callback],
    };

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
        const current: ICurrent = Object.assign(task, {
            response,
            body,
        });

        // 按顺序执行callback
        try {
            for (const cb of this.option.callback) {
                const result = cb(error, current);
                if (result instanceof Promise) {
                    await result;
                }
            }
        } catch (e) {
            console.error("defaultPlan: there are an error from callback function");
            throw e;
        }

    }
}

function requestAsync(opts: IRequestOpts) {
    return new Promise((resolve, reject) => {
        request(opts, (error: Error, response: any, body: any) => {
            resolve({error, response, body});
        });
    });
}

/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export function preLoadJq(error: Error, currentTask: ICurrent): void {
    if (error) { return ; }

    const $ = cheerio.load(currentTask.body);

    // 扩展：添加 url 方法
    // 返回当前节点（们）链接的的绝对路径(array)
    // 自动处理了锚和 javascript: void(0)
    // TODO B 存在不合法链接的返回
    $.prototype.url = function() {
        const result: string[] = [];
        $(this).each(function() {
            let newUrl = $(this).attr("href");
            // 如果为空，或是类似 'javascirpt: void(0)' 的 js 代码，直接跳过
            if (! newUrl || /^javascript/.test(newUrl)) {
                return false;
            }
            // 如果是相对路径，补全路径为绝对路径
            if (newUrl && !/^https?:\/\//.test(newUrl)) {
                newUrl = url.resolve(currentTask.url, newUrl);
            }
            // 去除连接中的锚
            const anchorIndex = newUrl.lastIndexOf("#");
            if (anchorIndex !== -1) {
                newUrl = newUrl.slice(0, anchorIndex);
            }
            result.push(newUrl);
        });
        return result;
    };

    /**
     * 获得选中节点（们）的 src 路径（自动补全）
     * @returns {array}
     */
    $.prototype.src = function() {
        const result: string[] = [];
        $(this).each(function() {
            let newUrl = $(this).attr("src");
            // 如果是相对路径，补全路径为绝对路径
            if (newUrl && !/^https?:\/\//.test(newUrl)) {
                newUrl = url.resolve(currentTask.url, newUrl);
            }
            result.push(newUrl);
        });
        return result;
    };

    currentTask.$ = $;
}

/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
export function preToUtf8(error: Error, currentTask: ICurrent): void {
    if (error) { return ; }
    const encoding = charset(currentTask.response.headers, currentTask.response.body.toString());
    // 有些时候会无法获得当前网站的编码，原因往往是网站内容过于简单，比如最简单的404界面。此时无需转码
    // TODO: 有没有可能，在需要转码的网站无法获得 encoding？
    if (encoding) {
        currentTask.body = iconv.decode(currentTask.response.body, encoding);
    }
}
