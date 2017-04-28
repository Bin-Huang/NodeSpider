import NodeSpider from "../build/spider.js";
let s = new NodeSpider();
s.start("hskdfjklsj", function (err, currentTask, $) {
    if (err) {
        s.retry(currentTask);
    }
});
