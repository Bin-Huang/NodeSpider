"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filenamifyUrl = require("filenamify-url");
const fs = require("fs-extra");
const got = require("got");
const path = require("path");
const defaultOpts = {
    retries: 3,
    callback: (current, s) => null,
    catch: (error) => { throw error; },
};
function downloadPlan(option) {
    const opts = Object.assign({}, defaultOpts, option);
    return {
        name: opts.name,
        retries: opts.retries,
        catch: opts.catch,
        process: async (task, spider) => {
            let filename; // 将url转化为合法的文件名
            if (task.info && typeof task.info.filename === "string") {
                filename = task.info.filename;
            }
            else {
                filename = filenamifyUrl(task.url); // 将url转化为合法的文件名
            }
            const filepath = path.resolve(opts.path, filename); // 安全地拼接保存路径
            await downloadAsync(task.url, filepath, opts.requestOpts);
            await opts.callback(Object.assign({}, task, { filepath }), spider);
        },
    };
}
exports.default = downloadPlan;
function downloadAsync(url, filepath, opts) {
    return new Promise((resolve, reject) => {
        const req = got.stream(url, opts);
        const file = fs.createWriteStream(filepath);
        req.pipe(file);
        req.on("error", reject);
        file.on("error", reject);
        file.on("finish", resolve);
    });
}
//# sourceMappingURL=downloadPlan.js.map