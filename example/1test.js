const {NodeSpider} = require("../index");

const n = new NodeSpider();

const planA = n.plan({
    rule: (err, current) => {
        if (err) {
            return console.log(err);
        }
        current.response = "response";
        current.body = "body";
        console.log(current);
    },
    info: {name: "infoinfo"},
});

n.queue(planA, "http://www.baidu.com", {
    // rule: (err, current) => {
    //     console.log("special rule");
    // }
    info: {name: "kljfljfkl"},
});