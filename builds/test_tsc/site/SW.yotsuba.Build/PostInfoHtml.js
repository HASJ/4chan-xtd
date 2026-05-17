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
exports.default = generatePostInfoHtml;
var globals_1 = require("../../globals/globals");
var jsx_1 = require("../../globals/jsx");
function generatePostInfoHtml(ID, o, subject, capcode, email, name, tripcode, pass, capcodeLC, capcodePlural, staticPath, gifIcon, capcodeDescription, uniqueID, flag, flagCode, flagCodeTroll, dateUTC, dateText, postLink, quoteLink, boardID, threadID) {
    var nameHtml = [(0, jsx_1.default)("span", { class: "name".concat(capcode ? ' capcode' : '') }, name)];
    if (tripcode)
        nameHtml.push(' ', (0, jsx_1.default)("span", { class: "postertrip" }, tripcode));
    if (pass)
        nameHtml.push(' ', (0, jsx_1.default)("span", { title: "Pass user since ".concat(pass), class: "n-pu" }));
    if (capcode) {
        nameHtml.push(' ', (0, jsx_1.default)("strong", { class: "capcode hand id_".concat(capcodeLC), title: "Highlight posts by ".concat(capcodePlural) },
            "## ",
            capcode));
    }
    var nameBlockContent = email ? [' ', jsx_1.default.apply(void 0, __spreadArray(["a", { href: "mailto:".concat(email), class: "useremail" }], nameHtml, false))] : nameHtml;
    if (!(boardID === "f" && !o.isReply || capcodeDescription))
        nameBlockContent.push(' ');
    if (capcodeDescription) {
        nameBlockContent.push((0, jsx_1.default)("img", { src: "".concat(staticPath).concat(capcodeLC, "icon").concat(gifIcon), alt: "".concat(capcode, " Icon"), title: "This user is ".concat(capcodeDescription, "."), class: "identityIcon retina" }));
    }
    if (uniqueID && !capcode) {
        nameBlockContent.push((0, jsx_1.default)("span", { class: "posteruid id_".concat(uniqueID) },
            "(ID: ",
            (0, jsx_1.default)("span", { class: "hand", title: "Highlight posts by this ID" }, uniqueID),
            ")"));
    }
    if (flagCode)
        nameBlockContent.push(' ', (0, jsx_1.default)("span", { title: flag, class: "flag flag-".concat(flagCode.toLowerCase()) }));
    if (flagCodeTroll)
        nameBlockContent.push(' ', (0, jsx_1.default)("span", { title: flag, class: "bfl bfl-".concat(flagCodeTroll.toLowerCase()) }));
    var postNumContent = [
        (0, jsx_1.default)("a", { href: postLink, title: "Link to this post" }, "No."),
        (0, jsx_1.default)("a", { href: quoteLink, title: "Reply to this post" }, ID),
    ];
    if (o.isSticky) {
        var src = "".concat(staticPath, "sticky").concat(gifIcon);
        postNumContent.push(' ');
        if (boardID === "f") {
            postNumContent.push((0, jsx_1.default)("img", { src: src, alt: "Sticky", title: "Sticky", style: "height: 18px; width: 18px;" }));
        }
        else {
            postNumContent.push((0, jsx_1.default)("img", { src: src, alt: "Sticky", title: "Sticky", class: "stickyIcon retina" }));
        }
    }
    if (o.isClosed && !o.isArchived) {
        postNumContent.push(' ');
        var src = "".concat(staticPath, "closed").concat(gifIcon);
        if (boardID === "f") {
            postNumContent.push((0, jsx_1.default)("img", { src: src, alt: "Closed", title: "Closed", style: "height: 18px; width: 18px;" }));
        }
        else {
            postNumContent.push((0, jsx_1.default)("img", { src: src, alt: "Closed", title: "Closed", class: "closedIcon retina" }));
        }
    }
    if (o.isArchived) {
        postNumContent.push(' ', (0, jsx_1.default)("img", { src: "".concat(staticPath, "archived").concat(gifIcon), alt: "Archived", title: "Archived", class: "archivedIcon retina" }));
    }
    if (!o.isReply && globals_1.g.VIEW === "index") {
        postNumContent.push(' \u00A0 ', // \u00A0 is nbsp
        (0, jsx_1.default)("span", null,
            "[",
            (0, jsx_1.default)("a", { href: "/".concat(boardID, "/thread/").concat(threadID), class: "replylink" }, "Reply"),
            "]"));
    }
    return jsx_1.default.apply(void 0, __spreadArray(__spreadArray(["div", { class: "postInfo desktop", id: "pi".concat(ID) }, (0, jsx_1.default)("input", { type: "checkbox", name: ID, value: "delete" }), ' '], ((!o.isReply || boardID === "f" || subject) ? [(0, jsx_1.default)("span", { class: "subject" }, subject), ' '] : []), false), [jsx_1.default.apply(void 0, __spreadArray(["span", { class: "nameBlock".concat(capcode ? " capcode".concat(capcode) : '') }], nameBlockContent, false)),
        ' ', (0, jsx_1.default)("span", { class: "dateTime", "data-utc": dateUTC }, dateText), ' ',
        jsx_1.default.apply(void 0, __spreadArray(["span", { class: "postNum".concat(!(boardID === " f" && !o.isReply) ? ' desktop' : '') }], postNumContent, false))
    ], false));
}
