"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var PostJumper = {
    init: function () {
        if (!globals_1.Conf['Unique ID and Capcode Navigation'] || !['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        this.buttons = this.makeButtons();
        icon_1.default.set(this.buttons.firstChild, 'arrowUpLong');
        icon_1.default.set(this.buttons.lastChild, 'arrowDownLong');
        return Callbacks_1.default.Post.push({
            name: 'Post Jumper',
            cb: this.node
        });
    },
    node: function () {
        if (this.isClone) {
            for (var _i = 0, _a = (0, __1.default)('.postJumper', this.nodes.info); _i < _a.length; _i++) {
                var buttons = _a[_i];
                PostJumper.addListeners(buttons);
            }
            return;
        }
        if (this.nodes.uniqueIDRoot) {
            PostJumper.addButtons(this, 'uniqueID');
        }
        if (this.nodes.capcode) {
            return PostJumper.addButtons(this, 'capcode');
        }
    },
    addButtons: function (post, type) {
        var value = post.info[type];
        var buttons = PostJumper.buttons.cloneNode(true);
        _1.default.extend(buttons.dataset, { type: type, value: value });
        _1.default.after(post.nodes[type + (type === 'capcode' ? '' : 'Root')], buttons);
        return PostJumper.addListeners(buttons);
    },
    addListeners: function (buttons) {
        _1.default.on(buttons.firstChild, 'click', PostJumper.buttonClick);
        return _1.default.on(buttons.lastChild, 'click', PostJumper.buttonClick);
    },
    buttonClick: function () {
        var toJumper;
        var dir = _1.default.hasClass(this, 'prev') ? -1 : 1;
        if (toJumper = PostJumper.find(this.parentNode, dir)) {
            return PostJumper.scroll(this.parentNode, toJumper);
        }
    },
    find: function (jumper, dir) {
        var _a = jumper.dataset, type = _a.type, value = _a.value;
        var xpath = "span[contains(@class,\"postJumper\") and @data-value=\"".concat(value, "\" and @data-type=\"").concat(type, "\"]");
        var axis = dir < 0 ? 'preceding' : 'following';
        var jumper2 = jumper;
        while (jumper2 = _1.default.x("".concat(axis, "::").concat(xpath), jumper2)) {
            if (jumper2.getBoundingClientRect().height) {
                return jumper2;
            }
        }
        if (jumper2 = _1.default.x("(//".concat(xpath, ")[").concat(dir < 0 ? 'last()' : '1', "]"))) {
            if (jumper2.getBoundingClientRect().height) {
                return jumper2;
            }
        }
        while ((jumper2 = _1.default.x("".concat(axis, "::").concat(xpath), jumper2)) && (jumper2 !== jumper)) {
            if (jumper2.getBoundingClientRect().height) {
                return jumper2;
            }
        }
        return null;
    },
    makeButtons: function () {
        var charPrev = '\u23EB';
        var charNext = '\u23EC';
        var classPrev = 'prev';
        var classNext = 'next';
        var span = _1.default.el('span', { className: 'postJumper' });
        _1.default.extend(span, { innerHTML: "<a href=\"javascript:;\" class=\"" + (0, globals_1.E)(classPrev) + "\">" + (0, globals_1.E)(charPrev) + "</a><a href=\"javascript:;\" class=\"" + (0, globals_1.E)(classNext) + "\">" + (0, globals_1.E)(charNext) + "</a>" });
        return span;
    },
    scroll: function (fromJumper, toJumper) {
        var prevPos = fromJumper.getBoundingClientRect().top;
        var destPos = toJumper.getBoundingClientRect().top;
        return window.scrollBy(0, destPos - prevPos);
    }
};
exports.default = PostJumper;
