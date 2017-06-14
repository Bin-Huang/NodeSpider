const NodeSpider = require("../index");

const n = new NodeSpider();

let i = 100;
const myPlan = n.plan((err, current) => {
    if (err) {
        return console.log(err);
    }
    const $ = current.$;
    n.queue(myPlan, $("a").url());

    if (i < 0) {
        i = 100;
        console.log(n._STATE.queue.allUrlNum());
    } else {
        i--;
    }
});

n.queue(myPlan, "http://www.baidu.com");
