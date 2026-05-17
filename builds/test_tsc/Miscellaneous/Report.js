"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Redirect_1 = require("../Archive/Redirect");
var _1 = require("../platform/$");
var ArchiveReport_html_1 = require("./Report/ArchiveReport.html");
var CSS_1 = require("../css/CSS");
var Captcha_1 = require("../Posting/Captcha");
var globals_1 = require("../globals/globals");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Report = {
    init: function () {
        var match;
        if (!(match = location.search.match(/\bno=(\d+)/))) {
            return;
        }
        Captcha_1.default.replace.init();
        this.postID = +match[1];
        return _1.default.ready(this.ready);
    },
    ready: function () {
        _1.default.addStyle(CSS_1.default.report);
        if (globals_1.Conf['Archive Report']) {
            Report.archive();
        }
        new MutationObserver(function () {
            Report.fit('iframe[src^="https://www.google.com/recaptcha/api2/frame"]');
            return Report.fit('body');
        }).observe(globals_1.d.body, {
            childList: true,
            attributes: true,
            subtree: true
        });
        return Report.fit('body');
    },
    fit: function (selector) {
        var el;
        if (!((el = (0, _1.default)(selector, globals_1.doc)) && (getComputedStyle(el).visibility !== 'hidden'))) {
            return;
        }
        var dy = (el.getBoundingClientRect().bottom - globals_1.doc.clientHeight) + 8;
        if (dy > 0) {
            return window.resizeBy(0, dy);
        }
    },
    archive: function () {
        var match, urls;
        if (!(urls = Redirect_1.default.report(globals_1.g.BOARD.ID)).length) {
            return;
        }
        var form = (0, _1.default)('form');
        var types = _1.default.id('reportTypes');
        var message = (0, _1.default)('h3');
        var fieldset = _1.default.el('fieldset', {
            id: 'archive-report',
            hidden: true
        }, { innerHTML: ArchiveReport_html_1.default });
        var enabled = (0, _1.default)('#archive-report-enabled', fieldset);
        var reason = (0, _1.default)('#archive-report-reason', fieldset);
        var submit = (0, _1.default)('#archive-report-submit', fieldset);
        _1.default.on(enabled, 'change', function () {
            return reason.disabled = !this.checked;
        });
        if (form && types) {
            fieldset.hidden = !(0, _1.default)('[value="31"]', types).checked;
            _1.default.on(types, 'change', function (e) {
                fieldset.hidden = (e.target.value !== '31');
                return Report.fit('body');
            });
            _1.default.after(types, fieldset);
            Report.fit('body');
            _1.default.one(form, 'submit', function (e) {
                var _this = this;
                if (!fieldset.hidden && enabled.checked) {
                    e.preventDefault();
                    return Report.archiveSubmit(urls, reason.value, function (results) {
                        _this.action = '#archiveresults=' + encodeURIComponent(JSON.stringify(results));
                        return _this.submit();
                    });
                }
            });
        }
        else if (message) {
            fieldset.hidden = /Report submitted!/.test(message.textContent);
            _1.default.on(enabled, 'change', function () {
                return submit.hidden = !this.checked;
            });
            _1.default.after(message, fieldset);
            _1.default.on(submit, 'click', function () { return Report.archiveSubmit(urls, reason.value, Report.archiveResults); });
        }
        if (match = location.hash.match(/^#archiveresults=(.*)$/)) {
            try {
                return Report.archiveResults(JSON.parse(decodeURIComponent(match[1])));
            }
            catch (error) { }
        }
    },
    archiveSubmit: function (urls, reason, cb) {
        var form = _1.default.formData({
            board: globals_1.g.BOARD.ID,
            num: Report.postID,
            reason: reason
        });
        var results = [];
        for (var _i = 0, urls_1 = urls; _i < urls_1.length; _i++) {
            var _a = urls_1[_i], name = _a[0], url = _a[1];
            (function (name, url) {
                return _1.default.ajax(url, {
                    onloadend: function () {
                        results.push([name, this.response || { error: '' }]);
                        if (results.length === urls.length) {
                            return cb(results);
                        }
                    },
                    form: form
                });
            })(name, url);
        }
    },
    archiveResults: function (results) {
        var fieldset = _1.default.id('archive-report');
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var _a = results_1[_i], name = _a[0], response = _a[1];
            var line = _1.default.el('h3', { className: 'archive-report-response' });
            if ('success' in response) {
                _1.default.addClass(line, 'archive-report-success');
                line.textContent = "".concat(name, ": ").concat(response.success);
            }
            else {
                _1.default.addClass(line, 'archive-report-error');
                line.textContent = "".concat(name, ": ").concat(response.error || 'Error reporting post.');
            }
            if (fieldset) {
                _1.default.before(fieldset, line);
            }
            else {
                _1.default.add(globals_1.d.body, line);
            }
        }
    }
};
exports.default = Report;
