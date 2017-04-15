import NodeSpider from "../build/spider.js";

let s = new NodeSpider();
s.start("http://www.guokr.com/scientific/channel/brief/", function(err, currentTask, $){
    if (err) {
        return s.retry(currentTask);
    }
});