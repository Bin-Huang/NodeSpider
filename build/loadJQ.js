"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = require("cheerio");
const url = require("url");
function loadJQ() {
    return loadJqOperation;
}
exports.default = loadJQ;
/**
 * 根据currentTask.body加载jQ对象，并扩展url、todo、download方法，以第三个参数$的形式传递
 * @param thisSpider
 * @param currentTask
 * @return currentTask
 */
function loadJqOperation(thisSpider, currentTask) {
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
    /**
     * 添加选定节点（们）中的链接到 CrawlQueue 并自动补全路径、跳过重复链接
     * @param {null|function|object}  option 回掉函数或设置对象
     * option 为可选参数，空缺时新建任务的回调函数
     * 可以传入函数作为任务的回掉函数
     * 也可以是一个包括设置的对象，如果对象中不存在callback成员，则默认当前任务的callback
     */
    $.prototype.todo = function (option) {
        let newUrls = $(this).url();
        newUrls = thisSpider.filter(newUrls);
        if (typeof option === "undefined") {
            newUrls.map((u) => {
                thisSpider.addTask({
                    strategy: currentTask.strategy,
                    url: u,
                });
            });
        }
        else if (typeof option === "function") {
            newUrls.map((u) => {
                thisSpider.addTask({
                    strategy: option,
                    url: u,
                });
            });
        }
        else if (typeof option === "object") {
            option.callback = option.callback ? option.callback : currentTask.strategy;
            newUrls.map((u) => {
                const newTask = Object.assign({}, option);
                newTask.url = u;
                thisSpider.addTask(newTask);
            });
        }
    };
    /**
     * 添加选定节点（们）中的链接到 download-list, 并自动补全路径、跳过重复链接
     * @param {null|string|object}  option 路径或设置对象
     * option 为可选参数，空缺时新建任务的 path 默认为默认保存路径
     * 可以传入字符串作为下载内容的保存路径
     * 也可以是一个包括设置的对象，如果对象中不存在path成员，则为默认保存路径
     */
    $.prototype.download = function (option) {
        let newUrls = $(this).url();
        newUrls = thisSpider.filter(newUrls);
        if (typeof option === "undefined") {
            newUrls.map((u) => {
                thisSpider.addDownload({
                    path: null,
                    url: u,
                });
            });
        }
        else if (typeof option === "string") {
            newUrls.map((u) => {
                thisSpider.addDownload({
                    path: option,
                    url: u,
                });
            });
        }
        else if (typeof option === "object") {
            option.path = option.path ? option.path : null;
            newUrls.map((u) => {
                const newTask = Object.assign({}, option, { url: u });
                thisSpider.addDownload(newTask);
            });
        }
    };
    currentTask.$ = $;
    return currentTask;
}
