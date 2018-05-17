"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const got = require("got");
const defaultOption = {
    retries: 3,
    failed: (err) => { throw err; },
};
function streamPlan(option) {
    const opts = Object.assign({}, defaultOption, option);
    return {
        name: opts.name,
        retries: opts.retries,
        failed: opts.failed,
        process: async (task, spider) => {
            return new Promise((resolve, reject) => {
                const flow = got.stream(task.url, opts.requestOpts);
                const done = (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                };
                opts.handle(flow, done, task, spider);
            });
        },
    };
}
exports.default = streamPlan;
//# sourceMappingURL=streamPlan.js.map