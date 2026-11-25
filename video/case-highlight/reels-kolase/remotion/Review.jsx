import React from 'react';
import {AbsoluteFill, Sequence, Track, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {SceneVisual} from './Visual';
import timing from './timing.cjs';

const {clips, scenes, fps} = timing;

function Picture({scene,clientVariant}) {
  const frame = useCurrentFrame();
  const take = scene.lines.find(t=>frame>=t.localFrom && frame<t.localFrom+t.frames+5);
  const seconds = take ? (frame-take.localFrom)/fps : -1;
  const page = take?.pages.find((p,i,all)=>seconds>=p.start && seconds<Math.min(all[i+1]?.start??Infinity,p.end+.25));
  const captionAge = page ? Math.max(0,frame-take.localFrom-Math.ceil(page.start*fps)) : 0;
  return <SceneVisual scene={scene.number} durationInFrames={scene.frames} caption={page?.text??''}
    captionAge={captionAge} beat={scene.beat} clientVariant={clientVariant}/>;
}

function PictureClip({index,origin,clientVariant}) {
  const scene=scenes[index];
  return <Sequence from={scene.from-origin} durationInFrames={scene.frames} name={scene.name}>
    <Picture scene={scene} clientVariant={clientVariant}/>
  </Sequence>;
}

function Voice({index,origin}) {
  const take=clips[index];
  return <Audio src={staticFile(take.src)} from={take.from-origin} durationInFrames={take.frames}
    name={take.speaker+' · '+take.text.split(' ').slice(0,5).join(' ')} />;
}

function SceneSound({index,origin,gain}) {
  const scene=scenes[index];
  return <Audio src={staticFile('sfx/mix/'+scene.number+'.wav')} from={scene.from-origin}
    durationInFrames={scene.frames} volume={gain} name={'SFX · '+scene.name}/>;
}

export function Review({only=0,sfxGain=0.72,clientVariant='bob'}) {
  const origin = only ? scenes[only-1].from : 0;
  const show = n=>!only || only===n;
  return <AbsoluteFill style={{backgroundColor:'#f3eee3'}}>
    <Track name="Animasi · enam adegan">
      {show(1)&&<PictureClip index={0} origin={origin} clientVariant={clientVariant}/>}
      {show(2)&&<PictureClip index={1} origin={origin}/>}
      {show(3)&&<PictureClip index={2} origin={origin}/>}
      {show(4)&&<PictureClip index={3} origin={origin}/>}
      {show(5)&&<PictureClip index={4} origin={origin}/>}
      {show(6)&&<PictureClip index={5} origin={origin}/>}
    </Track>
    <Track name="VO · Narator Navins">
      {show(1)&&<Voice index={0} origin={origin}/>}
      {show(2)&&<Voice index={1} origin={origin}/>}
      {show(3)&&<Voice index={2} origin={origin}/>}
      {show(4)&&<Voice index={3} origin={origin}/>}
      {show(5)&&<Voice index={4} origin={origin}/>}
      {show(6)&&<Voice index={5} origin={origin}/>}
    </Track>
    {sfxGain>0 && <Track name="SFX · gerak teks dan pena">
      {show(1)&&<SceneSound index={0} origin={origin} gain={sfxGain}/>}
      {show(2)&&<SceneSound index={1} origin={origin} gain={sfxGain}/>}
      {show(3)&&<SceneSound index={2} origin={origin} gain={sfxGain}/>}
      {show(4)&&<SceneSound index={3} origin={origin} gain={sfxGain}/>}
      {show(5)&&<SceneSound index={4} origin={origin} gain={sfxGain}/>}
      {show(6)&&<SceneSound index={5} origin={origin} gain={sfxGain}/>}
    </Track>}
  </AbsoluteFill>;
}
