import React from 'react';
import {Composition, Folder, registerRoot} from 'remotion';
import {Review} from './Review';
import timing from './timing.cjs';

const sceneReviews = timing.scenes.map(({number})=>function SceneReview() {
  return <Review only={number} sfxGain={0}/>;
});
const ClientBob = () => <Review only={1} clientVariant="bob"/>;
const ClientGlasses = () => <Review only={1} clientVariant="kacamata"/>;
const ClientHijab = () => <Review only={1} clientVariant="hijab"/>;
const openingFrames = timing.scenes[0].frames;

function Studio() {
  return <>
    <Composition id="Case-Highlight-Navins" component={Review} width={1080} height={1920} fps={30} durationInFrames={timing.totalFrames}/>
    <Folder name="Variasi-klien">
      <Composition id="Klien-A-Bob" component={ClientBob} width={1080} height={1920} fps={30} durationInFrames={openingFrames}/>
      <Composition id="Klien-B-Kacamata" component={ClientGlasses} width={1080} height={1920} fps={30} durationInFrames={openingFrames}/>
      <Composition id="Klien-C-Hijab" component={ClientHijab} width={1080} height={1920} fps={30} durationInFrames={openingFrames}/>
    </Folder>
    <Folder name="Cek-VO-per-adegan">{timing.scenes.map(scene=>
      <Composition key={scene.number} id={String(scene.number).padStart(2,'0')+'-'+scene.name.replaceAll(' ','-')}
        component={sceneReviews[scene.number-1]} width={1080} height={1920} fps={30} durationInFrames={scene.frames}/>
    )}</Folder>
  </>;
}

registerRoot(Studio);
