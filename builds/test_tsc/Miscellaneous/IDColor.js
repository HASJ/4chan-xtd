"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var IDColor = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Color User IDs']) {
            return;
        }
        this.ids = (0, helpers_1.dict)();
        this.ids['Heaven'] = [0, 0, 0, '#fff'];
        return Callbacks_1.default.Post.push({
            name: 'Color User IDs',
            cb: this.node
        });
    },
    node: function () {
        var span, uid;
        if (this.isClone || !((uid = this.info.uniqueID) && (span = this.nodes.uniqueID))) {
            return;
        }
        var rgb = IDColor.ids[uid] || IDColor.compute(uid);
        // Style the damn node.
        var style = span.style;
        style.color = rgb[3];
        style.backgroundColor = "rgb(".concat(rgb[0], ",").concat(rgb[1], ",").concat(rgb[2], ")");
        return _1.default.addClass(span, 'painted');
    },
    compute: function (uid) {
        // Convert chars to integers, bitshift and math to create a larger integer
        // Create a nice string of binary
        var hash = globals_1.g.SITE.uidColor ? globals_1.g.SITE.uidColor(uid) : parseInt(uid, 16);
        // Convert binary string to numerical values with bitshift and '&' truncation.
        var rgb = [
            (hash >> 16) & 0xFF,
            (hash >> 8) & 0xFF,
            hash & 0xFF
        ];
        // Weight color luminance values, assign a font color that should be readable. 
        rgb.push(_1.default.luma(rgb) > 125 ?
            '#000'
            :
                '#fff');
        // Cache.
        return this.ids[uid] = rgb;
    }
};
exports.default = IDColor;
