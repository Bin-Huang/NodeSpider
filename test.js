var NodeSpider = require('./spider.js');

var mySpider = new NodeSpider('http://www.baidu.com', function ($) {
    console.log($('head').find('title').text());
    $('a').each(function() {
        mySpider.todo($(this).attr('href'));
    });
});

mySpider.start();
// 成功抓广工头像
// var Spider = require('./spider.js');
// var data = require('./data.js');
// for (var i = 0; i < data.length; i++) {
// 	data[i] = 'http://gdut.eswis.cn/upfiles/540168647/userpic/2014/'+data[i] + '.jpg]jpg]download/';
// }
// var s = new Spider(data, function () {
	
// });

// s.start();

// var request = require('request');
// var fs = require('fs')
// var r = request('http://gdut.eswis.cn/upfiles/616306813/userpic/2014/3114008359.jpg');
// var w = fs.createWriteStream('d.jpg');
// r.pipe(w);