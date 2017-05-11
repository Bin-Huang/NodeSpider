"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const charset = require("charset");
const iconv = require("iconv-lite");
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 * @param thisSpider
 * @param error
 * @param currentTask
 * @param $
 */
function decode(thisSpider, error, currentTask, $) {
    return new Promise((resolve, reject) => {
        try {
            let encoding = charset(currentTask.response.headers, currentTask.response.body);
            currentTask.body = iconv.decode(currentTask.response.body, encoding);
        }
        catch (err) {
            // 如果预处理出错，通过 reject 传回错误
            return reject(err);
        }
        // 如果预处理一切顺利，通过 resolve 传回结果
        return resolve(currentTask);
    });
}
exports.default = decode;
