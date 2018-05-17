"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const charset = require("charset");
const got = require("got");
const iconv = require("iconv-lite");
const defaultOption = {
    failed: (error) => { throw error; },
    toUtf8: true,
    requestOpts: { encoding: null },
    retries: 3,
};
function requestPlan({ name, handle, failed = (error) => { throw error; }, toUtf8 = true, requestOpts = { encoding: null }, // 当输入 option 有requestOpts 设置，将可能导致encoding 不为 null
    retries = 3, }) {
    if (typeof requestOpts === "object" && typeof requestOpts.encoding === "undefined") {
        requestOpts.encoding = null;
    }
    return {
        name,
        retries,
        failed,
        process: async (task, spider) => {
            const res = await got(task.url, requestOpts);
            const current = Object.assign({}, task, { response: res, body: res.body.toString() });
            if (toUtf8) {
                current.body = decodeToUtf8(current.response);
            }
            return await handle(current, spider);
        },
    };
}
exports.default = requestPlan;
/**
 * 根据当前任务的response.header和response.body中的编码格式，将currentTask.body转码为utf8格式
 */
function decodeToUtf8(res) {
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
exports.decodeToUtf8 = decodeToUtf8;
//# sourceMappingURL=requestPlan.js.map