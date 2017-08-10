const { Spider, defaultPlan } = require("../build/index");

describe("test for method isExist", () => {
    test("parameter check", () => {
        const s = new Spider();
        const myPlan = s.add(defaultPlan(() => {
            return 1;
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
        const myPlan = s.add(defaultPlan(() => {
            return 1;
        }));
        expect(s.isExist("u1")).toBe(false);
        s.queue(myPlan, "u1");
        expect(s.isExist("u1")).toBe(true);

        expect(s.isExist("u3")).toBe(false);
        s.queue(myPlan, ["u2", "u3", "u4", "u5"]);
        expect(s.isExist("u3")).toBe(true);
    });
});

describe("test for method filter", () => {
    test("parameter check", () => {
        const s = new Spider();
        const myPlan = s.add(defaultPlan(() => {
            return 1;
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
        const myPlan = s.add(defaultPlan(() => {
            return 1;
        }));
        expect(s.filter(["u1", "u2", "u3"])).toEqual(["u1", "u2", "u3"]);
        expect(s.filter(["u1", "u2", "u3", "u3", "u3"])).toEqual(["u1", "u2", "u3"]);

        s.queue(myPlan, "u1");
        expect(s.filter(["u1", "u2", "u3"])).toEqual(["u2", "u3"]);
        expect(s.filter(["u1", "u1", "u2", "u2", "u3"])).toEqual(["u2", "u3"]);

        s.queue(myPlan, ["u2", "u3"]);
        expect(s.filter(["u1", "u1", "u2", "u2", "u3"])).toEqual([]);
    });
});
