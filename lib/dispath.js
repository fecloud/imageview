/**
 * Created with JetBrains WebStorm.
 * User: ouyangfeng
 * Date: 7/15/14
 * Time: 22:37
 * To change this template use File | Settings | File Templates.
 */
var fs = require('fs');

var util = require('./util.js');
var log = require('./log.js');
var imageview = require('./imageview.js');

var route = {};

route.imageview = function (req, res, params) {

    imageview.imageview(req, res, params);

};

exports.route = route;

var root = process.argv[3];
var dest = process.argv[4];

if (root) {
    log.w("root:" + root);
    fs.exists(root, function (exists) {
        if (!exists) {
            log.w("root:" + root + "not exists");
            process.exit(1);
        }
    });
} else {
    log.e("not setting root ,please set !");
}

if (dest) {
    log.w("dest:" + dest);
    fs.exists(dest, function (exists) {
        if (!exists) {
            log.w("dest:" + dest + "not exists");
            process.exit(1);
        }
    });
} else {
    log.e("not setting dest ,please set !");
    process.exit(1);
}