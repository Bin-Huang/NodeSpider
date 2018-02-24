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
const charset = require("charset");
const cheerio = require("cheerio");
const got = require("got");
const iconv = require("iconv-lite");
const url = require("url");
const defaultOpts = {
    toUtf8: true,
    jQ: true,
    requestOpts: { encoding: null },
};
function defaultPlan(option) {
    if (typeof option === "function") {
        option = { callback: option };
    }
    const opts = Object.assign({}, defaultOpts, option);
    return (task, spider) => __awaiter(this, void 0, void 0, function* () {
        let res;
        let err = null;
        let current;
        try {
            res = yield got(task.url, opts.requestOpts);
            current = Object.assign({}, task, { response: res, body: res.body.toString() });
        }
        catch (e) {
            err = e;
            current = Object.assign({}, task, { response: {}, body: "" });
        }
        if (!err) {
            if (opts.toUtf8) {
                current.body = preToUtf8(current.response);
            }
            if (opts.jQ) {
                preLoadJq(current);
            }
        }
        try {
            return yield opts.callback(err, current, spider);
        }
        catch (e) {
            console.log(`callback failed: ${e}`);
        }
    });
}
exports.default = defaultPlan;
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 */
function preLoadJq(currentTask) {
    const $ = cheerio.load(currentTask.body);
    // 扩展：添加 url 方法
    // 返回当前节点（们）链接的的绝对路径(array)
    // 自动处理了锚和 javascript: void(0)
    // TODO B 存在不合法链接的返回
    $.prototype.url = function () {
        const result = [];
        $(this).each(function () {
            let newUrl = $(this).attr("href");
            // 如果为空，或是类似 'javascirpt: void(0)' 的 js 代码，直接跳过
            if (!newUrl || /^javascript/.test(newUrl)) {
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
    $.prototype.src = function () {
        const result = [];
        $(this).each(function () {
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
exports.preLoadJq = preLoadJq;
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
function preToUtf8(res) {
    const encoding = charset(res.headers, res.body.toString());
    // 有些时候会无法获得当前网站的编码，原因往往是网站内容过于简单，比如最简单的404界面。此时无需转码
    // TODO: 有没有可能，在需要转码的网站无法获得 encoding？
    if (encoding) {
        return iconv.decode(res.body, encoding);
    }
    else {
        return res.body.toString();
    }
}
exports.preToUtf8 = preToUtf8;
