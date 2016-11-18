TODO
- 可选的jQ
- 释放err

easy to use!
```
var Spider = require('./spider.js');

var mySpider = new Spider('http://www.baidu.com', function ($, result) {
    console.log(result.res);
    console.log(result.url);
    console.log(result.body);
    console.log(result.err);
    console.log($('head').find('title').html());
});

mySpider.start();
```

```
var url = ['urlA', 'urlB', 'urlC'];
var opts = {
        retries: 2,
        max_connection: 100,
        save_log: true,
        log_path: '',
        decode: false,
        debug: false,
        jQ: true,   //callback(result) {}
        download: 'picture/',
};
var s = new Spider(url, opts, function($, result) {
    $('a.url').each(function () {
        s.todo($(this).text());
    });
    $('a.picture').each(function() {
        s.download($(this).text(), 'jpg', 3000);
    });
});
s.todoNow('http://www.baidu.com');
s.downloadNow(['http://xxx.jpg', 'http://ooo.jpg'], 'newFile/', 'jpg', 3000);
s.download("http://xxx", function(err) {});
s.start();
```

```
var opts = {
    debug: false,
    save_as_txt: {
        path: 'data/',
        frequency: 20
    },
    push_to_db: {
        user: 'ben',
        pw: 'skj',
        db_name: 'school',
        host: 'example.org',
        frequency: 20
    }
};
var s = new Spider('http://xxx.com', opts, function($) {
    var newtr = {};
    s.todo($('button$next_page'));
    $('tr').each(function() {
        newtr.name = $('.name').text();
        newtr.sex = $('.sex').text();
        newtr.phone = $('.phone_number').text();
        //当参数只有一个，同步返回并返回body。参数不止一个则异步return true;
        newtr.logo = s.download($('.logo'));
    });
    s.save(newtr, 'data');//添加到data.txt，如果不存在，新建它
    s.saveNow(newtr, 'data');
    s.push(newtr, 'table');//推送到数据库的table表，如果不存在，新建它
    s.pushNow(newtr, 'table');//如果失败，重试？保存到本地txt
});
s.start();
```

```

```

```
var url = ['http://www.baidu.com', 'http://www.jd.com'];
var opts = {
    decode: 'utf-8',
}
var callback = function ($) {
    console.log($(head).find(title).html());
}

var oneSpider = new Spider(url, opts, callback);
// or  `var oneSpier = new Spider(url, callback, opts)`
```

more API
```
var theSpider = require('./spider.js');

var opts = {
    
};

var theSpider = new spider (url[or url_Array], [opts], callback($,[body],[err],[res]){
    some code...
});

theSpider.start();
```
