const { Spider, Queue } = require("../build/index");

describe("test for parameter check when initalize a spider", () => {
    test("It will still ok when option is missing, because parameter opts is no required", () => {
        let spider;
        expect(() => {
            spider = new Spider();
        }).not.toThrow();
        expect(typeof spider.plan === "function").toBe(true);
        spider.end();
    });

    test("All will going well when parameter option is legal", () => {
        let spider;
        expect(() => {
            spider = new Spider({
                maxConnections: 100,
                queue: Queue,
                rateLimit: 100,
            });
        }).not.toThrow();
        expect(typeof spider.plan === "function").toBe(true);
        spider.end();

        let newSpider;
        expect(() => {
            newSpider = new Spider({
                maxConnections: {
                    "type1": 10,
                    "type2": 20,
                },
                queue: Queue,
            });
        }).not.toThrow();
        expect(typeof newSpider.plan === "function").toBe(true);
        newSpider.end();

        expect(() => {
            spider = new Spider({
                maxConnections: {
                    "type1": 10,
                    "type2": 20,
                },
                queue: Queue,
                rateLimit: 100,
            });
        }).not.toThrow();
        expect(typeof spider.plan === "function").toBe(true);
        spider.end();

        expect(() => {
            spider = new Spider({
                queue: Queue,
            });
        }).not.toThrow();
        expect(typeof spider.plan === "function").toBe(true);
        spider.end();
    });

    test("when parameter option is not a object, there should be a TypeError", () => {
        let spider;
        expect(() => {
            spider = new Spider(true);
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);

        expect(() => {
            spider = new Spider(1000);
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);

        expect(() => {
            spider = new Spider("a string");
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);

        expect(() => {
            spider = new Spider(() => "this is a function");
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);
    });

    test("When option's property has illegal type, there should be a TypeError throwed", () => {
        let spider;
        expect(() => {
            spider = new Spider({
                maxConnections: "string",
            });
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);

        expect(() => {
            spider = new Spider({
                maxConnections: "string",
                rateLimit: "string",
            });
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);

        expect(() => {
            spider = new Spider({
                maxConnections: 233,
                rateLimit: () => "a function",
            });
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);

        expect(() => {
            spider = new Spider({
                maxConnections: () => "a function",
                queue: Queue,
                rateLimit: 29,
            });
        }).toThrow(TypeError);
        expect(typeof spider === "undefined").toBe(true);
    });

});
