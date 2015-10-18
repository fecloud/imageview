/**
 * Created by ouyangfeng on 10/18/15.
 */

var fs = require('fs')
    , gm = require('gm');


var log = require('./log.js');
var util = require('./util.js');
var err_const = require('./error.js');

var root = process.argv[3];
var dest = process.argv[4];

var Task = function () {
    this.src;
    this.width;
    this.height;
};

var wait_tasks = new Array();

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

    if (wait_tasks.length == 0) {
        gm(image_src)
            .resize(width, height)
            .noProfile()
            .write(image_dest, function (err) {
                if (err) {
                    util.result_client(req, res, err_const.err_500);
                } else {
                    //查看目标文件是否存在
                    fs.readFile(image_dest, function (err, data) {
                        //返回目标文件
                        res.setHeader('Content-Type', 'image/jpeg');
                        res.setHeader('ETag', etag);
                        res.write(data);
                        res.end();
                    });
                }
            });
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
            log.d("imageview src:" + image_src);

            fs.stat(image_src, function (err, stats) {
                if (err) {
                    //src图片不存在
                    log.e("imageview src:" + image_src + " not found");
                    util.result_client(req, res, err_const.err_404);
                } else {
                    //etag
                    var identy = params.value + ":" + width + ":" + height + ":" + stats.size;
                    identy = util.md5(identy);

                    var image_dest = dest + "/" + identy;
                    log.d("image_dest:" + image_dest);

                    //查看目标文件是否存在
                    fs.readFile(image_dest, function (err, data) {
                        if (err) {
                            //目标文件不存在,调用gm
                            scale_image(req, res, params, image_src, image_dest, identy);
                        } else {
                            //返回目标文件
                            res.setHeader('Content-Type', 'image/jpeg');
                            res.setHeader('ETag', identy);
                            res.write(data);
                            res.end();
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