"use strict";
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
exports.default = generateFileHtml;
var jsx_1 = require("../../globals/jsx");
function generateFileHtml(file, ID, boardID, fileURL, shortFilename, fileThumb, o, staticPath, gifIcon) {
    var _a;
    if (file) {
        var fileContent = [];
        if (boardID === "f") {
            fileContent.push((0, jsx_1.default)("div", { class: "fileInfo", "data-md5": file.MD5 },
                (0, jsx_1.default)("span", { class: "fileText", id: "fT".concat(ID) },
                    'File: ',
                    (0, jsx_1.default)("a", { "data-width": file.width, "data-height": file.height, href: fileURL, target: "_blank" }, file.name),
                    "-(",
                    file.size,
                    ", ",
                    file.dimensions,
                    file.tag ? ', ' + file.tag : '',
                    ")")));
        }
        else {
            fileContent.push((0, jsx_1.default)("div", { class: "fileText", id: "fT".concat(ID), title: file.isSpoiler ? file.name : null },
                'File: ',
                (0, jsx_1.default)("a", { title: file.name === shortFilename || file.isSpoiler ? null : file.name, href: fileURL, target: "_blank" }, file.isSpoiler ? 'Spoiler Image' : shortFilename), " (".concat(file.size, ", ").concat(file.dimensions || "PDF", ")")), (0, jsx_1.default)("a", { class: "fileThumb".concat(file.isSpoiler ? ' imgspoiler' : ''), href: fileURL, target: "_blank", "data-m": file.hasDownscale ? '' : null },
                (0, jsx_1.default)("img", { src: fileThumb, alt: file.size, "data-md5": file.MD5, style: "height: ".concat(file.isSpoiler ? '100' : file.theight, "px; width: ").concat(file.isSpoiler ? '100' : file.twidth, "px;"), loading: "lazy" })));
        }
        return jsx_1.default.apply(void 0, __spreadArray(["div", { class: "file", id: "f".concat(ID) }], fileContent, false));
    }
    else if (o.fileDeleted) {
        return (0, jsx_1.default)("div", { class: "file", id: "f".concat(ID) },
            (0, jsx_1.default)("span", { class: "fileThumb" },
                (0, jsx_1.default)("img", { src: "".concat(staticPath, "filedeleted-res").concat(gifIcon), alt: "File deleted.", class: "fileDeletedRes retina" })));
    }
    return _a = { innerHTML: '' }, _a[jsx_1.isEscaped] = true, _a;
}
