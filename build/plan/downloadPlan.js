"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filenamifyUrl = require("filenamify-url");
const fs = require("fs-extra");
const got = require("got");
const path = require("path");
const defaultOpts = {
    callback: (err, current, s) => {
        if (err) {
            console.error(err);
        }
        return;
    },
};
function downloadPlan(option) {
    if (typeof option === "string") {
        option = { path: option };
    }
    const opts = Object.assign({}, defaultOpts, option);
    return (task, spider) => {
        return new Promise((resolve, reject) => {
            let filename; // 将url转化为合法的文件名
            if (task.info && typeof task.info.filename === "string") {
                filename = task.info.filename;
            }
            else {
                filename = filenamifyUrl(task.url); // 将url转化为合法的文件名
            }
            const filepath = path.resolve(opts.path, filename); // 安全地拼接保存路径
            const req = got.stream(task.url, opts.requestOpts);
            const file = fs.createWriteStream(filepath);
            req.pipe(file);
            const current = Object.assign({}, task, { filepath });
            // TODO: handle callback error
            const handle = (e, c, s) => {
                const result = opts.callback(e, c, s);
                if (result instanceof Promise) {
                    result.then((r) => resolve(r));
                }
                else {
                    resolve(result);
                }
            };
            req.on("error", (e) => handle(e, current, spider));
            file.on("error", (e) => handle(e, current, spider));
            file.on("error", (e) => handle(e, current, spider));
            file.on("finish", () => handle(null, current, spider));
        });
    };
}
exports.default = downloadPlan;
