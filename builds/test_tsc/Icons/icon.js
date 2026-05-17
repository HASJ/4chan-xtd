"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("../globals/globals");
var jsx_1 = require("../globals/jsx");
var faImage_1 = require("@fa/faImage");
var faEye_1 = require("@fa/faEye");
var faUpRightAndDownLeftFromCenter_1 = require("@fas/faUpRightAndDownLeftFromCenter");
var faComment_1 = require("@fa/faComment");
var faRotate_1 = require("@fas/faRotate");
var faWrench_1 = require("@fas/faWrench");
var faBolt_1 = require("@fas/faBolt");
var faPencil_1 = require("@fas/faPencil");
var faClipboard_1 = require("@fas/faClipboard");
var faClock_1 = require("@fa/faClock");
var faLink_1 = require("@fas/faLink");
var faShuffle_1 = require("@fas/faShuffle");
var faRotateLeft_1 = require("@fas/faRotateLeft");
var faDownload_1 = require("@fas/faDownload");
var faBookOpen_1 = require("@fas/faBookOpen");
var faDownLeftAndUpRightToCenter_1 = require("@fas/faDownLeftAndUpRightToCenter");
var faHeart_1 = require("@fas/faHeart");
var faCaretRight_1 = require("@fas/faCaretRight");
var faCaretLeft_1 = require("@fas/faCaretLeft");
var faCaretDown_1 = require("@fas/faCaretDown");
var faScissors_1 = require("@fas/faScissors");
var faXmark_1 = require("@fas/faXmark");
var faArrowRightLong_1 = require("@fas/faArrowRightLong");
var faPlus_1 = require("@fas/faPlus");
var faSquarePlus_1 = require("@fa/faSquarePlus");
var faSquareMinus_1 = require("@fa/faSquareMinus");
var faPlay_1 = require("@fas/faPlay");
var faStop_1 = require("@fas/faStop");
var faArrowUpLong_1 = require("@fas/faArrowUpLong");
var faArrowDownLong_1 = require("@fas/faArrowDownLong");
var toSvg = function (svgPathData, width, height) {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"icon\" viewBox=\"0 0 ".concat(width, " ").concat(height, "\">") +
        "<path d=\"".concat(svgPathData, "\" fill=\"currentColor\" /></svg>");
};
var icons = {
    image: toSvg(faImage_1.svgPathData, faImage_1.width, faImage_1.height),
    eye: toSvg(faEye_1.svgPathData, faEye_1.width, faEye_1.height),
    expand: toSvg(faUpRightAndDownLeftFromCenter_1.svgPathData, faUpRightAndDownLeftFromCenter_1.width, faUpRightAndDownLeftFromCenter_1.height),
    comment: toSvg(faComment_1.svgPathData, faComment_1.width, faComment_1.height),
    refresh: toSvg(faRotate_1.svgPathData, faRotate_1.width, faRotate_1.height),
    wrench: toSvg(faWrench_1.svgPathData, faWrench_1.width, faWrench_1.height),
    bolt: toSvg(faBolt_1.svgPathData, faBolt_1.width, faBolt_1.height),
    link: toSvg(faLink_1.svgPathData, faLink_1.width, faLink_1.height),
    pencil: toSvg(faPencil_1.svgPathData, faPencil_1.width, faPencil_1.height),
    clipboard: toSvg(faClipboard_1.svgPathData, faClipboard_1.width, faClipboard_1.height),
    clock: toSvg(faClock_1.svgPathData, faClock_1.width, faClock_1.height),
    shuffle: toSvg(faShuffle_1.svgPathData, faShuffle_1.width, faShuffle_1.height),
    undo: toSvg(faRotateLeft_1.svgPathData, faRotateLeft_1.width, faRotateLeft_1.height),
    download: toSvg(faDownload_1.svgPathData, faDownload_1.width, faDownload_1.height),
    bookOpen: toSvg(faBookOpen_1.svgPathData, faBookOpen_1.width, faBookOpen_1.height),
    shrink: toSvg(faDownLeftAndUpRightToCenter_1.svgPathData, faDownLeftAndUpRightToCenter_1.width, faDownLeftAndUpRightToCenter_1.height),
    heart: toSvg(faHeart_1.svgPathData, faHeart_1.width, faHeart_1.height),
    caretRight: toSvg(faCaretRight_1.svgPathData, faCaretRight_1.width, faCaretRight_1.height),
    caretLeft: toSvg(faCaretLeft_1.svgPathData, faCaretLeft_1.width, faCaretLeft_1.height),
    caretDown: toSvg(faCaretDown_1.svgPathData, faCaretDown_1.width, faCaretDown_1.height),
    scissors: toSvg(faScissors_1.svgPathData, faScissors_1.width, faScissors_1.height),
    xmark: toSvg(faXmark_1.svgPathData, faXmark_1.width, faXmark_1.height),
    arrowRightLong: toSvg(faArrowRightLong_1.svgPathData, faArrowRightLong_1.width, faArrowRightLong_1.height),
    plus: toSvg(faPlus_1.svgPathData, faPlus_1.width, faPlus_1.height),
    squarePlus: toSvg(faSquarePlus_1.svgPathData, faSquarePlus_1.width, faSquarePlus_1.height),
    squareMinus: toSvg(faSquareMinus_1.svgPathData, faSquareMinus_1.width, faSquareMinus_1.height),
    play: toSvg(faPlay_1.svgPathData, faPlay_1.width, faPlay_1.height),
    stop: toSvg(faStop_1.svgPathData, faStop_1.width, faStop_1.height),
    arrowUpLong: toSvg(faArrowUpLong_1.svgPathData, faArrowUpLong_1.width, faArrowUpLong_1.height),
    arrowDownLong: toSvg(faArrowDownLong_1.svgPathData, faArrowDownLong_1.width, faArrowDownLong_1.height)
};
var Icon = {
    /** Sets an icon in an HTML element */
    set: function (node, name, altText) {
        var html = icons[name];
        if (!html)
            throw new Error("Icon \"".concat(name, "\" not found."));
        if (altText) {
            node.innerHTML = "<span class=\"icon--alt-text\">".concat((0, globals_1.E)(altText), "</span>").concat(html);
        }
        else {
            node.innerHTML = html;
        }
    },
    /** Get the raw SVG string for an icon. */
    get: function (name) {
        return icons[name];
    },
    /** Get the raw SVG string for an icon wrapped for use in JSX. */
    raw: function (name) {
        var _a;
        return _a = { innerHTML: icons[name] }, _a[jsx_1.isEscaped] = true, _a;
    },
};
exports.default = Icon;
