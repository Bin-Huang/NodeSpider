const NodeSpider = require("../index");

const n = new NodeSpider();

const writer = n.pipe(NodeSpider.jsonPipe("mu.json"));

let i = 0;
const myPlan = n.plan((err, current) => {
    if (err) {
        return n.save(writer, err);
    }
    const $ = current.$;
    n.queue(myPlan, $("a").url());
    console.log(i++ + ":" + n._STATE.currentMultiTask);
});

n.queue(myPlan, "http://www.baidu.com");
