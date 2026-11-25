// Set ELEVENLABS_API_KEY in the environment, or launch Node with --env-file=<file>.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const studio = path.join(__dirname, 'remotion');
const manifestPath = path.join(studio, 'narration-manifest.json');
const audioDir = path.join(studio, 'public', 'narasi');
const source = fs.readFileSync(path.join(__dirname, 'narasi-navins.md'), 'utf8');
const voiceId = 'R86jddkroI9bJwXFfjsr';
const model = 'eleven_v4';
const directions = ['curious', 'matter-of-fact', 'calm', 'thoughtful', 'calm', 'warm'];
const levelTargetLufs = -21;
const script = [...source.matchAll(/^\| (\d+) · [^|]+\| “([^”]+)”/gm)].map(([, number, text]) => ({
  scene: Number(number), speaker: 'Navins', text, voiceId, direction: directions[Number(number)-1],
  src: 'narasi/' + number.padStart(2, '0') + '.mp3',
}));

function getDuration(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8' }).trim());
}

function levelTake(take) {
  const file = path.join(studio, 'public', take.src);
  const scan = spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', file, '-af',
    'loudnorm=I=-21:TP=-2:LRA=9:print_format=json', '-f', 'null', '-'], {encoding: 'utf8'});
  if (scan.status !== 0) throw Error('Cannot measure loudness in ' + take.src);
  const measured = JSON.parse(scan.stderr.match(/\{[^{}]+\}/g).at(-1));
  const gain = Math.min(levelTargetLufs - Number(measured.input_i), -2 - Number(measured.input_tp));
  if (!Number.isFinite(gain)) throw Error('Unexpected silent or unreadable audio in ' + take.src);
  if (Math.abs(gain) > 0.65) {
    const temporary = file + '.level.tmp';
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-af', 'volume=' + gain.toFixed(2) + 'dB',
      '-c:a', 'libmp3lame', '-b:a', '192k', '-f', 'mp3', temporary]);
    fs.renameSync(temporary, file);
  }
  return {...take, seconds: getDuration(file), levelTargetLufs};
}

async function record(line) {
  const url = 'https://api.elevenlabs.io/v1/text-to-speech/' + line.voiceId + '/with-timestamps?output_format=mp3_44100_128';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: '[' + line.direction + '] ' + line.text, model_id: model, language_code: 'id',
    }),
  });
  const body = await response.json();
  if (!response.ok) throw Error(response.status + ' ' + JSON.stringify(body.detail));
  const timing = body.alignment;
  const offset = timing?.characters.join('').indexOf(line.text);
  if (!body.audio_base64 || offset == null || offset < 0) throw Error('Incomplete or mismatched alignment');
  const words = [...line.text.matchAll(/\S+/g)].map(match => ({
    text: match[0], start: timing.character_start_times_seconds[offset+match.index],
    end: timing.character_end_times_seconds[offset+match.index + match[0].length - 1],
  }));
  const file = path.join(studio, 'public', line.src);
  const temporary = file + '.tmp';
  fs.writeFileSync(temporary, Buffer.from(body.audio_base64, 'base64'));
  const seconds = getDuration(temporary);
  if (!(seconds > 0) || words.at(-1).end > seconds + 0.15) throw Error('Invalid media duration');
  fs.renameSync(temporary, file);
  return { ...line, seconds, words, model };
}

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) throw Error('Set ELEVENLABS_API_KEY before generating audio.');
  if (script.length !== 6) throw Error('The script should cover all six scenes.');
  fs.mkdirSync(audioDir, {recursive: true});
  const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).takes : [];
  const complete = old.filter(take => script.some(line => take.src === line.src && take.text === line.text &&
    take.voiceId === line.voiceId && take.model === model && take.direction === line.direction && take.words?.length &&
    fs.existsSync(path.join(studio, 'public', line.src))));
  for (const line of script) {
    const cached = complete.find(take => take.src === line.src);
    if (cached?.levelTargetLufs === levelTargetLufs) continue;
    const take = levelTake(cached ?? await record(line));
    if (cached) complete.splice(complete.indexOf(cached), 1, take);
    else complete.push(take);
    complete.sort((a,b) => a.src.localeCompare(b.src));
    fs.writeFileSync(manifestPath + '.tmp', JSON.stringify({takes: complete}, null, 2) + '\n');
    fs.renameSync(manifestPath + '.tmp', manifestPath);
    console.log(take.src, line.speaker, take.seconds.toFixed(2) + ' s');
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
