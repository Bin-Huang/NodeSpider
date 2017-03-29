const NodeSpider = require("./build/spider");
let s = new NodeSpider({
    multiTasking: 1
});

let dataCallback = (err, currentTask, $) => {
    if (err) {
        console.log(err)
        return s.retry(currentTask);
    }
    s.save("data", {
        title: $(".cn").find("h1")[0].attr("title"),
        wage: $(".cn").find("strong")[0].text(),
        company: $(".cn").find("p")[0].find("a")[0].text(),
    })
}

let beginUrl = "http://search.51job.com/list/000000%252C00,000000,0000,00,9,99,%25E4%25BA%25A7%25E5%2593%2581%25E6%2580%25BB%25E7%259B%2591,2,1.html?lang=c&degreefrom=99&stype=1&workyear=99&cotype=99&jobterm=99&companysize=99&radius=-1&address=&lonlat=&postchannel=&list_type=&ord_field=&curr_page=&dibiaoid=0&landmark=&welfare=";
let num = 1000;
s.start(beginUrl, function(err, currentTask, $) {
    if (err) {
        console.log(err)
        s.retry(currentTask);
        return ;
    }
    $(".el").find("a").todo(dataCallback);
    console.log(s._TODOLIST._QUEUE)
    if (num > 1) {
        num --;
        // console.log($(".dw_page").find("a").url())
        $(".dw_page").find("a").todo();
    }
});
