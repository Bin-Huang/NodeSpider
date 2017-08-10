const { Spider, defaultPlan } = require("../build/index");

const n = new Spider();

const planA = n.add(defaultPlan({
    callback: (err, current) => {
        if (err) {
            return console.log(err);
        }
        const $ = current.$;
        console.log($("title").text());
        n.queue(planA, $("a").url());
    },
}));
n.queue(planA, "http://www.baidu.com", {
    // rule: (err, current) => {
    //     console.log("special rule");
    // }
});