const { defaultPlan, preLoadJq, preToUtf8 } = require("../build/index");
const { DefaultPlan } = require("../build/defaultPlan");

test("function defaultPlan parameter check", () => {
    expect(() => {
        defaultPlan("string");
    }).toThrow(TypeError);
    expect(() => {
        defaultPlan(100);
    }).toThrow(TypeError);
    expect(() => {
        defaultPlan(true);
    }).toThrow(TypeError);

    expect(() => {
        defaultPlan(() => "this is a function");
    }).not.toThrow(TypeError);

    expect(() => {
        defaultPlan({});
    }).toThrow(TypeError);
    expect(() => {
        defaultPlan({info: "a object without callback"});
    }).toThrow(TypeError);

    expect(() => {
        defaultPlan({callback: () => "a object with callback"});
    }).not.toThrow(TypeError);
});

test("function defaultPlan parameter default value", () => {
    const callback = () => "this is a callback function";

    expect(defaultPlan(callback).option.callback).toBe(callback);
    expect(defaultPlan(callback).option.request).toEqual({encoding: null});

    const plan1 = defaultPlan({callback});
    expect(plan1.option.callback).toBe(callback);
    expect(plan1.option.request).toEqual({encoding: null});
    expect(plan1.option.callback).toBe(callback);
    expect(plan1.type).toBe("default");

    const plan2 = defaultPlan({callback, type: "myType"});
    expect(plan2.option.callback).toBe(callback);
    expect(plan2.option.request).toEqual({encoding: null});
    expect(plan2.option.callback).toBe(callback);
    expect(plan2.type).toBe("myType");
});
