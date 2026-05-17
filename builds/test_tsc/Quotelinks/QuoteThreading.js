"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var RandomAccessList_1 = require("../classes/RandomAccessList");
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var ReplyPruning_1 = require("../Monitoring/ReplyPruning");
var Unread_1 = require("../Monitoring/Unread");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
/*
  <3 aeosynth
*/
var QuoteThreading = {
    init: function () {
        var _this = this;
        if (!globals_1.Conf['Quote Threading'] || (globals_1.g.VIEW !== 'thread')) {
            return;
        }
        this.controls = _1.default.el('label', { innerHTML: "<input id=\"threadingControl\" name=\"Thread Quotes\" type=\"checkbox\"> Threading" });
        this.threadNewLink = _1.default.el('span', {
            className: 'brackets-wrap threadnewlink',
            hidden: true
        });
        _1.default.extend(this.threadNewLink, { innerHTML: "<a href=\"javascript:;\">Thread New Posts</a>" });
        this.input = (0, _1.default)('input', this.controls);
        this.input.checked = globals_1.Conf['Thread Quotes'];
        _1.default.on(this.input, 'change', this.setEnabled);
        _1.default.on(this.input, 'change', this.rethread);
        _1.default.on(this.threadNewLink.firstElementChild, 'click', this.rethread);
        _1.default.on(globals_1.d, '4chanXInitFinished', function () { _this.ready = true; });
        Header_1.default.menu.addEntry(this.entry = {
            el: this.controls,
            order: 99
        });
        Callbacks_1.default.Thread.push({
            name: 'Quote Threading',
            cb: this.setThread
        });
        Callbacks_1.default.Post.push({
            name: 'Quote Threading',
            cb: this.node
        });
    },
    parent: (0, helpers_1.dict)(),
    children: (0, helpers_1.dict)(),
    inserted: (0, helpers_1.dict)(),
    toggleThreading: function () {
        this.setThreadingState(!globals_1.Conf['Thread Quotes']);
    },
    setThreadingState: function (enabled) {
        this.input.checked = enabled;
        this.setEnabled.call(this.input);
        this.rethread.call(this.input);
    },
    setEnabled: function () {
        var _a;
        if (this.checked) {
            _1.default.set('Prune All Threads', false);
            var other = (_a = ReplyPruning_1.default.inputs) === null || _a === void 0 ? void 0 : _a.enabled;
            if (other === null || other === void 0 ? void 0 : other.checked) {
                other.checked = false;
                _1.default.event('change', null, other);
            }
        }
        _1.default.cb.checked.call(this);
    },
    setThread: function () {
        QuoteThreading.thread = this;
        _1.default.asap((function () { return !globals_1.Conf['Thread Updater'] || (0, _1.default)('.navLinksBot > .updatelink'); }), function () {
            var navLinksBot;
            if (navLinksBot = (0, _1.default)('.navLinksBot')) {
                _1.default.add(navLinksBot, [_1.default.tn(' '), QuoteThreading.threadNewLink]);
            }
        });
    },
    node: function () {
        var parent;
        if (this.isFetchedQuote || this.isClone || !this.isReply) {
            return;
        }
        var parents = new Set();
        var lastParent = null;
        for (var _i = 0, _a = this.quotes; _i < _a.length; _i++) {
            var quote = _a[_i];
            if ((parent = globals_1.g.posts.get(quote))) {
                if (!parent.isFetchedQuote && parent.isReply && (parent.ID < this.ID)) {
                    parents.add(parent.ID);
                    if (!lastParent || (parent.ID > lastParent.ID)) {
                        lastParent = parent;
                    }
                }
            }
        }
        if (!lastParent)
            return;
        var ancestor = lastParent;
        while ((ancestor = QuoteThreading.parent[ancestor.fullID])) {
            parents.delete(ancestor.ID);
        }
        if (parents.size === 1) {
            QuoteThreading.parent[this.fullID] = lastParent;
        }
    },
    descendants: function (post) {
        var children;
        var posts = [post];
        if (children = QuoteThreading.children[post.fullID]) {
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var child = children_1[_i];
                posts = posts.concat(QuoteThreading.descendants(child));
            }
        }
        return posts;
    },
    insert: function (post) {
        var parent, x;
        if (!(globals_1.Conf['Thread Quotes'] &&
            (parent = QuoteThreading.parent[post.fullID]) &&
            !QuoteThreading.inserted[post.fullID])) {
            return false;
        }
        var descendants = QuoteThreading.descendants(post);
        if (!Unread_1.default.posts.has(parent.ID)) {
            if ((function () { for (var _i = 0, descendants_2 = descendants; _i < descendants_2.length; _i++) {
                var x = descendants_2[_i];
                if (Unread_1.default.posts.has(x.ID)) {
                    return true;
                }
            } })()) {
                QuoteThreading.threadNewLink.hidden = false;
                return false;
            }
        }
        var order = Unread_1.default.order;
        var children = (QuoteThreading.children[parent.fullID] || (QuoteThreading.children[parent.fullID] = []));
        var threadContainer = parent.nodes.threadContainer || _1.default.el('div', { className: 'threadContainer' });
        var nodes = [post.nodes.root];
        if (post.nodes.threadContainer) {
            nodes.push(post.nodes.threadContainer);
        }
        var i = children.length;
        for (var j = children.length - 1; j >= 0; j--) {
            var child = children[j];
            if (child.ID >= post.ID) {
                i--;
            }
        }
        if (i !== children.length) {
            var next = children[i];
            for (var _i = 0, descendants_1 = descendants; _i < descendants_1.length; _i++) {
                x = descendants_1[_i];
                order.before(order[next.ID], order[x.ID]);
            }
            children.splice(i, 0, post);
            _1.default.before(next.nodes.root, nodes);
        }
        else {
            var prev2 = void 0;
            var prev = parent;
            while ((prev2 = QuoteThreading.children[prev.fullID]) && prev2.length) {
                prev = prev2[prev2.length - 1];
            }
            for (var k = descendants.length - 1; k >= 0; k--) {
                x = descendants[k];
                order.after(order[prev.ID], order[x.ID]);
            }
            children.push(post);
            _1.default.add(threadContainer, nodes);
        }
        QuoteThreading.inserted[post.fullID] = true;
        if (!parent.nodes.threadContainer) {
            parent.nodes.threadContainer = threadContainer;
            _1.default.addClass(parent.nodes.root, 'threadOP');
            _1.default.after(parent.nodes.root, threadContainer);
        }
        return true;
    },
    rethread: function () {
        if (!QuoteThreading.ready) {
            return;
        }
        var thread = QuoteThreading.thread;
        var posts = thread.posts;
        QuoteThreading.threadNewLink.hidden = true;
        if (globals_1.Conf['Thread Quotes']) {
            posts.forEach(QuoteThreading.insert);
        }
        else {
            var nodes_1 = [];
            Unread_1.default.order = new RandomAccessList_1.default();
            QuoteThreading.inserted = (0, helpers_1.dict)();
            posts.forEach(function (post) {
                if (post.isFetchedQuote) {
                    return;
                }
                Unread_1.default.order.push(post);
                if (post.isReply) {
                    nodes_1.push(post.nodes.root);
                }
                if (QuoteThreading.children[post.fullID]) {
                    delete QuoteThreading.children[post.fullID];
                    _1.default.rmClass(post.nodes.root, 'threadOP');
                    _1.default.rm(post.nodes.threadContainer);
                    delete post.nodes.threadContainer;
                }
            });
            _1.default.add(thread.nodes.root, nodes_1);
        }
        Unread_1.default.position = Unread_1.default.order.first;
        Unread_1.default.updatePosition();
        Unread_1.default.setLine(true);
        Unread_1.default.read();
        Unread_1.default.update();
    },
};
exports.default = QuoteThreading;
