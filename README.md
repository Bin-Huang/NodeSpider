# NodeSpider

20 lines of code to develop a web crawler as a geek.

nodespider 是一个 容易上手、开发迅速、易于扩展的轻量级爬虫框架。通过各种简单好用的api方法，帮助开发者用较少的代码开发出满足工作的爬虫。

```javascript
let s = new NodeSpider({
    toUtf8: true,   // 自动转码页面为 utf-8
    // ...
});
s.start('https://en.wikipedia.org/wiki/Main_Page', function (err, current, $) {
    if (err) {
        s.retry(err, 3, function () {
            s.save('log', err);
        });
        return ;
    }
    s.todo($('a'), current.callback);
    s.save('wiki.json', {
        title: $('title').text(),
        sumary: $('p').text(),
    });
});
```

# Features
- server-side DOM & jQuery you can use to parse page
- 

