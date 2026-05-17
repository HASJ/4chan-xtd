"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var Notice_1 = require("../classes/Notice");
var globals_1 = require("../globals/globals");
var _1 = require("../platform/$");
var helpers_1 = require("../platform/helpers");
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var BoardConfig = {
    cbs: [],
    init: function () {
        var middle;
        if (globals_1.g.SITE.software !== 'yotsuba') {
            return;
        }
        var now = Date.now();
        if (now - (2 * helpers_1.HOUR) >= ((middle = globals_1.Conf['boardConfig'].lastChecked || 0)) || middle > now) {
            return _1.default.ajax("".concat(location.protocol, "//a.4cdn.org/boards.json"), { onloadend: this.load });
        }
        else {
            var boards = globals_1.Conf['boardConfig'].boards;
            return this.set(boards);
        }
    },
    load: function () {
        var _this = this;
        var boards;
        if ((this.status === 200) && this.response && this.response.boards) {
            boards = (0, helpers_1.dict)();
            for (var _i = 0, _a = this.response.boards; _i < _a.length; _i++) {
                var board = _a[_i];
                boards[board.board] = board;
            }
            _1.default.set('boardConfig', { boards: boards, lastChecked: Date.now() });
        }
        else {
            (boards = globals_1.Conf['boardConfig'].boards);
            var err = (function () {
                switch (_this.status) {
                    case 0: return 'Connection Error';
                    case 200: return 'Invalid Data';
                    default: return "Error ".concat(_this.statusText, " (").concat(_this.status, ")");
                }
            })();
            new Notice_1.default('warning', "Failed to load board configuration. ".concat(err), 20);
        }
        return BoardConfig.set(boards);
    },
    set: function (boards) {
        this.boards = boards;
        for (var ID in globals_1.g.boards) {
            var board = globals_1.g.boards[ID];
            board.config = this.boards[ID] || {};
        }
        for (var _i = 0, _a = this.cbs; _i < _a.length; _i++) {
            var cb = _a[_i];
            _1.default.queueTask(cb);
        }
    },
    ready: function (cb) {
        if (this.boards) {
            return cb();
        }
        else {
            return this.cbs.push(cb);
        }
    },
    sfwBoards: function (sfw) {
        var _this = this;
        return (function () {
            var result = [];
            var object = _this.boards || globals_1.Conf['boardConfig'].boards;
            for (var board in object) {
                var data = object[board];
                if (!!data.ws_board === sfw) {
                    result.push(board);
                }
            }
            return result;
        })();
    },
    isSFW: function (board) {
        var _a;
        return !!((_a = (this.boards || globals_1.Conf['boardConfig'].boards)[board]) === null || _a === void 0 ? void 0 : _a.ws_board);
    },
    domain: function (board) {
        // return `boards.${BoardConfig.isSFW(board) ? '4channel' : '4chan'}.org`;
        return 'boards.4chan.org';
    },
    isArchived: function (board) {
        // assume archive exists if no data available to prevent cleaning of archived threads
        var data = (this.boards || globals_1.Conf['boardConfig'].boards)[board];
        return !data || data.is_archived;
    },
    noAudio: function (boardID) {
        if (globals_1.g.SITE.software !== 'yotsuba') {
            return false;
        }
        var boards = this.boards || globals_1.Conf['boardConfig'].boards;
        return boards && boards[boardID] && !boards[boardID].webm_audio;
    },
    title: function (boardID) {
        var _a, _b;
        return ((_b = (_a = (this.boards || globals_1.Conf['boardConfig'].boards)) === null || _a === void 0 ? void 0 : _a[boardID]) === null || _b === void 0 ? void 0 : _b.title) || '';
    }
};
exports.default = BoardConfig;
