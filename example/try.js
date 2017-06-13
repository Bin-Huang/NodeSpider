const NodeSpider = require("../index");

const n = new NodeSpider();

const myPlan = n.plan((err, current) => {
    if (err) {
        return console.log(err);
    }
    console.log(current.body);
    const $ = current.$;
    console.log($("title").text());
});

console.log(myPlan)
n.queue(myPlan, "http://www.baidu.com");
