"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SimpleDict_1 = require("./SimpleDict");
var _1 = require("../platform/$");
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Thread = /** @class */ (function () {
    function Thread(ID, board) {
        this.board = board;
        this.ID = +ID;
        this.threadID = this.ID;
        this.boardID = this.board.ID;
        this.siteID = globals_1.g.SITE.ID;
        this.fullID = "".concat(this.board, ".").concat(this.ID);
        this.posts = new SimpleDict_1.default();
        this.isDead = false;
        this.isHidden = false;
        this.isSticky = false;
        this.isClosed = false;
        this.isArchived = false;
        this.postLimit = false;
        this.fileLimit = false;
        this.lastPost = 0;
        this.ipCount = undefined;
        this.json = null;
        this.OP = null;
        this.catalogView = null;
        this.nodes =
            { root: null };
        this.board.threads.push(this.ID, this);
        globals_1.g.threads.push(this.fullID, this);
    }
    Thread.prototype.toString = function () { return this.ID; };
    Thread.prototype.setPage = function (pageNum) {
        var icon;
        var _a = this.OP.nodes, info = _a.info, reply = _a.reply;
        if (!(icon = (0, _1.default)('.page-num', info))) {
            icon = _1.default.el('span', { className: 'page-num' });
            _1.default.replace(reply.parentNode.previousSibling, [_1.default.tn(' '), icon, _1.default.tn(' ')]);
        }
        icon.title = "This thread is on page ".concat(pageNum, " in the original index.");
        icon.textContent = "[".concat(pageNum, "]");
        if (this.catalogView) {
            return this.catalogView.nodes.pageCount.textContent = pageNum;
        }
    };
    Thread.prototype.setCount = function (type, count, reachedLimit) {
        if (!this.catalogView) {
            return;
        }
        var el = this.catalogView.nodes["".concat(type, "Count")];
        el.textContent = count;
        return (reachedLimit ? _1.default.addClass : _1.default.rmClass)(el, 'warning');
    };
    Thread.prototype.setStatus = function (type, status) {
        var name = "is".concat(type);
        if (this[name] === status) {
            return;
        }
        this[name] = status;
        if (!this.OP) {
            return;
        }
        this.setIcon('Sticky', this.isSticky);
        this.setIcon('Closed', this.isClosed && !this.isArchived);
        return this.setIcon('Archived', this.isArchived);
    };
    Thread.prototype.setIcon = function (type, status) {
        var typeLC = type.toLowerCase();
        var icon = (0, _1.default)(".".concat(typeLC, "Icon"), this.OP.nodes.info);
        if (!!icon === status) {
            return;
        }
        if (!status) {
            _1.default.rm(icon.previousSibling);
            _1.default.rm(icon);
            if (this.catalogView) {
                _1.default.rm((0, _1.default)(".".concat(typeLC, "Icon"), this.catalogView.nodes.icons));
            }
            return;
        }
        icon = _1.default.el('img', {
            src: "".concat(globals_1.g.SITE.Build.staticPath).concat(typeLC).concat(globals_1.g.SITE.Build.gifIcon),
            alt: type,
            title: type,
            className: "".concat(typeLC, "Icon retina")
        });
        if (globals_1.g.BOARD.ID === 'f') {
            icon.style.cssText = 'height: 18px; width: 18px;';
        }
        var root = (type !== 'Sticky') && this.isSticky ?
            (0, _1.default)('.stickyIcon', this.OP.nodes.info)
            :
                (0, _1.default)('.page-num', this.OP.nodes.info) || this.OP.nodes.quote;
        _1.default.after(root, [_1.default.tn(' '), icon]);
        if (!this.catalogView) {
            return;
        }
        return ((type === 'Sticky') && this.isClosed ? _1.default.prepend : _1.default.add)(this.catalogView.nodes.icons, icon.cloneNode());
    };
    Thread.prototype.kill = function () {
        return this.isDead = true;
    };
    Thread.prototype.collect = function () {
        var n = 0;
        this.posts.forEach(function (post) {
            if (post.clones.length) {
                return n++;
            }
            else {
                return post.collect();
            }
        });
        if (!n) {
            globals_1.g.threads.rm(this.fullID);
            return this.board.threads.rm(this);
        }
    };
    return Thread;
}());
exports.default = Thread;
