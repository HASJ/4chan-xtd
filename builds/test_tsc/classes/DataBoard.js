"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
;
/**
 * This class handles data related to specific threads or posts. This data is automatically cleaned up when the thread
 * ages out.
 * TODO At this moment, .get and .set aren't fully typed yet.
 */
var DataBoard = /** @class */ (function () {
    function DataBoard(key, sync, dontClean) {
        if (dontClean === void 0) { dontClean = false; }
        var _this = this;
        this.changes = [];
        this.onSync = this.onSync.bind(this);
        this.key = key;
        this.initData(globals_1.Conf[this.key]);
        _1.default.sync(this.key, this.onSync);
        if (!dontClean)
            this.clean();
        if (!sync)
            return;
        // Chrome also fires the onChanged callback on the current tab,
        // so we only start syncing when we're ready.
        var init = function () {
            _1.default.off(globals_1.d, '4chanXInitFinished', init);
            _this.sync = sync;
        };
        _1.default.on(globals_1.d, '4chanXInitFinished', init);
    }
    DataBoard.prototype.initData = function (data) {
        var _a;
        var boards;
        this.data = data;
        if (this.data.boards) {
            var lastChecked = void 0;
            (_a = this.data, boards = _a.boards, lastChecked = _a.lastChecked);
            this.data['4chan.org'] = { boards: boards, lastChecked: lastChecked };
            delete this.data.boards;
            delete this.data.lastChecked;
        }
        return this.data[globals_1.g.SITE.ID] || (this.data[globals_1.g.SITE.ID] = { boards: (0, helpers_1.dict)() });
    };
    DataBoard.prototype.save = function (change, cb) {
        var _this = this;
        change();
        this.changes.push(change);
        return _1.default.get(this.key, { boards: (0, helpers_1.dict)() }, function (items) {
            if (!_this.changes.length) {
                return;
            }
            var needSync = ((items[_this.key].version || 0) > (_this.data.version || 0));
            if (needSync) {
                _this.initData(items[_this.key]);
                for (var _i = 0, _a = _this.changes; _i < _a.length; _i++) {
                    change = _a[_i];
                    change();
                }
            }
            _this.changes = [];
            _this.data.version = (_this.data.version || 0) + 1;
            return _1.default.set(_this.key, _this.data, function () {
                var _a;
                if (needSync) {
                    (_a = _this.sync) === null || _a === void 0 ? void 0 : _a.call(_this);
                }
                return cb === null || cb === void 0 ? void 0 : cb();
            });
        });
    };
    DataBoard.prototype.forceSync = function (cb) {
        var _this = this;
        return _1.default.get(this.key, { boards: (0, helpers_1.dict)() }, function (items) {
            var _a;
            if ((items[_this.key].version || 0) > (_this.data.version || 0)) {
                _this.initData(items[_this.key]);
                for (var _i = 0, _b = _this.changes; _i < _b.length; _i++) {
                    var change = _b[_i];
                    change();
                }
                (_a = _this.sync) === null || _a === void 0 ? void 0 : _a.call(_this);
            }
            return cb === null || cb === void 0 ? void 0 : cb();
        });
    };
    DataBoard.prototype.delete = function (_a, cb) {
        var _this = this;
        var siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID;
        if (!siteID) {
            siteID = globals_1.g.SITE.ID;
        }
        if (!this.data[siteID]) {
            return;
        }
        this.save(function () {
            var _a;
            if (postID) {
                if (!((_a = _this.data[siteID].boards[boardID]) === null || _a === void 0 ? void 0 : _a[threadID])) {
                    return;
                }
                delete _this.data[siteID].boards[boardID][threadID][postID];
                _this.deleteIfEmpty({ siteID: siteID, boardID: boardID, threadID: threadID });
            }
            else if (threadID) {
                if (!_this.data[siteID].boards[boardID]) {
                    return;
                }
                delete _this.data[siteID].boards[boardID][threadID];
                _this.deleteIfEmpty({ siteID: siteID, boardID: boardID });
            }
            else {
                delete _this.data[siteID].boards[boardID];
            }
        }, cb);
    };
    DataBoard.prototype.deleteIfEmpty = function (_a) {
        var siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID;
        if (!this.data[siteID]) {
            return;
        }
        if (threadID) {
            if (!Object.keys(this.data[siteID].boards[boardID][threadID]).length) {
                delete this.data[siteID].boards[boardID][threadID];
                this.deleteIfEmpty({ siteID: siteID, boardID: boardID });
            }
        }
        else if (!Object.keys(this.data[siteID].boards[boardID]).length) {
            delete this.data[siteID].boards[boardID];
        }
    };
    DataBoard.prototype.set = function (data, cb) {
        var _this = this;
        this.save(function () {
            _this.setUnsafe(data);
        }, cb);
    };
    DataBoard.prototype.setUnsafe = function (_a) {
        var siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID, val = _a.val;
        if (!siteID) {
            siteID = globals_1.g.SITE.ID;
        }
        if (!this.data[siteID])
            this.data[siteID] = { boards: (0, helpers_1.dict)() };
        var boards = this.data[siteID].boards;
        if (postID !== undefined) {
            var base = void 0;
            (((base = boards[boardID] || (boards[boardID] = (0, helpers_1.dict)())))[threadID] || (base[threadID] = (0, helpers_1.dict)()))[postID] = val;
        }
        else if (threadID !== undefined) {
            (boards[boardID] || (boards[boardID] = (0, helpers_1.dict)()))[threadID] = val;
        }
        else {
            boards[boardID] = val;
        }
    };
    DataBoard.prototype.extend = function (_a, cb) {
        var _this = this;
        var siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID, val = _a.val;
        this.save(function () {
            var oldVal = _this.get({ siteID: siteID, boardID: boardID, threadID: threadID, postID: postID, defaultValue: (0, helpers_1.dict)() });
            for (var key in val) {
                var subVal = val[key];
                if (typeof subVal === 'undefined') {
                    delete oldVal[key];
                }
                else {
                    oldVal[key] = subVal;
                }
            }
            _this.setUnsafe({ siteID: siteID, boardID: boardID, threadID: threadID, postID: postID, val: oldVal });
        }, cb);
    };
    DataBoard.prototype.setLastChecked = function (key) {
        var _this = this;
        if (key === void 0) { key = 'lastChecked'; }
        this.save(function () {
            _this.data[key] = Date.now();
        });
    };
    DataBoard.prototype.get = function (_a) {
        var _b;
        var siteID = _a.siteID, boardID = _a.boardID, threadID = _a.threadID, postID = _a.postID, defaultValue = _a.defaultValue;
        var board, val;
        if (!siteID) {
            siteID = globals_1.g.SITE.ID;
        }
        if (board = (_b = this.data[siteID]) === null || _b === void 0 ? void 0 : _b.boards[boardID]) {
            var thread = void 0;
            if (threadID == null) {
                if (postID != null) {
                    for (thread = 0; thread < board.length; thread++) {
                        if (postID in thread) {
                            val = thread[postID];
                            break;
                        }
                    }
                }
                else {
                    val = board;
                }
            }
            else if (thread = board[threadID]) {
                val = (postID != null) ? thread[postID] : thread;
            }
        }
        return val || defaultValue;
    };
    DataBoard.prototype.clean = function () {
        var boardID, middle;
        var siteID = globals_1.g.SITE.ID;
        for (boardID in this.data[siteID].boards) {
            this.deleteIfEmpty({ siteID: siteID, boardID: boardID });
        }
        var now = Date.now();
        if (now - (2 * helpers_1.HOUR) >= ((middle = this.data[siteID].lastChecked || 0)) || middle > now) {
            this.data[siteID].lastChecked = now;
            for (boardID in this.data[siteID].boards) {
                this.ajaxClean(boardID);
            }
        }
    };
    DataBoard.prototype.ajaxClean = function (boardID) {
        var _a, _b;
        var that = this;
        var siteID = globals_1.g.SITE.ID;
        var threadsList = (_b = (_a = globals_1.g.SITE.urls).threadsListJSON) === null || _b === void 0 ? void 0 : _b.call(_a, { siteID: siteID, boardID: boardID });
        if (!threadsList) {
            return;
        }
        _1.default.cache(threadsList, function () {
            var _a, _b;
            if (this.status !== 200) {
                return;
            }
            var archiveList = (_b = (_a = globals_1.g.SITE.urls).archiveListJSON) === null || _b === void 0 ? void 0 : _b.call(_a, { siteID: siteID, boardID: boardID });
            if (!archiveList)
                return that.ajaxCleanParse(boardID, this.response);
            var response1 = this.response;
            _1.default.cache(archiveList, function () {
                if ((this.status !== 200) && (!!globals_1.g.SITE.archivedBoardsKnown || (this.status !== 404))) {
                    return;
                }
                that.ajaxCleanParse(boardID, response1, this.response);
            });
        });
    };
    DataBoard.prototype.ajaxCleanParse = function (boardID, response1, response2) {
        var board, ID;
        var siteID = globals_1.g.SITE.ID;
        if (!(board = this.data[siteID].boards[boardID]))
            return;
        var threads = (0, helpers_1.dict)();
        if (response1) {
            for (var _i = 0, response1_1 = response1; _i < response1_1.length; _i++) {
                var page = response1_1[_i];
                for (var _a = 0, _b = page.threads; _a < _b.length; _a++) {
                    var thread = _b[_a];
                    ID = thread.no;
                    if (ID in board) {
                        threads[ID] = board[ID];
                    }
                }
            }
        }
        if (response2) {
            for (var _c = 0, response2_1 = response2; _c < response2_1.length; _c++) {
                ID = response2_1[_c];
                if (ID in board)
                    threads[ID] = board[ID];
            }
        }
        this.data[siteID].boards[boardID] = threads;
        this.deleteIfEmpty({ siteID: siteID, boardID: boardID });
        _1.default.set(this.key, this.data);
    };
    DataBoard.prototype.onSync = function (data) {
        var _a;
        if ((data.version || 0) <= (this.data.version || 0)) {
            return;
        }
        this.initData(data);
        (_a = this.sync) === null || _a === void 0 ? void 0 : _a.call(this);
    };
    DataBoard.keys = [
        'hiddenThreads',
        'hiddenPosts',
        'hiddenPosterIds',
        'lastReadPosts',
        'yourPosts',
        'watchedThreads',
        'watcherLastModified',
        'customTitles',
    ];
    return DataBoard;
}());
exports.default = DataBoard;
