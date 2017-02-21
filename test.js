const spider = require('./build/spider');
let s = new spider({
    toUTF8: true,
    max_process: 50
});
let i = 1000;
let j = 0;
s.start('http://search.51job.com/list/000000,000000,0000,32,9,99,%2B,2,1.html?lang=c&stype=1&postchannel=0000&workyear=99&cotype=99&degreefrom=99&jobterm=99&companysize=99&lonlat=0%2C0&radius=-1&ord_field=0&confirmdate=9&fromType=&dibiaoid=0&address=&line=&specialarea=00&from=&welfare=', function (err, current, $) {
    if (err) {
        console.log(err);
        return ;
    }
    let data = {
        title: $('title').text(),
    };
    if (i>0) {
        i--;
        s.todo($('a'), current.callback);
    }
    s.save('tttttttt', data);
    console.log('i: ' + i);
    j++;
    console.log('j: '+j);
    console.log('prog: ' + s._status.process_num);
    console.log('chain: '+ s._todo_list.data._length);
    console.log(current.url);
});

