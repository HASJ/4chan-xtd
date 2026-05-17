"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var PostRedirect = {
    init: function () {
        var _this = this;
        return _1.default.on(globals_1.d, 'QRPostSuccessful', function (e) {
            if (!e.detail.redirect) {
                return;
            }
            _this.event = e;
            _this.delays = 0;
            return _1.default.queueTask(function () {
                if ((e === _this.event) && (_this.delays === 0)) {
                    return location.href = e.detail.redirect;
                }
            });
        });
    },
    delays: 0,
    delay: function () {
        var _this = this;
        if (!this.event) {
            return null;
        }
        var e = this.event;
        this.delays++;
        return function () {
            if (e !== _this.event) {
                return;
            }
            _this.delays--;
            if (_this.delays === 0) {
                return location.href = e.detail.redirect;
            }
        };
    }
};
exports.default = PostRedirect;
