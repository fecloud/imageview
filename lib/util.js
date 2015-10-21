/**
 * Created by ouyangfeng on 10/17/15.
 */
var crypto = require('crypto');


Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(),    //day
        "h+": this.getHours(),   //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};

/**
 * 格式化时间
 * @returns {*}
 */
function format_time() {

    return new Date().format("yyyy-MM-dd hh:mm:ss.S");
}

exports.format_time = format_time;

/**
 * 向客户端回复json
 * @param req
 * @param res
 * @param result
 */
function result_client(req, res, result) {

    res.setHeader('Content-Type', 'application/json;charset=UTF-8');
    res.write(JSON.stringify(result));
    res.end();

}

exports.result_client = result_client;

/**
 * md5加密
 * @param string
 * @returns {*}
 */
function md5(string) {

    var md5 = crypto.createHash('md5');
    md5.update(string);
    return md5.digest('hex');

}

exports.md5 = md5;

/**
 * 根据后缀判断是否是图片
 * @param file
 * @returns {boolean}
 */
function is_pic(file) {

    if (file) {

        var last = file.lastIndexOf('.');
        var fix = file.substring(last + 1);
        fix = fix.toLowerCase();
        if (fix == 'jpg' || fix == 'png' || fix == 'bmp' || fix == 'jpeg') {
            return true;
        }
    }

    return false;

}

exports.is_pic = is_pic;

/**
 * 根据后缀判断是否是视频
 * @param file
 */
function is_video(file) {

    if (file) {

        var last = file.lastIndexOf('.');
        var fix = file.substring(last + 1);
        fix = fix.toLowerCase();
        if (fix == 'mov' || fix == 'h264' || fix == 'mp4' || fix == '3gp' || fix == "mkv") {
            return true;
        }
    }
    return false;

}

exports.is_video = is_video;

function format_hms(longtime) {
    var h = 0;
    var m = 0;
    var s = 0;
    var yu = 0;

    h = parseInt(longtime / 3600);
    yu = longtime % 3600;

    m = parseInt(yu / 60);
    yu = yu % 60;
    s = yu;

    var format = "";

    if (h > 9){
        format +=h;
    } else{
        format +="0"
        format +=h;
    }

    format +=":"

    if (m > 9){
        format +=m;
    } else{
        format +="0"
        format +=m;
    }

    format +=":";

    if (s > 9){
        format +=s;
    } else{
        format +="0"
        format +=s;
    }
    return format;
}

exports.format_hms = format_hms;