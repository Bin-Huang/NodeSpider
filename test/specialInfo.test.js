// NOTE: 注意，本次测试需要连接网络并尝试访问github
const { Spider, defaultPlan, streamPlan } = require("../build/index");

describe("task's special info test", () => {
    test("when a task don't has special info, it's info from plan", (done) => {
        const s = new Spider();
        const plan1 = s.plan({
            callback: (err, current) => {
                expect(current.info).toBe(100);
                s.end();
                done();
            },
            info: 100,
        });
        s.queue(plan1, "http://www.github.com");
    });

    test("when a plan don't has info, plan's info should be {}", (done) => {
        const s = new Spider();
        const plan1 = s.plan({
            callback: (err, current) => {
                expect(current.info).toEqual({});
                expect(s._STATE.planStore.get(current.planKey).info).toEqual({});
                s.end();
                done();
            },
        });
        s.queue(plan1, "http://www.github.com");
    });
    test("when a task has special info, \
    the special info, instead of the plan's info, should be passed to current.info", (done) => {
        const s = new Spider();
        const plan1 = s.plan({
            callback: (err, current) => {
                expect(current.info).toBe("task's info");
                expect(s._STATE.planStore.get(current.planKey).info).toBe("plan's info");
                s.end();
                done();
            },
            info: "plan's info",
        });
        s.queue(plan1, "http://www.github.com", "task's info");
    });
    test("when a task has special info but an empty object, \
    the special info, instead of the plan's info, also should be passed to current.info", (done) => {
        const s = new Spider();
        const plan1 = s.plan({
            callback: (err, current) => {
                expect(current.info).toEqual({});
                expect(s._STATE.planStore.get(current.planKey).info).toBe("plan's info");
                s.end();
                done();
            },
            info: "plan's info",
        });
        s.queue(plan1, "http://www.github.com", {});
    });
});
