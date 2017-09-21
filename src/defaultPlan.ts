import * as charset from "charset";
import * as cheerio from "cheerio";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import Spider from "./spider";
import { IPlan, IRequestOptionInput, ITask } from "./types";

// for 传递给Plan真正的设置
export interface IDefaultPlanOption extends IRequestOptionInput {
    callbacks: IDefaultPlanOptionCallback[];
    name: string;
}

// for defaultPlan设置中的callback
export type IDefaultPlanOptionCallback = (err: Error, current: IDefaultPlanCurrent, spider: Spider) => any|Promise<any>;

// current crawl task; for `rule` function in the plan
export interface IDefaultPlanCurrent extends ITask {
    response: any;
    body: string;
    [propName: string]: any;
}

/**
 * 默认值 type: "default", info: {}, option: {request: {encoding: null}, pre: [preToUtf8(), preLoadJq()], callback }
 * @param planOptionInput
 */
export function defaultPlan(option: IDefaultPlanOption) {
    if (typeof option.name !== "string") {
        throw new TypeError("err");
    }
    if (! Array.isArray(option.callbacks)) {
        throw new TypeError("err");
    }
    for (const cb of option.callbacks) {
        if (typeof cb !== "function") {
            throw new TypeError("err");
        }
    }
    option.method = option.method || "GET";
    option.header = option.header || {};
    return new DefaultPlan(option.name, option);
}

export class DefaultPlan implements IPlan {
    public option: IDefaultPlanOption;
    public name: string;
    constructor(name: string, option: IDefaultPlanOption) {
        this.option = option;
        this.name = name;
    }
    public async process(task: ITask, spider: Spider) {
        const {error, response, body}: any = await requestAsync({
            encoding: null,
            header: this.option.header,
            method: this.option.method,
            url: task.url,
        });
        const current: IDefaultPlanCurrent = Object.assign(task, {
            response,
            body,
        });

        // 按顺序执行callback
        try {
            for (const cb of this.option.callbacks) {
                const result = cb(error, current, spider);
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

function requestAsync(opts: any) {
    return new Promise((resolve, reject) => {
        request(opts, (error: Error, response: any, body: any) => {
            resolve({error, response, body});
        });
    });
}

/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export function preLoadJq(error: Error, currentTask: IDefaultPlanCurrent): void {
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
export function preToUtf8(error: Error, currentTask: IDefaultPlanCurrent): void {
    if (error) { return ; }
    const encoding = charset(currentTask.response.headers, currentTask.response.body.toString());
    // 有些时候会无法获得当前网站的编码，原因往往是网站内容过于简单，比如最简单的404界面。此时无需转码
    // TODO: 有没有可能，在需要转码的网站无法获得 encoding？
    if (encoding) {
        currentTask.body = iconv.decode(currentTask.response.body, encoding);
    }
}
