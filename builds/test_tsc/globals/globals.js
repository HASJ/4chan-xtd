"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.docSet = exports.c = exports.doc = exports.d = exports.E = exports.g = exports.Conf = void 0;
var version_json_1 = require("../../version.json");
var package_json_1 = require("../../package.json");
exports.Conf = Object.create(null);
exports.g = {
    VERSION: version_json_1.default.version,
    VERSION_DATE: new Date(version_json_1.default.date),
    NAMESPACE: package_json_1.default.name,
    sites: Object.create(null),
    boards: Object.create(null)
};
exports.E = (function () {
    var str = {
        '&': '&amp;',
        "'": '&#039;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;'
    };
    var regex = /[&"'<>]/g;
    var fn = function (x) {
        return str[x];
    };
    var output = function (text) {
        return text.toString().replace(regex, fn);
    };
    output.cat = function (templates) {
        var html = '';
        for (var i = 0; i < templates.length; i++) {
            html += templates[i].innerHTML;
        }
        return html;
    };
    return output;
})();
exports.d = document;
exports.doc = exports.d.documentElement;
exports.c = console;
var docSet = function () {
    // return (doc = d.documentElement);
    return exports.doc;
};
exports.docSet = docSet;
