/**
 * Created by ouyangfeng on 10/18/15.
 */

var fs = require('fs')
    , gm = require('gm');
var os = require('os');
var exec = require('child_process').exec,
    child;


var log = require('./log.js');
var util = require('./util.js');
var err_const = require('./error.js');

var root = process.argv[3];
var dest = process.argv[4];

var runing = 0;

var MAX_TASK = os.cpus().length * 4;

function add_task(path) {
    runing += 1;
}

function remove_task(path) {
    runing -= 1;
}

/**
 * 返回文件到http
 * @param req
 * @param res
 * @param image
 * @param etag
 */
function res_file(req, res, image, etag) {

    fs.lstat(image, function (err, stats) {
        if (err) {
            util.result_client(req, res, err_const.err_500);
        } else {
            var if_none_match;
            var if_modified_since;

            if (req.headers['if-none-match']) {
                if_none_match = req.headers['if-none-match'];
            }
            if (req.headers['if-modified-since']) {
                if_modified_since = req.headers['if-modified-since'];
            }

            //304
            if (etag === if_none_match && if_modified_since === stats.mtime.toGMTString()) {
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('ETag', etag);
                res.setHeader("Last-Modified", stats.mtime.toGMTString());
                res.setHeader("Cache-Control", "public, max-age=60");
                res.statusCode = 304;
                res.statusMessage = "Not Modified";
                res.end();

            } else {
                fs.readFile(image, function (err, data) {
                    //返回目标文件
                    res.setHeader('Content-Type', 'image/jpeg');
                    res.setHeader('ETag', etag);
                    res.setHeader("Last-Modified", stats.mtime.toGMTString());
                    res.setHeader("Cache-Control", "public, max-age=60");
                    res.write(data);
                    res.end();
                });
            }
        }
    });
}

/**
 * 调用gm缩放图片
 * @param req
 * @param res
 * @param params
 * @param image_src
 * @param image_dest
 */
function scale_image(req, res, params, src, dest, etag) {

    var width = params.width;
    var height = params.height;

    if (MAX_TASK > runing) {
        add_task(src);

        //调用gm缩放图片
        gm(src)
            .resize(width, height)
            .noProfile()
            .autoOrient()
            .write(dest, function (err) {

                remove_task(src);
                if (err) {
                    util.result_client(req, res, err_const.err_500);
                } else {
                    res_file(req, res, dest, etag);
                }
            });


    } else {
        console.log("system busy");
        res.statusCode = 508;
        res.statusMessage = "system busy";
        res.end();
    }
}

function scale_video(req, res, params, src, dest, etag) {

    var width = params.width;
    var height = params.height;

    if (MAX_TASK > runing) {
        add_task(src);

        //调用ffmpeg
        child = exec("ffprobe -v quiet -print_format json -show_format \"" + src + "\"",
            function (error, stdout, stderr) {

                if (error !== null) {
                    log.e("ffprobe fail");
                    util.result_client(req, res, err_const.err_500);
                } else {
                    var json = JSON.parse(stdout);
                    if (json && json.format && json.format.duration) {

                        var long_time = parseInt(json.format.duration);

                        var start = util.format_hms(long_time / 2);

                        var cmd = "ffmpeg -y  -ss \"" + start + "\" -i \"" + src + "\" -s " + width + "*" + height + " -f image2 \"" + dest + "\"";

                        //log.d("cmd:" + cmd);
                        child = exec(cmd, function (error, stdout, stderr) {

                            remove_task(src);
                            res_file(req, res, dest, etag);
                        });
                    } else {
                        remove_task(src);
                        util.result_client(req, res, err_const.err_500);
                    }
                }
            });


    } else {
        console.log("system busy");
        res.statusCode = 508;
        res.statusMessage = "system busy";
        res.end();
    }

}

function imageview(req, res, params) {

    if (params.value && params.width && params.height) {
        var src = root + params.value;

        //是图片或者视频
        if (util.is_pic(src) || util.is_video(src)) {

            var width = params.width;
            var height = params.height;

            if (width == 0 || height == 0) {
                util.result_client(req, res, err_const.err_400);
            } else {

                fs.stat(src, function (err, stats) {
                    if (err) {
                        //src图片不存在
                        log.e("imageview src:" + src + " not found");
                        util.result_client(req, res, err_const.err_404);
                    } else {
                        //etag
                        var identy = params.value + ":" + width + ":" + height + ":" + stats.size;
                        var etag = util.md5(identy);

                        var dest_target = dest + "/" + etag + ".jpg";

                        //log.d("dest_target:" + dest_target);

                        //查看目标文件是否存在
                        fs.access(dest_target, fs.F_OK, function (err) {
                            if (err) {
                                //目标文件不存在,调用程序
                                if (util.is_pic(src)) {
                                    scale_image(req, res, params, src, dest_target, etag);
                                } else {
                                    scale_video(req, res, params, src, dest_target, etag);
                                }

                            } else {
                                res_file(req, res, dest_target, etag);
                            }
                        });

                    }
                });

            }
        } else {
            util.result_client(req, res, err_const.err_415);
        }
    }
    else {
        util.result_client(req, res, err_const.err_400);
    }
}

exports.imageview = imageview;