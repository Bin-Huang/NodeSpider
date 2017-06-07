const NodeSpider = require("nodespider");
const n = new NodeSpider({
    maxC: 30,
});

const getNews = n.createStragter((err, current) => {
    const $ = current.$;
    n.save({title = $("title").text()});
    $("a").forEach(() => {
        getNews($(this).url());
        downloadImg($(this).src());
    });
});

const getPicture = n.createStragter({
    pre: [NodeSpider.decode, NodeSpider.loadJq],
    cookies: "dfjskljkwioivwkljekjf",
    callback: (err, current) => {
        return null;
    },
});

getNews("http://www.baidu.com", {
    path: "skdlfjskljfkls",
});

const s = new NodeSpider({
    maxL: 30,
});
function myT(err, current) {
    if (err) {
        return null;
    }
    const $ = current.$;
    $("a").forEach(() => {
        $(this).todo();
        $(this).todo(getdddd);
    });
}

s.addTask("ksldfjslkfj", myT);
