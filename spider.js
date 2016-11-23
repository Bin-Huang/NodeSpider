var EventEmitter = require('events');
var iconv = require('iconv-lite');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

//如果你想自定义默认设置，修改这里
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

var global_value = {
    conn_num: 0, //当前连接数
    pointer: 0 //当前todo_list中未爬取链接位置（指针）
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

    // var that = this;

}

//事件监听初始化、各参数、选项检验、启动工作
Spider.prototype.start = function start() {
    var that = this;

    //参数初始化检测，错误则全面停止爬取工作
    var init_result = this.initCheckout();
    if (!init_result) {
        return;
    }

    if (this.opts.debug === false) {

    }

    //火力全开，启动爬取

    this.crawl();
};


Spider.prototype.finish = function finish() {
    console.log('finish');
    for (var i in this.table) {
        this.table[i].release(); //将数据池中还来不及保存的内容保存到本地
    }
};
Spider.prototype.next = function next() {
    // if (global_value.conn_num < this.opts.max_connection) {
    //     if (this.todo_list.length <= global_value.pointer) {
    //         if (global_value.conn_num === 0) {
    //             if (this.opts.retries > 0 && this.fail_list.length > 0) {
    //                 this.todo_list = this.fail_list;
    //                 global_value.pointer = 0;
    //                 this.fail_list = [];
    //                 this.opts.retries--;
    //             } else { //如果剩余重试次数等于0，爬取工作进入最后整理阶段
    //                 this.finish();
    //                 return true;
    //             }
    //         } else {
    //             return; //当conn_num不等于0，说明todo_list可能只是暂时没有新链接（新链接可能在抓回来的路上），直接返回并无视此次next请求
    //         }
    //     } else {
    //         this.crawl();
    //     }
    // }

    //如果当前连接数达到最大连接数，无视此次next请求
    if (global_value.conn_num >= this.opts.max_connection) {
        return; 
    }

    //如果todo_list存在新链接则爬取
    if (this.todo_list.length > global_value.pointer) {
        this.crawl();
    } else {
        //当todo_list不存在新链接
        
        //如果当前连接数不为0，新的链接可能正在爬取回来的路上。直接无视此次next请求
        if (global_value.conn_num !== 0) {
            return; 
        }

        //如果当前连接数为0，判断当前剩余重试数与失败链接清单
        if (this.opts.retries > 0 && this.fail_list.length > 0) {
            //开始重爬失败链接
            this.todo_list = this.fail_list;
            global_value.pointer = 0;
            this.fail_list = [];
            this.opts.retries--;
            this.crawl();
        } else { //如果剩余重试次数等于0，爬取工作停止，进入最后的整理阶段
            this.finish();
            return true;
        }
    }
};

Spider.prototype.crawl = function crawl() {
    var that = this;
    var url = that.todo_list[global_value.pointer];
    global_value.pointer++;
    global_value.conn_num++;

    var err = {};
    request({
        url: url,
        method: 'GET',
        encoding: null
    }, function(err, res, body) {
        //如果请求失败，进行错误处理并停止对该链接的抓取工作
        if (err) {
            err = {
                type: 'HTTP_Request_Err',
                url: url,
                detail: err,
                suggest: '访问失败，请检查链接与目标站点访问情况'
            };
            whenErr(err);
            return;
        }

        //根据opts设置，对爬取body进行转码（转为utf-8）
        if (that.opts.decode) {
            body = iconv.decode(body, that.opts.decode);
        }

        var result = {
            err: err,
            body: body,
            res: res,
            url: url
        };
        //尝试执行用户脚本，如果失败进行错误处理并停止对该链接的抓取工作
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
                suggest: '爬取失败，请检查callback函数与返回正文'
            };
            whenErr(err);
            return;
        }

        //能运行到这里，没有经历报错并return，说明执行成功
        showProgress(url);
        global_value.conn_num--;
        that.done_list.push(url);
        that.next();
    });

    this.next(); //进行多进程抓取

    /**
     * 错误处理函数。根据是否为debug模式，调整错误处理的方式
     * @param  {object} err 错误信息对象，要求包括type、url、detail、suggest等属性
     * @return {}     无
     */
    function whenErr(err) {
        if (that.opts.debug) { //如果是debug模式，报错并退出抓取
            console.log('\n=============ERROR===============\n\n' + '[Type]: ' + err.type + '\n\n[Url]: ' + err.url + '\n\n' + '[Suggest]: ' + err.suggest + '\n\n' + '[Detail]: ' + err.detail + '\n');
            console.log('停止爬取');
        } else { //如果不是debug模式，将错误推送Log并继续抓取
            that.fail_list.push(url);
            that.pushLog(err, true);
        }
        showProgress(url);
        global_value.conn_num--;
        that.fail_list.push(url);
        that.next();
    }

    function showProgress(url) {
        var all = that.todo_list.length; //总进度（不包括重爬）
        var done = global_value.pointer; //已完成进度
        var suc = that.done_list.length; //成功链接数
        var fail = that.fail_list.length; //失败链接数
        var retry = that.opts.retries; //当前剩下的重爬次数
        var conn = global_value.conn_num; //当前连接数
        console.log('Progress: [' + done + '/' + all + '],  suc/fail: [' + suc + '/' + fail + '],  retries: ' + retry + ',  conn: [' + conn + ']  url:' + url);
    }

};

/**
 * 添加待抓取链接
 * @param {string} new_todo 待抓取的url
 */
Spider.prototype.todo = function todo(new_todo) {
    if (this.stop_add_todo) {
        return;
    }
    //如果链接不重复（不存在与todo_list）
    if (this.todo_list.indexOf(new_todo) === -1) {
        this.todo_list.push(new_todo);
        return true;
    } else {
        if (this.opts.debug) {
            console.log('todo:　链接已存在');
        }
    }
    return false;
};

// Spider.prototype.todoNow = function todoNow(url) {
//     if (this.stop_add_todo) return;
//     //如果链接不重复（不存在与todo_list）
//     if (this.todo_list.indexOf(new_todo_list) === -1) {
//         this.todo_list.push(new_todo_list);
//         return true;
//     }
//     return false;
// };

/**
 * 尝试向Log推送日志内容
 * @param  {object}  info  信息对象，包括url、type、detail、suggest属性
 * @param  {Boolean} isErr 是否为错误信息（是则强制推动内容到log
 */
Spider.prototype.pushLog = function pushLog(info, isErr) {
    if (this.opts.log_more || isErr) {
        var news = {
            time: Date(),
            url: info.url,
            type: info.type,
            suggest: info.suggest,
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

    var i;
    if (!this.header) { //如果没有表头，新建
        this.header = [];
        for (i in d[0]) {
            this.header.push(i); //将第一个数据对象的所有属性名作为表头关键字
        }
    }

    var txt = '';
    if (!this.file) { //第一次release？新建写入流，并写入表头
        this.file = fs.createWriteStream(this.path);
        txt = '';
        for (i = 0; i < this.header.length; i++) {
            txt += this.header[i] + '\t';
        }
        txt += '\n';
        this.file.write(txt);
    }

    //根据表头将新数据写入本地文本
    txt = '';
    for (i = 0; i < d.length; i++) {
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
