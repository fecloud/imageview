/**
 * Created by ouyangfeng on 10/18/15.
 */

var fs = require('fs')
    , gm = require('gm');
var os = require('os');


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

            if (req.headers['if-none-match']) {
                if_none_match = req.headers['if-none-match'];
            }
            //304
            if (etag === if_none_match) {
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
function scale_image(req, res, params, image_src, image_dest, etag) {

    var width = params.width;
    var height = params.height;

    if (MAX_TASK > runing) {
        add_task(image_src);
        gm(image_src)
            .resize(width, height)
            .noProfile()
            .write(image_dest, function (err) {

                remove_task(image_src);
                if (err) {
                    util.result_client(req, res, err_const.err_500);
                } else {
                    res_file(req, res, image_dest, etag);
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
        var image_src = root + params.value;
        var width = params.width;
        var height = params.height;

        if (width == 0 || height == 0) {
            util.result_client(req, res, err_const.err_400);
        } else {
            //log.d("imageview src:" + image_src);
            fs.stat(image_src, function (err, stats) {
                if (err) {
                    //src图片不存在
                    log.e("imageview src:" + image_src + " not found");
                    util.result_client(req, res, err_const.err_404);
                } else {
                    //etag
                    var identy = params.value + ":" + width + ":" + height + ":" + stats.size;
                    var etag = util.md5(identy);

                    var image_dest = dest + "/" + etag;

                    //查看目标文件是否存在
                    fs.access(image_dest, fs.F_OK, function (err) {
                        if (err) {
                            //目标文件不存在,调用gm
                            scale_image(req, res, params, image_src, image_dest, etag);
                        } else {
                            res_file(req, res, image_dest, etag);
                        }
                    });

                }
            });

        }

    }
    else {
        util.result_client(req, res, err_const.err_400);
    }
}

exports.imageview = imageview;