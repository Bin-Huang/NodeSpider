"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const charset = require("charset");
const iconv = require("iconv-lite");
function decode() {
    /**
     * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
     * @param thisSpider
     * @param currentTask
     * @return currentTask
     */
    return function decodeOperation(thisSpider, currentTask) {
        const encoding = charset(currentTask.response.headers, currentTask.response.body.toString());
        // 有些时候会无法获得当前网站的编码，原因往往是网站内容过于简单，比如最简单的404界面。此时无需转码
        // TODO: 有没有可能，在需要转码的网站无法获得 encoding？
        if (encoding) {
            currentTask.body = iconv.decode(currentTask.response.body, encoding);
        }
        return currentTask;
    };
}
exports.default = decode;
