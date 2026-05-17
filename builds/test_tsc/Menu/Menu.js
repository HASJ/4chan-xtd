"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var icon_1 = require("../Icons/icon");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Menu = {
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu']) {
            return;
        }
        this.button = _1.default.el('a', {
            className: 'menu-button',
            href: 'javascript:;'
        });
        icon_1.default.set(this.button, 'caretDown');
        this.menu = new UI_1.default.Menu('post');
        Callbacks_1.default.Post.push({
            name: 'Menu',
            cb: this.node
        });
        return Callbacks_1.default.CatalogThread.push({
            name: 'Menu',
            cb: this.catalogNode
        });
    },
    node: function () {
        if (this.isClone) {
            var button = (0, _1.default)('.menu-button', this.nodes.info);
            _1.default.rmClass(button, 'active');
            _1.default.rm((0, _1.default)('.dialog', this.nodes.info));
            Menu.makeButton(this, button);
            return;
        }
        return _1.default.add(this.nodes.info, Menu.makeButton(this));
    },
    catalogNode: function () {
        return _1.default.after(this.nodes.icons, Menu.makeButton(this.thread.OP));
    },
    makeButton: function (post, button) {
        if (!button) {
            button = Menu.button.cloneNode(true);
        }
        _1.default.on(button, 'click', function (e) {
            return Menu.menu.toggle(e, this, post);
        });
        return button;
    }
};
exports.default = Menu;
