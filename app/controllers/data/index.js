/**
 * Copyright (C) 2020 RyDOT Infotech Pvt. Ltd - All Rights Reserved
 *
 * CONFIDENTIAL
 *
 * All information contained herein is, and remains the property of RyDOT Infotech Pvt. Ltd and its partners,
 * if any. The intellectual and technical concepts contained herein are proprietary to RyDOT Infotech Pvt. Ltd and its
 * partners and may be covered by their and Foreign Patents, patents in process, and are protected by trade secret or
 * copyright law. Dissemination of this information or reproduction of this material is strictly forbidden unless
 * prior written permission is obtained from RyDOT Infotech Pvt. Ltd.
**/
var mongoose = require('mongoose'),
    responder = require('../../libs/responder');

module.exports = {
    get: get,
    download: download
};

async function get(req, res, next) {
    var limit = parseInt(req.body.limit) || 10;
    var skip = parseInt(req.body.skip) || 0;
    var startDate = req.body.fromDate || '';
    var endDate = req.body.toDate || '';

    var where = {
        isDeleted: false,
        data: {
            $exists: true
        },
        createdAt: {}
    };

    try {
        var start = new Date(startDate);
        var end = new Date(endDate);

        if(start instanceof Date && !isNaN(start))
            where.createdAt.$gte = start;
        
        if(end instanceof Date && !isNaN(end))
            where.createdAt.$lte = end;
    } catch(ex) {}

    if(Object.keys(where.createdAt).length === 0) {
        delete where.createdAt;
    }

    console.log(where)

    mongoose.models.Log.count(where).exec(function (err, c) {

        if(err) {
            return handleInternalError(res, err, next);
        } else if(c === 0) {
            return responder.success(res, {
                list: [],
                count: 0
            });
        } else {

            mongoose.models.Log.find(where).sort({createdAt: -1}).limit(limit).skip(skip).exec(function (err, items) {

                if(err) {
                    return handleInternalError(res, err, next);
                } else {
                    return responder.success(res, {
                        list: items,
                        count: c
                    });
                }
            });
        }
    });
}

async function download(req, res, next) {
    var startDate = req.body.fromDate || '';
    var endDate = req.body.toDate || '';
    var keys = req.body.keys || [];
    var tzOffset = (-1) * parseInt(req.headers['x-time-zone']) * 60000;

    var where = {
        isDeleted: false,
        data: {
            $exists: true
        },
        createdAt: {}
    };

    try {
        var start = new Date(startDate);
        var end = new Date(endDate);

        if(start instanceof Date && !isNaN(start))
            where.createdAt.$gte = start;
        
        if(end instanceof Date && !isNaN(end))
            where.createdAt.$lte = end;
    } catch(ex) {}

    if(Object.keys(where.createdAt).length === 0) {
        delete where.createdAt;
    }

    mongoose.models.Log.find(where).sort({createdAt: -1}).exec(function (err, items) {

        if(err) {
            return handleInternalError(res, err, next);
        } else {
            var text = ``;//`createdAt,${keys.join(',')}`;
            items.forEach(function(item) {
                text += `\n${new Date(item.createdAt.getTime() + tzOffset).toISOString().substring(0, 19).replace('T', ' ')},` + keys.map(function(key) {
                    return item.data[key] || '';
                }).join(',');
            });
            return responder.success(res, {
                text: text
            })
        }
    });
}