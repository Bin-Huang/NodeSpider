const NodeSpider = require("../index");
const n = new NodeSpider();

const p = n.plan(function(err, current) {
    if (err) {
        return console.log(err);
    }
    console.log(current.body);
});

n.queue(p, "http://www.neeq.com.cn/disclosure/announcement.html");