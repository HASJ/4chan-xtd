"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.icons = void 0;
// == Create CSS for Link Title Favicons == //
var icons = function (data) { return ('/* Link Title Favicons */\n' +
    data.map(function (_a) {
        var name = _a.name, data = _a.data;
        return ".linkify.".concat(name, "::before {\n  content: \"\";\n  background: transparent url('data:image/png;base64,").concat(data, "') center left no-repeat!important;\n  padding-left: 18px;\n}\n");
    }).join('')); };
exports.icons = icons;
