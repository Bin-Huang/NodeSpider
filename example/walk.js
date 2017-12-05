/**
 * 从百度开始，访问页面中所有的链接，并对所有访问的页面重复上述操作
 */

const { Spider } = require("../build/index");

const s = new Spider({
    alive: true
});

let i = 1;
s.plan("take a walk", (err, current) => {
    console.log(i ++);
    if (err) {
        s.end();
        return console.log(err.message);
    }
    const $ = current.$;
    console.log($("title").text()); // 每经过一个页面，打印它的标题
    s.add("take a walk", $("a").url());
});

s.add("take a walk", "http://www.baidu.com");
