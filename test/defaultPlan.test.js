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
        defaultPlan({
            callbacks: [
                () => "this is a function",
            ],
            name: "plan1",
        });
    }).not.toThrow(TypeError);

    expect(() => {
        defaultPlan({});
    }).toThrow(TypeError);
    expect(() => {
        defaultPlan({info: "a object without callback"});
    }).toThrow(TypeError);

    expect(() => {
        defaultPlan({name: "plan1", callbacks: [() => "a object with callback"]});
    }).not.toThrow(TypeError);
});
