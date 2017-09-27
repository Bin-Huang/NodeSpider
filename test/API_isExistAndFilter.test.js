const { Spider, defaultPlan } = require("../build/index");

describe("test for method isExist", () => {
    test("parameter check", () => {
        const s = new Spider();
        s.add(defaultPlan({
            callbacks: [
                (err, current) => {
                    return 1;
                },
            ],
            name: "myPlan",
        }));
        expect(() => {
            s.isExist();
        }).toThrow(TypeError);
        expect(() => {
            s.isExist(1231231);
        }).toThrow(TypeError);
        expect(() => {
            s.isExist({name: "spider"});
        }).toThrow(TypeError);
        expect(() => {
            s.isExist(["u1", "u2"]);
        }).toThrow(TypeError);
        expect(() => {
            s.isExist(() => {
                return "this is a function";
            });
        }).toThrow(TypeError);
        expect(() => {
            s.isExist(new Promise((resolve, reject) => {
                resolve("this is a promise");
            }));
        }).toThrow(TypeError);

        expect(() => {
            s.isExist("url1");
        }).not.toThrow(TypeError);
    });
    test("functional verification", () => {
        const s = new Spider();
        s.add(defaultPlan({
            callbacks: [
                (err, current) => {
                    return 1;
                },
            ],
            name: "myPlan",
        }));
        expect(s.isExist("http://wwww.example1.com")).toBe(false);
        s.queue("myPlan", "http://wwww.example1.com");
        expect(s.isExist("http://wwww.example1.com")).toBe(true);

        expect(s.isExist("http://www.example3.com")).toBe(false);
        s.queue("myPlan", [
            "http://www.example2.com",
            "http://www.example3.com",
            "http://www.example4.com",
        ]);
        expect(s.isExist("http://www.example3.com")).toBe(true);
    });
});

describe("test for method filter", () => {
    test("parameter check", () => {
        const s = new Spider();
        s.add(defaultPlan({
            callbacks: [
                (err, current) => {
                    return 1;
                },
            ],
            name: "myPlan",
        }));

        expect(() => {
            s.filter();
        }).toThrow(TypeError);
        expect(() => {
            s.filter("u1");
        }).toThrow(TypeError);
        expect(() => {
            s.filter(121);
        }).toThrow(TypeError);
        expect(() => {
            s.filter(() => "this is a function");
        }).toThrow(TypeError);
        expect(() => {
            s.filter({name: "this is a object"});
        }).toThrow(TypeError);

        expect(() => {
            s.filter([1, 2]);
        }).toThrow(TypeError);
        expect(() => {
            s.filter(["u1", 2]);
        }).toThrow(TypeError);
        expect(() => {
            s.filter(["u1", "u2", {name: "object"}]);
        }).toThrow(TypeError);
        expect(() => {
            s.filter(["u1", "u2", () => "function"]);
        }).toThrow(TypeError);

        expect(() => {
            s.filter([]);
        }).not.toThrow(TypeError);
        expect(() => {
            s.filter(["u1", "u2", "u3"]);
        }).not.toThrow(TypeError);
    });

    test("functional verification", () => {
        const s = new Spider();

        s.add(defaultPlan({
            callbacks: [
                (err, current) => {
                    return 1;
                },
            ],
            name: "myPlan",
        }));
        expect(s.filter(["u1", "u2", "u3"])).toEqual(["u1", "u2", "u3"]);
        expect(s.filter(["u1", "u2", "u3", "u3", "u3"])).toEqual(["u1", "u2", "u3"]);

        s.queue("myPlan", "http://www.example1.com");
        expect(s.filter([
            "http://www.example1.com",
            "http://www.example2.com",
            "http://www.example3.com",
        ])).toEqual([
            "http://www.example2.com",
            "http://www.example3.com",
        ]);
        expect(s.filter([
            "http://www.example1.com",
            "http://www.example1.com",
            "http://www.example2.com",
            "http://www.example2.com",
            "http://www.example3.com",
        ])).toEqual([
            "http://www.example2.com",
            "http://www.example3.com",
        ]);

        s.queue("myPlan", [
            "http://www.example2.com",
            "http://www.example3.com",
        ]);
        expect(s.filter([
            "http://www.example1.com",
            "http://www.example1.com",
            "http://www.example2.com",
            "http://www.example2.com",
            "http://www.example3.com",
        ])).toEqual([]);
    });
});
