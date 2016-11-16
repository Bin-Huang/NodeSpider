TODO
- 可选的jQ
- 释放err


easy to use!
```
var Spider = require('./spider.js');

var mySpider = new Spider('http://www.baidu.com', function ($) {
    console.log($('head').find('title').html());
});

mySpider.start();
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
