"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Audio = {
    /** Add event listeners for videos with audio from a third party */
    setupSync: function (video, audio) {
        audio.addEventListener('playing', function () {
            video.currentTime = audio.currentTime % video.duration;
            video.play();
        });
        audio.addEventListener('play', function () {
            video.currentTime = audio.currentTime % video.duration;
            video.play();
        });
        audio.addEventListener('pause', function () {
            video.pause();
        });
        audio.addEventListener('seeked', function () {
            video.currentTime = audio.currentTime % video.duration;
        });
        audio.addEventListener('ratechange', function () {
            video.currentTime = audio.currentTime;
            video.playbackRate = audio.playbackRate;
        });
        audio.addEventListener('waiting', function () {
            video.currentTime = audio.currentTime % video.duration;
            video.pause();
        });
        audio.addEventListener('canplay', function () {
            if (audio.currentTime < .1)
                video.currentTime = 0;
        }, { once: true });
    },
};
exports.default = Audio;
