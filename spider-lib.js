const EventEmitter = require('events');
const iconv = require('iconv-lite');
const request = require('request');
const cheerio = require('cheerio');

/**
 * [Spider description]
 * opts.aim {string}or{array} 目标链接或多个目标链接组成的数组
 * opts.action {function} 抓到内容后的操作
 * opts.maxConnection {number} 最大连接数（最大线程数）,默认20
 */
var Spider = function(opts) {
    this.aim = function() {
        if (typeof opts.aim === 'string') {
            return [opts.aim];
        } else if (Array.isArray(opts.aim)) {
            return opts.aim;
        }
        console.error('目标链接aim只能是字符串或数组！');
        return false;
    }();
    this.done = []; //抓取成功的url列表
    this.fail_aim = []; //抓取失败的url列表
    this.repeat = opts.repeat || 2; //对失败链接重复抓取的次数
    this.addAim = addAim;
    this.stop_add_aim = false; //当为ture，则停止继续添加链接到aim。用于在action中停止添加待抓取链接
    this.maxConnection = opts.maxConnection || 20;
    this.conn_num = 0; //当前连接数
    this.nervus = new EventEmitter();
    this.encoding = opts.encoding || 'utf-8';
    this.action = opts.action;
    this.paw = paw;
    this.brain = brain;
    this.log = log;
    this.start = start;
};

function start() {
    this.brain();
    this.log();
    this.nervus.emit('start');
}

function brain() {
    var that = this;
    this.nervus.on('start', function() {
        if (that.aim.length > 0) {
            var next_url = that.aim[0];
            that.aim.shift();
            that.conn_num++;
            that.paw(next_url);
        }
    });
    this.nervus.on('next', function() {
        that.conn_num--;
        if (that.conn_num < that.maxConnection) {
            if (that.aim.length > 0) {
                var next_url = that.aim[0];
                that.aim.shift();
                that.conn_num++;
                that.paw(next_url);
            } else if (that.repeat > 0) {
            	that.aim = that.fail_aim;
            	that.fail_aim = [];
            	that.repeat --;
				that.conn_num++;
				that.nervus.emit('next');           	
            } else if (that.conn_num <= 0) {
            	that.nervus.emit('finish');
            }
        }
    });
}

function paw(url) {
    var that = this;
    request({
        url: url,
        method: 'GET',
        encoding: null
    }, function(err, res, body) {
        if (err) {
            that.nervus.emit('failed', { url: url, detail: err });
            that.fail_aim.push(url);
            that.nervus.emit('next');
            return;
        }
        body = iconv.decode(body, that.encoding);
        $ = cheerio.load(body);
        var sss = $;
        that.action();

        that.nervus.emit('successful', { url: url, detail: 'successful' });
        that.done.push(url);
        that.nervus.emit('next');
    });
}


/**
 * 添加待抓取链接
 * @param {string} new_aim 待抓取的url
 */
function addAim(new_aim) {
    if (this.stop_add_aim) {
        return;
    }
    var x = this.aim.indexOf(new_aim);
    var y = this.done.indexOf(new_aim);
    var z = this.fail_aim.indexOf(new_aim);
    //如果这个链接不存在于待抓取列表、抓取成功列表、抓取失败列表，则添加到待抓取列表
    if (x === -1 && y === -1 && z === -1) {
        this.aim.push(new_aim);
        return true;
    }
    return false;
}

function log() {
    var log = [];
    var that = this;
    // 进度显示
    function show(url) {
        var done = that.done.length;
        var all = that.aim.length + that.done.length + that.fail_aim.length;
        var fail = that.fail_aim.length;
        console.log('[' + done + '/' + fail + '/' + all + '](S/F/A) ,N:'+that.conn_num+'  ' + url);
    }

    this.nervus.on('error', function(news) {
        console.error('error:' + news.detail);
        log.push({ time: new Date(), type: 'error', url: news.url, detail: news.detail });
    });
    this.nervus.on('failed', function(news) {
        show(news.url);
        log.push({ time: new Date(), type: 'failed', url: news.url, detail: news.detail });
    });
    this.nervus.on('successful', function(news) {
        show(news.url);
        log.push({ time: new Date(), type: 'successful', url: news.url, detail: news.detail });
    });
    this.nervus.on('finish', function() {
        console.log('finished');
    });

}

module.exports = Spider;
