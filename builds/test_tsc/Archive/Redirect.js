"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Notice_js_1 = require("../classes/Notice.js");
var globals_js_1 = require("../globals/globals.js");
var __js_1 = require("../platform/$.js");
var CrossOrigin_js_1 = require("../platform/CrossOrigin.js");
var helpers_js_1 = require("../platform/helpers.js");
var archives_json_1 = require("./archives.json");
var Redirect = {
    archives: archives_json_1.default,
    /** List of archives by compatible functions. */
    data: null,
    init: function () {
        this.selectArchives();
        if (globals_js_1.Conf['archiveAutoUpdate']) {
            var now = Date.now();
            if (now - (2 * helpers_js_1.DAY) >= globals_js_1.Conf['lastarchivecheck'] || globals_js_1.Conf['lastarchivecheck'] > now)
                this.update();
        }
    },
    selectArchives: function () {
        var o = {
            thread: new Map(),
            threadJSON: new Map(),
            post: new Map(),
            file: new Map(),
        };
        var archives = (0, helpers_js_1.dict)();
        for (var _i = 0, _a = globals_js_1.Conf['archives']; _i < _a.length; _i++) {
            var data = _a[_i];
            for (var _b = 0, _c = ['boards', 'files']; _b < _c.length; _b++) {
                var key = _c[_b];
                if (!(data[key] instanceof Array)) {
                    data[key] = [];
                }
            }
            var uid = data.uid, name_1 = data.name, boards = data.boards, files = data.files, software = data.software;
            if (!['fuuka', 'foolfuuka'].includes(software)) {
                continue;
            }
            archives[JSON.stringify(uid !== null && uid !== void 0 ? uid : name_1)] = data;
            for (var _d = 0, boards_1 = boards; _d < boards_1.length; _d++) {
                var boardID = boards_1[_d];
                if (!o.thread.has(boardID))
                    o.thread.set(boardID, data);
                if (!o.file.has(boardID) && files.includes(boardID))
                    o.file.set(boardID, data);
                if (software === 'foolfuuka') {
                    if (!o.threadJSON.has(boardID))
                        o.threadJSON.set(boardID, data);
                    if (!o.post.has(boardID))
                        o.post.set(boardID, data);
                }
            }
        }
        for (var boardID in globals_js_1.Conf['selectedArchives']) {
            var record = globals_js_1.Conf['selectedArchives'][boardID];
            for (var _e = 0, _f = Object.entries(record); _e < _f.length; _e++) {
                var _g = _f[_e], type = _g[0], id = _g[1];
                var archive;
                if ((archive = archives[JSON.stringify(id)]) && __js_1.default.hasOwn(o, type)) {
                    var boards = type === 'file' ? archive.files : archive.boards;
                    if (boards.includes(boardID)) {
                        o[type].set(boardID, archive);
                    }
                }
            }
        }
        Redirect.data = o;
    },
    update: function (cb) {
        var url;
        var urls = [];
        var responses = [];
        var nloaded = 0;
        for (var _i = 0, _a = globals_js_1.Conf['archiveLists'].split('\n'); _i < _a.length; _i++) {
            url = _a[_i];
            if (url[0] !== '#') {
                url = url.trim();
                if (url) {
                    urls.push(url);
                }
            }
        }
        var fail = function (url, action, msg) { return new Notice_js_1.default('warning', "Error ".concat(action, " archive data from\n").concat(url, "\n").concat(msg), 20); };
        var load = function (i) { return (function () {
            if (this.status !== 200) {
                return fail(urls[i], 'fetching', (this.status ? "Error ".concat(this.statusText, " (").concat(this.status, ")") : 'Connection Error'));
            }
            var response = this.response;
            if (!(response instanceof Array)) {
                response = [response];
            }
            responses[i] = response;
            nloaded++;
            if (nloaded === urls.length) {
                return Redirect.parse(responses, cb);
            }
        }); };
        if (urls.length) {
            for (var i = 0; i < urls.length; i++) {
                url = urls[i];
                if (['[', '{'].includes(url[0])) {
                    var response;
                    try {
                        response = JSON.parse(url);
                    }
                    catch (err) {
                        fail(url, 'parsing', err.message);
                        continue;
                    }
                    load(i).call({ status: 200, response: response });
                }
                else {
                    CrossOrigin_js_1.default.ajax(url, { onloadend: load(i) });
                }
            }
        }
        else {
            Redirect.parse([], cb);
        }
    },
    parse: function (responses, cb) {
        var _a;
        var archives = [];
        var archiveUIDs = (0, helpers_js_1.dict)();
        for (var _i = 0, responses_1 = responses; _i < responses_1.length; _i++) {
            var response = responses_1[_i];
            for (var _b = 0, response_1 = response; _b < response_1.length; _b++) {
                var data = response_1[_b];
                var uid = JSON.stringify((_a = data.uid) !== null && _a !== void 0 ? _a : data.name);
                if (uid in archiveUIDs) {
                    __js_1.default.extend(archiveUIDs[uid], data);
                }
                else {
                    archiveUIDs[uid] = helpers_js_1.dict.clone(data);
                    archives.push(data);
                }
            }
        }
        var items = { archives: archives, lastarchivecheck: Date.now() };
        __js_1.default.set(items);
        __js_1.default.extend(globals_js_1.Conf, items);
        Redirect.selectArchives();
        return cb === null || cb === void 0 ? void 0 : cb();
    },
    to: function (dest, data) {
        var archive = (['search', 'board'].includes(dest) ? Redirect.data.thread : Redirect.data[dest]).get(data.boardID);
        if (!archive) {
            return '';
        }
        return Redirect[dest](archive, data);
    },
    protocol: function (archive) {
        var protocol = location.protocol;
        if (!__js_1.default.getOwn(archive, protocol.slice(0, -1))) {
            protocol = protocol === 'https:' ? 'http:' : 'https:';
        }
        return "".concat(protocol, "//");
    },
    thread: function (archive, _a) {
        var boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID;
        // Keep the post number only if the location.hash was sent f.e.
        var path = threadID ?
            "".concat(boardID, "/thread/").concat(threadID)
            :
                "".concat(boardID, "/post/").concat(postID);
        if (archive.software === 'foolfuuka') {
            path += '/';
        }
        if (threadID && postID) {
            path += archive.software === 'foolfuuka' ?
                "#".concat(postID)
                :
                    "#p".concat(postID);
        }
        return "".concat(Redirect.protocol(archive)).concat(archive.domain, "/").concat(path);
    },
    threadJSON: function (archive, _a) {
        var boardID = _a.boardID, threadID = _a.threadID;
        return "".concat(Redirect.protocol(archive)).concat(archive.domain, "/_/api/chan/thread/?board=").concat(boardID, "&num=").concat(threadID);
    },
    post: function (archive, _a) {
        var boardID = _a.boardID, postID = _a.postID;
        // For fuuka-based archives:
        // https://github.com/eksopl/fuuka/issues/27
        var protocol = Redirect.protocol(archive);
        var url = "".concat(protocol).concat(archive.domain, "/_/api/chan/post/?board=").concat(boardID, "&num=").concat(postID);
        if (!Redirect.securityCheck(url)) {
            return '';
        }
        return url;
    },
    file: function (archive, _a) {
        var boardID = _a.boardID, filename = _a.filename;
        if (!filename) {
            return '';
        }
        if (boardID === 'f') {
            filename = encodeURIComponent(__js_1.default.unescape(decodeURIComponent(filename)));
        }
        else {
            if (/[sm]\.jpg$/.test(filename)) {
                return '';
            }
        }
        if (archive.name.endsWith('arch.b4k.co') || archive.name.endsWith('palanq.win')) {
            var _b = filename.split('.'), timeStamp = _b[0], ext = _b[1];
            if (timeStamp.length > 13) {
                // remove last 3 digits
                filename = "".concat(timeStamp.slice(0, -3), ".").concat(ext);
            }
        }
        return "".concat(Redirect.protocol(archive)).concat(archive.domain, "/").concat(boardID, "/full_image/").concat(filename);
    },
    board: function (archive, _a) {
        var boardID = _a.boardID;
        return "".concat(Redirect.protocol(archive)).concat(archive.domain, "/").concat(boardID, "/");
    },
    search: function (archive, _a) {
        var boardID = _a.boardID, type = _a.type, value = _a.value;
        type = type === 'name' ?
            'username'
            : type === 'MD5' ?
                'image'
                :
                    type;
        if (type === 'capcode') {
            // https://github.com/pleebe/FoolFuuka/blob/bf4224eed04637a4d0bd4411c2bf5f9945dfec0b/src/Model/Search.php#L363
            value = __js_1.default.getOwn({
                'Developer': 'dev',
                'Verified': 'ver'
            }, value) || value.toLowerCase();
        }
        else if (type === 'image') {
            value = value.replace(/[+/=]/g, function (c) { return ({ '+': '-', '/': '_', '=': '' })[c]; });
        }
        value = encodeURIComponent(value);
        var path = archive.software === 'foolfuuka' ?
            "".concat(boardID, "/search/").concat(type, "/").concat(value, "/")
            : type === 'image' ?
                "".concat(boardID, "/image/").concat(value)
                :
                    "".concat(boardID, "/?task=search2&search_").concat(type, "=").concat(value);
        return "".concat(Redirect.protocol(archive)).concat(archive.domain, "/").concat(path);
    },
    report: function (boardID) {
        var urls = [];
        for (var _i = 0, _a = globals_js_1.Conf['archives']; _i < _a.length; _i++) {
            var archive = _a[_i];
            var software = archive.software, https = archive.https, reports = archive.reports, boards = archive.boards, name = archive.name, domain = archive.domain;
            if ((software === 'foolfuuka') && https && reports && boards instanceof Array && boards.includes(boardID)) {
                urls.push([name, "https://".concat(domain, "/_/api/chan/offsite_report/")]);
            }
        }
        return urls;
    },
    securityCheck: function (url) {
        return /^https:\/\//.test(url) ||
            (location.protocol === 'http:') ||
            globals_js_1.Conf['Exempt Archives from Encryption'];
    },
    navigate: function (dest, data, alternative) {
        if (!Redirect.data) {
            Redirect.init();
        }
        var url = Redirect.to(dest, data);
        if (url && (Redirect.securityCheck(url) ||
            confirm("Redirect to ".concat(url, "?\n\nYour connection will not be encrypted.")))) {
            return location.replace(url);
        }
        else if (alternative) {
            return location.replace(alternative);
        }
    }
};
exports.default = Redirect;
