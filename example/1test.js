const {Spider} = require("../build/index");

const n = new Spider();

const planA = n.plan({
    callback: (err, current) => {
        if (err) {
            return console.log(err);
        }
        const $ = current.$;
        console.log($("title").text());
        n.queue(planA, $("a").url());
    },
});
console.log(planA);
n.queue(planA, "http://www.baidu.com", {
    // rule: (err, current) => {
    //     console.log("special rule");
    // }
});
