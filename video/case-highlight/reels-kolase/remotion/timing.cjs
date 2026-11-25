const {takes} = require('./narration-manifest.json');

const fps = 30;
const sceneNames = ['Tanah warisan', 'Awal sengketa', 'Gugatan perdata', 'Pertimbangan hakim', 'Putusan', 'Tiga hal yang perlu dicek'];
// Each page ends at a natural spoken phrase. Timings come from the recorded words.
const phraseEndings = [
  ['orang tua', 'sudah dijual,', 'belum dibagi.', 'Apa yang terjadi', 'belum setuju?'],
  ['salah satu ahli waris', 'yang keberatan.', 'peninggalan ayahnya', 'oleh ahli waris lain', 'tanpa persetujuannya.'],
  ['gugatan perdata', 'Negeri Setempat.', 'Dalam sidang perdata,', 'menanggapi gugatan', 'dinilai hakim.'],
  ['belum dibagi,', 'para ahli waris.', 'tanpa persetujuan ahli waris lain,', 'penjualan itu dinilai', 'perbuatan melawan hukum.'],
  ['gugatan.', 'belinya dinyatakan', 'batal demi hukum.', 'pada banding', 'peninjauan kembali.'],
  ['tanah warisan,', 'ahli warisnya,', 'sudah dibagi,', 'menyetujui penjualan.'],
];

function makePages(take,index) {
  const pages = [];
  let words = [];
  const emit = () => {
    pages.push({text:words.map(w=>w.text).join(' '), start:words[0].start, end:words.at(-1).end});
    words = [];
  };
  for (const word of take.words) {
    words.push(word);
    const phrase = words.map(w=>w.text).join(' ');
    if (phraseEndings[index]?.some(ending=>phrase.toLowerCase().endsWith(ending.toLowerCase())) || phrase.length >= 47) emit();
  }
  if (words.length) emit();
  return pages;
}

let playhead = 0;
const clips = takes.map((take,i)=>({...take, index:i, pages:makePages(take,i)}));
const beatPhrases = {
  2: {client:'klien kami', seller:'oleh ahli waris lain'},
  3: {hearing:'dalam sidang perdata,', reply:'menanggapi gugatan', evidence:'mengajukan bukti'},
  4: {legal:'perbuatan melawan hukum.'},
  5: {banding:'banding', pk:'peninjauan'},
  6: {heirs:'siapa saja', divided:'apakah tanahnya', consent:'siapa yang'},
};
const scenes = sceneNames.map((name,i)=>{
  const number = i+1;
  const lines = clips.filter(t => t.scene === number);
  let offset = number === 1 ? 4 : 7;
  for (const line of lines) {
    line.localFrom = offset;
    line.from = playhead + offset;
    line.frames = Math.ceil(line.seconds * fps);
    offset += line.frames + 9;
  }
  const frames = Math.max(4*fps, offset + (number===6 ? 29 : 8));
  const beat = {};
  const phrases = beatPhrases[number] ?? {};
  const line = lines[0];
  const words = line?.words.map(w=>w.text.toLowerCase()) ?? [];
  for (const [label,phrase] of Object.entries(phrases)) {
    const chunk = phrase.split(' ');
    const index = words.findIndex((_,n)=>words.slice(n,n+chunk.length).join(' ')===phrase);
    if (index >= 0) beat[label] = line.localFrom + Math.ceil(line.words[index].start*fps);
  }
  const scene = {number, name, from:playhead, frames, lines, beat};
  playhead += frames;
  return scene;
});

module.exports = {fps, scenes, clips, totalFrames:playhead};
