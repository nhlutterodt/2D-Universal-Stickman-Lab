/**
 * stressTest(N): create N sprites and measure perf.
 * @lab-docgen
 */
window.stressTest = function(N = 100) {
  const sprites = [];
  for (let i = 0; i < N; ++i) {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = (Math.random() * window.innerWidth) + 'px';
    el.style.top = (Math.random() * window.innerHeight) + 'px';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.background = '#4df';
    document.body.appendChild(el);
    sprites.push(el);
  }
  return sprites;
};
