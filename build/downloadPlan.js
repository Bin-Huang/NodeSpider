"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const request = require("request");
const plan_1 = require("./plan");
function downloadPlan(opts) {
    // TODO B 参数检验与默认赋值
    const planOption = opts;
    return new plan_1.default("download", planOption, (task, self) => __awaiter(this, void 0, void 0, function* () {
        const reqStream = request(task.specialOpts.request);
        const fileStream = fs.createWriteStream(task.specialOpts.path);
        reqStream.pipe(fileStream);
    }));
}
exports.default = downloadPlan;
