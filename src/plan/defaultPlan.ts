import * as charset from "charset";
import * as cheerio from "cheerio";
import * as got from "got";
import * as http from "http";
import * as iconv from "iconv-lite";
import * as request from "request";
import * as url from "url";
import Spider from "../spider";
import NodeSpider from "../spider";
import { IPlan, ITask } from "../types";

export interface IDefaultPlanCurrentSucceed extends ITask {
    response: got.Response<Buffer>;
    body: string;
    $?: CheerioStatic;
}
export interface IDefaultPlanCurrentFailed extends ITask {
    response: {};
    body: string;
    $?: CheerioStatic;
}

export type IDefaultPlanCallback =
    (err: Error|null, current: IDefaultPlanCurrentSucceed|IDefaultPlanCurrentFailed, spider: Spider)
    => any|Promise<any>;

export interface IDefaultPlanOption {
    callback: IDefaultPlanCallback;
    toUtf8?: boolean;
    jQ?: boolean;
    requestOpts?: http.RequestOptions;
}

const defaultOpts = {
    toUtf8: true,
    jQ: true,
    requestOpts: { encoding: null },
};

export default function defaultPlan(option: IDefaultPlanOption|IDefaultPlanCallback): IPlan {
    if (typeof option === "function") {
        option = { callback: option };
    }
    const opts = { ...defaultOpts, ...option };
    return async (task, spider) => {
        let res: got.Response<Buffer>;
        try {
            res = await got(task.url, opts.requestOpts);
            const current = { ...task, response: res, body: res.body.toString() };
            if (opts.toUtf8) { preToUtf8(current); }
            if (opts.jQ) { preLoadJq(current); }
            try {
                return await opts.callback(null, current, spider);
            } catch (e) {
                console.log(`callback error: ${e}`);
            }
        } catch (err) {
            const current = { ...task, response: {}, body: "" };
            try {
                return await opts.callback(err, current, spider);
            } catch (e) {
                console.log(`callback error: ${e}`);
            }
        }

    };
}

/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
export function preLoadJq(currentTask: IDefaultPlanCurrentSucceed): void {
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
export function preToUtf8(currentTask: IDefaultPlanCurrentSucceed): void {
    const encoding = charset(currentTask.response.headers, currentTask.response.body.toString());
    // 有些时候会无法获得当前网站的编码，原因往往是网站内容过于简单，比如最简单的404界面。此时无需转码
    // TODO: 有没有可能，在需要转码的网站无法获得 encoding？
    if (encoding) {
        currentTask.body = iconv.decode(currentTask.response.body, encoding);
    }
}
