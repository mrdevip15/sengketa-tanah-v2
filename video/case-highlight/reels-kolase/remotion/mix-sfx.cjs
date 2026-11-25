// Build the six editable sound-effects stems. All starts use the same 30 fps
// scene clock as the headline, paper, pencil and caption animations.
const fs = require('node:fs');
const path = require('node:path');
const {fps, scenes} = require('./timing.cjs');

const rate = 48000;
const bankDir = path.join(__dirname, 'public', 'sfx');
const outputDir = path.join(bankDir, 'mix');

function cuesFor(scene) {
  const seconds = s => Math.round(s*fps);
  const ratio = n => Math.round(n*scene.frames);
  const cues = [];
  const place = (frame, sound, gain, pan=0) => cues.push({frame:Math.max(0,frame), sound, gain, pan});
  if (scene.number!==2) {
    place(0,scene.number===5?'stamp':'paper',.54,-.15);
    place(seconds(.23),'brush',.35,.14);
  }
  switch (scene.number) {
    case 1:
      place(seconds(.46),'brush',.28,-.19);
      place(seconds(1.48),'pin',.39,.17); break;
    case 2:
      place(seconds(.08),'paper',.65,-.2);place(seconds(.36),'brush',.4,.15);
      place(seconds(.75),'underline',.4);place(seconds(1.4),'pencil',.37,-.2);
      place(ratio(.31),'pencil',.48);place(ratio(.67),'underline',.47);
      place(scene.beat.client ?? 7,'paper',.4,.12);
      place(scene.beat.seller ?? 100,'pin',.41,.1);break;
    case 3:
      place(seconds(.15),'pencil',.27,-.3);place(seconds(.35),'pencil',.28,.3);
      place(ratio(.32),'underline',.45,.2);
      place(scene.beat.hearing ?? ratio(.5),'paper',.52,-.16);
      place(scene.beat.reply ?? (scene.beat.hearing ?? ratio(.5))+40,'paper',.45,.14);
      place(scene.beat.evidence ?? (scene.beat.hearing ?? ratio(.5))+75,'stamp',.36,-.08);
      break;
    case 4:
      place(seconds(.54),'pencil',.49,-.1);place(seconds(2.1),'underline',.39,.15);
      place(seconds(2.65),'pencil',.44);place(scene.beat.legal ?? ratio(.66),'pencil',.46);break;
    case 5:
      place(seconds(.08),'pin',.35);place(seconds(.5),'underline',.49,-.12);
      place((scene.beat.banding ?? ratio(.69))-seconds(.32),'pin',.52);
      place((scene.beat.pk ?? ratio(.79))-seconds(.22),'pin',.53);
      place((scene.beat.pk ?? ratio(.79))-seconds(.17),'paper',.37,.18);break;
    case 6:
      place(seconds(.48),'underline',.44,-.1);
      place(seconds(.86),'pencil',.29,.2);
      place(scene.beat.heirs ?? ratio(.46),'paper',.46,-.18);
      place(scene.beat.divided ?? ratio(.61),'paper',.48,-.15);
      place(scene.beat.consent ?? ratio(.77),'paper',.49,-.11);break;
  }
  scene.lines.forEach(line=>line.pages.forEach((p,i)=>{
    place(line.localFrom+Math.ceil(p.start*fps),'tick',.20 + .014*(i%3),i%2?.12:-.12);
  }));
  return cues.sort((a,b)=>a.frame-b.frame);
}

function loadMono16(file) {
  const bytes=fs.readFileSync(file);
  let samples;
  for (let i=12; i+8<=bytes.length;) {
    const chunk=bytes.toString('ascii',i,i+4), size=bytes.readUInt32LE(i+4), start=i+8;
    if(chunk==='fmt ' && (bytes.readUInt16LE(start)!==1 || bytes.readUInt16LE(start+2)!==1 ||
      bytes.readUInt32LE(start+4)!==rate || bytes.readUInt16LE(start+14)!==16)) {
      throw Error('Expected 48 kHz mono PCM16: '+file);
    }
    if(chunk==='data') samples = new Int16Array(bytes.buffer,bytes.byteOffset+start,size/2);
    i=start+size+(size%2);
  }
  if (!samples?.length) throw Error('Empty sound: '+file);
  return samples;
}

function waveStereo(samples) {
  const out=Buffer.alloc(44+samples.length*2);
  out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);
  out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(2,22);
  out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*4,28);out.writeUInt16LE(4,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(out.length-44,40);
  for(let i=0;i<samples.length;i++){
    if(Math.abs(samples[i])>32767) throw Error('Sound effects exceeded headroom');
    out.writeInt16LE(Math.round(samples[i]),44+i*2);
  }
  return out;
}

function build() {
  fs.mkdirSync(outputDir,{recursive:true});
  const cache=new Map();
  for (const scene of scenes) {
    const frames=Math.round(scene.frames*rate/fps);
    const mix=new Float32Array(frames*2), cues=cuesFor(scene);
    for (const cue of cues) {
      if(!cache.has(cue.sound)) cache.set(cue.sound,loadMono16(path.join(bankDir,cue.sound+'.wav')));
      const sound=cache.get(cue.sound), offset=Math.round(cue.frame*rate/fps);
      for(let j=0;j<sound.length && offset+j<frames;j++) {
        const sample=sound[j]*cue.gain, idx=(offset+j)*2;
        mix[idx]+=sample*(1-Math.max(0,cue.pan));
        mix[idx+1]+=sample*(1+Math.min(0,cue.pan));
      }
    }
    fs.writeFileSync(path.join(outputDir,scene.number+'.wav'),waveStereo(mix));
    console.log(scene.number+' · '+scene.name+' · '+cues.length+' cues');
  }
}
if (require.main===module) build();
module.exports={cuesFor};
