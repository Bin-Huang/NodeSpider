const NodeSpider = require("../build/spider.js");
let s = new NodeSpider();
s.start("kjklsdfj", function (currentTask) {
    s.retry(currentTask);
});
let c = new NodeSpider();
