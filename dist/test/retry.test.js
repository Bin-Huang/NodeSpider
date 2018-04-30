"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const delay = require("delay");
const sinon = require("sinon");
const index_1 = require("../src/index");
ava_1.default("testing 1 for retry", async (t) => {
    const s = new index_1.Spider();
    const catchSpy = sinon.spy();
    const handleSpy = sinon.spy();
    const plan = {
        name: "test",
        process: async () => {
            await delay(100);
            handleSpy();
            throw new Error("error");
        },
        catch: catchSpy,
        retries: 3,
    };
    s.plan(plan);
    s.add("test", "http://test1.com");
    await delay(10000);
    t.is(1, catchSpy.callCount);
    t.is(4, handleSpy.callCount);
});
ava_1.default("testing 2 for retry", async (t) => {
    const s = new index_1.Spider();
    const catchSpy = sinon.spy();
    const handleSpy = sinon.spy();
    const plan = {
        name: "test",
        process: async () => {
            await delay(100);
            handleSpy();
            throw new Error("error");
        },
        catch: catchSpy,
        retries: 1,
    };
    s.plan(plan);
    s.add("test", "http://test1.com");
    await delay(10000);
    t.is(1, catchSpy.callCount);
    t.is(2, handleSpy.callCount);
});
ava_1.default("testing 3 for retry", async (t) => {
    const s = new index_1.Spider();
    const catchSpy = sinon.spy();
    const handleSpy = sinon.spy();
    let isErr = true;
    const plan = {
        name: "test",
        process: async () => {
            await delay(100);
            handleSpy();
            if (isErr) {
                isErr = false;
                throw new Error("error");
            }
            else {
                return null;
            }
        },
        catch: catchSpy,
        retries: 4,
    };
    s.plan(plan);
    s.add("test", "http://test1.com");
    await delay(10000);
    t.is(0, catchSpy.callCount);
    t.is(2, handleSpy.callCount);
});
//# sourceMappingURL=retry.test.js.map