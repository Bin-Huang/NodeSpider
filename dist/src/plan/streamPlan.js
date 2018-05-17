"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const got = require("got");
function streamPlan({ name, requestOpts, handle, retries = 3, failed = (err) => { throw err; }, }) {
    return {
        name,
        retries,
        failed,
        process: async (task, spider) => {
            return new Promise((resolve, reject) => {
                const flow = got.stream(task.url, requestOpts);
                const done = (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                };
                handle(flow, done, task, spider);
            });
        },
    };
}
exports.default = streamPlan;
//# sourceMappingURL=streamPlan.js.map