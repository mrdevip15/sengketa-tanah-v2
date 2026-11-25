// Rebuild the seven dry, mono foley cues used by the documentary title animation.
const fs = require('node:fs');
const path = require('node:path');
const rate = 48000;
const destination = path.join(__dirname, 'public', 'sfx');
const peakTarget = 10 ** (-8 / 20);
const tau = Math.PI * 2;

function noiseGenerator(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2147483648 - 1;
  };
}

function lowpass(frequency) {
  const alpha = 1 - Math.exp(-tau * frequency / rate);
  let state = 0;
  return input => (state += alpha * (input - state));
}

function addStroke(buffer, start, length, settings, noise) {
  const {low, high, gain, roughness, attack = 0.12, release = 0.28} = settings;
  const dark = lowpass(low);
  const bright = lowpass(high);
  const pressure = lowpass(16);
  const grit = lowpass(109);
  const first = Math.round(start * rate);
  const count = Math.min(Math.round(length * rate), buffer.length - first);
  for (let i = 0; i < count; i++) {
    const phase = i / count;
    const edge = Math.sin(Math.min(phase / attack, 1) * Math.PI / 2) *
      Math.sin(Math.min((1 - phase) / release, 1) * Math.PI / 2);
    const press = Math.max(0.10, 0.60 + 5.8 * pressure(noise()));
    const grain = 0.8 + roughness * Math.abs(grit(noise())) * 10;
    const w = noise();
    buffer[first + i] += gain * edge * edge * press * grain * (bright(w) - dark(w));
  }
}

// Small non-harmonic resonances plus a short contact transient give the impression
// of hand tools, paper stacks and wood, rather than pitched UI notifications.
function addContact(buffer, start, gain, modes, gritMs, noise) {
  const first = Math.round(start * rate);
  const grain = lowpass(4900);
  const bass = lowpass(190);
  const phases = modes.map(() => noise() * 0.14);
  for (let i = 0; i < buffer.length - first; i++) {
    const t = i / rate;
    let sample = 0;
    for (let k = 0; k < modes.length; k++) {
      const [frequency, decayMs, level] = modes[k];
      sample += level * Math.sin(tau * frequency * t + phases[k]) * Math.exp(-t * 1000 / decayMs);
    }
    const w = noise();
    const contact = (grain(w) - bass(w)) * Math.exp(-t * 1000 / gritMs);
    buffer[first + i] += gain * Math.min(1, t / 0.0007) * (sample + 0.8 * contact);
  }
}

const cues = {
  paper: [0.46, (b,n) => {
    addStroke(b,.009,.34,{low:300,high:3400,gain:.8,roughness:1.1,attack:.23,release:.50},n);
    addStroke(b,.09,.25,{low:1800,high:6800,gain:.3,roughness:1.2,attack:.30},n);
    for (const [time,level] of [[.07,.15],[.164,.22],[.209,.1],[.286,.15],[.324,.08]])
      addContact(b,time,level,[[315,8,.45],[880,3,.22]],2.3,n);
  }],
  brush: [0.35, (b,n) => {
    addStroke(b,.005,.32,{low:140,high:1900,gain:.8,roughness:.3,attack:.58,release:.37},n);
    addStroke(b,.095,.19,{low:1200,high:4700,gain:.3,roughness:.25,attack:.62,release:.35},n);
  }],
  pencil: [0.42, (b,n) => {
    for (const [start,length,gain] of [[.012,.098,.85],[.118,.077,.55],[.207,.128,1],[.347,.042,.5]])
      addStroke(b,start,length,{low:950,high:6600,gain,roughness:2.1,attack:.12,release:.22},n);
    addContact(b,.013,.24,[[1180,4,.24],[2700,1.4,.18]],1.1,n);
  }],
  underline: [0.23, (b,n) => {
    addStroke(b,.007,.18,{low:360,high:2700,gain:1,roughness:.55,attack:.14,release:.24},n);
    addStroke(b,.10,.104,{low:960,high:4800,gain:.42,roughness:.7,attack:.49,release:.40},n);
    addContact(b,.012,.17,[[280,4,.26],[980,3,.2]],1.1,n);
  }],
  stamp: [0.25, (b,n) => {
    addContact(b,.007,1,[[102,32,.53],[152,20,.36],[306,15,.22],[690,8,.17],[1220,3,.09]],4,n);
    addContact(b,.026,.23,[[177,14,.30],[540,7,.23]],4.4,n);
    addStroke(b,.041,.138,{low:120,high:1400,gain:.14,roughness:.7,attack:.16,release:.65},n);
  }],
  tick: [0.078, (b,n) => {
    addContact(b,.003,.72,[[410,5.7,.35],[760,3.6,.26],[1390,2.4,.17]],2.1,n);
    addStroke(b,.006,.028,{low:690,high:3100,gain:.17,roughness:.44},n);
  }],
  pin: [0.135, (b,n) => {
    addContact(b,.004,.95,[[531,8.1,.55],[886,9,.40],[1510,4.6,.18],[2235,2.1,.12]],2.3,n);
    addContact(b,.022,.12,[[310,7,.3],[880,4,.20]],1.8,n);
  }],
};

function writeWav(name, samples) {
  const max = samples.reduce((a,b) => Math.max(a, Math.abs(b)), 0);
  const wav = Buffer.alloc(44 + samples.length * 2);
  wav.write('RIFF',0); wav.writeUInt32LE(wav.length - 8,4); wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(rate,24); wav.writeUInt32LE(rate * 2,28);
  wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34); wav.write('data',36);
  wav.writeUInt32LE(samples.length * 2,40);
  samples.forEach((sample,i) => wav.writeInt16LE(Math.round(sample * peakTarget / max * 32767), 44 + i*2));
  fs.writeFileSync(path.join(destination,name+'.wav'),wav);
}

fs.mkdirSync(destination,{recursive:true});
Object.entries(cues).forEach(([name,[seconds,compose]],index) => {
  const samples = new Float64Array(Math.round(seconds*rate));
  compose(samples,noiseGenerator(611732 + index * 331));
  writeWav(name,samples);
});
