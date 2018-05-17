"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filenamifyUrl = require("filenamify-url");
const fs = require("fs-extra");
const got = require("got");
const path_1 = require("path");
const defaultOpts = {
    retries: 3,
    handle: (current, s) => null,
    failed: (error) => { throw error; },
};
function downloadPlan({ name, path, requestOpts, retries = 3, handle = (current, s) => null, failed = (error) => { throw error; }, }) {
    return {
        name,
        retries,
        failed,
        process: async (task, spider) => {
            let filename; // 将url转化为合法的文件名
            if (task.info && typeof task.info.filename === "string") {
                filename = task.info.filename;
            }
            else {
                filename = filenamifyUrl(task.url); // 将url转化为合法的文件名
            }
            const filepath = path_1.resolve(path, filename); // 安全地拼接保存路径
            await downloadAsync(task.url, filepath, requestOpts);
            await handle(Object.assign({}, task, { filepath }), spider);
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