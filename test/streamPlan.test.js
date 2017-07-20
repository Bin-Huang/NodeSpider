const { Spider, streamPlan } = require("../build/index");

// NOTE 测试需要访问百度网站，当网络状态不佳时可能导致单元测试错误

describe("task' special options test", () => {
    test("when special option is an empty object, it should have no impact to execute plan", (done) => {
        const s = new Spider();
        const plan1 = s.plan(streamPlan({
            callback: (req, current) => {
                s.end();
                done();
            },
        }));
        s.queue(plan1, "http://www.baidu.com", {});
    });
    test("try to change the info", (done) => {
        const n = new Spider();
        const plan2 = n.plan(streamPlan({
            callback: (req, current) => {
                expect(current.info).toEqual({
                    hello: "spider",
                });
                n.end();
                done();
            },
            info: { hello: "world" },
        }));
        n.queue(plan2, "http://www.baidu.com", {info: {hello: "spider"}});
    });
    test("try to change the callback", done => {
        const s = new Spider();
        const p = s.plan(streamPlan(() => null));
        s.queue(p, "http://www.baidu.com", {
            callback: () => done(),
        });
    });
});
