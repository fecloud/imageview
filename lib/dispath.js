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