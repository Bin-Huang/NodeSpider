"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const delay = require("delay");
const sinon = require("sinon");
const index_1 = require("../../src/index");
const s = new index_1.Spider();
ava_1.default.serial("test for method 'plan'", async (t) => {
    const plan = {
        name: "test",
        process: sinon.spy(),
        failed: sinon.spy(),
        retries: 3,
    };
    s.plan(plan);
    t.true(s._STATE.planStore.find((p) => p.name === "test") !== undefined);
    const [uid] = s.add("test", "http://test1.com");
    await delay(1000);
    t.deepEqual(plan.process.getCall(0).args[0], {
        uid,
        url: "http://test1.com",
        planName: "test",
        info: {},
    });
    t.is(s, plan.process.getCall(0).args[1]);
});
//# sourceMappingURL=plan.test.js.map