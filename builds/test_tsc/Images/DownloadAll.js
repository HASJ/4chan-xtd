"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("../globals/globals");
var Header_1 = require("../General/Header");
var icon_1 = require("../Icons/icon");
var _1 = require("../platform/$");
var CrossOrigin_1 = require("../platform/CrossOrigin");
var Notice_1 = require("../classes/Notice");
var DownloadAll = {
    queue: [],
    isDownloading: false,
    getDownloadedSet: function (threadID) {
        try {
            var stored = localStorage.getItem("4chan-xt-downloaded-".concat(threadID));
            if (stored) {
                var parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return new Set(parsed);
            }
        }
        catch (e) { }
        return new Set();
    },
    addDownloadedUrl: function (threadID, url) {
        var downloadedSet = DownloadAll.getDownloadedSet(threadID);
        downloadedSet.add(url);
        try {
            localStorage.setItem("4chan-xt-downloaded-".concat(threadID), JSON.stringify(Array.from(downloadedSet)));
        }
        catch (e) { }
    },
    init: function () {
        if (!['index', 'thread'].includes(globals_1.g.VIEW) || !globals_1.Conf['Download All Media'])
            return;
        if (globals_1.g.VIEW === 'thread') {
            var el = _1.default.el('a', {
                href: 'javascript:;',
                title: 'Download All Media',
                className: 'download-all-link'
            });
            icon_1.default.set(el, 'download', 'Download All Media');
            _1.default.on(el, 'click', function (e) {
                e.preventDefault();
                var thread = globals_1.g.threads.get("".concat(globals_1.g.BOARD.ID, ".").concat(globals_1.g.THREADID));
                if (thread)
                    DownloadAll.queueThread(thread);
            });
            Header_1.default.addShortcut('download-all', el, 526);
        }
    },
    queueThread: function (thread) {
        var _a;
        var OP = thread.OP;
        var excerpt = (((_a = OP.info.subject) === null || _a === void 0 ? void 0 : _a.trim()) || OP.commentDisplay().replace(/\n+/g, ' ').trim() || '')
            .replace(/[\\/:*?"<>|]/g, '-')
            .slice(0, 50)
            .trim();
        var folderName = excerpt ? "".concat(thread.ID, " - ").concat(excerpt) : "".concat(thread.ID);
        var downloadedSet = DownloadAll.getDownloadedSet(thread.ID);
        var addedCount = 0;
        var fileIndex = 1;
        thread.posts.forEach(function (post) {
            if (post.isClone || post.isHidden)
                return;
            if (post.files) {
                post.files.forEach(function (file) {
                    if (!file.isDead && file.url) {
                        // Check if already in queue or downloaded
                        var inQueue = DownloadAll.queue.some(function (item) { return item.file.url === file.url; });
                        if (!inQueue && !downloadedSet.has(file.url)) {
                            var paddedIndex = String(fileIndex).padStart(3, '0');
                            var seqName = "".concat(paddedIndex, " - ").concat(file.name);
                            DownloadAll.queue.push({ file: file, folderName: folderName, seqName: seqName, threadID: thread.ID });
                            addedCount++;
                        }
                        // Increment fileIndex regardless of whether it's in the queue to maintain accurate ordering relative to the thread
                        fileIndex++;
                    }
                });
            }
        });
        if (addedCount === 0) {
            new Notice_1.default('info', 'No new media to download.', 3);
        }
        else {
            new Notice_1.default('info', "Added ".concat(addedCount, " files to download queue."), 3);
            DownloadAll.processQueue();
        }
    },
    processQueue: function () {
        if (DownloadAll.isDownloading || DownloadAll.queue.length === 0)
            return;
        DownloadAll.isDownloading = true;
        var _loop_1 = function () {
            var item = DownloadAll.queue.shift();
            if (!item)
                return "break";
            var file = item.file, folderName = item.folderName, seqName = item.seqName, threadID = item.threadID;
            DownloadAll.addDownloadedUrl(threadID, file.url);
            var GM_download_fn = typeof GM_download !== 'undefined' ? GM_download : (typeof GM !== 'undefined' && typeof GM.download !== 'undefined' ? GM.download : null);
            if (GM_download_fn) {
                GM_download_fn({
                    url: file.url,
                    name: "".concat(folderName, "/").concat(seqName),
                    saveAs: false,
                    onload: function () { },
                    onerror: function () {
                        new Notice_1.default('warning', "Could not download ".concat(file.url), 5);
                    }
                });
            }
            else {
                // Use fallback async download (breaks while loop)
                CrossOrigin_1.default.file(file.url, function (blob) {
                    if (blob) {
                        var a_1 = _1.default.el('a', {
                            href: URL.createObjectURL(blob),
                            download: "".concat(folderName, "/").concat(seqName),
                            hidden: true
                        });
                        _1.default.add(globals_1.d.body, a_1);
                        a_1.click();
                        setTimeout(function () {
                            URL.revokeObjectURL(a_1.href);
                            _1.default.rm(a_1);
                            DownloadAll.isDownloading = false;
                            DownloadAll.processQueue();
                        }, 500); // 500ms stagger
                    }
                    else {
                        new Notice_1.default('warning', "Could not download ".concat(file.url), 5);
                        DownloadAll.isDownloading = false;
                        DownloadAll.processQueue();
                    }
                });
                return { value: void 0 };
            }
        };
        while (DownloadAll.queue.length > 0) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object")
                return state_1.value;
            if (state_1 === "break")
                break;
        }
        // We only reach here if GM_download processed everything synchronously
        DownloadAll.isDownloading = false;
    }
};
exports.default = DownloadAll;
