// 注意：本次测试需要访问百度、爱奇艺，当网络不佳时将会失败
const { Spider, defaultPlan } = require("../build/index");

describe("Spider.prototype.queue's test", () => {
    test("parameter type-check", () => {
        const s = new Spider();
        s.plan("myplan", () => null);
        expect(() => {
            s.queue();
        }).toThrow(TypeError);
        expect(() => {
            s.queue(1);
        }).toThrow(TypeError);
        expect(() => {
            s.queue("string");
        }).toThrow(TypeError);
        expect(() => {
            s.queue({}, {});
        }).toThrow(TypeError);
        expect(() => {
            s.queue("myplan", "url");
        }).not.toThrow(TypeError);
    });

    test("functional verification", (done) => {
        const s = new Spider();
        s.plan("myPlan", (err, current) => {
            expect(current.body.length > 100).toBe(true);
            done();
        });
        s.queue("myPlan", ["http://www.baidu.com"]);
    });

    test("nnly absolute url(s) can be added", () => {
        const s = new Spider();
        s.plan("p", (err, current) => console.log(current.url));

        let rest = s.queue("p", "http://www.baidu.com");
        expect(rest).toEqual([]);

        rest = s.queue("p", ["http://www.baidu.com", "http://www.iqiyi.com"]);
        expect(rest).toEqual([]);

        rest = s.queue("p", ["http://www.baidu.com", "www.iqiyi.com"]);
        expect(rest).toEqual(["www.iqiyi.com"]);

        rest = s.queue("p", [121212, "www.iqiyi.com"]);
        expect(rest).toEqual([121212, "www.iqiyi.com"]);
    });
});
