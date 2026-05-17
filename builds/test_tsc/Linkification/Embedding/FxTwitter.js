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
exports.default = EmbedFxTwitter;
var _1 = require("../../platform/$");
var icon_1 = require("../../Icons/icon");
var Linkify_1 = require("../Linkify");
var jsx_1 = require("../../globals/jsx");
var Time_1 = require("../../Miscellaneous/Time");
var CrossOrigin_1 = require("../../platform/CrossOrigin");
var globals_1 = require("../../globals/globals");
function EmbedFxTwitter(a) {
    var _this = this;
    var el = _1.default.el('div', { innerHTML: '<blockquote class="twitter-tweet">Loading&hellip;</blockquote>' });
    var shouldTranslate = globals_1.Conf.fxtLang ? "/".concat(globals_1.Conf.fxtLang) : '';
    var maxReplies = +globals_1.Conf.fxtMaxReplies;
    CrossOrigin_1.default.cachePromise("".concat(globals_1.Conf.fxtUrl, "/").concat(a.dataset.uid).concat(shouldTranslate)).then(function (req) { return __awaiter(_this, void 0, void 0, function () {
        // console.log(tweet);
        function renderMedia(tweet) {
            var _a, _b;
            return ((_b = (_a = tweet.media) === null || _a === void 0 ? void 0 : _a.all) === null || _b === void 0 ? void 0 : _b.map(function (media) {
                switch (media.type) {
                    case 'photo':
                        return (0, jsx_1.default)("div", { class: "fxt-media" },
                            (0, jsx_1.default)("a", { href: media.url, target: "_blank", referrerpolicy: "no-referrer" },
                                (0, jsx_1.default)("img", { src: media.url, alt: media.altText, width: media.width, height: media.height, referrerpolicy: "no-referrer" })));
                    case 'video':
                    case 'gif':
                        return (0, jsx_1.default)("div", { class: "fxt-media" },
                            (0, jsx_1.default)("video", { controls: true, width: media.width, height: media.height, poster: media.thumbnail_url, preload: "meta" },
                                (0, jsx_1.default)("source", { src: media.url, type: media.format })));
                    default:
                        console.warn("FxTwitter media type ".concat(media.type, " not recognized"));
                }
            })) || [];
        }
        function renderDate(tweet) {
            return Time_1.default.format(new Date(tweet.created_at));
        }
        function renderPoll(tweet) {
            var maxPercentage = 0;
            var maxChoiceIndex = -1;
            tweet.poll.choices.forEach(function (choice, index) {
                if (choice.percentage > maxPercentage) {
                    maxPercentage = choice.percentage;
                    maxChoiceIndex = index;
                }
            });
            return jsx_1.default.apply(void 0, __spreadArray(__spreadArray(["div", { class: "fxt-poll" }], tweet.poll.choices.map(function (choice, index) {
                return (0, jsx_1.default)("div", { class: "fxt-choice ".concat(index === maxChoiceIndex ? 'highlight' : '') },
                    (0, jsx_1.default)("span", { class: "fxt-choice_label" }, choice.label),
                    (0, jsx_1.default)("span", { class: "fxt-choice_percentage" },
                        choice.percentage,
                        "%"),
                    (0, jsx_1.default)("div", { class: "fxt-bar", style: "width: ".concat(choice.percentage, "%") }));
            }), false), [(0, jsx_1.default)("div", { class: "total-votes" },
                    tweet.poll.total_votes.toLocaleString(),
                    " votes")], false));
        }
        function renderTranslation(tweet) {
            var _a, _b, _c;
            if (!((_a = tweet === null || tweet === void 0 ? void 0 : tweet.translation) === null || _a === void 0 ? void 0 : _a.target_lang) || ((_b = tweet === null || tweet === void 0 ? void 0 : tweet.translation) === null || _b === void 0 ? void 0 : _b.source_lang) === ((_c = tweet === null || tweet === void 0 ? void 0 : tweet.translation) === null || _c === void 0 ? void 0 : _c.target_lang)) {
                return '';
            }
            return (0, jsx_1.default)(jsx_1.hFragment, null,
                (0, jsx_1.default)("hr", null),
                (0, jsx_1.default)("p", null,
                    "Translated from ",
                    tweet.translation.source_lang_en),
                jsx_1.default.apply(void 0, __spreadArray(["p", { lang: tweet.translation.target_lang }], renderText(tweet.translation.text), false)));
        }
        function renderMeta(tweet) {
            return (0, jsx_1.default)("div", { class: "fxt-meta" },
                (0, jsx_1.default)("a", { class: "fxt-meta_profile", href: tweet.author.url, title: tweet.author.description, target: "_blank", referrerpolicy: "no-referrer" },
                    (0, jsx_1.default)("div", { class: "fxt-meta_avatar" },
                        (0, jsx_1.default)("img", { src: tweet.author.avatar_url, referrerpolicy: "no-referrer" })),
                    (0, jsx_1.default)("div", { class: "fxt-meta_author" },
                        (0, jsx_1.default)("span", { class: "fxt-meta_author_username" }, tweet.author.name),
                        (0, jsx_1.default)("span", { class: "fxt-meta_author_account" },
                            "@",
                            tweet.author.screen_name))),
                (0, jsx_1.default)("a", { href: tweet.url, title: "Open tweet in a new tab", target: "_blank", referrerpolicy: "no-referrer" }, icon_1.default.raw('link')));
        }
        function renderText(inputText) {
            var result = [];
            var endLast = 0;
            for (var _i = 0, _a = inputText.matchAll(/(?:@|\#)\w+/g); _i < _a.length; _i++) {
                var match = _a[_i];
                result.push(inputText.slice(endLast, match.index), (0, jsx_1.default)("a", { href: "https://x.com/".concat(match[0].startsWith('#') ? 'hashtag/' : '').concat(match[0].slice(1)), target: "_blank", referrerpolicy: "no-referrer" }, match[0]));
                endLast = match.index + match[0].length;
            }
            result.push(inputText.slice(endLast));
            return result;
        }
        function renderCommunityNote(note) {
            var content = [];
            var i = 0;
            if (note.entities) {
                for (var _i = 0, _a = note.entities; _i < _a.length; _i++) {
                    var entity = _a[_i];
                    if (entity.ref.url) {
                        if (i < entity.fromIndex)
                            content.push.apply(content, renderText(note.text.slice(i, entity.fromIndex)));
                        content.push((0, jsx_1.default)("a", { href: entity.ref.url, target: "_blank", referrerpolicy: "no-referrer" }, note.text.slice(entity.fromIndex, entity.toIndex)));
                        i = entity.toIndex;
                    }
                }
            }
            if (i < note.text.length - 1)
                content.push.apply(content, renderText(note.text.slice(i)));
            return (0, jsx_1.default)("div", { class: "fxt-community_note" },
                (0, jsx_1.default)("div", { class: "fxt-community_note-header" }, "Community Note"),
                jsx_1.default.apply(void 0, __spreadArray(["div", { class: "fxt-community_note-text" }], content, false)));
        }
        function renderQuote(quote) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _a = jsx_1.default;
                            _b = ["div", { class: "fxt-quote_container" }];
                            return [4 /*yield*/, renderTweet(quote, 'quote')];
                        case 1: return [2 /*return*/, _a.apply(void 0, _b.concat([_c.sent()]))];
                    }
                });
            });
        }
        function renderReplies(tweet) {
            return __awaiter(this, void 0, void 0, function () {
                var replies, depth, replyUrl, replyData, replyHTML, error_1, url;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            replies = [];
                            depth = 0;
                            _a.label = 1;
                        case 1:
                            if (!(tweet.replying_to && tweet.replying_to_status && depth < maxReplies)) return [3 /*break*/, 7];
                            replyUrl = "".concat(globals_1.Conf.fxtUrl, "/").concat(tweet.replying_to, "/status/").concat(tweet.replying_to_status);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 5, , 6]);
                            return [4 /*yield*/, CrossOrigin_1.default.cachePromise(replyUrl)];
                        case 3:
                            replyData = _a.sent();
                            tweet = replyData.response.tweet;
                            return [4 /*yield*/, renderTweet(tweet, 'reply')];
                        case 4:
                            replyHTML = _a.sent();
                            replies.unshift(replyHTML);
                            depth++;
                            return [3 /*break*/, 6];
                        case 5:
                            error_1 = _a.sent();
                            console.error("Error fetching/rendering reply tweet: ".concat(error_1.message));
                            console.log(tweet);
                            url = "".concat(globals_1.Conf.fxtUrl, "/").concat(tweet.replying_to, "/status/").concat(tweet.replying_to_status);
                            return [2 /*return*/, (0, jsx_1.default)("div", { class: "fxt-reply_container" },
                                    (0, jsx_1.default)("article", { class: "fxt-card fxt-tweet-reply" },
                                        (0, jsx_1.default)("div", { class: "fxt-content warning" },
                                            "Failed trying to load ",
                                            (0, jsx_1.default)("a", { href: url, target: "_blank", referrerpolicy: "no-referrer" }, url),
                                            (0, jsx_1.default)("br", null),
                                            "This tweet has probably been deleted or removed.",
                                            (0, jsx_1.default)("br", null),
                                            "This also breaks the reply chain, so you may want to view the original tweet.")))];
                        case 6: return [3 /*break*/, 1];
                        case 7: return [2 /*return*/, jsx_1.default.apply(void 0, __spreadArray(["div", { class: "fxt-reply_container" }], replies, false))];
                    }
                });
            });
        }
        function renderTweet(tweet, type) {
            return __awaiter(this, void 0, void 0, function () {
                var media, quote, _a, poll, created_at, translation, note;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            media = renderMedia(tweet);
                            if (!(tweet === null || tweet === void 0 ? void 0 : tweet.quote)) return [3 /*break*/, 2];
                            return [4 /*yield*/, renderQuote(tweet.quote)];
                        case 1:
                            _a = _d.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = '';
                            _d.label = 3;
                        case 3:
                            quote = _a;
                            poll = (tweet === null || tweet === void 0 ? void 0 : tweet.poll) ? renderPoll(tweet) : '';
                            created_at = renderDate(tweet);
                            translation = (shouldTranslate) ? renderTranslation(tweet) : '';
                            note = tweet.community_note ? renderCommunityNote(tweet.community_note) : '';
                            return [2 /*return*/, (0, jsx_1.default)("article", { class: "fxt-card fxt-tweet-".concat(type) },
                                    renderMeta(tweet),
                                    (0, jsx_1.default)("div", { class: "fxt-content" },
                                        jsx_1.default.apply(void 0, __spreadArray(__spreadArray(["div", { class: "fxt-text", lang: tweet.lang }], renderText(tweet.text), false), [translation], false)),
                                        (media.length || poll) && jsx_1.default.apply(void 0, __spreadArray(["div", { class: "fxt-media_container ".concat(((_c = (_b = tweet.media) === null || _b === void 0 ? void 0 : _b.all) === null || _c === void 0 ? void 0 : _c.length) > 1 ? 'fxt-media-multiple' : '') }, poll], media, false)),
                                        note,
                                        quote),
                                    (0, jsx_1.default)("div", { class: "fxt-stats" },
                                        (0, jsx_1.default)("div", { class: "fxt-stats_time" }, created_at),
                                        (0, jsx_1.default)("div", { class: "fxt-stats_meta" },
                                            (0, jsx_1.default)("span", { class: "fxt-likes" },
                                                icon_1.default.raw("comment"),
                                                tweet.replies.toLocaleString()),
                                            (0, jsx_1.default)("span", { class: "fxt-reposts" },
                                                icon_1.default.raw("shuffle"),
                                                tweet.retweets.toLocaleString()),
                                            (0, jsx_1.default)("span", { class: "fxt-replies" },
                                                icon_1.default.raw("heart"),
                                                tweet.likes.toLocaleString()))))];
                    }
                });
            });
        }
        function renderFullTweet(tweet) {
            return __awaiter(this, void 0, void 0, function () {
                var mainTweetHTML, repliesHTML, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, renderTweet(tweet, 'original')];
                        case 1:
                            mainTweetHTML = _b.sent();
                            if (!tweet.replying_to) return [3 /*break*/, 3];
                            return [4 /*yield*/, renderReplies(tweet)];
                        case 2:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = '';
                            _b.label = 4;
                        case 4:
                            repliesHTML = _a;
                            return [2 /*return*/, (0, jsx_1.default)(jsx_1.hFragment, null,
                                    repliesHTML,
                                    mainTweetHTML)];
                    }
                });
            });
        }
        var tweet, rendered, _i, _a, textEl;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (req.status === 404) {
                        el.textContent = '404: tweet not found';
                        return [2 /*return*/];
                    }
                    tweet = req.response.tweet;
                    return [4 /*yield*/, renderFullTweet(tweet)];
                case 1:
                    rendered = _b.sent();
                    el.innerHTML = rendered.innerHTML;
                    for (_i = 0, _a = el.getElementsByClassName('fxt-text'); _i < _a.length; _i++) {
                        textEl = _a[_i];
                        Linkify_1.default.process(textEl);
                    }
                    el.style.resize = null;
                    el.classList.add('fxt-card_container');
                    el.style.height = null;
                    el.style.width = null;
                    el.style.overflow = null;
                    return [2 /*return*/];
            }
        });
    }); });
    return el;
}
