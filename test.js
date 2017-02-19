const spider = require('./build/spider');
let s = new spider({
    max_process: 10,
});
let i = 1000;
s.start('http://blog.csdn.net/jimbowong/article/details/54960244', function (err, current, $) {
    if (err) {
        console.log(err);
        return ;
    }
    s.todo($('a'), current.callback);
    // console.log('id: '+ i++);
    console.log(s._status.process_num)
    console.log('titile: '+$('title').text());
});
