"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Header_1 = require("../General/Header");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var FappeTyme = {
    init: function () {
        if ((!globals_1.Conf['Fappe Tyme'] && !globals_1.Conf['Werk Tyme']) || !['index', 'thread', 'archive'].includes(globals_1.g.VIEW)) {
            return;
        }
        this.nodes = {};
        this.enabled = {
            fappe: false,
            werk: globals_1.Conf['werk']
        };
        for (var _i = 0, _a = ["Fappe", "Werk"]; _i < _a.length; _i++) {
            var type = _a[_i];
            if (globals_1.Conf["".concat(type, " Tyme")]) {
                var lc = type.toLowerCase();
                var el = UI_1.default.checkbox(lc, "".concat(type, " Tyme"), false);
                el.title = "".concat(type, " Tyme");
                this.nodes[lc] = el.firstElementChild;
                if (globals_1.Conf[lc]) {
                    this.set(lc, true);
                }
                _1.default.on(this.nodes[lc], 'change', this.toggle.bind(this, lc));
                Header_1.default.menu.addEntry({
                    el: el,
                    order: 97
                });
                var indicator = _1.default.el('span', {
                    className: 'indicator',
                    textContent: type[0],
                    title: "".concat(type, " Tyme active")
                });
                _1.default.on(indicator, 'click', function () {
                    var check = _1.default.getOwn(FappeTyme.nodes, this.parentNode.id.replace('shortcut-', ''));
                    check.checked = !check.checked;
                    return _1.default.event('change', null, check);
                });
                Header_1.default.addShortcut(lc, indicator, 410);
            }
        }
        if (globals_1.Conf['Werk Tyme']) {
            _1.default.sync('werk', this.set.bind(this, 'werk'));
        }
        Callbacks_1.default.Post.push({
            name: 'Fappe Tyme',
            cb: this.node
        });
        return Callbacks_1.default.CatalogThread.push({
            name: 'Werk Tyme',
            cb: this.catalogNode
        });
    },
    node: function () {
        return this.nodes.root.classList.toggle('noFile', !this.files.length);
    },
    catalogNode: function () {
        var file = this.thread.OP.files[0];
        if (!file) {
            return;
        }
        var filename = _1.default.el('div', {
            textContent: file.name,
            className: 'werkTyme-filename'
        });
        return _1.default.add(this.nodes.thumb.parentNode, filename);
    },
    set: function (type, enabled) {
        this.enabled[type] = (this.nodes[type].checked = enabled);
        return _1.default["".concat(enabled ? 'add' : 'rm', "Class")](globals_1.doc, "".concat(type, "Tyme"));
    },
    toggle: function (type) {
        this.set(type, !this.enabled[type]);
        if (type === 'werk') {
            return _1.default.cb.checked.call(this.nodes[type]);
        }
    }
};
exports.default = FappeTyme;
