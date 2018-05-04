"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const delay = require("delay");
const index_1 = require("../src/index");
// export type IStatus = "active" | "end" | "pause" | "vacant";
ava_1.default("testing 1 for status", async (t) => {
    const s = new index_1.Spider({ heartbeat: 4000 });
    await delay(1000);
    t.is("vacant", s._STATE.status);
    await delay(3100);
    t.is("end", s._STATE.status);
});
ava_1.default("testing 2 for status", async (t) => {
    const s = new index_1.Spider({ heartbeat: 4000, concurrency: 2 });
    s.plan({
        name: "test",
        process: async () => {
            await delay(1000);
            return null;
        },
        catch: () => null,
        retries: 3,
    });
    await delay(1000);
    t.is("vacant", s._STATE.status);
    s.add("test", "http://teat1.com");
    t.is("active", s._STATE.status);
    await delay(4500);
    t.is("end", s._STATE.status);
});
ava_1.default("testing 3 for status", async (t) => {
    const s = new index_1.Spider({ heartbeat: 4000, concurrency: 2 });
    s.plan({
        name: "test",
        process: async () => {
            await delay(1000);
            return null;
        },
        catch: () => null,
        retries: 3,
    });
    await delay(1000);
    t.is("vacant", s._STATE.status);
    s.pause();
    t.is("pause", s._STATE.status);
    s.add("test", "http://teat1.com");
    t.is("pause", s._STATE.status);
    await delay(4100);
    t.is("pause", s._STATE.status);
    s.active();
    await delay(8100);
    t.is("end", s._STATE.status);
});
ava_1.default("testing 4 for status", async (t) => {
    const s = new index_1.Spider({ heartbeat: 4000, stillAlive: true });
    s.plan({
        name: "test",
        process: async () => {
            await delay(200);
            return null;
        },
        catch: () => null,
        retries: 3,
    });
    await delay(4100);
    t.is("vacant", s._STATE.status);
    s.add("test", "http://test1.com");
    await delay(8100);
    t.is("vacant", s._STATE.status);
});
//# sourceMappingURL=status.test.js.map