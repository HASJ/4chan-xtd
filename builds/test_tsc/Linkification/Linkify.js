"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
// #region tests_enabled
var Test_1 = require("../General/Test");
// #endregion
var globals_1 = require("../globals/globals");
var ImageHost_1 = require("../Images/ImageHost");
var ExpandComment_1 = require("../Miscellaneous/ExpandComment");
var _1 = require("../platform/$");
var __1 = require("../platform/$$");
var Embedding_1 = require("./Embedding");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Linkify = {
    init: function () {
        if (!['index', 'thread', 'archive'].includes(globals_1.g.VIEW) || !globals_1.Conf['Linkify']) {
            return;
        }
        if (globals_1.Conf['Comment Expansion']) {
            ExpandComment_1.default.callbacks.push(this.node);
        }
        Callbacks_1.default.Post.push({
            name: 'Linkify',
            cb: this.node
        });
        return Embedding_1.default.init();
    },
    node: function () {
        var _a, _b;
        var link;
        if (this.isClone) {
            return Embedding_1.default.events(this);
        }
        if (!Linkify.regString.test(this.info.comment)) {
            return;
        }
        for (var _i = 0, _c = (0, __1.default)('a', this.nodes.comment); _i < _c.length; _i++) {
            link = _c[_i];
            if ((_b = (_a = globals_1.g.SITE).isLinkified) === null || _b === void 0 ? void 0 : _b.call(_a, link)) {
                _1.default.addClass(link, 'linkify');
                if (ImageHost_1.default.useFaster) {
                    ImageHost_1.default.fixLinks([link]);
                }
                Embedding_1.default.process(link, this);
            }
        }
        var links = Linkify.process(this.nodes.comment);
        if (ImageHost_1.default.useFaster) {
            ImageHost_1.default.fixLinks(links);
        }
        for (var _d = 0, links_1 = links; _d < links_1.length; _d++) {
            link = links_1[_d];
            Embedding_1.default.process(link, this);
        }
    },
    process: function (node) {
        var _a, _b;
        var length;
        var test = /[^\s"]+/g;
        var space = /[\s"]/;
        var snapshot = _1.default.X('.//br|.//text()', node);
        var i = 0;
        var links = [];
        while ((node = snapshot.snapshotItem(i++))) {
            var result;
            var data = node.data;
            if (!data || (node.parentElement.nodeName === "A")) {
                continue;
            }
            while ((result = test.exec(data))) {
                var index = result.index;
                var endNode = node;
                var word = result[0];
                // End of node, not necessarily end of space-delimited string
                if ((length = index + word.length) === data.length) {
                    var saved;
                    test.lastIndex = 0;
                    while (saved = snapshot.snapshotItem(i++)) {
                        var end;
                        if ((saved.nodeName === 'BR') || ((saved.parentElement.nodeName === 'P') && !saved.previousSibling)) {
                            var part1, part2;
                            if (
                            // link deliberately split
                            (part1 = word.match(/(https?:\/\/)?([a-z\d-]+\.)*[a-z\d-]+$/i)) &&
                                (part2 = (_b = (_a = snapshot.snapshotItem(i)) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.match(/^(\.[a-z\d-]+)*\//i)) &&
                                ((part1[0] + part2[0]).search(Linkify.regString) === 0)) {
                                continue;
                            }
                            else {
                                break;
                            }
                        }
                        if ((saved.parentElement.nodeName === "A") && !Linkify.regString.test(word)) {
                            break;
                        }
                        endNode = saved;
                        (data = saved.data);
                        if (end = space.exec(data)) {
                            // Set our snapshot and regex to start on this node at this position when the loop resumes
                            word += data.slice(0, end.index);
                            test.lastIndex = (length = end.index);
                            i--;
                            break;
                        }
                        else {
                            (length = data.length);
                            word += data;
                        }
                    }
                }
                if (Linkify.regString.test(word)) {
                    links.push(Linkify.makeRange(node, endNode, index, length));
                    // #region tests_enabled
                    if (links.length) {
                        Test_1.default.assert(function () { var _a; return word === ((_a = links[links.length - 1]) === null || _a === void 0 ? void 0 : _a.toString()); });
                    }
                    // #endregion
                }
                if (!test.lastIndex || (node !== endNode)) {
                    break;
                }
            }
        }
        i = links.length;
        while (i--) {
            links[i] = Linkify.makeLink(links[i]);
        }
        return links;
    },
    regString: new RegExp("((https?|mailto|git|magnet|ftp|irc):([a-z\\d%/?])|([-a-z\\d]+[.])+(aero|asia|biz|cat|com|coop|dance|info|int|jobs|mobi|moe|museum|name|net|org|post|pro|tel|travel|xxx|xyz|edu|gov|mil|[a-z]{2})([:/]|(?![^\\s\"]))|[\\d]{1,3}\\.[\\d]{1,3}\\.[\\d]{1,3}\\.[\\d]{1,3}|[-\\w\\d.@]+@[a-z\\d.-]+\\.[a-z\\d])", 'i'),
    makeRange: function (startNode, endNode, startOffset, endOffset) {
        var range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
    },
    makeLink: function (range) {
        var t;
        var encodedDomain;
        var text = range.toString();
        // Clean start of range
        var i = text.search(Linkify.regString);
        if (i > 0) {
            text = text.slice(i);
            while ((range.startOffset + i) >= range.startContainer.data.length) {
                i--;
            }
            if (i) {
                range.setStart(range.startContainer, range.startOffset + i);
            }
        }
        // Clean end of range
        i = 0;
        while (/[)\]}>.,]/.test(t = text.charAt(text.length - (1 + i)))) {
            if (!/[.,]/.test(t) && !((text.match(/[()\[\]{}<>]/g)).length % 2)) {
                break;
            }
            i++;
        }
        if (i) {
            text = text.slice(0, -i);
            while ((range.endOffset - i) < 0) {
                i--;
            }
            if (i) {
                range.setEnd(range.endContainer, range.endOffset - i);
            }
        }
        // Make our link 'valid' if it is formatted incorrectly.
        if (!/((mailto|magnet):|.+:\/\/)/.test(text)) {
            text = (/@/.test(text) ?
                'mailto:'
                :
                    'http://') + text;
        }
        // Decode percent-encoded characters in domain so that they behave consistently across browsers.
        if (encodedDomain = text.match(/^(https?:\/\/[^/]*%[0-9a-f]{2})(.*)$/i)) {
            text = encodedDomain[1].replace(/%([0-9a-f]{2})/ig, function (x, y) {
                if (y === '25') {
                    return x;
                }
                else {
                    return String.fromCharCode(parseInt(y, 16));
                }
            }) + encodedDomain[2];
        }
        var a = _1.default.el('a', {
            className: 'linkify',
            rel: 'noreferrer noopener',
            target: '_blank',
            href: text
        });
        // Insert the range into the anchor, the anchor into the range's DOM location, and destroy the range.
        _1.default.add(a, range.extractContents());
        range.insertNode(a);
        return a;
    }
};
exports.default = Linkify;
