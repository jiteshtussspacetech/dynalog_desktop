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
    responder = require('../../libs/responder'),
    ipcMain = require('electron').ipcMain;

module.exports = {
    get: get,
    put: put
};

async function get(req, res, next) {
    mongoose.models.Option.findOne({
        isDeleted: false,
        field: 'config'
    }).exec(function(err, item) {
        if(err) {
            return responder.handleInternalError(res, err, next);
        } else if(!item) {
            const item = new mongoose.models.Option({
                isDeleted: false,
                field: 'config',
                data: {
                    dateFormat: 'medium',
                    deviceId: 5,
                    addressLength: 1,
                    device: {
                        host: '',
                        port: 0,
                        interval: 60
                    },
                    registers: []
                }
            });
            item.save(function(err) {
                if(err) {
                    return responder.handleInternalError(res, err, next);
                } else {
                    return responder.success(res, {
                        item: item.data
                    });
                }
            });
        } else {
            return responder.success(res, {
                item: item.data
            });
        }
    });
}

async function put(req, res, next) {
    var update = {};
    update['data.dateFormat'] = req.body.dateFormat;
    update['data.deviceId'] = req.body.deviceId;
    update['data.addressLength'] = req.body.addressLength;
    update['data.device'] = req.body.device;
    update['data.registers'] = req.body.registers;

    mongoose.models.Option.findOneAndUpdate({
        isDeleted: false,
        field: 'config'
    }, {
        $set: update
    }, {
        upsert: true,
        new: true
    }).exec(function(err, item) {
        if(err) {
            return responder.handleInternalError(res, err, next);
        } else {
            ipcMain.emit('updateConfig', JSON.stringify(item));
            ipcMain.emit('restartModbus', true);
            return responder.success(res, {});
        }
    });
}