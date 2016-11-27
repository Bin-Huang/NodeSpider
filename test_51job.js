var Spider = require('./spider.js');
var page = 2;
var url = 'http://jobs.51job.com/all/p1';
var s = new Spider(url, { decode: 'gbk', debug: true }, function($, result) {
	if (page < 4000) {
		s.todo(url.slice(0,url.length - 1) + page);
		page ++;
	}
	if (/html/.test(result.url)) {
		var data = {};
		data.City = $('div.cn span.lname').text();
		data.CompanyName = $('.cn p.cname a').attr('title');
		data.CreateTime = $('span.sp4 em.i4').parent().text() || '';
		data.Education = $('span.sp4 em.i2').parent().text() || '';
		data.PositionName = $('.cn h1').attr('title');
		data.Salary = $('.cn strong').text();
		data.WordYear = $('.sp4 em.i1').parent().text() || '';
		data.Number = $('.sp4 em.i3').parent().text().match(/\d+/) || 5;
		s.push(data);
	} else {
		$('.e p.info span.title a').each(function () {
			if ($(this).attr('class') === 'name') {return;}
			s.todo($(this).attr('href'));
		});
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
