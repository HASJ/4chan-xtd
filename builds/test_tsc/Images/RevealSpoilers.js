"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var RevealSpoilers = {
    init: function () {
        if (!['index', 'thread', 'archive'].includes(globals_1.g.VIEW) || !globals_1.Conf['Reveal Spoiler Thumbnails']) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'Reveal Spoiler Thumbnails',
            cb: this.node
        });
    },
    node: function () {
        if (this.isClone) {
            return;
        }
        for (var _i = 0, _a = this.files; _i < _a.length; _i++) {
            var file = _a[_i];
            if (file.thumb && file.isSpoiler) {
                var thumb = file.thumb;
                // Remove old width and height.
                thumb.removeAttribute('style');
                // Enforce thumbnail size if thumbnail is replaced.
                thumb.style.maxHeight = (thumb.style.maxWidth = this.isReply ? '125px' : '250px');
                if (thumb.src) {
                    thumb.src = file.thumbURL;
                }
                else {
                    thumb.dataset.src = file.thumbURL;
                }
            }
        }
    }
};
exports.default = RevealSpoilers;
