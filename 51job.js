const NodeSpider = require("./build/spider");
let s = new NodeSpider({
    // multiTasking: 1
});

let dataCallback = (err, currentTask, $) => {
    if (err) {
        console.log(err)
        // return s.retry(currentTask);
    }
    s.save("data", {
        title: $(".cn").find("h1").attr("title"),
        wage: $(".cn").find("strong").text(),
        company: $(".cn").find("p").find("a").text(),
    })
}

let beginUrl = "http://search.51job.com/list/000000%252C00,000000,0000,00,9,99,%25E4%25BA%25A7%25E5%2593%2581%25E6%2580%25BB%25E7%259B%2591,2,1.html?lang=c&degreefrom=99&stype=1&workyear=99&cotype=99&jobterm=99&companysize=99&radius=-1&address=&lonlat=&postchannel=&list_type=&ord_field=&curr_page=&dibiaoid=0&landmark=&welfare=";
let num = 1000;
s.start(beginUrl, function(err, currentTask, $) {
    if (err) {
        console.log(err)
        // s.retry(currentTask);
        return ;
    }
    console.log(currentTask.url);
    $(".el").find("p").find("span").find("a").todo(dataCallback);
    // $("a").todo();

    console.log(num)
    if (num > 1) {
        num --;
        let urls =         $(".p_in").find("ul").find("li").find("a").todo();
        console.log(urls)
        // urls.map((u) => {
        //     console.log(s.check(u));
        // })
        $(".p_in").find("ul").find("li").find("a").todo();

    }
});
