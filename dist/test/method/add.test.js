"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const sinon = require("sinon");
const index_1 = require("../../src/index");
const s = new index_1.Spider();
s._STATE.status = "pause";
s.plan({
    name: "test",
    process: async () => null,
    catch: () => null,
    retries: 3,
});
const addTaskHandler = sinon.spy();
s.on("addTask", addTaskHandler);
ava_1.default.serial("test for method 'add': basic", async (t) => {
    const url1 = "http://test1.com";
    const [uid1] = s.add("test", url1);
    const task1 = {
        info: {},
        uid: uid1,
        url: url1,
        planName: "test",
    };
    t.deepEqual(task1, addTaskHandler.getCall(0).args[0]);
    t.deepEqual(task1, s._STATE.queue.next());
});
ava_1.default.serial("test for method 'add' with info", async (t) => {
    const [uid] = s.add("test", "http://test2.com", { pkg: "nodespider" });
    const task1 = {
        info: { pkg: "nodespider" },
        uid,
        url: "http://test2.com",
        planName: "test",
    };
    t.deepEqual(task1, addTaskHandler.getCall(1).args[0]);
    t.deepEqual(task1, s._STATE.queue.next());
});
ava_1.default.serial("test for method 'add' with urls", async (t) => {
    const [url1, url2] = ["http://test3.com", "http://test4.com"];
    const [uid1, uid2] = s.add("test", [url1, url2]);
    const task1 = {
        info: {},
        uid: uid1,
        url: url1,
        planName: "test",
    };
    const task2 = {
        info: {},
        uid: uid2,
        url: url2,
        planName: "test",
    };
    t.deepEqual(task1, addTaskHandler.getCall(2).args[0]);
    t.deepEqual(task1, s._STATE.queue.next());
    t.deepEqual(task2, addTaskHandler.getCall(3).args[0]);
    t.deepEqual(task2, s._STATE.queue.next());
});
ava_1.default.serial("test for method 'add' with urls and info", async (t) => {
    const info = { url: "https://github.com/Bin-Huang/NodeSpider" };
    const [url1, url2] = ["http://test1.com", "http://test2.com"];
    const [uid1, uid2] = s.add("test", [url1, url2], info);
    const task1 = {
        info,
        uid: uid1,
        url: url1,
        planName: "test",
    };
    const task2 = {
        info,
        uid: uid2,
        url: url2,
        planName: "test",
    };
    t.deepEqual(task1, addTaskHandler.getCall(4).args[0]);
    t.deepEqual(task1, s._STATE.queue.next());
    t.deepEqual(task2, addTaskHandler.getCall(5).args[0]);
    t.deepEqual(task2, s._STATE.queue.next());
});
//# sourceMappingURL=add.test.js.map