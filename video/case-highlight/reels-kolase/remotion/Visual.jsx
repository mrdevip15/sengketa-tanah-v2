import React, {useEffect, useId, useMemo, useState} from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';

const ink = '#221f1c';
const paper = '#f3eee3';
const cream = '#fffaf0';
const brick = '#b63b2b';
const serif = '"Baskerville Old Face", Baskerville, Georgia, serif';
const italic = 'Georgia, "Times New Roman", serif';
const sans = '"Franklin Gothic Demi", "Arial", sans-serif';
const hand = '"Segoe Print", "Segoe Script", cursive';
const mono = 'Consolas, "Courier New", monospace';
const firmWordmark = 'NAVINS';
const firmDescriptor = 'COUNSELLORS AT LAW';
const firmName = firmWordmark + ' ' + firmDescriptor;

const sources = {
  kantor: 'sumber/interior-kantor-ilustratif.jpg',
  jalanPenutup: 'sumber/jalan-samping-penutup.jpg',
  lahanTepiJalan: 'sumber/lahan-tepi-jalan.jpg',
  arsip: 'sumber/dokumen-arsip.jpg',
  berkas: 'sumber/dokumen-klip.jpg',
  mahkamah: 'sumber/pengadilan-ma-jakarta.jpg',
};
const headings = ['CASE HIGHLIGHT', 'PENJUALAN', 'GUGATAN PERDATA', 'PERTIMBANGAN HAKIM', 'PUTUSAN', 'HASIL PERKARA'];
const footers = [
  'Reka adegan · foto interior ilustratif', 'Foto ilustrasi · berkas',
  'Reka adegan · konsultasi hukum', 'Lahan tepi jalan · ilustrasi',
  `Ringkasan perkara · ${firmName}`, 'Foto ilustrasi · lahan tepi jalan',
];
const settle = Easing.bezier(.16, 1, .3, 1);
function progress(value, start, end, easing = settle) {
  return interpolate(value, [start, Math.max(start + .001, end)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing,
  });
}

// A small repeatable ink texture moves with the paper, so scrubbing never flickers.
const specks = Array.from({length: 63}, (_, i) => ({
  x: ((i * 67.87 + 3.5) % 59), y: ((i * i * 2.7 + i * 19.13) % 61), r: .17 + ((i * 37) % 11) / 23,
}));
function PaperTexture({id, dark = false}) {
  return <>
    <defs><pattern id={id} patternUnits="userSpaceOnUse" width="59" height="61">
      {specks.map(({x,y,r}, i) => <circle key={i} cx={x} cy={y} r={r} fill={dark ? cream : '#544936'}
        opacity={dark ? .1 + (i % 3) * .015 : .065 + (i % 3) * .018}/>)}
    </pattern></defs>
    <rect width="540" height="960" fill={`url(#${id})`}/>
  </>;
}

function Text({x, y, size, font = sans, color = ink, children, ...rest}) {
  return <text x={x} y={y} fill={color} fontFamily={font} fontSize={size} {...rest}>{children}</text>;
}

function Header({scene, light, time}) {
  const color = light ? cream : ink;
  const rule=progress(time,0,.44);
  return <g>
    <Text x={37} y={76} size={25} fontWeight={700} letterSpacing="1.35" color={color}>{firmWordmark}</Text>
    <Text x={38} y={93} size={13} fontWeight={700} letterSpacing=".55" color={color}>{firmDescriptor}</Text>
    <Text x={493} y={92} size={12} textAnchor="end" color={color} font={mono}>{headings[scene - 1]}</Text>
    <path d="M37 104H495" stroke={color} strokeWidth=".9" opacity=".8" pathLength="1" strokeDasharray="1" strokeDashoffset={(1-rule)*.52}/>
  </g>;
}

function Title({first,second,firstSize,secondSize,y=181,color=ink,accent=brick,frame}) {
  const {fps}=useVideoConfig(), id=useId().replaceAll(':','');
  const a=progress(frame/fps,0,.54), b=progress(frame/fps,.23,.91);
  // The first line is readable on the initial hook frame. The italic lands on the second accent.
  return <g>
    <defs><clipPath id={id}><path d={`M0 ${y-8}H${574*b+3}l-22 101H0Z`}/></clipPath></defs>
    <Text x={32-(1-a)*9} y={y+(1-a)*12} size={firstSize} font={serif} color={color} opacity={.78+.22*a}>{first}</Text>
    <Text x={32} y={y+73+(1-b)*9} size={secondSize} font={italic} fontStyle="italic" color={accent} clipPath={`url(#${id})`}>{second}</Text>
  </g>;
}

function Photo({name,x=0,y=0,w=540,h=960,position='50% 50%',zoom=1}) {
  return <foreignObject x={x} y={y} width={w} height={h} overflow="hidden">
    <div style={{width:'100%',height:'100%',overflow:'hidden'}}>
      <Img draggable={false} src={staticFile(sources[name])} style={{
        width:'100%',height:'100%',display:'block',objectFit:'cover',objectPosition:position,
        transformOrigin:position,transform:`scale(${zoom})`,
      }}/>
    </div>
  </foreignObject>;
}

function Stroke({d, p, color=brick, width=2.2}) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
    pathLength="1" strokeDasharray="1" strokeDashoffset={1-p} opacity={p>0?1:0}/>;
}

function Written({text,x,y,size,angle=-4,color=brick,p}) {
  const id = useId().replaceAll(':','');
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <defs>
      <clipPath id={id} clipPathUnits="objectBoundingBox">
        <rect x={-.04} y={-.15} width={1.08*p} height={1.3}/>
      </clipPath>
    </defs>
    <Text x={0} y={0} size={size} color={color} font={hand}
      clipPath={p<1 ? `url(#${id})` : undefined}>{text}</Text>
  </g>;
}

// Local points inside the photo card, with the left edge following the road shoulder.
const roadsideBoundary = [[367,113],[452,126],[444,245],[393,291],[236,292],[294,199]];
const roadsidePath = 'M'+roadsideBoundary.map(([x,y])=>x+' '+y).join('L')+'Z';
function Parcel({p}) {
  return <g>
    <path d={roadsidePath} fill="#fbeb9e" opacity={progress(p,.78,1)*.22}/>
    <Stroke d={roadsidePath} color="#30251c" width={5} p={p}/>
    <Stroke d={roadsidePath} color="#fff5d5" width={2.8} p={p}/>
    {roadsideBoundary.map(([x,y],i)=><g key={x} opacity={progress(p,i/7,i/7+.11)}>
      <path d={`M${x-4} ${y-4}l8 8m-8 0l8 -8`} stroke="#fff5d5" strokeWidth="1.35"/>
    </g>)}
  </g>;
}

const figureData=new Map();
const clientArt = {
  bob: 'klien',
  kacamata: 'klien-kacamata',
  hijab: 'klien-hijab',
};
function readInk(asset, female){
  if(!figureData.has(asset)){
    const head=female?'Side-parted bob and face in three-quarter profile':'Three-quarter face and combed hair';
    const arm=female?'Left arm, rolled cuff and supporting fingers':'An outstretched palm and cuff';
    const last=female?'Contrast portfolio, forearm and waist':'Portfolio and the second hand at his side';
    const read=fetch(staticFile('gambar/'+asset+'.svg'))
      .then(response=>{if(!response.ok)throw Error(response.statusText);return response.text();})
      .then(source=>{
        // Keep the source paths, hatching and draw order. Only their joint groups change pose.
        if(![head,arm,last].every(label=>source.includes('<!-- '+label+' -->')))return '';
        return source
          .replace('<!-- '+head+' -->','<g style="transform-origin:'+(female?'98px 79px':'106px 79px')+';transform:rotate(var(--ink-head))">')
          .replace('<!-- '+arm+' -->','</g><g style="transform-origin:'+(female?'74px 108px':'71px 107px')+';transform:rotate(var(--ink-arm))">')
          .replace('<!-- '+last+' -->','</g>');
      });
    figureData.set(asset,read);
  }
  return figureData.get(asset);
}
function InkDrawing({role,variant}){
  const female=role==='Klien';
  const asset=female ? clientArt[variant] : 'advokat';
  const [drawing,setDrawing]=useState('');
  const {delayRender,continueRender}=useDelayRender();
  useEffect(()=>{
    let mounted=true;
    const handle=delayRender('Load ink drawing · '+asset);
    readInk(asset,female).then(source=>{if(mounted)setDrawing(source);}).catch(()=>{}).finally(()=>continueRender(handle));
    return ()=>{mounted=false;};
  },[asset,female,delayRender,continueRender]);
  if(drawing)return <g dangerouslySetInnerHTML={{__html:drawing}}/>;
  return <foreignObject x={0} y={0} width={200} height={480}><Img src={staticFile('gambar/'+asset+'.svg')}
    style={{width:200,height:480,display:'block'}}/></foreignObject>;
}
function Actor({role,cx,y,h,frame,fps,accent=0,variant='bob'}) {
  const female = role==='Klien';
  const time=frame/fps;
  const tone = female ? .3 : 1.9;
  const lean = Math.sin(time*1.2+tone)*.34 + accent*.8;
  const w=h*200/480;
  const head=Math.sin(time*1.15+tone)*1.05+accent*(female?1.8:5.5);
  const arm=Math.sin(time*1.3+tone)*.7-accent*(female?1.25:9);
  return <g transform={`translate(${cx-w/2} ${y}) scale(${h/480})`} style={{
    '--ink-head':head+'deg','--ink-arm':arm+'deg',
  }}>
    <g transform={`rotate(${lean} 105 452)`}>
      <InkDrawing key={variant} role={role} variant={variant}/>
    </g>
  </g>;
}

function Opening({time,frame,fps,ratio,clientVariant}) {
  const arrival=progress(time,.46,1.48);
  const plaque=progress(time,1.48,1.92);
  const greeting=Math.sin(progress(time,1.96,3.1,Easing.linear)*Math.PI);
  const clientX=172-(1-arrival)*30;
  return <>
    <Title first="Sengketa Tanah" second="Warisan" firstSize={71} secondSize={74} y={184} frame={frame}/>
    <rect x="26" y="288" width="488" height="473" fill="#e3d9ca"/>
    <Photo name="kantor" x={28} y={290} w={484} h={469} position="50% 88%" zoom={1.018+ratio*.035}/>
    <rect x="28" y="290" width="484" height="469" fill="#302725" opacity=".12"/>
    <g transform={`translate(${260+(1-plaque)*13} 301)`} opacity={plaque}>
      <rect width="222" height="66" fill="#17232f"/>
      <path d="M8 8H214V58H8Z" fill="none" stroke="#c5aa84" opacity=".8" strokeWidth=".8"/>
      <Text x={18} y={36} size={28} fontWeight={700} letterSpacing="1.2" color={cream}>{firmWordmark}</Text>
      <Text x={20} y={52} size={12} fontWeight={700} letterSpacing=".55" color="#f0e4d1">{firmDescriptor}</Text>
    </g>
    <ellipse cx="374" cy="730" rx="56" ry="7" fill="#171819" opacity=".35"/>
    <g style={{filter:'drop-shadow(2px 2px 2px #1f1b1766)'}}>
      <Actor role="Advokat" cx={373} y={368} h={374} frame={frame} fps={fps} accent={greeting}/>
    </g>
    <ellipse cx={clientX+22} cy="730" rx="51" ry="7" fill="#171819" opacity=".37"/>
    <g style={{filter:'drop-shadow(2px 2px 2px #1f1b1766)'}}>
      <Actor role="Klien" cx={clientX} y={397} h={347} frame={frame} fps={fps} accent={greeting*.45} variant={clientVariant}/>
    </g>
    <path d="M28 759H512" stroke="#c3ab8a" strokeWidth="1.8"/>
  </>;
}

function Sale({time,ratio,uid,frame,durationInFrames,beat}) {
  const card=progress(time,.08,1.06);
  const italicEntry=progress(time,.36,.88);
  const underline=progress(frame,Math.round(.67*durationInFrames),Math.round(.67*durationInFrames)+20,Easing.linear);
  const client=progress(frame,beat.client ?? 7,(beat.client ?? 7)+15);
  const seller=progress(frame,beat.seller ?? 100,(beat.seller ?? 100)+15);
  return <>
    <Photo name="berkas" position="17% 46%" zoom={1.003+ratio*.034}/>
    <defs>
      <linearGradient id={uid+'-top'} x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#191714" stopOpacity=".83"/><stop offset="1" stopColor="#191714" stopOpacity="0"/></linearGradient>
      <linearGradient id={uid+'-bottom'} x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#19150f" stopOpacity="0"/><stop offset=".64" stopColor="#19150f" stopOpacity=".86"/><stop offset="1" stopColor="#19150f" stopOpacity=".98"/></linearGradient>
    </defs>
    <rect width="540" height="380" fill={`url(#${uid}-top)`}/>
    <rect y="560" width="540" height="400" fill={`url(#${uid}-bottom)`}/>
    <g transform={`translate(${38-(1-client)*16} 121)`} opacity={client}>
      <rect width="345" height="76" fill={cream}/>
      <Text x={16} y={26} size={13} font={mono} color={brick}>KLIEN · {firmName}</Text>
      <Text x={16} y={57} size={24}>Ahli waris yang keberatan</Text>
    </g>
    <g transform={`translate(${38-(1-seller)*16} 210)`} opacity={seller}>
      <rect width="345" height="46" fill={ink}/>
      <Text x={16} y={30} size={20} color={cream}>Penjual · ahli waris lain</Text>
    </g>
    <g transform={`translate(${81+(1-card)*12} ${480+(1-card)*61}) rotate(${-2.5+(1-card)*3})`} opacity={card}>
      <rect x="2" y="5" width="388" height="190" fill="#282014" opacity=".24"/>
      <rect width="388" height="190" fill={cream}/>
      <Text x={17} y={79} size={69} font={serif}>Perjanjian</Text>
      <Text x={21-(1-italicEntry)*9} y={155+(1-italicEntry)*10} opacity={italicEntry} size={63} font={italic} fontStyle="italic" color={brick}>jual beli</Text>
      <Stroke d="M21 166Q125 158 241 166" p={progress(time,.75,1.5,Easing.linear)}/>
    </g>
    <Stroke d="M102 460Q76 408 113 372m0 0-11 3m11-3 1 13" p={progress(time,1.4,2.1,Easing.linear)}/>
    <Written x={39} y={721} text="persetujuan siapa?" size={30} color="#ffdcac" p={progress(ratio,.31,.47,Easing.linear)}/>
    <Stroke d="M44 735Q151 720 290 725" width={2.15} color="#ffdcac" p={underline}/>
  </>;
}

function Lawsuit({frame,fps,time,ratio,durationInFrames,beat}) {
  const hearing = beat.hearing ?? Math.round(.5*durationInFrames);
  const process = [
    [hearing, 'Gugatan diajukan'],
    [beat.reply ?? hearing+40, 'Tanggapan para pihak'],
    [beat.evidence ?? hearing+75, 'Pembuktian'],
  ];
  const inspection = progress(frame,hearing,hearing+12);
  const cue=Math.round(.32*durationInFrames);
  const gesture=Math.sin(progress(frame,cue,cue+37,Easing.linear)*Math.PI);
  return <>
    <Title first="Dari gugatan" second="ke pembuktian." firstSize={76} secondSize={53} y={175} frame={frame}/>
    <Photo name="arsip" y={296} w={540} h={394} position="17% 51%" zoom={1.037-ratio*.028}/>
    {inspection<1 && <g opacity={1-inspection}>
      <path fill="#e3ded1" d="M0 492l35-4 26 3 41-10 42 5 26-8 45 4 33-4 32 8 37-11 27 5 41-6 36 8 34-7 43 9 42-5v295H0Z"/>
      <path d="M46 703l440-6" stroke="#b3a993" strokeWidth="1"/>
      <Actor role="Klien" cx={170} y={345} h={380} frame={frame} fps={fps} accent={gesture*.48}/>
      <Actor role="Advokat" cx={353} y={310} h={412} frame={frame} fps={fps} accent={gesture}/>
      <Written text="Klien" x={105} y={752} size={18} p={progress(time,.15,.72)}/>
      <Written text="Advokat" x={319} y={748} size={18} angle={2} p={progress(time,.35,.92)}/>
      <Stroke d="M321 757Q353 762 390 755" p={progress(frame,cue,cue+20,Easing.linear)}/>
    </g>}
    {inspection>0 && <g opacity={inspection}>
      <rect y="296" width="540" height="482" fill={ink} opacity=".28"/>
      {process.map(([from,label],index)=>{
        const entry=progress(frame,from,from+15);
        return <g key={label} opacity={entry}
          transform={`translate(${56+(1-entry)*52} ${363+index*108+(1-entry)*10}) rotate(${index===1?1.5:-1})`}>
          <rect x="4" y="4" width="427" height="76" fill={ink} opacity=".3"/>
          <rect width="427" height="76" fill={cream}/>
          <Text x={17} y={46} size={17} font={mono} color={brick}>{'0'+(index+1)}</Text>
          <Text x={61} y={49} size={29}>{label}</Text>
        </g>;
      })}
    </g>}
  </>;
}

function Hearing({frame,time,durationInFrames,beat}) {
  const enter=progress(time,0,.8);
  const cue=beat.legal ?? Math.round(.66*durationInFrames);
  const legalFinding=progress(frame,cue,cue+21,Easing.linear);
  return <>
    <Title first="Hak bersama" second="para ahli waris" firstSize={78} secondSize={60} color={cream} accent="#f2c9ae" frame={frame}/>
    <g transform={`translate(25 ${304+(1-enter)*14}) rotate(${1.5-(1-enter)*1.2})`}>
      <rect x={2} y={6} width={492} height={361} fill="#11100d"/>
      <rect width={492} height={361} fill={cream}/>
      <Photo name="lahanTepiJalan" x={9} y={9} w={474} h={310} position="50% 55%"/>
      <Parcel p={progress(time,.54,2.34,Easing.linear)}/>
      <Text x={16} y={344} size={17} font={hand}>Sketsa batas ilustratif</Text>
    </g>
    <g opacity={1-legalFinding}><Written text="belum dibagi" x={267} y={718} size={27} color="#f4c9a4" p={progress(time,2.65,3.65,Easing.linear)}/></g>
    <Written text="Perbuatan melawan hukum" x={121} y={723} size={25} color="#f4c9a4" p={legalFinding}/>
    <Stroke d="M312 688Q327 645 362 605m0 0-12 5m12-5-3 12" color="#f4c9a4" p={progress(time,2.1,2.74,Easing.linear)}/>
  </>;
}

const docket=[
  ['Tingkat pertama','14/Pdt.G/2023/PN Jnp'],
  ['Banding','416/PDT/2023/PT MKS'],
  ['Peninjauan kembali','964 PK/Pdt/2024'],
];
function Ruling({time,frame,fps,ratio,durationInFrames,beat}) {
  const bandingAt=Number.isFinite(beat?.banding)?beat.banding/fps:durationInFrames/fps*.69;
  const pkAt=Number.isFinite(beat?.pk)?beat.pk/fps:durationInFrames/fps*.79;
  const points=[progress(time,.08,.5),progress(time,bandingAt-.32,bandingAt+.16),progress(time,pkAt-.22,pkAt+.23)];
  const card=progress(time,pkAt-.17,pkAt+.52);
  return <>
    <Title first="Batal" second="demi hukum." firstSize={94} secondSize={66} y={191} frame={frame}/>
    <Stroke d="M36 279Q199 269 402 278M76 284Q221 277 313 280" p={progress(time,.5,1.55,Easing.linear)} width={2.75}/>
    <path d={`M49 333v${Math.max(4,70*points[1]+70*points[2])}`} stroke="#837468" strokeWidth="1.25"/>
    {docket.map(([label,num],i)=><g key={num} transform={`translate(0 ${(1-points[i])*7})`} opacity={points[i]}>
      <rect x="45" y={334+i*70} width="9" height="9" fill={brick}/>
      <Text x={75} y={348+i*70} size={24}>{label}</Text>
      <Text x={76} y={370+i*70} size={16} font={mono} color="#554a43">{num}</Text>
    </g>)}
    {card>0 && <g transform={`translate(28 ${550+(1-card)*16}) rotate(${-1.6+(1-card)*2})`} opacity={card}>
      <rect x="2" y="4" width="480" height="201" fill="#282019" opacity=".2"/>
      <rect width="480" height="201" fill={cream}/>
      <Photo name="mahkamah" x={7} y={7} w={466} h={155} position="52% 49%" zoom={1+Math.max(ratio-.7,0)*.06}/>
      <Text x={15} y={184} size={14} font={mono}>Mahkamah Agung RI, Jakarta · arsip 2008</Text>
    </g>}
  </>;
}

function Closing({time,frame,fps,ratio,uid,beat,durationInFrames}) {
  const sunFace = progress(time,.86,1.52,Easing.linear);
  const sunRays = progress(time,1.31,1.93,Easing.linear);
  const questions=[
    [beat.heirs ?? Math.round(durationInFrames*.46),'Siapa ahli warisnya?'],
    [beat.divided ?? Math.round(durationInFrames*.61),'Sudah dibagi?'],
    [beat.consent ?? Math.round(durationInFrames*.77),'Siapa yang setuju?'],
  ];
  return <>
    <Photo name="jalanPenutup" h={910} position="51% 58%" zoom={1.035-ratio*.024}/>
    <defs>
      <linearGradient id={uid+'-sky'} x2="0" y2="1">
        <stop stopColor="#bdeafa"/>
        <stop offset=".63" stopColor="#d3f2fb" stopOpacity=".94"/>
        <stop offset=".88" stopColor="#daeff5" stopOpacity=".57"/>
        <stop offset="1" stopColor="#daeff5" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <rect width="540" height="499" fill={`url(#${uid}-sky)`}/>
    <Title first="Sebelum menjual" second="tanah warisan." firstSize={68} secondSize={62} y={184} frame={frame}/>
    <g transform="translate(431 342) rotate(-9)">
      <path d="M-28 2C-29-14-17-28-2-29S28-19 29-3 18 26 2 29-27 19-28 2Z"
        fill="#ffd767" opacity={progress(sunFace,.42,1)*.95}/>
      <Stroke d="M-28 2C-29-14-17-28-2-29S28-19 29-3 18 26 2 29-27 19-28 2Z"
        p={sunFace} color="#ad5d24" width={2.6}/>
      <Stroke d="M-1-39l1-12M27-28l9-9M40 0l12 1M29 27l9 9M1 40l1 12M-26 29l-9 10M-40 1l-12 1M-29-27l-8-10"
        p={sunRays} color="#ad5d24" width={2.6}/>
      <Stroke d="M-15-9Q-12-17-5-19" p={sunRays} color="#fff5c6" width={2.4}/>
    </g>
    <ellipse cx="167" cy="644" rx="47" ry="6" fill="#212514" opacity=".28"/>
    <Actor role="Klien" cx={146} y={320} h={338} frame={frame} fps={fps}/>
    {questions.map(([cue,question],index)=>{
      const arrived=progress(frame,cue,cue+16);
      const y=417+index*75;
      return <g key={question} transform={`translate(${213+(1-arrived)*37} ${y+(1-arrived)*14}) rotate(${(index-1)*1.25})`} opacity={arrived}>
        <path d="M4 4H272V58H4Z" fill="#191a13" opacity=".30"/>
        <path d="M0 0H272l-2 12 2 9-2 15 2 13-3 7H0Z" fill={cream}/>
        <Text x={12} y={35} size={15} font={mono} color={brick}>{'0'+(index+1)}</Text>
        <Text x={43} y={36} size={22} color={ink}>{question}</Text>
      </g>;
    })}
    <path fill={paper} d="M0 749l26-5 28 4 45-7 33 2 37-7 39 7 43-6 35 3 49-5 43 3 31-5 44 6 40-6 47 3V960H0Z"/>
    <Stroke d="M36 272Q117 263 202 272" width={2.2} p={progress(time,.48,1.22,Easing.linear)}/>
  </>;
}

function Caption({caption, captionAge, light, scene}) {
  const entry=progress(captionAge,-1,5);
  const {lines,size}=useMemo(()=>{
    const words=(Array.isArray(caption)?caption.join(' '):caption||'').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return {lines:[],size:31};
    const ctx=document.createElement('canvas').getContext('2d');
    for(let size=31;size>=18;size--){
      ctx.font='700 '+size+'px '+sans;
      const entire=words.join(' ');
      if(ctx.measureText(entire).width<=420)return {lines:[entire],size};
      let best=null;
      for(let n=1;n<words.length;n++){
        const a=words.slice(0,n).join(' '), b=words.slice(n).join(' ');
        const wa=ctx.measureText(a).width, wb=ctx.measureText(b).width;
        if(Math.max(wa,wb)>420)continue;
        const cost=Math.abs(wa-wb)+(wb>wa?12:0);
        if(!best||cost<best.cost)best={lines:[a,b],size,cost};
      }
      if(best)return best;
    }
    return {lines:[words.join(' ')],size:18};
  },[caption]);
  return <g>
    {lines.length>0 && <g opacity={entry} transform={`translate(0 ${(1-entry)*7})`}>
      <rect x={38} y={lines.length===1?803:785} width={464} height={lines.length===1?55:91} rx={6} fill="#080808"/>
      {lines.map((line,i)=><Text key={i} x={270} y={(lines.length===1?840:821)+i*36}
        size={size} color="#ffffff" fontWeight={700} textAnchor="middle">{line}</Text>)}
    </g>}
    <Text x={38} y={918} size={10.2} color={light?'#ded6c6':'#575049'} font={mono}>
      {footers[scene-1].toLocaleUpperCase('id-ID')}
    </Text>
  </g>;
}

const shots=[Opening,Sale,Lawsuit,Hearing,Ruling,Closing];
export function SceneVisual({scene,durationInFrames,caption,captionAge=0,beat,clientVariant}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const uid=useId().replaceAll(':','');
  const Shot=shots[scene-1];
  const time=frame/fps;
  const ratio=progress(frame,0,Math.max(1,durationInFrames-1),Easing.linear);
  const darkPaper=scene===4, lightHeader=scene===2||darkPaper;
  return <svg viewBox="0 0 540 960" width="100%" height="100%" style={{display:'block',background:paper}}>
    <rect width="540" height="960" fill={darkPaper?ink:paper}/>
    <PaperTexture id={uid+'-grain'} dark={darkPaper}/>
    <Shot {...{time,frame,fps,ratio,uid,durationInFrames,beat,clientVariant}}/>
    <Header scene={scene} light={lightHeader} time={time}/>
    <Caption caption={caption} captionAge={captionAge} scene={scene} light={scene===2||darkPaper}/>
  </svg>;
}
