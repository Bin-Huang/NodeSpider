"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const url = require("url");
function loadJq(body, task) {
    let $ = cheerio_1.default.load(body);
    $ = addMethodUrl($, task.url);
}
function addMethodUrl($, currentUrl) {
    $.prototype.url = function () {
        let result = [];
        $(this).each(function () {
            let newUrl = $(this).attr("href");
            // 如果是类似 'javascirpt: void(0)' 的 js 代码，直接跳过
            if (/^javascript/.test(newUrl)) {
                return false;
            }
            // 如果是锚，等效与当前 url 路径
            if (newUrl[0] === "#") {
                return result.push(currentUrl);
            }
            // 如果是相对路径，补全路径为绝对路径
            if (newUrl && !/^https?:\/\//.test(newUrl)) {
                newUrl = url.resolve(currentUrl, newUrl);
            }
            result.push(newUrl);
        });
        if (result.length < 2) {
            [result] = result;
        }
        return result;
    };
    return $;
}
function addMethodTodo($, thisSpider) {
    $.prototype.todo = function () {
        $(this).each(function () {
            let url = $(this).url();
            if (!thisSpider.check(url)) {
            }
        });
    };
    return $;
}
