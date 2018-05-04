"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const sinon = require("sinon");
const index_1 = require("../../src/index");
const s = new index_1.Spider();
ava_1.default("test for method 'pipe' & 'save'", async (t) => {
    const pipeWrite1 = sinon.spy();
    const pipeEnd1 = sinon.spy();
    s.pipe({
        name: "testPipe1",
        write: pipeWrite1,
        end: pipeEnd1,
        items: ["item1", "item2"],
    });
    s.save("testPipe1", {
        item1: "data1",
        item2: "data2",
    });
    t.is(1, pipeWrite1.callCount);
    t.deepEqual(["data1", "data2"], pipeWrite1.getCall(0).args[0]);
    s.save("testPipe1", {
        item1: "data3",
        other: "data2",
    });
    t.is(2, pipeWrite1.callCount);
    t.deepEqual(["data3", null], pipeWrite1.getCall(1).args[0]);
    s.save("testPipe1", {});
    t.is(3, pipeWrite1.callCount);
    t.deepEqual([null, null], pipeWrite1.getCall(2).args[0]);
    const pipeWrite2 = sinon.spy();
    const pipeEnd2 = sinon.spy();
    s.pipe({
        name: "testPipe2",
        write: pipeWrite2,
        end: pipeEnd2,
        items: {
            item1: parseInt,
            item2: (n) => n * 1000,
        },
    });
    s.save("testPipe2", {
        item1: "1",
        item2: 2,
    });
    t.is(1, pipeWrite2.callCount);
    t.deepEqual([1, 2000], pipeWrite2.getCall(0).args[0]);
    s.save("testPipe2", {
        item1: 2,
        other: "data2",
    });
    t.is(2, pipeWrite2.callCount);
    t.deepEqual([2, null], pipeWrite2.getCall(1).args[0]);
    s.save("testPipe2", {});
    t.is(3, pipeWrite2.callCount);
    t.deepEqual([null, null], pipeWrite2.getCall(2).args[0]);
});
//# sourceMappingURL=pipe&save.test.js.map