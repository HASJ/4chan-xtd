"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
var SettingsHtml_1 = require("./Settings/SettingsHtml");
var Filter_guide_html_1 = require("./Settings/Filter-guide.html");
var Sauce_html_1 = require("./Settings/Sauce.html");
var Advanced_html_1 = require("./Settings/Advanced.html");
var Keybinds_html_1 = require("./Settings/Keybinds.html");
var Filter_select_html_1 = require("./Settings/Filter-select.html");
var Export_html_1 = require("./Settings/Export.html");
var Redirect_1 = require("../Archive/Redirect");
var Config_1 = require("../config/Config");
var ImageHost_1 = require("../Images/ImageHost");
var CustomCSS_1 = require("../Miscellaneous/CustomCSS");
var FileInfo_1 = require("../Miscellaneous/FileInfo");
var Keybinds_1 = require("../Miscellaneous/Keybinds");
var Time_1 = require("../Miscellaneous/Time");
var Favicon_1 = require("../Monitoring/Favicon");
var ThreadUpdater_1 = require("../Monitoring/ThreadUpdater");
var Unread_1 = require("../Monitoring/Unread");
var __1 = require("../platform/$$");
var _1 = require("../platform/$");
var package_json_1 = require("../../package.json");
var globals_1 = require("../globals/globals");
var Header_1 = require("./Header");
var jsx_1 = require("../globals/jsx");
var helpers_1 = require("../platform/helpers");
var icon_1 = require("../Icons/icon");
var UI_1 = require("./UI");
var Settings = {
    dialog: undefined,
    init: function () {
        // 4chan X settings link
        var link = _1.default.el('a', {
            className: 'settings-link',
            title: "".concat(package_json_1.default.name, " Settings"),
            href: 'javascript:;'
        });
        icon_1.default.set(link, 'wrench', 'Settings');
        _1.default.on(link, 'click', Settings.open);
        Header_1.default.addShortcut('settings', link, 820);
        var add = this.addSection;
        add('Main', this.main);
        add('Filter', this.filter);
        add('Sauce', this.sauce);
        add('Advanced', this.advanced);
        add('Keybinds', this.keybinds);
        _1.default.on(globals_1.d, 'AddSettingsSection', Settings.addSection);
        _1.default.on(globals_1.d, 'OpenSettings', function (e) { return Settings.open(e.detail); });
        if ((globals_1.g.SITE.software === 'yotsuba') && globals_1.Conf['Disable Native Extension']) {
            if (_1.default.hasStorage) {
                // Run in page context to handle case where 4chan X has localStorage access but not the page.
                // (e.g. Pale Moon 26.2.2, GM 3.8, cookies disabled for 4chan only)
                _1.default.global('disableNativeExtension');
            }
            else {
                _1.default.global('disableNativeExtensionNoStorage');
            }
        }
    },
    open: function (openSection) {
        var dialog, sectionToOpen;
        if (Settings.dialog) {
            return;
        }
        _1.default.event('CloseMenu');
        Settings.dialog = (dialog = _1.default.el('div', { id: 'overlay' }, SettingsHtml_1.default));
        _1.default.on((0, _1.default)('.export', dialog), 'click', Settings.export);
        _1.default.on((0, _1.default)('.import', dialog), 'click', Settings.import);
        _1.default.on((0, _1.default)('.reset', dialog), 'click', Settings.reset);
        _1.default.on((0, _1.default)('input', dialog), 'change', Settings.onImport);
        var links = [];
        for (var _i = 0, _a = Settings.sections; _i < _a.length; _i++) {
            var section = _a[_i];
            var link = _1.default.el('a', {
                className: "tab-".concat(section.hyphenatedTitle),
                textContent: section.title,
                href: 'javascript:;'
            });
            _1.default.on(link, 'click', Settings.openSection.bind(section));
            links.push(link, _1.default.tn(' | '));
            if (section.title === openSection) {
                sectionToOpen = link;
            }
        }
        links.pop();
        _1.default.add((0, _1.default)('.sections-list', dialog), links);
        if (openSection !== 'none') {
            (sectionToOpen ? sectionToOpen : links[0]).click();
        }
        icon_1.default.set((0, _1.default)('.close', dialog), 'xmark');
        _1.default.on((0, _1.default)('.close', dialog), 'click', Settings.close);
        _1.default.on(window, 'beforeunload', Settings.close);
        _1.default.on(dialog, 'click', function () {
            var _a, _b;
            // Do not close when the mouse ends up outside the modal when selecting text in an input.
            if (((_a = globals_1.d.activeElement) === null || _a === void 0 ? void 0 : _a.tagName) === 'INPUT' || ((_b = globals_1.d.activeElement) === null || _b === void 0 ? void 0 : _b.tagName) === 'TEXTAREA')
                return;
            Settings.close();
        });
        _1.default.on(dialog.firstElementChild, 'click', function (e) { return e.stopPropagation(); });
        _1.default.add(globals_1.d.body, dialog);
        links[0].focus();
        _1.default.event('OpenSettings', null, dialog);
    },
    close: function () {
        var _a;
        if (!Settings.dialog) {
            return;
        }
        // Unfocus current field to trigger change event.
        (_a = globals_1.d.activeElement) === null || _a === void 0 ? void 0 : _a.blur();
        _1.default.rm(Settings.dialog);
        delete Settings.dialog;
    },
    sections: [],
    addSection: function (title, open) {
        var _a;
        if (typeof title !== 'string') {
            (_a = title.detail, title = _a.title, open = _a.open);
        }
        var hyphenatedTitle = title.toLowerCase().replace(/\s+/g, '-');
        Settings.sections.push({ title: title, hyphenatedTitle: hyphenatedTitle, open: open });
    },
    openSection: function () {
        var selected;
        if (selected = (0, _1.default)('.tab-selected', Settings.dialog)) {
            _1.default.rmClass(selected, 'tab-selected');
        }
        _1.default.addClass((0, _1.default)(".tab-".concat(this.hyphenatedTitle), Settings.dialog), 'tab-selected');
        var section = (0, _1.default)('section', Settings.dialog);
        _1.default.rmAll(section);
        section.className = "section-".concat(this.hyphenatedTitle);
        this.open(section, globals_1.g);
        section.scrollTop = 0;
        _1.default.event('OpenSettings', null, section);
    },
    warnings: {
        localStorage: function (cb) {
            if (_1.default.cantSync) {
                var why = _1.default.cantSet ? 'save your settings' : 'synchronize settings between tabs';
                cb(_1.default.el('li', {
                    textContent: "".concat(package_json_1.default.name, " needs local storage to ").concat(why, ".\nEnable it on boards.").concat(location.hostname.split('.')[1], ".org in your browser's privacy settings (may be listed as part of \"local data\" or \"cookies\").")
                }));
            }
        },
        ads: function (cb) {
            _1.default.onExists(globals_1.doc, '.adg-rects > .desktop', function (ad) { return _1.default.onExists(ad, 'iframe', function () {
                var url = Redirect_1.default.to('thread', { boardID: 'qa', threadID: 362590 });
                cb(_1.default.el('li', (0, jsx_1.default)(jsx_1.hFragment, null,
                    "To protect yourself from ",
                    (0, jsx_1.default)("a", { href: url, target: "_blank" }, "malicious ads"),
                    ", you should ",
                    (0, jsx_1.default)("a", { href: "https://github.com/gorhill/uBlock#ublock-origin", target: "_blank" }, "block ads"),
                    " on 4chan.")));
            }); });
        }
    },
    main: function (section) {
        var key;
        var warnings = _1.default.el('fieldset', { hidden: true }, { innerHTML: '<legend>Warnings</legend><ul></ul>' });
        var addWarning = function (item) {
            _1.default.add((0, _1.default)('ul', warnings), item);
            warnings.hidden = false;
        };
        for (key in Settings.warnings) {
            var warning = Settings.warnings[key];
            warning(addWarning);
        }
        _1.default.add(section, warnings);
        var items = (0, helpers_1.dict)();
        var inputs = (0, helpers_1.dict)();
        var addCheckboxes = function (root, obj) {
            var containers = [root];
            var result = [];
            for (key in obj) {
                var arr = obj[key];
                if (arr instanceof Array) {
                    var description = arr[1];
                    var div = _1.default.el('div', { innerHTML: "<label><input type=\"checkbox\" name=\"".concat(key, "\">").concat(key, "</label><span class=\"description\">: ").concat(description, "</span>") });
                    div.dataset.name = key;
                    var input = (0, _1.default)('input', div);
                    _1.default.on(input, 'change', _1.default.cb.checked);
                    _1.default.on(input, 'change', function () { this.parentNode.parentNode.dataset.checked = this.checked; });
                    items[key] = globals_1.Conf[key];
                    inputs[key] = input;
                    var level = arr[2] || 0;
                    if (containers.length <= level) {
                        var container = _1.default.el('div', { className: 'suboption-list' });
                        _1.default.add(containers[containers.length - 1].lastElementChild, container);
                        containers[level] = container;
                    }
                    else if (containers.length > (level + 1)) {
                        containers.splice(level + 1, containers.length - (level + 1));
                    }
                    result.push(_1.default.add(containers[level], div));
                }
            }
            return result;
        };
        for (var keyFS in Config_1.default.main) {
            var obj = Config_1.default.main[keyFS];
            var fs = _1.default.el('fieldset', { innerHTML: "<legend>".concat(keyFS, "</legend>") });
            addCheckboxes(fs, obj);
            if (keyFS === 'Posting and Captchas') {
                _1.default.add(fs, _1.default.el('p', { innerHTML: 'For more info on captcha options and issues, see the <a href="' + package_json_1.default.captchaFAQ + '" target="_blank">captcha FAQ</a>.' }));
            }
            _1.default.add(section, fs);
        }
        addCheckboxes((0, _1.default)('div[data-name="JSON Index"] > .suboption-list', section), Config_1.default.Index);
        _1.default.get(items, function (items) {
            for (key in items) {
                var val = items[key];
                inputs[key].checked = val;
                inputs[key].parentNode.parentNode.dataset.checked = val;
            }
        });
        var div = _1.default.el('div', { innerHTML: '<button></button><span class="description">: Clear manually-hidden threads and posts on all boards. Reload the page to apply.' });
        var button = (0, _1.default)('button', div);
        _1.default.get({ hiddenThreads: (0, helpers_1.dict)(), hiddenPosts: (0, helpers_1.dict)() }, function (_a) {
            var hiddenThreads = _a.hiddenThreads, hiddenPosts = _a.hiddenPosts;
            var board, ID, site, thread;
            var hiddenNum = 0;
            for (ID in hiddenThreads) {
                site = hiddenThreads[ID];
                if (ID !== 'boards') {
                    for (ID in site.boards) {
                        board = site.boards[ID];
                        hiddenNum += Object.keys(board).length;
                    }
                }
            }
            for (ID in hiddenThreads.boards) {
                board = hiddenThreads.boards[ID];
                hiddenNum += Object.keys(board).length;
            }
            for (ID in hiddenPosts) {
                site = hiddenPosts[ID];
                if (ID !== 'boards') {
                    for (ID in site.boards) {
                        board = site.boards[ID];
                        for (ID in board) {
                            thread = board[ID];
                            hiddenNum += Object.keys(thread).length;
                        }
                    }
                }
            }
            for (ID in hiddenPosts.boards) {
                board = hiddenPosts.boards[ID];
                for (ID in board) {
                    thread = board[ID];
                    hiddenNum += Object.keys(thread).length;
                }
            }
            button.textContent = "Hidden: ".concat(hiddenNum);
        });
        _1.default.on(button, 'click', function () {
            this.textContent = 'Hidden: 0';
            _1.default.get('hiddenThreads', (0, helpers_1.dict)(), function (_a) {
                var _b;
                var hiddenThreads = _a.hiddenThreads;
                if (_1.default.hasStorage && (globals_1.g.SITE.software === 'yotsuba')) {
                    var boardID = void 0;
                    for (boardID in (_b = hiddenThreads['4chan.org']) === null || _b === void 0 ? void 0 : _b.boards) {
                        localStorage.removeItem("4chan-hide-t-".concat(boardID));
                    }
                    for (boardID in hiddenThreads.boards) {
                        localStorage.removeItem("4chan-hide-t-".concat(boardID));
                    }
                }
                _1.default.delete(['hiddenThreads', 'hiddenPosts']);
            });
        });
        (0, _1.default)('input[name="Stubs"]', section).closest('fieldset').insertAdjacentElement('beforeend', div);
    },
    isExportModalOpen: false,
    export: function () {
        return __awaiter(this, void 0, void 0, function () {
            var exportHistory, cancelled, dialog_1, form_1, _a, history_1, ask_1, exportBtnRect, Conf2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        exportHistory = globals_1.Conf['Export History'];
                        cancelled = false;
                        if (!globals_1.Conf['Ask to Export History']) return [3 /*break*/, 2];
                        if (Settings.isExportModalOpen)
                            return [2 /*return*/];
                        dialog_1 = UI_1.default.dialog('export-dialog', { innerHTML: Export_html_1.default });
                        form_1 = (0, _1.default)('form', dialog_1);
                        _a = form_1.elements, history_1 = _a.history, ask_1 = _a.ask;
                        history_1.checked = globals_1.Conf['Export History'];
                        _1.default.add(globals_1.d.body, dialog_1);
                        exportBtnRect = (0, _1.default)('.export', Settings.dialog).getBoundingClientRect();
                        dialog_1.style.top = "".concat(exportBtnRect.y + exportBtnRect.height, "px");
                        dialog_1.style.left = "".concat(exportBtnRect.x, "px");
                        Settings.isExportModalOpen = true;
                        return [4 /*yield*/, new Promise(function (resolve) {
                                var close = function () {
                                    dialog_1.remove();
                                    resolve();
                                    Settings.isExportModalOpen = false;
                                };
                                _1.default.on(form_1, 'submit', function (e) {
                                    e.preventDefault();
                                    exportHistory = history_1.checked;
                                    _1.default.set('Export History', exportHistory);
                                    _1.default.set('Ask to Export History', ask_1.checked);
                                    close();
                                });
                                _1.default.on((0, _1.default)('#cancel-export', dialog_1), 'click', function () {
                                    cancelled = true;
                                    close();
                                });
                            })];
                    case 1:
                        _b.sent();
                        if (cancelled)
                            return [2 /*return*/];
                        _b.label = 2;
                    case 2:
                        Conf2 = (0, helpers_1.dict)();
                        _1.default.extend(Conf2, globals_1.Conf);
                        if (!exportHistory) {
                            delete Conf2.hiddenThreads;
                            delete Conf2.hiddenPosts;
                            delete Conf2.hiddenPosterIds;
                            delete Conf2.lastReadPosts;
                            delete Conf2.yourPosts;
                            delete Conf2.watchedThreads;
                            delete Conf2.cooldowns;
                            delete Conf2['Index Sort'];
                        }
                        _1.default.get(Conf2, function (Conf2) {
                            // Don't export cached JSON data.
                            delete Conf2['boardConfig'];
                            Settings.downloadExport({ version: globals_1.g.VERSION, date: Date.now(), Conf: Conf2 });
                        });
                        return [2 /*return*/];
                }
            });
        });
    },
    downloadExport: function (data) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = _1.default.el('a', {
            download: "".concat(package_json_1.default.name, " v").concat(globals_1.g.VERSION, "-").concat(data.date, ".json"),
            href: url
        });
        var p = (0, _1.default)('.imp-exp-result', Settings.dialog);
        _1.default.rmAll(p);
        _1.default.add(p, a);
        a.click();
    },
    import: function () {
        (0, _1.default)('input[type=file]', this.parentNode).click();
    },
    onImport: function () {
        var file;
        if (!(file = this.files[0])) {
            return;
        }
        this.value = null;
        var output = (0, _1.default)('.imp-exp-result');
        if (!confirm('Your current settings will be entirely overwritten, are you sure?')) {
            output.textContent = 'Import aborted.';
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                Settings.loadSettings(helpers_1.dict.json(e.target.result), function (err) {
                    if (err) {
                        output.textContent = 'Import failed due to an error.';
                    }
                    else if (confirm('Import successful. Reload now?')) {
                        window.location.reload();
                    }
                });
            }
            catch (error) {
                var err = error;
                output.textContent = 'Import failed due to an error.';
                globals_1.c.error(err.stack);
            }
        };
        reader.readAsText(file);
    },
    upgrade: function (data, version) {
        var corrupted, key, val;
        var changes = (0, helpers_1.dict)();
        var set = function (key, value) { return data[key] = (changes[key] = value); };
        // XXX https://github.com/greasemonkey/greasemonkey/issues/2600
        if (corrupted = (version[0] === '"')) {
            try {
                version = JSON.parse(version);
            }
            catch (error) { }
        }
        var compareString = version.replace(/^XT /i, '').replace(/\d+/g, function (x) { return x.padStart(5, '0'); });
        if (corrupted) {
            for (key in data) {
                val = data[key];
                if (typeof val === 'string') {
                    try {
                        var val2 = JSON.parse(val);
                        set(key, val2);
                    }
                    catch (error1) { }
                }
            }
        }
        if (compareString < '00001.00014.00016.00001') {
            if (data['archiveLists'] != null) {
                set('archiveLists', data['archiveLists'].replace('https://mayhemydg.github.io/archives.json/archives.json', 'https://nstepien.github.io/archives.json/archives.json'));
            }
        }
        if (compareString < '00001.00014.00016.00007') {
            if (data['sauces'] != null) {
                set('sauces', data['sauces'].replace(/https:\/\/www\.deviantart\.com\/gallery\/#\/d%\$1%\$2;regexp:\/\^\\w\+_by_\\w\+\[_-\]d\(\[\\da-z\]\{6\}\)\\b\|\^d\(\[\\da-z\]\{6\}\)-\[\\da-z\]\{8\}-\//g, 'javascript:void(open("https://www.deviantart.com/"+%$1.replace(/_/g,"-")+"/art/"+parseInt(%$2,36)));regexp:/^\\w+_by_(\\w+)[_-]d([\\da-z]{6})\\b/').replace(/\/\/imgops\.com\/%URL/g, '//imgops.com/start?url=%URL'));
            }
        }
        if (compareString < '00001.00014.00017.00002') {
            if (data['jsWhitelist'] != null) {
                set('jsWhitelist', data['jsWhitelist'] + '\n\nhttps://hcaptcha.com\nhttps://*.hcaptcha.com');
            }
        }
        if (compareString < '00001.00014.00020.00004') {
            if (data['archiveLists'] != null) {
                set('archiveLists', data['archiveLists'].replace('https://nstepien.github.io/archives.json/archives.json', 'https://4chenz.github.io/archives.json/archives.json'));
            }
        }
        if (compareString < '00001.00014.00022.00003') {
            if (data['sauces']) {
                set('sauces', data['sauces'].replace(/^#?\s*https:\/\/www\.google\.com\/searchbyimage\?image_url=%(IMG|T?URL)&safe=off(?=$|;)/mg, 'https://www.google.com/searchbyimage?sbisrc=4chanx&image_url=%$1&safe=off'));
                if (compareString === '00001.00014.00022.00002' && !/\bsbisrc=/.test(data['sauces'])) {
                    set('sauces', data['sauces'].replace(/^#?\s*https:\/\/lens\.google\.com\/uploadbyurl\?url=%(IMG|T?URL)(?=$|;)/m, 'https://www.google.com/searchbyimage?sbisrc=4chanx&image_url=%$1&safe=off'));
                }
            }
        }
        if (compareString < '00002.00003.00001.00000') {
            if (data['boardnav']) {
                set('boardnav', data['boardnav'].replace('[external-text:"FAQ","4chan XT"]', "[external-text:\"FAQ\",\"".concat(package_json_1.default.faq, "\"]")));
            }
        }
        if (compareString < '00002.00003.00006.00000') {
            set('RelativeTime', data['Relative Post Dates'] ? (data['Relative Date Title'] ? 'Hover' : 'Show') : 'No');
        }
        if (compareString === '00002.00009.00000.00000') {
            set('XEmbedder', data['Embed Tweets inline with fxTwitter'] ? 'fxt' : 'tf');
            set('fxtMaxReplies', data['Resolve Tweet Replies'] ? (data['Resolve all Tweet Replies'] ? 100 : 1) : 0);
            set('fxtLang', data['Translate non-English Tweets to English'] ? 'en' : '');
        }
        return changes;
    },
    loadSettings: function (data, cb) {
        if (data.version !== globals_1.g.VERSION) {
            Settings.upgrade(data.Conf, data.version);
        }
        _1.default.clear(function (err) {
            if (err) {
                return cb(err);
            }
            _1.default.set(data.Conf, cb);
        });
    },
    reset: function () {
        if (confirm('Your current settings will be entirely wiped, are you sure?')) {
            _1.default.clear(function (err) {
                if (err) {
                    (0, _1.default)('.imp-exp-result').textContent = 'Import failed due to an error.';
                }
                else if (confirm('Reset successful. Reload now?')) {
                    window.location.reload();
                }
            });
        }
    },
    filter: function (section) {
        _1.default.extend(section, { innerHTML: Filter_select_html_1.default });
        var select = (0, _1.default)('select', section);
        _1.default.on(select, 'change', Settings.selectFilter);
        Settings.selectFilter.call(select);
    },
    selectFilter: function () {
        var name;
        var div = this.nextElementSibling;
        if ((name = this.value) !== 'guide') {
            if (!_1.default.hasOwn(Config_1.default.filter, name)) {
                return;
            }
            _1.default.rmAll(div);
            var ta_1 = _1.default.el('textarea', {
                name: name,
                className: 'field',
                spellcheck: false
            });
            _1.default.on(ta_1, 'change', _1.default.cb.value);
            _1.default.get(name, globals_1.Conf[name], function (item) {
                ta_1.value = item[name];
                _1.default.add(div, ta_1);
            });
            return;
        }
        var filterTypes = Object.keys(Config_1.default.filter)
            .filter(function (x) { return x !== 'general'; })
            .join(',\u200B'); // \u200B is zero width space, to control where line breaks happen on a narrow screen
        _1.default.extend(div, { innerHTML: Filter_guide_html_1.default });
        (0, _1.default)('#filterTypes', div).textContent = "type:\u200B".concat(filterTypes, ";");
        (0, _1.default)('.warning', div).hidden = globals_1.Conf['Filter'];
    },
    sauce: function (section) {
        _1.default.extend(section, { innerHTML: Sauce_html_1.default });
        (0, _1.default)('.warning', section).hidden = globals_1.Conf['Sauce'];
        var ta = (0, _1.default)('textarea', section);
        _1.default.get('sauces', globals_1.Conf['sauces'], function (item) {
            ta.value = item['sauces'];
            ta.hidden = false;
        }); // XXX prevent Firefox from adding initialization to undo queue
        _1.default.on(ta, 'change', _1.default.cb.value);
    },
    advanced: function (section) {
        var input, name;
        _1.default.extend(section, { innerHTML: Advanced_html_1.default });
        for (var _i = 0, _a = (0, __1.default)('.warning', section); _i < _a.length; _i++) {
            var warning = _a[_i];
            warning.hidden = globals_1.Conf[warning.dataset.feature];
        }
        var inputs = (0, helpers_1.dict)();
        for (var _b = 0, _c = (0, __1.default)('[name]', section); _b < _c.length; _b++) {
            input = _c[_b];
            inputs[input.name] = input;
        }
        _1.default.on(inputs['archiveLists'], 'change', function () {
            _1.default.set('lastarchivecheck', 0);
            globals_1.Conf['lastarchivecheck'] = 0;
            _1.default.id('lastarchivecheck').textContent = 'never';
        });
        var items = (0, helpers_1.dict)();
        for (name in inputs) {
            input = inputs[name];
            if (!['Interval', 'Custom CSS', 'timeLocale'].includes(name)) {
                items[name] = globals_1.Conf[name];
                var event = ((input.nodeName === 'SELECT') ||
                    ['checkbox', 'radio'].includes(input.type) ||
                    ((input.nodeName === 'TEXTAREA') && !(name in Settings))) ? 'change' : 'input';
                _1.default.on(input, event, _1.default.cb[input.type === 'checkbox' ? 'checked' : 'value']);
                if (name in Settings) {
                    _1.default.on(input, event, Settings[name]);
                }
            }
        }
        _1.default.get(items, function (items) {
            for (var key in items) {
                var val = items[key];
                input = inputs[key];
                input[input.type === 'checkbox' ? 'checked' : 'value'] = val;
                input.hidden = false; // XXX prevent Firefox from adding initialization to undo queue
                if (key in Settings) {
                    Settings[key].call(input);
                }
            }
        });
        var listImageHost = _1.default.id('list-fourchanImageHost');
        for (var _d = 0, _e = ImageHost_1.default.suggestions; _d < _e.length; _d++) {
            var textContent = _e[_d];
            _1.default.add(listImageHost, _1.default.el('option', { textContent: textContent }));
        }
        var interval = inputs['Interval'];
        var customCSS = inputs['Custom CSS'];
        var applyCSS = (0, _1.default)('#apply-css', section);
        var timeLocale = inputs.timeLocale;
        interval.value = globals_1.Conf['Interval'];
        customCSS.checked = globals_1.Conf['Custom CSS'];
        inputs['usercss'].disabled = !globals_1.Conf['Custom CSS'];
        applyCSS.disabled = !globals_1.Conf['Custom CSS'];
        timeLocale.value = globals_1.Conf.timeLocale;
        _1.default.on(interval, 'change', ThreadUpdater_1.default.cb.interval);
        _1.default.on(customCSS, 'change', Settings.togglecss);
        _1.default.on(applyCSS, 'click', function () { return CustomCSS_1.default.update(); });
        _1.default.on(timeLocale, 'change', Settings.setTimeLocale);
        var itemsArchive = (0, helpers_1.dict)();
        for (var _f = 0, _g = ['archives', 'selectedArchives', 'lastarchivecheck']; _f < _g.length; _f++) {
            name = _g[_f];
            itemsArchive[name] = globals_1.Conf[name];
        }
        _1.default.get(itemsArchive, function (itemsArchive) {
            _1.default.extend(globals_1.Conf, itemsArchive);
            Redirect_1.default.selectArchives();
            Settings.addArchiveTable(section);
        });
        var boardSelect = (0, _1.default)('#archive-board-select', section);
        var table = (0, _1.default)('#archive-table', section);
        var updateArchives = (0, _1.default)('#update-archives', section);
        _1.default.on(boardSelect, 'change', function () {
            (0, _1.default)('tbody > :not([hidden])', table).hidden = true;
            (0, _1.default)("tbody > .".concat(this.value), table).hidden = false;
        });
        _1.default.on(updateArchives, 'click', function () { return Redirect_1.default.update(function () { return Settings.addArchiveTable(section); }); });
        _1.default.on(inputs.beepVolume, 'change', function () { ThreadUpdater_1.default.playBeep(false); });
        _1.default.on(inputs.beepSource, 'change', function () { ThreadUpdater_1.default.playBeep(false); });
    },
    addArchiveTable: function (section) {
        var boardID, o;
        (0, _1.default)('#lastarchivecheck', section).textContent = globals_1.Conf['lastarchivecheck'] === 0 ?
            'never'
            :
                new Date(globals_1.Conf['lastarchivecheck']).toLocaleString();
        var boardSelect = (0, _1.default)('#archive-board-select', section);
        var table = (0, _1.default)('#archive-table', section);
        var tbody = (0, _1.default)('tbody', section);
        _1.default.rmAll(boardSelect);
        _1.default.rmAll(tbody);
        var archBoards = (0, helpers_1.dict)();
        for (var _i = 0, _a = globals_1.Conf['archives']; _i < _a.length; _i++) {
            var _b = _a[_i], uid = _b.uid, name = _b.name, boards = _b.boards, files = _b.files, software = _b.software;
            if (!['fuuka', 'foolfuuka'].includes(software)) {
                continue;
            }
            for (var _c = 0, boards_1 = boards; _c < boards_1.length; _c++) {
                boardID = boards_1[_c];
                o = archBoards[boardID] || (archBoards[boardID] = {
                    thread: [],
                    threadJSON: [],
                    post: [],
                    file: []
                });
                if (!o.threadJSON)
                    o.threadJSON = [];
                var archive = [uid !== null && uid !== void 0 ? uid : name, name];
                o.thread.push(archive);
                if (software === 'foolfuuka') {
                    o.post.push(archive);
                    o.threadJSON.push(archive);
                }
                if (files.includes(boardID)) {
                    o.file.push(archive);
                }
            }
        }
        var rows = [];
        var boardOptions = [];
        for (var _d = 0, _e = Object.keys(archBoards).sort(); _d < _e.length; _d++) { // Alphabetical order
            boardID = _e[_d];
            var row = _1.default.el('tr', { className: "board-".concat(boardID) });
            row.hidden = boardID !== globals_1.g.BOARD.ID;
            boardOptions.push(_1.default.el('option', {
                textContent: "/".concat(boardID, "/"),
                value: "board-".concat(boardID),
                selected: boardID === globals_1.g.BOARD.ID
            }));
            o = archBoards[boardID];
            for (var _f = 0, _g = ['thread', 'threadJSON', 'post', 'file']; _f < _g.length; _f++) {
                var item = _g[_f];
                _1.default.add(row, Settings.addArchiveCell(boardID, o, item));
            }
            rows.push(row);
        }
        if (rows.length === 0) {
            boardSelect.hidden = (table.hidden = true);
            return;
        }
        boardSelect.hidden = (table.hidden = false);
        if (!(globals_1.g.BOARD.ID in archBoards)) {
            rows[0].hidden = false;
        }
        _1.default.add(boardSelect, boardOptions);
        _1.default.add(tbody, rows);
        for (boardID in globals_1.Conf['selectedArchives']) {
            var data = globals_1.Conf['selectedArchives'][boardID];
            for (var type in data) {
                var select;
                var id = data[type];
                if (select = (0, _1.default)("select[data-boardid='".concat(boardID, "'][data-type='").concat(type, "']"), tbody)) {
                    select.value = JSON.stringify(id);
                    if (!select.value) {
                        select.value = select.firstChild.value;
                    }
                }
            }
        }
    },
    addArchiveCell: function (boardID, data, type) {
        var length = data[type].length;
        var td = _1.default.el('td', { className: 'archive-cell' });
        if (!length) {
            td.textContent = '--';
            return td;
        }
        var options = [];
        var i = 0;
        while (i < length) {
            var archive = data[type][i++];
            options.push(_1.default.el('option', {
                value: JSON.stringify(archive[0]),
                textContent: archive[1]
            }));
        }
        _1.default.extend(td, { innerHTML: '<select></select>' });
        var select = td.firstElementChild;
        if (!(select.disabled = length === 1)) {
            // XXX GM can't into datasets
            select.setAttribute('data-boardid', boardID);
            select.setAttribute('data-type', type);
            _1.default.on(select, 'change', Settings.saveSelectedArchive);
        }
        _1.default.add(select, options);
        return td;
    },
    saveSelectedArchive: function () {
        var _this = this;
        _1.default.get('selectedArchives', globals_1.Conf['selectedArchives'], function (_a) {
            var selectedArchives = _a.selectedArchives;
            (selectedArchives[_this.dataset.boardid] || (selectedArchives[_this.dataset.boardid] = (0, helpers_1.dict)()))[_this.dataset.type] = JSON.parse(_this.value);
            _1.default.set('selectedArchives', selectedArchives);
            globals_1.Conf['selectedArchives'] = selectedArchives;
            Redirect_1.default.selectArchives();
        });
    },
    boardnav: function () {
        Header_1.default.generateBoardList(this.value);
    },
    time: function () {
        this.nextElementSibling.textContent = Time_1.default.format(new Date(), this.value);
    },
    timeLocale: function () {
        Settings.time.call((0, _1.default)('[name=time]', Settings.dialog));
    },
    backlink: function () {
        this.nextElementSibling.textContent = this.value.replace(/%(?:id|%)/g, function (x) { return ({ '%id': '123456789', '%%': '%' })[x]; });
    },
    fileInfo: function () {
        var data = {
            isReply: true,
            file: {
                url: "//".concat(ImageHost_1.default.host(), "/g/1334437723720.jpg"),
                name: 'd9bb2efc98dd0df141a94399ff5880b7.jpg',
                size: '276 KB',
                sizeInBytes: 276 * 1024,
                dimensions: '1280x720',
                isImage: true,
                isVideo: false,
                isSpoiler: true,
                tag: 'Loop'
            }
        };
        FileInfo_1.default.format(this.value, data, this.nextElementSibling);
    },
    favicon: function () {
        Favicon_1.default.switch();
        if ((globals_1.g.VIEW === 'thread') && globals_1.Conf['Unread Favicon']) {
            Unread_1.default.update();
        }
        var img = this.nextElementSibling.children;
        var f = Favicon_1.default;
        var iterable = [f.SFW, f.unreadSFW, f.unreadSFWY, f.NSFW, f.unreadNSFW, f.unreadNSFWY, f.dead, f.unreadDead, f.unreadDeadY];
        for (var i = 0; i < iterable.length; i++) {
            var icon = iterable[i];
            if (!img[i]) {
                _1.default.add(this.nextElementSibling, _1.default.el('img'));
            }
            img[i].src = icon;
        }
    },
    togglecss: function () {
        if (((0, _1.default)('textarea[name=usercss]', _1.default.x('ancestor::fieldset[1]', this)).disabled = (_1.default.id('apply-css').disabled = !this.checked))) {
            CustomCSS_1.default.rmStyle();
        }
        else {
            CustomCSS_1.default.addStyle();
        }
        _1.default.cb.checked.call(this);
    },
    setTimeLocale: function (e) {
        var input = e.target;
        try {
            if (input.value !== '')
                new Intl.DateTimeFormat(input.value);
            input.setCustomValidity('');
            Time_1.default.formatterCache.clear();
            _1.default.cb.value.call(input);
            Settings.timeLocale.call(input);
        }
        catch (e) {
            input.setCustomValidity('Locale not recognized');
            input.reportValidity();
        }
    },
    keyBindInputs: (0, helpers_1.dict)(),
    keybinds: function (section) {
        var key;
        _1.default.extend(section, { innerHTML: Keybinds_html_1.default });
        (0, _1.default)('.warning', section).hidden = globals_1.Conf['Keybinds'];
        var tbody = (0, _1.default)('tbody', section);
        var items = (0, helpers_1.dict)();
        var inputs = Settings.keyBindInputs;
        for (key in Config_1.default.hotkeys) {
            var arr = Config_1.default.hotkeys[key];
            var tr = _1.default.el('tr', { innerHTML: "<td>".concat(arr[1], "</td><td><input class=\"field\"></td>") });
            var input = (0, _1.default)('input', tr);
            input.name = key;
            input.spellcheck = false;
            items[key] = globals_1.Conf[key];
            inputs[key] = input;
            _1.default.on(input, 'keydown', Settings.keybind);
            _1.default.add(tbody, tr);
        }
        _1.default.get(items, function (items) {
            for (key in items) {
                var val = items[key];
                inputs[key].value = val;
            }
        });
        _1.default.on((0, _1.default)('#reset-keys', section), 'click', Settings.resetKeybinds);
    },
    keybind: function (e) {
        if (e.keyCode === 9)
            return; // tab
        e.preventDefault();
        e.stopPropagation();
        var key = Keybinds_1.default.keyCode(e);
        if (key == null)
            return; // empty string is backspace
        this.value = key;
        _1.default.cb.value.call(this);
    },
    resetKeybinds: function () {
        if (!confirm('Are you sure you want to reset the keybinds?'))
            return;
        var defaults = Object.fromEntries(Object.entries(Config_1.default.hotkeys).map(function (_a) {
            var key = _a[0], value = _a[1];
            return [key, value[0]];
        }));
        _1.default.set(defaults, function () {
            Object.assign(globals_1.Conf, defaults);
            for (var _i = 0, _a = Object.entries(defaults); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                Settings.keyBindInputs[key].value = value;
            }
        });
    },
};
exports.default = Settings;
