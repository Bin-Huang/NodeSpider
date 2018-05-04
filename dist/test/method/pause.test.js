"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const sinon = require("sinon");
const index_1 = require("../../src/index");
const s = new index_1.Spider();
ava_1.default("test for method 'pause'", async (t) => {
    const handleStatusChange = sinon.spy();
    s.on("statusChange", handleStatusChange);
    s.pause();
    t.is("pause", s._STATE.status);
    t.is(1, handleStatusChange.callCount);
    t.is("pause", handleStatusChange.getCall(0).args[0]);
});
//# sourceMappingURL=pause.test.js.map