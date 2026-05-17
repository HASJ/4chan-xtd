"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArchivePost = void 0;
var Redirect_1 = require("./Redirect");
var jsx_1 = require("../globals/jsx");
var Callbacks_1 = require("../classes/Callbacks");
var ImageHost_1 = require("../Images/ImageHost");
var Board_1 = require("../classes/Board");
var Fetcher_1 = require("../classes/Fetcher");
var Post_1 = require("../classes/Post");
var Thread_1 = require("../classes/Thread");
var globals_1 = require("../globals/globals");
var helpers_1 = require("../platform/helpers");
var _1 = require("../platform/$");
var parseArchivePost = function (data, url) {
    var _a;
    var _b;
    // https://github.com/eksopl/asagi/blob/v0.4.0b74/src/main/java/net/easymodo/asagi/YotsubaAbstract.java#L82-L129
    // https://github.com/FoolCode/FoolFuuka/blob/800bd090835489e7e24371186db6e336f04b85c0/src/Model/Comment.php#L368-L428
    // https://github.com/bstats/b-stats/blob/6abe7bffaf6e5f523498d760e54b110df5331fbb/inc/classes/Yotsuba.php#L157-L168
    var comment = (data.comment || '').split(/(\n|\[\/?(?:b|spoiler|code|moot|banned|fortune(?: color="#\w+")?|i|red|green|blue)\])/);
    comment = comment.map(function (text, i) {
        if ((i % 2) === 1) {
            var tag = Fetcher_1.default.archiveTags[text.replace(/\ .*\]/, ']')];
            return (typeof tag === 'function') ? tag(text) : tag;
        }
        else {
            var greentext = text[0] === '>';
            text = text
                .replace(/(\[\/?[a-z]+):lit(\])/g, '$1$2')
                .split(/(>>(?:>\/[a-z\d]+\/)?\d+)/g)
                .map(function (text2, j) { return ((j % 2) ? "<span class=\"deadlink\">".concat((0, globals_1.E)(text2), "</span>") : (0, globals_1.E)(text2)); })
                .join('');
            return { innerHTML: (greentext ? "<span class=\"quote\">".concat(text, "</span>") : text) };
        }
    });
    comment = (_a = { innerHTML: globals_1.E.cat(comment) }, _a[jsx_1.isEscaped] = true, _a);
    var o = {
        ID: data.num,
        threadID: data.thread_num,
        boardID: data.board.shortname,
        isReply: data.num !== data.thread_num,
        fileDeleted: false,
        info: {
            subject: data.title,
            email: data.email,
            name: data.name || '',
            tripcode: data.trip,
            capcode: (function () {
                switch (data.capcode) {
                    // https://github.com/pleebe/FoolFuuka/blob/bf4224eed04637a4d0bd4411c2bf5f9945dfec0b/assets/themes/foolz/foolfuuka-theme-fuuka/src/Partial/Board.php#L77
                    case 'M': return 'Mod';
                    case 'A': return 'Admin';
                    case 'D': return 'Developer';
                    case 'V': return 'Verified';
                    case 'F': return 'Founder';
                    case 'G': return 'Manager';
                }
            })(),
            uniqueID: data.poster_hash,
            flagCode: data.poster_country,
            flagCodeTroll: data.troll_country_code,
            flag: data.poster_country_name || data.troll_country_name,
            dateUTC: data.timestamp,
            dateText: data.fourchan_date,
            commentHTML: comment,
        },
        file: null,
        extra: null,
    };
    if (o.info.capcode) {
        delete o.info.uniqueID;
    }
    if (data.media && !!+data.media.banned) {
        o.fileDeleted = true;
    }
    else if ((_b = data.media) === null || _b === void 0 ? void 0 : _b.media_filename) {
        var thumb_link = data.media.thumb_link;
        // Fix URLs missing origin
        if ((thumb_link === null || thumb_link === void 0 ? void 0 : thumb_link[0]) === '/') {
            thumb_link = url.split('/', 3).join('/') + thumb_link;
        }
        if (!Redirect_1.default.securityCheck(thumb_link)) {
            thumb_link = '';
        }
        var media_link = Redirect_1.default.to('file', { boardID: o.boardID, filename: data.media.media_orig });
        if (!Redirect_1.default.securityCheck(media_link)) {
            media_link = '';
        }
        o.file = {
            name: data.media.media_filename,
            url: media_link ||
                (o.boardID === 'f' ?
                    "".concat(location.protocol, "//").concat(ImageHost_1.default.flashHost(), "/").concat(o.boardID, "/").concat(encodeURIComponent((0, globals_1.E)(data.media.media_filename)))
                    :
                        "".concat(location.protocol, "//").concat(ImageHost_1.default.host(), "/").concat(o.boardID, "/").concat(data.media.media_orig)),
            height: data.media.media_h,
            width: data.media.media_w,
            MD5: data.media.media_hash,
            size: _1.default.bytesToString(data.media.media_size),
            thumbURL: thumb_link || "".concat(location.protocol, "//").concat(ImageHost_1.default.thumbHost(), "/").concat(o.boardID, "/").concat(data.media.preview_orig),
            theight: data.media.preview_h,
            twidth: data.media.preview_w,
            isSpoiler: data.media.spoiler === '1'
        };
        if (!/\.pdf$/.test(o.file.url)) {
            o.file.dimensions = "".concat(o.file.width, "x").concat(o.file.height);
        }
        if ((o.boardID === 'f') && data.media.exif) {
            o.file.tag = JSON.parse(data.media.exif).Tag;
        }
    }
    o.extra = (0, helpers_1.dict)();
    var board = globals_1.g.boards[o.boardID] ||
        new Board_1.default(o.boardID);
    var thread = globals_1.g.threads.get("".concat(o.boardID, ".").concat(o.threadID)) ||
        new Thread_1.default(o.threadID, board);
    var post = new Post_1.default(globals_1.g.SITE.Build.post(o), thread, board);
    post.resurrect();
    post.markAsFromArchive();
    if (post.file) {
        post.file.thumbURL = o.file.thumbURL;
    }
    Callbacks_1.default.Post.execute(post);
    return post;
};
exports.parseArchivePost = parseArchivePost;
exports.default = exports.parseArchivePost;
