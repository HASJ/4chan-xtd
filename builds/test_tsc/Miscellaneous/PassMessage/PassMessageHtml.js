"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_1 = require("../../globals/jsx");
var package_json_1 = require("../../../package.json");
var passMessagePage = (0, jsx_1.default)("div", { class: "box-inner" },
    (0, jsx_1.default)("div", { class: "boxbar" },
        (0, jsx_1.default)("h2", null,
            "Trouble buying a 4chan Pass? (a message from 4chan X)",
            (0, jsx_1.default)("a", { href: "javascript:;", style: "text-decoration: none; float: right; margin-right: 4px;", title: "Close" }, "\u00D7"))),
    (0, jsx_1.default)("div", { class: "boxcontent" },
        "Check the 4chan X wiki for ",
        (0, jsx_1.default)("a", { href: "".concat(package_json_1.default.captchaFAQ, "#alternatives"), target: "_blank", rel: "noopener" }, "alternative solutions"),
        "."));
exports.default = passMessagePage;
