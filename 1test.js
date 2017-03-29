const NodeSpider = require('./build/spider');

let s = new NodeSpider({
    // multiTasking: 10
});

let i = 0;

s.addTask({
    url: '123',
    callback: () => {},
    type: 0
})
console.log(s.check('123'));
console.log(s.check('3'));
s.addTask({
    url: '123',
    callback: () => {},
    type: 0
})

// s.start('http://www.baidu.com', function(err, currentTask, $) {
//     if (err) {
//         // s.retry(currentTask);
//         return ;
//     }
//     $('a').todo();
//     let l = s._TODOLIST._QUEUE.getLength();
//     console.log(l);
//     // console.log("curr: " + s._STATUS._currentMultiTask)
//     // console.log(l)
//     // console.log(i ++);
// })

// s.start("http://search.51job.com/list/000000,000000,0000,00,9,99,%25E4%25BA%25A7%25E5%2593%2581%25E7%25BB%258F%25E7%2590%2586,2,1.html?lang=c&stype=&postchannel=0000&workyear=99&cotype=99&degreefrom=99&jobterm=99&companysize=99&providesalary=99&lonlat=0%2C0&radius=-1&ord_field=0&confirmdate=9&fromType=&dibiaoid=0&address=&line=&specialarea=00&from=&welfare=", function(err, currentTask, $) {
//     if (err) {
//         s.retry(currentTask);
//         return ;
//     }
//     $(".dw_page").find("a").todo();
//     console.log(s._TODOLIST._QUEUE.getLength());
// })
