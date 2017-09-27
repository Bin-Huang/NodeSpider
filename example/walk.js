/**
 * 从百度开始，访问页面中所有的链接，并对所有访问的页面重复上述操作
 */

const { Spider } = require("../build/index");

const s = new Spider();

s.plan("take a walk", (err, current) => {
    if (err) return console.log(err);
    const $ = current.$;
    console.log($("title").text()); // 每经过一个页面，打印它的标题
    s.queue("take a walk", $("a").url());
});

s.queue("take a walk", "http://www.baidu.com");