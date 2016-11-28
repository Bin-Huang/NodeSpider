# NodeSpider

NodeSpider基于nodejs，是一个容易上手、开发迅速的轻量级爬虫库，让开发者只需专注于网页抓取策略与业务逻辑、其他琐事交给API自动处理，提高爬虫开发效率。

虽然顺利爬了几十万个网页、收集了一百万的招聘信息，但仍觉得不够完善。我将在两个月后着重完善，敬请期待 :)

# 快速上手

```javascript
var NodeSpider = require('./NodeSpider.js'); //引入NodeSpider爬虫包

var url = 'http://demo.com'; //or ['http://demo1.org', 'http://demo2.com', 'https://demo3.cn']

var options = {
    debug: false, //关闭debug模式.爬取过程中将自动重试爬取失败的链接（默认2次），并自动输出log.txt到本地
    max_connection: 30, //最大同时连接数
    decode: 'gbk', //将返回正文从gbk自动转码为unicode

    //更多设置见API......
};

//初始化爬虫
var s = new NodeSpider(url, option, function($, info) {
    console.log(info.url); //当前页面的链接
    console.log(info.body); //当前返回正文
    console.log(info.err); //当前返回错误(关闭debug模式下，错误链接将被自动重试并记录log)
    console.log(info.res); //当前返回响应

    //直接使用jQuery语法与API抓取你想要的内容
    s.todo($('#next_page').attr('href')); //todo将新的链接添加到待爬取列表并排队等候抓取，并自动去重、自动补全相对路径为绝对路径

    var new_data = { //新建一个数据对象
        title: $('#title').text(),
        time: $('#create_time').text(),
        content: $('#content').text()
    };
    s.push(new_data); //push将数据推送到默认的'data'池，并自动以表格形式保存到本地data.txt中

    //实验性功能（暂时不太完善）
    s.push(new_data, 'my_pool'); //推送数据到自定义的'my_pool'池，根据'my_pool'的设置保存内容
    s.download($('#download_button').attr('href'), 'jpg'); //download将自动下载内容到本地

    //更多Method见API
});

s.start(); //启动爬虫
```
