// 注意：本次测试需要访问百度，当网络不佳时将会失败
const { Spider, defaultPlan } = require("../build/index");

describe("test for method add", () => {
    test("parameter type-check", () => {
        const s = new Spider();

        expect(() => {
            s.add();
        }).toThrow(TypeError);
        expect(() => {
            s.add(23);
        }).toThrow(TypeError);
        expect(() => {
            s.add("hello, this is a string");
        }).toThrow(TypeError);
        expect(() => {
            s.add({name: "object"});
        }).toThrow(TypeError);
        expect(() => {
            s.add(() => "function");
        }).toThrow(TypeError);
        expect(() => {
            s.add(new Promise(() => 100));
        }).toThrow(TypeError);
    });

    test("functional verification", (done) => {
        const s = new Spider();
        s.add("testSpider", defaultPlan((error, current) => {
            expect(current.body.length > 100).toBe(true);
            done();
        }));
        s.queue("testSpider", "http://www.baidu.com");
    });
});

describe("test for method plan", () => {
    test("functional verification", (done) => {
        const s = new Spider();
        s.plan("testSpider", (error, current) => {
            expect(current.body.length > 100).toBe(true);
            done();
        });
        s.queue("testSpider", "http://www.baidu.com");
    });
});
