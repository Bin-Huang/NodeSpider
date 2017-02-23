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
        s.retry(err);   // 自动对错误进行重试
        return ;
    }

    // 直接使用 jQuery 操作、选择内容
    console.log($('title').text()); 

    // 添加新链接至待爬取列表，自动补全相对路径，自动去重
    s.todo($('a'), current.callback);

    // 轻松将内容保存到本地
    s.save('./mydata.json', {
        title: $('title').text(),
        sumary: $('p').text(),
    });
});
```

# Features
- server-side DOM & jQuery you can use to parse page
- 

# 初始化

## 通过 `new NodeSpider()` 新建爬虫实例
```javascript
var NodeSpider = require('NodeSpider');

var s = new NodeSpider();   //新建实例

```

## option

新建爬虫实例的同时，你还可以对实例进行设置

```javascript
var s = new NodeSpider({
    toUTF8: true,
    max_process: 30
    // 或者更多 ...
});
```

下面是你可以自由设置的设置项

```javascript
var option = {
    max_process: 40,    //最大同时抓取任务的数目，默认： 40
    toUTF8: true,  //是否自动将返回正文转码为 utf-8。默认： True
    jq: true   //是否加载 jQuery 并传入 callback 爬取函数。默认： true
};
```

# 方法

## NodeSpider.prototype.start(url, callback)

传入开始链接，并为该链接（们）指定 callback 爬取函数

**url** type: {string | array}

需要被爬取的链接，可以是 url 字符串，也可以是 url 组成的数组，甚至是一个jQuery选择对象。

**callback** type: {function}

为该链接设置 callback 爬取函数。

```javascript
NodeSpider.start('http://www.google.com', function(err, current, $){
    if (err) console.log(err);  //请求过程中遇到的错误，正常情况下为 null

    // NodeSpider 通过异步的方式请求网络并抓取。
    // 你可通过 current 获得当前爬取任务的信息
    console.log(current.url);   // 当前链接
    console.log(current.callback);  // 当前爬取函数
    console.log(current.response);  // 服务器回应
    console.log(current.body);  // 返回正文
    console.log(current.opts);  // 当前该任务的设置

    // 你可以使用 jQuery 来操作、选择你需要的内容
    // （如果你在初始化时设置 {jq: false}, 则 $ 无法使用）
    console.log($('title').text());
    $('a').each(function () {
        console.log($(this).attr('href'));
    })
});
```

## NodeSpider.prototype.todo(item, [opts,] callback)

方法 todo 用来添加新的链接到待爬取列表，并为其指定 callback 抓取函数。
重复的链接将自动取消添加并返回`false`，所以你不用担心重复抓取的问题。
同时，你可以选择性的为其指定爬取设置（爬取该链接时，该设置将覆盖全局设置）

**item**    type: string, array or jQuery

你可以传入一个 url 字符串，或者是 url 组成的数组，甚至是一个jQuery选择对象。
当传入的是一个jQuery选择对象时，nodespider 将自动获取其中每一元素节点的 href 属性，并根据当前任务自动补全相对路径为绝对路径。
所以当在callback抓取函数中调用 todo 时，建议你传入jquery对象，这会减轻你工作负担

```
s.todo('http://www.google.com', yourCallback);
s.todo(['http://www.wiki.com', 'http://www.amazon.con'], yourCallback);

function yourCallback(err, current, $) {
    s.todo($('a'), yourCallback);
}
```

**opts** 可选 type: object

本次爬取工作的专门设置
```
var opts = {

}
```

**callback** type: function

指定本次爬取工作的callback 爬取函数, 当爬虫获得网页内容后调用
```
function (err, current, $) {

}
```

## NodeSpider.prototype.save(path, data)
方法 save 可以帮助你将对象格式的数据以各种格式保存到本地，这在抓取数据时非常有用

- path type: string

指定保存路径。不用担心路径及文件是否存在，NodeSpider将自动帮你创建。
文件的不同扩展名将决定数据在文件中的表现形式。
```javascript
var s = new NodeSpider();
var data = {type: 'cat', color: 'white'};

//data数据将以json形式保存
s.save('./myFolder/myData.json', data); 

//data中的数据将以表格形式保存。以属性名为表头，以'\t'、'\n'为分隔。
//当你复制所有内容到 Excel，你会喜欢它的
s.save('./myFolder/myData.txt', data); 

//如果没有指定扩展名，则以json形式保存
s.save('./myFolder/myData', data);
```

- data type: object

需要保存的数据对象。
需要注意的是：当你首次向一个文件保存数据时，这个文件将与数据中各属性名相绑定。此后保存数据到文件，只会保存对应数据名的内容。
```javascript
// mydata.json 与 data属性名 ['name', 'age'] 相绑定
s.save('student.json', {
    name: 'ben',
    age: 20
});


s.save('student.json', {
    name: 'ben',
    score: 'A'  // score 不在 header, 所以 'A' 不会被保存
});
```

## NodeSpider.prototype.retry(err[, max_retry_num[, final_callback]])
遇到不可避免的错误，使用 retry 重试本次抓取任务

```javascript
var s = new NodeSpider();
s.start('http://some_url_maybe_wrong', function(err, current, $) {
    if (err) {
        s.retry(err);
        // or
        // s.retry(err, 3)
        // or
        // s.retry(err, 3, function (err) {
        //  s.save('log', err);
        // }
    }
})
```
**err** type: {Error}

直接将被传入 callback 抓取函数的error，作为 retry 方法的参数

**max_retry_num** type: {number}

可选。设置最大的重试次数，默认为 3。

**final_callback** type: {function}

可选。设置达到最大重试次数后所需要执行的函数。默认等价于：`function (err) {this.save('log', err)}`