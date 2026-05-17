"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("../../globals/globals");
var jsx_1 = require("../../globals/jsx");
var package_json_1 = require("../../../package.json");
// \u00A0 is non breaking space
var separator = '\u00A0|\u00A0';
var settingsHtml = (0, jsx_1.default)("div", { id: "fourchanx-settings", class: "dialog" },
    (0, jsx_1.default)("nav", null,
        (0, jsx_1.default)("div", { class: "sections-list" }),
        (0, jsx_1.default)("p", { class: "imp-exp-result warning" }),
        (0, jsx_1.default)("div", { class: "credits" },
            (0, jsx_1.default)("a", { href: "javascript:;", class: "export" }, "Export"),
            separator,
            (0, jsx_1.default)("a", { href: "javascript:;", class: "import" }, "Import"),
            separator,
            (0, jsx_1.default)("a", { href: "javascript:;", class: "reset" }, "Reset Settings"),
            separator,
            (0, jsx_1.default)("input", { type: "file", hidden: true, accept: ".json,application/json" }),
            (0, jsx_1.default)("a", { href: package_json_1.default.page, target: "_blank" }, package_json_1.default.name),
            separator,
            (0, jsx_1.default)("a", { href: package_json_1.default.changelog, target: "_blank" }, globals_1.g.VERSION),
            separator,
            (0, jsx_1.default)("a", { href: package_json_1.default.issues, target: "_blank" }, "Issues"),
            separator,
            (0, jsx_1.default)("a", { href: "javascript:;", class: "close", title: "Close" }, "\u2715"))),
    (0, jsx_1.default)("div", { class: "section-container" },
        (0, jsx_1.default)("section", null)));
exports.default = settingsHtml;
