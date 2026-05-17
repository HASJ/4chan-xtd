"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Callbacks_1 = require("../classes/Callbacks");
var Post_1 = require("../classes/Post");
var Index_1 = require("../General/Index");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
var RelativeDates = {
    INTERVAL: 30000,
    init: function () {
        if ((['index', 'thread', 'archive'].includes(globals_1.g.VIEW) &&
            ['Show', 'Both', 'BothRelativeFirst'].includes(globals_1.Conf.RelativeTime)) ||
            Index_1.default.enabled) {
            this.flush();
            _1.default.on(globals_1.d, 'visibilitychange PostsInserted', this.flush);
        }
        if (globals_1.Conf.RelativeTime !== 'No') {
            return Callbacks_1.default.Post.push({
                name: 'Relative Post Dates',
                cb: this.node
            });
        }
    },
    node: function () {
        var _this = this;
        if (!this.info.date) {
            return;
        }
        var dateEl = this.nodes.date;
        if (globals_1.Conf.RelativeTime === 'Hover') {
            _1.default.on(dateEl, 'mouseover', function () { return RelativeDates.hover(_this); });
            return;
        }
        if (this.isClone) {
            return;
        }
        // Show original absolute time as tooltip so users can still know exact times
        // Since "Time Formatting" runs its `node` before us, the title tooltip will
        // pick up the user-formatted time instead of 4chan time when enabled.
        if (globals_1.Conf.RelativeTime === 'Show') {
            dateEl.dataset.fullTime = dateEl.textContent;
            dateEl.title = dateEl.textContent;
        }
        return RelativeDates.update(this);
    },
    /** @param diff is milliseconds from now. */
    relative: function (diff, now, date, abbrev) {
        var number;
        var unit;
        if ((number = (diff / helpers_1.DAY)) >= 1) {
            var years = now.getFullYear() - date.getFullYear();
            var months = now.getMonth() - date.getMonth();
            var days = now.getDate() - date.getDate();
            if (years > 1) {
                number = years - ((months < 0) || ((months === 0) && (days < 0)));
                unit = 'year';
            }
            else if ((years === 1) && ((months > 0) || ((months === 0) && (days >= 0)))) {
                number = years;
                unit = 'year';
            }
            else if ((months = months + (12 * years)) > 1) {
                number = months - (days < 0);
                unit = 'month';
            }
            else if ((months === 1) && (days >= 0)) {
                number = months;
                unit = 'month';
            }
            else {
                unit = 'day';
            }
        }
        else if ((number = (diff / helpers_1.HOUR)) >= 1) {
            unit = 'hour';
        }
        else if ((number = (diff / helpers_1.MINUTE)) >= 1) {
            unit = 'minute';
        }
        else {
            // prevent "-1 seconds ago"
            number = Math.max(0, diff) / helpers_1.SECOND;
            unit = 'second';
        }
        var rounded = Math.round(number);
        if (abbrev) {
            unit = unit === 'month' ? 'mo' : unit[0];
        }
        else {
            if (rounded !== 1) {
                unit += 's';
            } // pluralize
        }
        if (abbrev) {
            return "".concat(rounded).concat(unit);
        }
        else {
            return "".concat(rounded, " ").concat(unit, " ago");
        }
    },
    // Changing all relative dates as soon as possible incurs many annoying
    // redraws and scroll stuttering. Thus, sacrifice accuracy for UX/CPU economy,
    // and perform redraws when the DOM is otherwise being manipulated (and scroll
    // stuttering won't be noticed), falling back to INTERVAL while the page
    // is visible.
    //
    // Each individual dateTime element will add its update() function to the stale list
    // when it is to be called.
    stale: [],
    timeout: undefined,
    flush: function () {
        // No point in changing the dates until the user sees them.
        if (globals_1.d.hidden) {
            return;
        }
        var now = new Date();
        for (var _i = 0, _a = RelativeDates.stale; _i < _a.length; _i++) {
            var data = _a[_i];
            RelativeDates.update(data, now);
        }
        RelativeDates.stale = [];
        // Reset automatic flush.
        clearTimeout(RelativeDates.timeout);
        RelativeDates.timeout = setTimeout(RelativeDates.flush, RelativeDates.INTERVAL);
    },
    hover: function (post) {
        var date = post.info.date;
        var now = new Date();
        var diff = now - date;
        post.nodes.date.title = RelativeDates.relative(diff, now, date);
    },
    // `update()`, when called from `flush()`, updates the elements,
    // and re-calls `setOwnTimeout()` to re-add `data` to the stale list later.
    update: function (data, now) {
        if (now === void 0) { now = new Date(); }
        var abbrev, date;
        var isPost = data instanceof Post_1.default;
        if (isPost) {
            (date = data.info.date);
            abbrev = false;
        }
        else {
            date = new Date(+data.dataset.utc);
            abbrev = !!data.dataset.abbrev;
        }
        var diff = now - date;
        var relative = RelativeDates.relative(diff, now, date, abbrev);
        if (isPost) {
            for (var _i = 0, _a = [data].concat(data.clones); _i < _a.length; _i++) {
                var singlePost = _a[_i];
                var node = singlePost.nodes.date;
                if (globals_1.Conf.RelativeTime === 'Show') {
                    node.textContent = relative;
                }
                else {
                    var full = node.dataset.fullTime;
                    if (!full) {
                        full = node.textContent;
                        node.dataset.fullTime = full;
                    }
                    node.textContent = globals_1.Conf.RelativeTime === 'Both' ? "".concat(full, ", ").concat(relative) : "".concat(relative, ", ").concat(full);
                }
            }
        }
        else {
            data.firstChild.textContent = relative;
        }
        RelativeDates.setOwnTimeout(diff, data);
    },
    setOwnTimeout: function (diff, data) {
        var delay = diff < helpers_1.MINUTE ?
            helpers_1.SECOND - ((diff + (helpers_1.SECOND / 2)) % helpers_1.SECOND)
            : diff < helpers_1.HOUR ?
                helpers_1.MINUTE - ((diff + (helpers_1.MINUTE / 2)) % helpers_1.MINUTE)
                : diff < helpers_1.DAY ?
                    helpers_1.HOUR - ((diff + (helpers_1.HOUR / 2)) % helpers_1.HOUR)
                    :
                        helpers_1.DAY - ((diff + (helpers_1.DAY / 2)) % helpers_1.DAY);
        setTimeout(RelativeDates.markStale, delay, data);
    },
    markStale: function (data) {
        if (RelativeDates.stale.includes(data)) {
            return;
        } // We can call RelativeDates.update() multiple times.
        if (data instanceof Post_1.default && !globals_1.g.posts.get(data.fullID)) {
            return;
        } // collected post.
        if (data instanceof Element && !globals_1.doc.contains(data)) {
            return;
        } // removed catalog reply.
        RelativeDates.stale.push(data);
    }
};
exports.default = RelativeDates;
