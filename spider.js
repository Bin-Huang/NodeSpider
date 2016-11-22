var EventEmitter = require('events');
var iconv = require('iconv-lite');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var default_options = {
    debug: true,

    retries: 2,
    max_connection: 20,

    save_log: 'log.txt',
    log_frequency: 10,
    log_more: false,

    // table: {
    //   default: 
    //   'data': {
    //       save_as_txt: 'data.txt',
    //   },
    // },

    sql: {
        host: '127.0.0.1',
        db: 'school',
        user: 'ben',
        password: '123123123',
    },

    table_default_max: 5,

    decode: 'utf-8',
    jQ: true,

    save_as_txt: false,
    push_to_db: false
};


function Spider(todo_list, opts, callback) {
    this.todo_list = typeof todo_list === 'string' ? [todo_list] : todo_list;

    //让opts变成可选参数，且opts和callback位置可以互换，更加灵活
    if (callback) { //当用户输入了opts参数
        //opts设置覆盖
        var o;
        var i;
        if (typeof opts === 'object') { //当参数opts位置在callback前
            o = default_options;
            for (i in opts) { //使用参数opts覆盖默认设置
                o[i] = opts[i];
            }
            this.opts = o;
            this.callback = callback;
        } else if (typeof callback === 'object') { //当参数opts在callback后面
            o = default_options;
            for (i in callback) {
                o[i] = callback[i];
            }
            this.opts = o;
            this.callback = opts;
        }
    } else { //当用户没有输入opts参数
        this.opts = default_options;
        this.callback = opts;
    }

    this.done_list = []; //已完成的链接
    this.fail_list = []; //失败的链接
    this.nervus = new EventEmitter();
    this.stop_add_todo = false;

    this.log = new Pool(this.opts.log_frequency, this.save_log);

    this.table = {};

    var that = this;


}

//事件监听初始化、各参数、选项检验、启动工作
Spider.prototype.start = function start() {
    var conn_num = 0; //当前连接数
    var pointer = 0; //指针，用于按顺序读取todo_list的元素
    var that = this;

    var init_result = this.initCheckout();

    if (!init_result) {
        return;
    }

    if (this.opts.debug === false) {

    }

    //事件监听
    that.nervus.on('crawl', function() {
        if (that.todo_list.length > pointer) {
            var next_url = that.todo_list[pointer];
            pointer++;
            conn_num++;
            that.crawl(next_url);
        }
    });
    that.nervus.on('next', function() {
        if (conn_num < that.opts.max_connection) {
            //当todo_list链接已爬完，如果重复次数大于0，对失败链接进行重爬
            if (that.todo_list.length <= pointer && that.opts.retries > 0) {
                that.todo_list = that.fail_list;
                pointer = 0;
                that.fail_list = [];
                that.opts.retries--;
            }
            //如果todo_list已爬完，重复次数为0或已无失败链接，且当前连接数为0，表示爬取总工作已结束
            if (that.todo_list.length <= pointer && conn_num <= 0) {
                that.nervus.emit('finish');
                return true;
            }

            that.nervus.emit('crawl');
        }
    });
    that.nervus.on('succeeded', function(url) {
        showProgress(url);
        conn_num--;
        that.done_list.push(url);
        that.nervus.emit('next');
    });
    that.nervus.on('failed', function(url) {
        showProgress(url);
        conn_num--;
        that.fail_list.push(url);
        that.nervus.emit('next');
    });
    that.nervus.on('finish', function() {
        console.log('finish');
        for (var i in that.table) {
            that.table[i].release();
        }
        // //just debug
        // console.log(that.log);
    });

    //火力全开，启动爬取
    for (var i = 0; i < that.opts.max_connection; i++) {
        that.nervus.emit('next');
    }

    // 展示进度
    function showProgress(url) {
        var all = that.todo_list.length; //总进度（不包括重爬）
        var done = pointer; //已完成进度
        var suc = that.done_list.length; //成功链接数
        var fail = that.fail_list.length; //失败链接数
        var retry = that.opts.retries; //当前剩下的重爬次数
        console.log('Progress: [' + done + '/' + all + '],  suc/fail: [' + suc + '/' + fail + '],  retries: ' + retry + ',  url:' + url);
    }
};

Spider.prototype.crawl = function crawl(url) {
    var that = this;
    var err = {};
    request({
        url: url,
        method: 'GET',
        encoding: null
    }, function(err, res, body) {
        if (err) {
            err = {
                type: 'HTTP_Request_Err',
                url: url,
                detail: err,
                warn: '访问失败，请检查链接与目标站点访问情况'
            };
            whenErr(err);
            return;
        }

        if (that.opts.decode) {
            // body = iconv.decode(body, that.opts.decode); //根据opts强制文本转码
            body = iconv.decode(body, that.opts.decode);
        }

        var result = {
            err: err,
            body: body,
            res: res,
            url: url
        };
        try {
            if (that.opts.jQ) {
                var $ = cheerio.load(body, { decodeEntities: false });
                that.callback($, result); //调用用户脚本
            } else {
                that.callback(result); //调用用户脚本
            }
        } catch (e) {
            err = {
                type: 'Crawl_Err',
                url: url,
                detail: e,
                warn: '爬取失败，请检查callback函数与返回正文'
            };
            whenErr(err);
            return;
        }

        that.nervus.emit('succeeded', url);
    });

    function whenErr(err) {
        if (that.opts.debug) { //如果是debug模式，报错并退出抓取
            console.log('\n=============ERROR===============\n\n' + '[Type]: ' + err.type + '\n\n[Url]: ' + err.url + '\n\n' + '[Warn]: ' + err.warn + '\n\n' + '[Detail]: ' + err.detail + '\n');
            console.log('停止爬取');
        } else { //如果不是debug模式，将错误推送Log并继续抓取
            that.fail_list.push(url);
            that.pushLog(err, true);
        }
        that.nervus.emit('failed', url);
    }

};

/**
 * 添加待抓取链接
 * @param {string} new_todo_list 待抓取的url
 */
Spider.prototype.todo = function todo(new_todo_list) {
    if (this.stop_add_todo) {
        return;
    }
    var x = this.todo_list.indexOf(new_todo_list);
    var y = this.done_list.indexOf(new_todo_list);
    var z = this.fail_list.indexOf(new_todo_list);
    //如果这个链接不存在于待抓取列表、抓取成功列表、抓取失败列表，则添加到待抓取列表
    if (x === -1 && y === -1 && z === -1) {
        this.todo_list.push(new_todo_list);
        return true;
    } else {
        console.log('todo:　链接已存在');
    }
    return false;
};

Spider.prototype.todoNow = function todoNow(url) {
    if (this.stop_add_todo) return;
    var x = this.todo_list.indexOf(new_todo_list);
    var y = this.done_list.indexOf(new_todo_list);
    var z = this.fail_list.indexOf(new_todo_list);
    //如果这个链接不存在于待抓取列表、抓取成功列表、抓取失败列表，则添加到待抓取列表
    if (x === -1 && y === -1 && z === -1) {
        this.todo_list.push(new_todo_list);
        return true;
    }
    return false;
};

/**
 * 尝试向Log推送日志内容
 * @param  {object}  info  信息对象，包括url、type、detail、warn属性
 * @param  {Boolean} isErr 是否为错误信息（是则强制推动内容到log
 */
Spider.prototype.pushLog = function pushLog(info, isErr) {
    if (this.opts.log_more || isErr) {
        var news = {
            time: Date(),
            url: info.url,
            type: info.type,
            warn: info.warn,
            detail: info.detail
        };
        this.log.push(news);
    }
};

//爬虫初始化参数检验
Spider.prototype.initCheckout = function initCheckout() {
    var result = true;
    if (typeof this.todo_list !== 'string' && !Array.isArray(this.todo_list)) {
        console.error('初始化参数出错，您没有正确输入链接字符串或链接字符串的数组');
        result = false;
    }
    if (typeof this.callback !== 'function') {
        console.error('初始化参数出错: callback格式不正确');
        result = false;
    }
    return result;
};


Spider.prototype.push = function push(data, destination) {
    if (!destination) {
        destination = 'data'; //如果不指定table，默认推送到data
    }
    if (!this.table[destination]) { //如果目标table不存在，新建它
        this.table[destination] = new Pool(5, destination + '.txt');
    }
    this.table[destination].push(data);
};



/**
 * 资源池生成函数 for log、data_table
 * @param {number} max     最大容量。达到时将触发release函数：清空内容并写入txt
 * @param {strint} save_path 将写入数据的txt路径
 * @param {array} header 表头数组
 */
function Pool(max, save_path, header) {
    this.data = [];
    this.max = max;
    this.file = false;
    this.path = save_path || new Date().getTime() + '.txt';
    this.header = header || false; //表头
}
Pool.prototype.release = function() {
    var d = this.data; //读取并清空数据池
    this.data = [];
    if (d === []) {
        return;
    } //如果无新数据，停止下面操作

    if (!this.header) { //如果没有表头，新建
        this.header = [];
        for (var i in d[0]) {
            this.header.push(i); //将第一个数据对象的所有属性名作为表头关键字
        }
    }

    if (!this.file) { //第一次release？新建写入流，并写入表头
        this.file = fs.createWriteStream(this.path);
        var txt = '';
        for (var i = 0; i < this.header.length; i++) {
            txt += this.header[i] + '\t';
        }
        txt += '\n';
        this.file.write(txt);
    }

    //根据表头将新数据写入本地文本
    var txt = '';
    for (var i = 0; i < d.length; i++) {
        for (var j = 0; j < this.header.length; j++) {
            txt += d[i][this.header[j]] + '\t';
        }
        txt += '\n';
    }
    this.file.write(txt);
};
Pool.prototype.push = function(new_data) {
    if (this.max && this.max <= this.data.length) {
        return false;
    } else {
        this.data.push(new_data);
    }
    if (this.data.length >= this.max) {
        this.release();
    }
};
Pool.prototype.pop = function() {
    var d = this.data[0];
    this.data.shift();
    return d;
};

module.exports = Spider;
