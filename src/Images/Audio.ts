const Audio = {
  /** Add event listeners for videos with audio from a third party */
  setupSync(video: HTMLVideoElement, audio: HTMLAudioElement) {
    audio.addEventListener('playing', () => {
      video.currentTime = audio.currentTime % video.duration;
      video.play();
    });

    audio.addEventListener('play', () => {
      video.currentTime = audio.currentTime % video.duration;
      video.play();
    });

    audio.addEventListener('pause', () => {
      video.pause();
    });

    audio.addEventListener('seeked', () => {
      video.currentTime = audio.currentTime % video.duration;
    });

    audio.addEventListener('ratechange', () => {
      video.currentTime = audio.currentTime;
      video.playbackRate = audio.playbackRate;
    });

    audio.addEventListener('waiting', () => {
      video.currentTime = audio.currentTime % video.duration;
      video.pause();
    });

    audio.addEventListener('canplay', () => {
      if (audio.currentTime < .1) video.currentTime = 0;
    }, { once: true });
  },
};
export default Audio;