# NodeSpider

10 lines of code to develop a web crawler as a geek

nodespider is a web crawler 

```javascript
let s = new NodeSpider({

});

s.start('http://www.google.com', function(err, current, $) {
    if (err) {
        s.retry(err, 3, function(err) {
            s.save('log.json', err);
        });
        return ;
    }
    console.log($('title').text());

    s.todo($('a'), current.callback);
    s.download($('img'), 'src', './myFolder', function (err) {
        if (err) s.retry(err, 2, function() {s.log(err)});
    });

    s.save('my-table.txt', {
        name: $('#name').text();
        age: $('span .man #age').text();
    })
});
```

# Features
- server-side DOM & jQuery you can use to parse page
- 

