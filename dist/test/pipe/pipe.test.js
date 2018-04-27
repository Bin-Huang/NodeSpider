"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const delay = require("delay");
const fs = require("fs-extra");
const path = require("path");
const csvPipe_1 = require("../../src/pipe/csvPipe");
ava_1.default("test 1 for csvPipe", async (t) => {
    const filepath = path.resolve(__dirname, "csvPipe_test1.csv");
    const pipe = csvPipe_1.default({
        name: "test1",
        path: filepath,
        items: ["item1", "item2"],
    });
    pipe.write(["data1", "data2"]);
    pipe.write(["data3", null]);
    pipe.write(["data4", "data5"]);
    pipe.end();
    await delay(1000);
    t.is(pipe.name, "test1");
    const str = await fs.readFile(filepath, { encoding: "utf8" });
    t.is(str, "item1,item2\ndata1,data2\ndata3,null\ndata4,data5\n");
    await fs.remove(filepath);
});
ava_1.default("test 2 for csvPipe", async (t) => {
    const filepath = path.resolve(__dirname, "csvPipe_test2.csv");
    const pipe = csvPipe_1.default({
        name: "test1",
        path: filepath,
        items: {
            item1: (a) => a,
            item2: (a) => a,
        },
    });
    pipe.write([null, null]);
    pipe.write(["data3", null]);
    pipe.write(["data4", "data5"]);
    pipe.end();
    await delay(1000);
    t.is(pipe.name, "test1");
    const str = await fs.readFile(filepath, { encoding: "utf8" });
    t.is(str, "item1,item2\nnull,null\ndata3,null\ndata4,data5\n");
    await fs.remove(filepath);
});
//# sourceMappingURL=pipe.test.js.map