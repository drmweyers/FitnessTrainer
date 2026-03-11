let interval = null;
let remaining = 0;

self.onmessage = function(e) {
  const { type, duration } = e.data;
  if (type === 'start') {
    remaining = duration;
    if (interval) clearInterval(interval);
    interval = setInterval(function() {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        interval = null;
        self.postMessage({ type: 'complete' });
      } else {
        self.postMessage({ type: 'tick', remaining: remaining });
      }
    }, 1000);
  } else if (type === 'pause') {
    if (interval) clearInterval(interval);
    interval = null;
    self.postMessage({ type: 'paused', remaining: remaining });
  } else if (type === 'resume') {
    if (interval) clearInterval(interval);
    interval = setInterval(function() {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        interval = null;
        self.postMessage({ type: 'complete' });
      } else {
        self.postMessage({ type: 'tick', remaining: remaining });
      }
    }, 1000);
  } else if (type === 'stop') {
    if (interval) clearInterval(interval);
    interval = null;
    remaining = 0;
  }
};
