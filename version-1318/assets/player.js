(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function setupPlayer(box) {
    var video = box.querySelector('video');
    var overlay = box.querySelector('.player-overlay');
    var source = box.getAttribute('data-source');
    var prepared = false;
    var hlsInstance = null;

    if (!video || !overlay || !source) {
      return;
    }

    function prepare() {
      if (prepared) {
        return;
      }
      prepared = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.load();
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        return;
      }
      video.src = source;
      video.load();
    }

    function play() {
      prepare();
      overlay.classList.add('hidden');
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          overlay.classList.remove('hidden');
        });
      }
    }

    overlay.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener('play', function () {
      overlay.classList.add('hidden');
    });
    video.addEventListener('pause', function () {
      if (!video.ended) {
        overlay.classList.remove('hidden');
      }
    });
    video.addEventListener('ended', function () {
      overlay.classList.remove('hidden');
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    document.querySelectorAll('.js-player').forEach(setupPlayer);
  });
})();
