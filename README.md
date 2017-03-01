# NodeSpider

20 lines of code to develop a web crawler as a geek.

Nodespider is designed to hel. Through a variety of simple and easy to use API method to help developers with less code developed to meet the work of reptiles.

NodeSpider is designed to 

Easier and more efficient to crawl a website and extract data, NodeSpider can save your time.

```javascript
let s = new NodeSpider({
    toUtf8: true,   // Convert html to UTF8 if necessary
    // more...
});

// start crawling with a url and callback
s.start('https://en.wikipedia.org/wiki/Main_Page', function (err, current, $) {
    if (err) {
        s.retry(err);   //retry the task
        return ;
    }

    // You can use jQuery to extract data or select element
    console.log($('title').text()); 

    // Add new task to NodeSpider's todo-list.
    // Never worry about the url is existed or has been crawled
    s.todo($('a#next_page').attr('href'), current.callback);

    // Get the url(s) from jQuery selected Element
    // Will convert relative url into absolute url automatically, never wrong about the relative url in page.
    s.todo($('a'), current.callback);

    // Easy to save data from the website to local.
    s.save('./mydata.json', {
        title: $('title').text(),
        sumary: $('p').text(),
        picture_url: $('img').attr('href')
    });

    // And more interesting thing...
});
```

# Features
- server-side DOM & jQuery you can use to parse page

# Initialization

## new NodeSpider([option])
```javascript
var NodeSpider = require('NodeSpider');

var s = new NodeSpider();   //create an instance of NodeSpider
```

You can config the instance when you create.

```javascript
var s = new NodeSpider({
    toUTF8: true,
    max_process: 40
    // and more...
});
```

**option:**

- **toUTF8** (default: `true`) If true, convert html to UTF8 if necessary.
- **jq** (default: `true`) Whether you need jQuery on the sever.
- **max_process** (default: 40) Max number of crawling tasks executed asynchronously.

# Method

## NodeSpider.prototype.start(start_url, callback)

Start web crawling with start_url(s)

**start_url** type: {string | array}

The url to start with. It can be a string or an array of string.

**callback** type: {function}

the function about what you want to do after received response. 

There are three parameters: 

`err`

If there are not error in the task, it is `null`

`current`

In NodeSpider, all tasks will be executed Asynchronously. But you can get information about the current task through the 'current' parameter.

- `current.url` current task's url
- `current.callback` current task's callback
- `current.response` current response from website
- `current.body` current html body
- `current.opts` the special option for current task

`$` 

You can use the `$` to operate element just like jQuery in browser. It can help you to extract urls and data more easily.

```javascript

NodeSpider.start('http://www.google.com', function (err, current, $) {

    if (err) console.log(err);

    // get information from current task
    console.log(current.url);
    console.log(current.response);

    // Use the $ to operate/select Elements
    console.log($('title').text());

});
```

## NodeSpider.prototype.todo(item, [opts,] callback)

Add new web-crawl task to spider's todo-list. The task will be executed automatically.

**item**    type: string, array or jQuery

The url(s) you want to crawl. It can be a url `string`, array of urls, and jQuery element object that possess `href` attribute.

If it is jQuery element object, nodespider will convert relative url into absolute url automatically, never wrong about the relative url in page.
```
s.todo('http://www.google.com', yourCallback);
s.todo(['http://www.wiki.com', 'http://www.amazon.con'], yourCallback);

function yourCallback(err, current, $) {
    s.todo($('a'), yourCallback);
}
```

**opts** type: object
*optional* Special option for this task
```
var opts = {
    jq: true
    //...
}
```

**callback** type: function

the callback function for the task, about how to scrape the web
```
function (err, current, $) {
    // your code
}
```

## NodeSpider.prototype.save(path, data)
Method save help you to save/collect data from website to local easier.

- path type: string

The path to save data. 
If path or file does not exist, nodespider will create it automatically.


Different file extension lead to defferent mode to save data.
```javascript
var s = new NodeSpider();
var data = {type: 'cat', color: 'white'};

// save as json
s.save('./myFolder/myData.json', data); 

// save as txt, using '\t','\n' as separator.
// if you copy all to Excel, you will like that :)
s.save('./myFolder/myData.txt', data); 

// if there are no file extension, save as json by default
s.save('./myFolder/myData', data);
```

- data type: object

Data you want to save/collect.

```javascript
s.save('student.json', {
    name: 'ben',
    age: 20
});
```

## NodeSpider.prototype.retry(err[, max_retry_num[, final_callback]])

Method `retry` can help you to retry failed task.

```javascript
var s = new NodeSpider();
s.start('http://some_url_maybe_wrong', function(err, current, $) {
    if (err) {
        s.retry(err);
        // as
        // s.retry(err, 3);
        // as
        // s.retry(err, 3, function (err) {
        //    s.save('log', err);
        // };
    }
})
```
**err** type: {Error}

the error passed into the callback.

**max_retry_num** type: {number}

*optional* Number of retries if the request fails. Default `3`

**final_callback** type: {function}

*optional* the function to execute when a task failure more than max_retry_num.
There are only parameter `error`.

Default: save error as data to log, equal to `function (err){s.save('log', err)}`.