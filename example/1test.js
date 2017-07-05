const {NodeSpider} = require("../index");

const n = new NodeSpider();

const planA = n.plan((err, current) => {
    if (err) {
        return console.log(err);
    }
    current.response = null;
    current.body = null;
    console.log(current);
});

n.queue(planA, "http://www.baidu.com");