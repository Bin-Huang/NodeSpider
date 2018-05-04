// 例子：抓取本页面，并console.log输出帖子与评论内容
const { Spider } = require("../build/index");
const s = new Spider();
s.plan("myPlan", (err, current) => {
    if (err) return s.retry(current);
    const $ = current.$;
    console.log($(".topic_content").text());    // 打印帖子
    $(".reply_item").each(function () {
        let text = $(this).text().replace(/\s+/g, " ");
        console.log(text);  // 打印每个评论
    }); 
})
s.queue("myPlan", "https://cnodejs.org/topic/59cd08505704b6f30c5678fe");