"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Header_1 = require("../General/Header");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var ScrollMarkers = {
    init: function () {
        ScrollMarkers.container = _1.default.el('div', { classList: 'scroll-marker-container' });
        globals_1.doc.insertAdjacentElement('afterbegin', ScrollMarkers.container);
        _1.default.on(ScrollMarkers.container, 'click', function (e) {
            var postId = e.target.dataset.postId;
            if (postId)
                Header_1.default.scrollTo(globals_1.g.posts[postId].nodes.root);
        });
        new ResizeObserver(ScrollMarkers.markScroll).observe(globals_1.doc);
    },
    container: undefined,
    // Keep instead of redoing so renewing doesn't lose keyboard focus
    markers: undefined,
    markScroll: (0, helpers_1.debounce)(100, function () {
        var _a, _b;
        if (!globals_1.Conf['Scroll Markers']) {
            ScrollMarkers.container.innerText = '';
            ScrollMarkers.markers = undefined;
            return;
        }
        var newMarkers = new Map();
        (_a = globals_1.g.posts) === null || _a === void 0 ? void 0 : _a.forEach(function (post) {
            var postEl = post.nodes.root;
            var isReply = false;
            if (_1.default.hasClass(postEl, 'quotesYou')) {
                isReply = true;
            }
            else if (!_1.default.hasClass(postEl, 'yourPost')) {
                return;
            }
            var postPosition = postEl.getBoundingClientRect();
            newMarkers.set("".concat(post.boardID, ".").concat(post.ID), {
                classList: "post-scroll-marker ".concat(isReply ? 'reply' : 'you', "-scroll-marker"),
                ariaLabel: "Jump to ".concat(isReply ? 'reply to ' : '', " my post"),
                top: (((postPosition.top + window.scrollY) / globals_1.doc.scrollHeight) * 100).toFixed(1),
                height: Math.max(1, (postPosition.height / globals_1.doc.scrollHeight) * 100).toFixed(1),
            });
        });
        var previousEl;
        for (var _i = 0, newMarkers_1 = newMarkers; _i < newMarkers_1.length; _i++) {
            var _c = newMarkers_1[_i], key = _c[0], marker = _c[1];
            var existing = (_b = ScrollMarkers.markers) === null || _b === void 0 ? void 0 : _b.get(key);
            var el = existing === null || existing === void 0 ? void 0 : existing.el;
            if (!el) {
                el = _1.default.el('button', { type: 'button' });
                if (previousEl) {
                    previousEl.insertAdjacentElement('afterend', el);
                }
                else {
                    _1.default.add(ScrollMarkers.container, el);
                }
            }
            el.classList = marker.classList;
            el.style.setProperty('--top', marker.top);
            el.style.setProperty('--height', marker.height);
            el.dataset.postId = key;
            marker.el = el;
            previousEl = el;
            document.createElement('button');
        }
        // Remove those that don't exist anymore
        if (ScrollMarkers.markers) {
            for (var _d = 0, _e = ScrollMarkers.markers; _d < _e.length; _d++) {
                var _f = _e[_d], key = _f[0], el = _f[1].el;
                if (!newMarkers.has(key))
                    el.remove();
            }
        }
        ScrollMarkers.markers = newMarkers;
    }, false),
};
exports.default = ScrollMarkers;
