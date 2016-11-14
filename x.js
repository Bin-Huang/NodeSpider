var spider = require('./spider-lib.js');
var fs = require('fs');

var num = 100;
var data = [];

var opts = {
    aim: 'http://www.w3school.com.cn',
    action: function() {
        console.log($('html').html());
        // var that = this;
        // $('a').each(function() {
        //     if (num < 0) {
        //         this.stop_add_aim = true;
        //         return;
        //     }
        //     if ($(this).attr('href') && $(this).attr('href').indexOf('javascript:void') === -1) {
        //         that.addAim($(this).attr('href'));
        //     }
        //     num--;
        // });
    },
};


var s = new spider(opts);
s.start();
