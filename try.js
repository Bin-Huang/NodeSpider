var Spider = require('./spider.js');
var page = 30;

var url = 'http://search.51job.com/jobsearch/search_result.php?fromJs=1&jobarea=010000%2C00&district=000000&funtype=0000&industrytype=00&issuedate=9&providesalary=99&keywordtype=2&curr_page=1&lang=c&stype=1&postchannel=0000&workyear=99&cotype=99&degreefrom=99&jobterm=99&companysize=99&lonlat=0%2C0&radius=-1&ord_field=0&list_type=0&fromType=14&dibiaoid=0&confirmdate=9';

var s = new Spider(url, { decode: 'gbk' , debug: true}, function($, result) {
    $('.dw_table').find('[class="el"]').each(function() {
        var data = {};
        data.name = $(this).find('.t1').find('a').attr('title');
        data.company = $(this).find('.t2').find('a').attr('title');
        data.site = $(this).find('.t3').text();
        data.wage = $(this).find('.t4').text();
        data.time = $(this).find('.t5').text();
        s.push(data);
    });
    if (page > 0) {
    	var a = $('.dw_page').find('li.on').next().find('a').attr('href');
    	page --;
    	s.todo(a);
    }
});

s.start();

// var Spider = require('./spider.js');
// var fs = require('fs');
// var data = require('./data.js');

// console.log(data.length);


// for (var i = 0; i < data.length; i++) {
//  data[i] = 'http://gdut.eswis.cn/upfiles/688557596/userpic/2014/' + data[i] + '.jpg';
// }
// console.log('装弹完成');
// var s = new Spider(data, {max_connection: 500}, function ($, body, url) {
//  if (body.length < 3000) {
//      s.fail_todo.push(url);
//  } else {
//      var id = url.match(/\d{10}/);
//      fs.writeFile('touxiang/' + id + '.jpg', function (err) {
//          if (err) {
//              s.fail_todo.push(url);
//          }
//          console.log('done');
//      });
//  }
// });
// s.start();
