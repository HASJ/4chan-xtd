"use strict";
// cSpell:ignore installGentoo, webfont
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../platform/$");
var burichan_css_1 = require("./burichan.css");
var futaba_css_1 = require("./futaba.css");
var linkify_audio_png_1 = require("./linkify.audio.png");
var linkify_bitchute_png_1 = require("./linkify.bitchute.png");
var linkify_clyp_png_1 = require("./linkify.clyp.png");
var linkify_dailymotion_png_1 = require("./linkify.dailymotion.png");
var linkify_gfycat_png_1 = require("./linkify.gfycat.png");
var linkify_gist_png_1 = require("./linkify.gist.png");
var linkify_image_png_1 = require("./linkify.image.png");
var linkify_installgentoo_png_1 = require("./linkify.installgentoo.png");
var linkify_liveleak_png_1 = require("./linkify.liveleak.png");
var linkify_pastebin_png_1 = require("./linkify.pastebin.png");
var linkify_peertube_png_1 = require("./linkify.peertube.png");
var linkify_soundcloud_png_1 = require("./linkify.soundcloud.png");
var linkify_streamable_png_1 = require("./linkify.streamable.png");
var linkify_twitchtv_png_1 = require("./linkify.twitchtv.png");
var linkify_x_png_1 = require("./linkify.x.png");
var linkify_video_png_1 = require("./linkify.video.png");
var linkify_vidlii_png_1 = require("./linkify.vidlii.png");
var linkify_vimeo_png_1 = require("./linkify.vimeo.png");
var linkify_vine_png_1 = require("./linkify.vine.png");
var linkify_vocaroo_png_1 = require("./linkify.vocaroo.png");
var linkify_youtube_png_1 = require("./linkify.youtube.png");
var variableBase_css_1 = require("./variableBase.css");
var photon_css_1 = require("./photon.css");
var report_css_1 = require("./report.css");
var spooky_css_1 = require("./spooky.css");
var style_css_1 = require("./style.css");
var tomorrow_css_1 = require("./tomorrow.css");
var www_css_1 = require("./www.css");
var yotsuba_b_css_1 = require("./yotsuba-b.css");
var yotsuba_css_1 = require("./yotsuba.css");
var style_1 = require("./style");
var globals_1 = require("../globals/globals");
var icons_css_1 = require("../Icons/icons.css");
var FxTwitter_css_1 = require("../Linkification/Embedding/FxTwitter.css");
var mainCSS = style_css_1.default + variableBase_css_1.default + yotsuba_css_1.default + yotsuba_b_css_1.default + futaba_css_1.default + burichan_css_1.default + tomorrow_css_1.default + photon_css_1.default + spooky_css_1.default + icons_css_1.default + FxTwitter_css_1.default;
var faIcons = [
    { name: "audio", data: linkify_audio_png_1.default },
    { name: "bitchute", data: linkify_bitchute_png_1.default },
    { name: "clyp", data: linkify_clyp_png_1.default },
    { name: "dailymotion", data: linkify_dailymotion_png_1.default },
    { name: "gfycat", data: linkify_gfycat_png_1.default },
    { name: "gist", data: linkify_gist_png_1.default },
    { name: "image", data: linkify_image_png_1.default },
    { name: "installgentoo", data: linkify_installgentoo_png_1.default },
    { name: "liveleak", data: linkify_liveleak_png_1.default },
    { name: "pastebin", data: linkify_pastebin_png_1.default },
    { name: "peertube", data: linkify_peertube_png_1.default },
    { name: "soundcloud", data: linkify_soundcloud_png_1.default },
    { name: "streamable", data: linkify_streamable_png_1.default },
    { name: "twitchtv", data: linkify_twitchtv_png_1.default },
    { name: "twitter", data: linkify_x_png_1.default },
    { name: "video", data: linkify_video_png_1.default },
    { name: "vidlii", data: linkify_vidlii_png_1.default },
    { name: "vimeo", data: linkify_vimeo_png_1.default },
    { name: "vine", data: linkify_vine_png_1.default },
    { name: "vocaroo", data: linkify_vocaroo_png_1.default },
    { name: "youtube", data: linkify_youtube_png_1.default },
];
var CSS = {
    boards: mainCSS + (0, style_1.icons)(faIcons),
    report: report_css_1.default,
    www: www_css_1.default,
    sub: function (css) {
        var variables = {
            site: globals_1.g.SITE.selectors
        };
        return css.replace(/\$[\w\$]+/g, function (name) {
            var words = name.slice(1).split('$');
            var sel = variables;
            for (var i = 0; i < words.length; i++) {
                if (typeof sel !== 'object')
                    return ':not(*)';
                sel = _1.default.getOwn(sel, words[i]);
            }
            if (typeof sel !== 'string')
                return ':not(*)';
            return sel;
        });
    }
};
exports.default = CSS;
