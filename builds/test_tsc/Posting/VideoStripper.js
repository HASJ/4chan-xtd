"use strict";
/**
 * Lightweight, zero-dependency video container patchers to remove audio tracks.
 * Modifies the underlying ArrayBuffer in-place.
 */
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
exports.VideoStripper = void 0;
var VideoStripper = /** @class */ (function () {
    function VideoStripper() {
    }
    VideoStripper.stripAudio = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var buffer, uint8, dataView, patched, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, file.arrayBuffer()];
                    case 1:
                        buffer = _a.sent();
                        uint8 = new Uint8Array(buffer);
                        dataView = new DataView(buffer);
                        patched = false;
                        if (file.type === 'video/mp4' || file.name.endsWith('.mp4')) {
                            patched = this.stripMp4(uint8, dataView);
                        }
                        else if (file.type === 'video/webm' || file.name.endsWith('.webm')) {
                            patched = this.stripWebm(uint8, dataView);
                        }
                        if (patched) {
                            return [2 /*return*/, new File([buffer], file.name, { type: file.type })];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        console.warn('Failed to strip audio from video:', e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/, file]; // If parsing fails or audio not found, return original file
                }
            });
        });
    };
    VideoStripper.stripMp4 = function (uint8, view) {
        var offset = 0;
        var stripped = false;
        var utf8Decoder = new TextDecoder('utf8');
        while (offset < uint8.length) {
            if (offset + 8 > uint8.length)
                break;
            var size = view.getUint32(offset, false);
            var boxOffset = offset;
            if (size === 1) {
                if (offset + 16 > uint8.length)
                    break;
                // 64-bit size, we only read the lower 32 bits since MP4 files on 4chan aren't that huge
                size = view.getUint32(offset + 12, false);
                boxOffset += 8;
            }
            if (size === 0) {
                // Box extends to end of file
                size = uint8.length - offset;
            }
            var type = utf8Decoder.decode(uint8.subarray(boxOffset + 4, boxOffset + 8));
            if (type === 'moov') {
                var moovOffset = boxOffset + 8;
                var moovEnd = offset + size;
                while (moovOffset < moovEnd) {
                    if (moovOffset + 8 > moovEnd)
                        break;
                    var boxSize = view.getUint32(moovOffset, false);
                    if (boxSize === 0)
                        boxSize = moovEnd - moovOffset;
                    var boxType = utf8Decoder.decode(uint8.subarray(moovOffset + 4, moovOffset + 8));
                    if (boxType === 'trak') {
                        var isAudio = false;
                        var trakOffset = moovOffset + 8;
                        var trakEnd = moovOffset + boxSize;
                        while (trakOffset < trakEnd) {
                            if (trakOffset + 8 > trakEnd)
                                break;
                            var tBoxSize = view.getUint32(trakOffset, false);
                            if (tBoxSize === 0)
                                tBoxSize = trakEnd - trakOffset;
                            var tBoxType = utf8Decoder.decode(uint8.subarray(trakOffset + 4, trakOffset + 8));
                            if (tBoxType === 'mdia') {
                                var mdiaOffset = trakOffset + 8;
                                var mdiaEnd = trakOffset + tBoxSize;
                                while (mdiaOffset < mdiaEnd) {
                                    if (mdiaOffset + 8 > mdiaEnd)
                                        break;
                                    var mBoxSize = view.getUint32(mdiaOffset, false);
                                    if (mBoxSize === 0)
                                        mBoxSize = mdiaEnd - mdiaOffset;
                                    var mBoxType = utf8Decoder.decode(uint8.subarray(mdiaOffset + 4, mdiaOffset + 8));
                                    if (mBoxType === 'hdlr') {
                                        if (mdiaOffset + 20 <= mdiaEnd) {
                                            var handlerType = utf8Decoder.decode(uint8.subarray(mdiaOffset + 16, mdiaOffset + 20));
                                            if (handlerType === 'soun') {
                                                isAudio = true;
                                            }
                                        }
                                    }
                                    mdiaOffset += mBoxSize;
                                }
                            }
                            trakOffset += tBoxSize;
                        }
                        if (isAudio) {
                            // Overwrite 'trak' with 'free'
                            uint8[moovOffset + 4] = 0x66; // 'f'
                            uint8[moovOffset + 5] = 0x72; // 'r'
                            uint8[moovOffset + 6] = 0x65; // 'e'
                            uint8[moovOffset + 7] = 0x65; // 'e'
                            stripped = true;
                        }
                    }
                    moovOffset += boxSize;
                }
            }
            offset += size;
        }
        return stripped;
    };
    VideoStripper.stripWebm = function (uint8, view) {
        var offset = 0;
        var stripped = false;
        function readVint(off) {
            if (off >= uint8.length)
                return { val: 0, length: 1 };
            var byte = uint8[off];
            var mask = 0x80;
            var length = 1;
            while (!(byte & mask) && length < 8) {
                mask >>= 1;
                length++;
            }
            var val = byte & ~mask;
            for (var i = 1; i < length; i++) {
                if (off + i >= uint8.length)
                    break;
                val = (val << 8) | uint8[off + i];
            }
            // Handle unknown size
            if (length === 8 && val === 0xFFFFFFFFFFFFFF)
                val = -1;
            return { val: val, length: length };
        }
        while (offset < uint8.length) {
            if (offset + 3 >= uint8.length)
                break;
            // EBML header
            if (uint8[offset] === 0x1A && uint8[offset + 1] === 0x45 && uint8[offset + 2] === 0xDF && uint8[offset + 3] === 0xA3) {
                var sizeInfo = readVint(offset + 4);
                offset += 4 + sizeInfo.length + sizeInfo.val;
                continue;
            }
            // Segment
            if (uint8[offset] === 0x18 && uint8[offset + 1] === 0x53 && uint8[offset + 2] === 0x80 && uint8[offset + 3] === 0x67) {
                var sizeInfo = readVint(offset + 4);
                offset += 4 + sizeInfo.length;
                var segEnd = sizeInfo.val === -1 ? uint8.length : offset + sizeInfo.val;
                while (offset < segEnd) {
                    if (offset + 3 >= uint8.length)
                        break;
                    // Tracks
                    if (uint8[offset] === 0x16 && uint8[offset + 1] === 0x54 && uint8[offset + 2] === 0xAE && uint8[offset + 3] === 0x6B) {
                        var tSizeInfo = readVint(offset + 4);
                        var tracksOffset = offset + 4 + tSizeInfo.length;
                        var tracksEnd = tracksOffset + tSizeInfo.val;
                        while (tracksOffset < tracksEnd) {
                            if (tracksOffset >= uint8.length)
                                break;
                            if (uint8[tracksOffset] === 0xAE) { // TrackEntry
                                var entryStart = tracksOffset;
                                var entrySizeInfo = readVint(tracksOffset + 1);
                                var entryDataOffset = tracksOffset + 1 + entrySizeInfo.length;
                                var entryEnd = entryDataOffset + entrySizeInfo.val;
                                var isAudio = false;
                                var curr = entryDataOffset;
                                while (curr < entryEnd) {
                                    if (curr >= uint8.length)
                                        break;
                                    if (uint8[curr] === 0x83) { // TrackType
                                        var typeSizeInfo = readVint(curr + 1);
                                        var typeValInfo = readVint(curr + 1 + typeSizeInfo.length);
                                        if (typeValInfo.val === 2)
                                            isAudio = true; // Audio
                                        curr += 1 + typeSizeInfo.length + typeSizeInfo.val;
                                    }
                                    else {
                                        // Variable length ID
                                        var idLength = 1;
                                        while (!(uint8[curr] & (0x80 >> (idLength - 1))) && idLength < 8)
                                            idLength++;
                                        var eSizeInfo = readVint(curr + idLength);
                                        curr += idLength + eSizeInfo.length + eSizeInfo.val;
                                    }
                                }
                                if (isAudio) {
                                    // Overwrite 'TrackEntry' (AE) with 'Void' (EC)
                                    uint8[entryStart] = 0xEC;
                                    stripped = true;
                                }
                                tracksOffset = entryEnd;
                            }
                            else {
                                var idLength = 1;
                                while (!(uint8[tracksOffset] & (0x80 >> (idLength - 1))) && idLength < 8)
                                    idLength++;
                                var teSizeInfo = readVint(tracksOffset + idLength);
                                tracksOffset += idLength + teSizeInfo.length + teSizeInfo.val;
                            }
                        }
                        offset = tracksEnd;
                    }
                    else {
                        // Skip other segment elements
                        var idLength = 1;
                        while (!(uint8[offset] & (0x80 >> (idLength - 1))) && idLength < 8)
                            idLength++;
                        var eSizeInfo = readVint(offset + idLength);
                        offset += idLength + eSizeInfo.length + eSizeInfo.val;
                    }
                }
            }
            else {
                break;
            }
        }
        return stripped;
    };
    return VideoStripper;
}());
exports.VideoStripper = VideoStripper;
