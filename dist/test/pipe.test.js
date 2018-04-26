"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
ava_1.default("test for csvPipe", async (t) => {
    const obj = {
        k1: 23,
        k3: 39999999,
        k2: 3,
    };
    const keys = Object.keys(obj);
    t.deepEqual(keys, ["k1", "k3", "k2"]);
    const entries = Object.entries(obj);
    t.deepEqual(entries.map((e) => e[0]), ["k1", "k3", "k2"]);
    // const filepath = path.resolve(__dirname, "pipe_test.csv");
    // const pipe = csvPipe({
    //   name: "test1",
    //   path: filepath,
    //   items: ["item1", "item2"],
    // });
    // pipe.write(["data1", "data2"]);
    // pipe.write(["data3", null]);
    // pipe.write(["data4", "data5"]);
    // pipe.end();
    // t.is(pipe.name, "test1");
    // const str = await fs.readFile(filepath, { encoding: "utf8" });
    // t.is(str, "item1,item2\ndata1,data2\ndata3,null\ndata4,data5\n");
});
//# sourceMappingURL=pipe.test.js.map