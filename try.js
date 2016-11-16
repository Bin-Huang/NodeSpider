var Spider = require('./spider.js');
var fs = require('fs');
var data = require('./data.js');
for (var i = 0; i < data.length; i++) {
	data[i] = 'http://gdut.eswis.cn/upfiles/688557596/userpic/2014/' + data[i] + '.jpg';
}
console.log('装弹完成');
var s = new Spider(data, {max_connection: 500}, function ($, body, url) {
	if (body.length < 3000) {
		s.fail_todo.push(url);
	} else {
		var id = url.match(/\d{10}/);
		fs.writeFile('touxiang/' + id + '.jpg', function (err) {
			if (err) {
				s.fail_todo.push(url);
			}
			console.log('done');
		});
	}
});
s.start();