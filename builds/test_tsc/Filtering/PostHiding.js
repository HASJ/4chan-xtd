"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var Callbacks_1 = require("../classes/Callbacks");
var DataBoard_1 = require("../classes/DataBoard");
var BoardConfig_1 = require("../General/BoardConfig");
var Get_1 = require("../General/Get");
var UI_1 = require("../General/UI");
var globals_1 = require("../globals/globals");
var Menu_1 = require("../Menu/Menu");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var Recursive_1 = require("./Recursive");
var icon_1 = require("../Icons/icon");
;
var PostHiding = {
    db: undefined,
    /** poster Ids to filter */
    posterIdDb: undefined,
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || (!globals_1.Conf['Reply Hiding Buttons'] && !(globals_1.Conf['Menu'] && globals_1.Conf['Reply Hiding Link']))) {
            return;
        }
        if (globals_1.Conf['Reply Hiding Buttons']) {
            _1.default.addClass(globals_1.doc, "reply-hide");
        }
        this.db = new DataBoard_1.default('hiddenPosts');
        this.posterIdDb = new DataBoard_1.default('hiddenPosterIds');
        Callbacks_1.default.Post.push({
            name: 'Reply Hiding',
            cb: this.node
        });
    },
    isHidden: function (boardID, threadID, postID) {
        return !!(PostHiding.db && PostHiding.db.get({ boardID: boardID, threadID: threadID, postID: postID }));
    },
    node: function () {
        if (!this.isReply || this.isClone || this.isFetchedQuote)
            return;
        var data = PostHiding.db.get({ boardID: this.board.ID, threadID: this.thread.ID, postID: this.ID });
        if (!data && this.info.uniqueID) {
            var hiddenPosterIds = PostHiding.posterIdDb.get({ boardID: this.board.ID, threadID: this.thread.ID });
            if (hiddenPosterIds && this.info.uniqueID in hiddenPosterIds) {
                data = hiddenPosterIds[this.info.uniqueID];
                // thisPost is only on the first hidden posts, it shouldn't apply when hiding on poster ID
                data.thisPost = true;
            }
        }
        if (data) {
            if (data.thisPost) {
                PostHiding.hide(this, data.makeStub, data.hideRecursively, 'Hidden manually');
            }
            else {
                PostHiding.hideRecursive(this, data.makeStub);
            }
        }
        if (!globals_1.Conf['Reply Hiding Buttons']) {
            return;
        }
        var button = PostHiding.makeButton(this, 'hide');
        var sa = globals_1.g.SITE.selectors.sideArrows;
        if (sa) {
            var sideArrows = (0, _1.default)(sa, this.nodes.root);
            _1.default.replace(sideArrows.firstChild, button);
            sideArrows.className = 'replacedSideArrows';
        }
        else {
            _1.default.prepend(this.nodes.info, button);
        }
    },
    menu: {
        post: undefined,
        init: function () {
            return __awaiter(this, void 0, void 0, function () {
                var applyHide, hideOptions, applyShow, thisPost, replies, hideStubLink, showOptions, byId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Menu'] || !globals_1.Conf['Reply Hiding Link'])
                                return [2 /*return*/];
                            return [4 /*yield*/, new Promise(function (res) { return BoardConfig_1.default.ready(res); })];
                        case 1:
                            _a.sent();
                            applyHide = _1.default.el('a', {
                                textContent: 'Apply',
                                href: 'javascript:;'
                            });
                            _1.default.on(applyHide, 'click', PostHiding.menu.hide);
                            hideOptions = [
                                { el: applyHide },
                                { el: UI_1.default.checkbox('thisPost', 'This post', true) },
                                { el: UI_1.default.checkbox('replies', 'Hide replies', globals_1.Conf['Recursive Hiding']) },
                                { el: UI_1.default.checkbox('makeStub', 'Make stub', globals_1.Conf['Stubs']) },
                            ];
                            if (globals_1.g.BOARD.config.user_ids) {
                                hideOptions.push({ el: UI_1.default.checkbox('byId', 'By poster id', false) });
                            }
                            Menu_1.default.menu.addEntry({
                                el: _1.default.el('div', {
                                    className: 'hide-reply-link',
                                    textContent: 'Hide'
                                }),
                                order: 20,
                                open: function (post) {
                                    if (!post.isReply || post.isClone || post.isHidden) {
                                        return false;
                                    }
                                    PostHiding.menu.post = post;
                                    return true;
                                },
                                subEntries: hideOptions
                            });
                            applyShow = _1.default.el('a', {
                                textContent: 'Apply',
                                href: 'javascript:;'
                            });
                            _1.default.on(applyShow, 'click', PostHiding.menu.show);
                            thisPost = UI_1.default.checkbox('thisPost', 'This post', false);
                            replies = UI_1.default.checkbox('replies', 'Show replies', false);
                            hideStubLink = _1.default.el('a', {
                                textContent: 'Hide stub',
                                href: 'javascript:;'
                            });
                            _1.default.on(hideStubLink, 'click', PostHiding.menu.hideStub);
                            showOptions = [
                                { el: applyShow },
                                { el: thisPost },
                                { el: replies },
                            ];
                            if (globals_1.g.BOARD.config.user_ids) {
                                byId = UI_1.default.checkbox('byId', 'By poster id', false);
                                showOptions.push({ el: byId });
                            }
                            Menu_1.default.menu.addEntry({
                                el: _1.default.el('div', {
                                    className: 'show-reply-link',
                                    textContent: 'Show'
                                }),
                                order: 20,
                                open: function (post) {
                                    var _a;
                                    if (!post.isReply || post.isClone || !post.isHidden) {
                                        return false;
                                    }
                                    var data = PostHiding.db.get({ boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID });
                                    if (!data)
                                        return false;
                                    PostHiding.menu.post = post;
                                    thisPost.firstChild.checked = post.isHidden;
                                    replies.firstChild.checked = (_a = data.hideRecursively) !== null && _a !== void 0 ? _a : globals_1.Conf['Recursive Hiding'];
                                    if (byId)
                                        byId.firstChild.checked = data.byId;
                                    return true;
                                },
                                subEntries: showOptions
                            });
                            Menu_1.default.menu.addEntry({
                                el: hideStubLink,
                                order: 15,
                                open: function (post) {
                                    var data;
                                    if (!post.isReply || post.isClone || !post.isHidden) {
                                        return false;
                                    }
                                    if (!(data = PostHiding.db.get({ boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID }))) {
                                        return false;
                                    }
                                    return PostHiding.menu.post = post;
                                }
                            });
                            return [2 /*return*/];
                    }
                });
            });
        },
        hide: function () {
            var _a;
            var parent = this.parentNode;
            var thisPost = (0, _1.default)('input[name=thisPost]', parent).checked;
            var replies = (0, _1.default)('input[name=replies]', parent).checked;
            var makeStub = (0, _1.default)('input[name=makeStub]', parent).checked;
            var byId = (_a = (0, _1.default)('input[name=byId]', parent)) === null || _a === void 0 ? void 0 : _a.checked;
            var post = PostHiding.menu.post;
            if (!thisPost && !replies && !byId)
                return;
            if (thisPost) {
                PostHiding.hide(post, makeStub, replies, 'Hidden manually');
            }
            else if (replies) {
                PostHiding.hideRecursive(post, makeStub);
            }
            if (byId) {
                var msg_1 = "Hidden because of poster ID ".concat(post.info.uniqueID);
                globals_1.g.posts.forEach(function (p) {
                    if (p.info.uniqueID === post.info.uniqueID && p !== post) {
                        PostHiding.hide(p, makeStub, replies, msg_1);
                        PostHiding.saveHiddenState(p, true, thisPost, makeStub, replies, byId);
                    }
                });
                var data = PostHiding.posterIdDb.get({ boardID: post.boardID, threadID: post.threadID, defaultValue: (0, helpers_1.dict)() });
                if (!(post.info.uniqueID in data)) {
                    data[post.info.uniqueID] = { makeStub: makeStub, hideRecursively: replies };
                    PostHiding.posterIdDb.set({ boardID: post.boardID, threadID: post.threadID, val: data });
                }
            }
            PostHiding.saveHiddenState(post, true, thisPost, makeStub, replies, byId);
            _1.default.event('CloseMenu', null);
        },
        show: function () {
            var _a;
            var parent = this.parentNode;
            var thisPost = (0, _1.default)('input[name=thisPost]', parent).checked;
            var replies = (0, _1.default)('input[name=replies]', parent).checked;
            var byId = (_a = (0, _1.default)('input[name=byId]', parent)) === null || _a === void 0 ? void 0 : _a.checked;
            var post = PostHiding.menu.post;
            var boardID = post.boardID, threadID = post.threadID, postID = post.postID;
            if (!thisPost && !replies && !byId)
                return;
            if (thisPost) {
                PostHiding.show(post, replies);
            }
            else if (replies) {
                Recursive_1.default.apply(PostHiding.show, post, true);
                Recursive_1.default.rm(PostHiding.hide, post);
            }
            if (byId) {
                globals_1.g.posts.forEach(function (p) {
                    if (p.info.uniqueID === post.info.uniqueID && p !== post) {
                        PostHiding.show(p, replies);
                        var data_1 = PostHiding.db.get({ boardID: boardID, threadID: threadID, postID: postID });
                        if (data_1) {
                            PostHiding.saveHiddenState(post, !(thisPost && replies), !thisPost, data_1.makeStub, !replies, byId);
                        }
                    }
                });
                var byIdState = PostHiding.posterIdDb.get({ boardID: boardID, threadID: threadID });
                if (byIdState && post.info.uniqueID in byIdState) {
                    delete byIdState[post.info.uniqueID];
                    PostHiding.posterIdDb.set({ boardID: boardID, threadID: threadID, val: byIdState });
                }
            }
            var data = PostHiding.db.get({ boardID: boardID, threadID: threadID, postID: postID });
            if (data) {
                PostHiding.saveHiddenState(post, !(thisPost && replies), !thisPost, data.makeStub, !replies, byId);
            }
            _1.default.event('CloseMenu', null);
        },
        hideStub: function () {
            var data;
            var post = PostHiding.menu.post;
            if (data = PostHiding.db.get({ boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID })) {
                PostHiding.show(post, data.hideRecursively);
                PostHiding.hide(post, false, data.hideRecursively);
                PostHiding.saveHiddenState(post, true, true, false, data.hideRecursively, data.byId);
            }
            _1.default.event('CloseMenu', null);
        }
    },
    makeButton: function (post, type) {
        var span = _1.default.el('span', {
            className: 'stub-icon',
        });
        var a = _1.default.el('a', {
            className: "".concat(type, "-post-button ").concat(type, "-reply-button"),
            href: 'javascript:;'
        });
        icon_1.default.set(span, type === 'hide' ? 'squareMinus' : 'squarePlus');
        _1.default.add(a, span);
        _1.default.on(a, 'click', PostHiding.toggle);
        return a;
    },
    saveHiddenState: function (post, isHiding, thisPost, makeStub, hideRecursively, byId) {
        var data = {
            boardID: post.board.ID,
            threadID: post.thread.ID,
            postID: post.ID
        };
        if (isHiding) {
            data.val = {
                thisPost: thisPost !== false, // undefined -> true
                makeStub: makeStub,
                hideRecursively: hideRecursively,
                byId: byId
            };
            PostHiding.db.set(data);
        }
        else {
            PostHiding.db.delete(data);
        }
    },
    toggle: function () {
        var post = Get_1.default.postFromNode(this);
        post.isHidden ? PostHiding.show(post) : PostHiding.hide(post, undefined, undefined, 'Hidden manually');
        PostHiding.saveHiddenState(post, post.isHidden);
    },
    hide: function (post, makeStub, hideRecursively, reason) {
        var _a;
        if (makeStub === void 0) { makeStub = globals_1.Conf['Stubs']; }
        if (hideRecursively === void 0) { hideRecursively = globals_1.Conf['Recursive Hiding']; }
        if (post.isHidden)
            return;
        post.isHidden = true;
        if (hideRecursively) {
            PostHiding.hideRecursive(post, makeStub);
        }
        for (var _i = 0, _b = Get_1.default.allQuotelinksLinkingTo(post); _i < _b.length; _i++) {
            var quotelink = _b[_i];
            _1.default.addClass(quotelink, 'filtered');
        }
        if (!makeStub) {
            post.nodes.root.hidden = true;
            return;
        }
        post.nodes.stub = _1.default.el('div', { className: 'stub' });
        var a = PostHiding.makeButton(post, 'show');
        _1.default.add(a, _1.default.el('span', { className: 'stub-name', textContent: post.info.nameBlock }));
        var reasons = ((_a = post.filterResults) === null || _a === void 0 ? void 0 : _a.reasons) || [];
        if (reason)
            reasons = __spreadArray(__spreadArray([], reasons, true), [reason], false);
        if (globals_1.Conf['Filter Reason'] && reasons.length) {
            var reasonsSpan = _1.default.el('span', { className: 'stub-reasons' });
            _1.default.add(reasonsSpan, reasons.map(function (re) { return _1.default.el('span', { className: 'stub-reason', textContent: re }); }));
            a.appendChild(reasonsSpan);
        }
        _1.default.add(post.nodes.stub, a);
        if (!globals_1.Conf['Filter Reason'] && reasons)
            post.nodes.stub.title = reasons.join(' & ');
        if (globals_1.Conf['Menu']) {
            _1.default.add(post.nodes.stub, Menu_1.default.makeButton(post));
        }
        _1.default.prepend(post.nodes.root, post.nodes.stub);
    },
    hideRecursive: function (post, makeStub) {
        Recursive_1.default.applyAndAdd(PostHiding.hide, post, makeStub, true, "Hidden recursively from ".concat(post.ID));
    },
    show: function (post, showRecursively) {
        if (showRecursively === void 0) { showRecursively = globals_1.Conf['Recursive Hiding']; }
        if (post.nodes.stub) {
            _1.default.rm(post.nodes.stub);
            delete post.nodes.stub;
        }
        else {
            post.nodes.root.hidden = false;
        }
        post.isHidden = false;
        if (showRecursively) {
            Recursive_1.default.apply(PostHiding.show, post, true);
            Recursive_1.default.rm(PostHiding.hide, post);
        }
        for (var _i = 0, _a = Get_1.default.allQuotelinksLinkingTo(post); _i < _a.length; _i++) {
            var quotelink = _a[_i];
            _1.default.rmClass(quotelink, 'filtered');
        }
    }
};
exports.default = PostHiding;
