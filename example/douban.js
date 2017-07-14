// 尝试使用默认callback和默认planOpts的方式声明两个plan，并启动

const { Spider } = require("../build/index.js");
const n = new Spider();


const funPlan = n.plan((err, current) => {
    if (err) {
        return console.log(err);
    }
    const $ = current.$;
    console.log($("title").text());
});

n.queue(funPlan, "http://www.baidu.com");


const optsPlan = n.plan((err, current) => {
    if (err) {
        console.log(err);
    }
    const $ = current.$;
    console.log($("title").text());
});

n.queue(optsPlan, "http://www.baidu.com")