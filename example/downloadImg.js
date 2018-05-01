/**
 * 尝试下载某个网页所有的图片，并保存到 ./img 路径
 */

const { Spider, downloadPlan } = require("../build/index");

const s = new Spider();

s.plan("downloadImg", downloadPlan({
    callback: (err, current) => {
        if (err) return console.log(err);
        console.log(current.url + " done!");
    },
    path: "./example/img",
}));

s.plan("getSrc", (err, current) => {
    if (err) return console.log(err);
    const $ = current.$;
    s.add("downloadImg", $("img").src());
    // $("img").src().map((src) => {
    //     s.download("./img", src);
    // });
});

s.add("getSrc", "https://pixabay.com/");
