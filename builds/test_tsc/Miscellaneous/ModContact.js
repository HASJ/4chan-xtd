"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var _1 = require("../platform/$");
var Callbacks_1 = require("../classes/Callbacks");
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ModContact = {
    init: function () {
        if ((globals_1.g.SITE.software !== 'yotsuba') || !['index', 'thread'].includes(globals_1.g.VIEW)) {
            return;
        }
        return Callbacks_1.default.Post.push({
            name: 'Mod Contact Links',
            cb: this.node
        });
    },
    node: function () {
        var moved;
        if (this.isClone || !_1.default.hasOwn(ModContact.specific, this.info.capcode)) {
            return;
        }
        var links = _1.default.el('span', { className: 'contact-links brackets-wrap' });
        _1.default.extend(links, ModContact.template(this.info.capcode));
        _1.default.after(this.nodes.capcode, links);
        if ((moved = this.info.comment.match(/This thread was moved to >>>\/(\w+)\//)) && _1.default.hasOwn(ModContact.moveNote, moved[1])) {
            var moveNote = _1.default.el('div', { className: 'move-note' });
            _1.default.extend(moveNote, ModContact.moveNote[moved[1]]);
            return _1.default.add(this.nodes.post, moveNote);
        }
    },
    template: function (capcode) {
        return { innerHTML: "<a href=\"https://www.4chan.org/feedback\" target=\"_blank\">feedback</a>" + (ModContact.specific[capcode]()).innerHTML };
    },
    specific: {
        Mod: function () { return { innerHTML: " <a href=\"https://www.4chan-x.net/4chan-irc.html\" target=\"_blank\">IRC</a>" }; },
        Manager: function () { return ModContact.specific.Mod(); },
        Developer: function () { return { innerHTML: " <a href=\"https://github.com/4chan\" target=\"_blank\">github</a>" }; },
        Admin: function () { return { innerHTML: " <a href=\"https://twitter.com/hiroyuki_ni\" target=\"_blank\">twitter</a>" }; }
    },
    moveNote: {
        qa: { innerHTML: "Moving a thread to /qa/ does not imply mods will read it. If you wish to contact mods, use <a href=\"https://www.4chan.org/feedback\" target=\"_blank\">feedback</a><span class=\"invisible\"> (https://www.4chan.org/feedback)</span> or <a href=\"https://www.4chan-x.net/4chan-irc.html\" target=\"_blank\">IRC</a><span class=\"invisible\"> (https://www.4chan-x.net/4chan-irc.html)</span>." }
    }
};
exports.default = ModContact;
