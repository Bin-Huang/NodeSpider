const NodeSpider = require("../build/spider");

const s = NodeSpider.create();
s.addTask({
    url: "http://www.douban.com",
    strategy: (err, currentTask, $) => {
        if (err) {
            console.log(err)
        } else {
            console.log($("title").text());
        }
    }
})