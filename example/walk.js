/**
 * 从百度开始，访问页面中所有的链接，并对所有访问的页面重复上述操作
 */

const { Spider, defaultPlan } = require("../build/index");

const s = new Spider();

s.on("statusChange", (c, p) => console.log(`${p} -> ${c}`));

let i = 0;
s.add("take a walk", defaultPlan((err, current) => {
    if (err) return console.log(err.message);
    const $ = current.$;
    console.log($("title").text()); // 每经过一个页面，打印它的标题
    console.log(i++);
    if (i < 2) {
        s.queue("take a walk", $("a").url());
    }
}));

s.queue("take a walk", "http://www.baidu.com");


setTimeout(() => {
    i = 0;
    console.log("============")
    s.queue("take a walk", "http://www.baidu.com");
}, 6000);

setTimeout(() => {
    i = 0;
    console.log("============")
    s.end();
    s.queue("take a walk", "http://www.baidu.com");
}, 12000);

setTimeout(() => {
    s.queue("take a walk", "http://www.baidu.com");
}, 15000);