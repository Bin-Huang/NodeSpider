const { Spider } = require("../build/index");
const fs = require("fs");

const n = new Spider ({
    multiTasking: 100,
});

const w = fs.createWriteStream("m.txt");

let i = 0;
let bug = 0;
let u = 10000;
const myPlan = n.plan((err, current) => {
    const text = `${new Date().getTime()}\t${i++}\t${n._STATE.currentMultiTask}\t${bug}\t${n._STATE.queue.crawlWaitingNum()}\n`;
    if (err) {
        bug ++;
        return w.write(text);
    }
    const $ = current.$;
    if (n._STATE.queue.crawlWaitingNum() < u) {
        n.queue(myPlan, $("a").url());
    }
    console.log(text);
    return w.write(text);
});

n.queue(myPlan, "http://www.baidu.com");
