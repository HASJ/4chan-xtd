"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var MarkNewIPs = {
    init: function () {
        if ((globals_1.g.SITE.software !== 'yotsuba') || (globals_1.g.VIEW !== 'thread') || !globals_1.Conf['Mark New IPs']) {
            return;
        }
        return Callbacks_1.default.Thread.push({
            name: 'Mark New IPs',
            cb: this.node
        });
    },
    node: function () {
        MarkNewIPs.ipCount = this.ipCount;
        MarkNewIPs.postCount = this.posts.keys.length;
        return _1.default.on(globals_1.d, 'ThreadUpdate', MarkNewIPs.onUpdate);
    },
    onUpdate: function (e) {
        var fullID;
        var _a = e.detail, ipCount = _a.ipCount, postCount = _a.postCount, newPosts = _a.newPosts, deletedPosts = _a.deletedPosts;
        if (ipCount == null) {
            return;
        }
        switch (ipCount - MarkNewIPs.ipCount) {
            case (postCount - MarkNewIPs.postCount) + deletedPosts.length:
                var i = MarkNewIPs.ipCount;
                for (var _i = 0, newPosts_1 = newPosts; _i < newPosts_1.length; _i++) {
                    fullID = newPosts_1[_i];
                    MarkNewIPs.markNew(globals_1.g.posts.get(fullID), ++i);
                }
                break;
            case -deletedPosts.length:
                for (var _b = 0, newPosts_2 = newPosts; _b < newPosts_2.length; _b++) {
                    fullID = newPosts_2[_b];
                    MarkNewIPs.markOld(globals_1.g.posts.get(fullID));
                }
                break;
        }
        MarkNewIPs.ipCount = ipCount;
        return MarkNewIPs.postCount = postCount;
    },
    markNew: function (post, ipCount) {
        var suffix = ((Math.floor(ipCount / 10)) % 10) === 1 ?
            'th'
            :
                ['st', 'nd', 'rd'][(ipCount % 10) - 1] || 'th'; // fuck switches
        var counter = _1.default.el('span', {
            className: 'ip-counter',
            textContent: "(".concat(ipCount, ")")
        });
        post.nodes.nameBlock.title = "This is the ".concat(ipCount).concat(suffix, " IP in the thread.");
        _1.default.add(post.nodes.nameBlock, [_1.default.tn(' '), counter]);
        return _1.default.addClass(post.nodes.root, 'new-ip');
    },
    markOld: function (post) {
        post.nodes.nameBlock.title = 'Not the first post from this IP.';
        return _1.default.addClass(post.nodes.root, 'old-ip');
    }
};
exports.default = MarkNewIPs;
