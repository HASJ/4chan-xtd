"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateCatalogThreadHtml;
var jsx_1 = require("../../globals/jsx");
function generateCatalogThreadHtml(thread, src, imgClass, data, postCount, fileCount, pageCount, staticPath, gifIcon) {
    return (0, jsx_1.default)(jsx_1.hFragment, null,
        (0, jsx_1.default)("a", { class: "catalog-link", href: "/".concat(thread.board, "/thread/").concat(thread.ID) }, imgClass ?
            (0, jsx_1.default)("img", { src: src, class: "catalog-thumb ".concat(imgClass) }) :
            (0, jsx_1.default)("img", { src: src, class: "catalog-thumb", "data-width": data.tn_w, "data-height": data.tn_h })),
        (0, jsx_1.default)("div", { class: "catalog-stats" },
            (0, jsx_1.default)("span", { title: "Posts / Files / Page" },
                (0, jsx_1.default)("span", { class: "post-count".concat(data.bumplimit ? ' warning' : '') }, postCount),
                ' / ',
                (0, jsx_1.default)("span", { class: "file-count".concat(data.imagelimit ? ' warning' : '') }, fileCount),
                ' / ',
                (0, jsx_1.default)("span", { class: "page-count" }, pageCount)),
            (0, jsx_1.default)("span", { class: "catalog-icons" },
                thread.isSticky ? (0, jsx_1.default)("img", { src: "".concat(staticPath, "sticky").concat(gifIcon), class: "stickyIcon", title: "Sticky" }) : '',
                thread.isClosed ? (0, jsx_1.default)("img", { src: "".concat(staticPath, "closed").concat(gifIcon), class: "closedIcon", title: "Closed" }) : '')));
}
