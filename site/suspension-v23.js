import * as T from './assets/vendor/three-r180/three.module.min.js';
import {COMPONENTS} from './components-v23.js';
export {COMPONENTS};
const clamp=T.MathUtils.clamp;
export const smooth=(v,a,b)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
// Pure deterministic pose contract. Physical source units are metres. No timers or accumulated transforms.
export function poseAt(progress){
 const p=clamp(progress,0,1),s=(a,b)=>smooth(p,a,b),poses=new Map(COMPONENTS.map(c=>[c.id,[0,0,0]]));if(p===0)return poses;
 poses.set('wheel-bolts',[0,0,.81*s(0,.08)]);poses.set('wheel',[0,0,.66*s(.055,.25)]);
 const brake=s(.25,.34);for(const id of['caliper','caliper-carrier'])poses.set(id,[.29*brake,.035*brake,0]);
 poses.set('pads',[.29*brake-.10*s(.34,.39),.035*brake,0]);
 poses.set('rotor',[0,0,.40*s(.38,.46)]);poses.set('hub',[0,0,.20*s(.46,.50)]);
 poses.set('bearing',[0,0,-.13*s(.49,.56)]);poses.set('shield',[.05*s(.47,.55),0,-.16*s(.47,.55)]);
 poses.set('tie',[-.12*s(.55,.64),.025*s(.55,.64),.12*s(.50,.55)]);
 poses.set('shaft',[.035*s(.57,.68),0,-.22*s(.57,.68)]);
 poses.set('antiroll-link',[.15*s(.63,.71),.03*s(.63,.71),0]);
 for(const id of['arm','balljoint'])poses.set(id,[0,-.20*s(.66,.75),.025*s(.66,.75)]);
 poses.set('knuckle',[.015*s(.76,.86),-.035*s(.76,.86),-.20*s(.76,.86)]);
 const axis=new T.Vector3(-.055,.47,-.075).normalize();
 const lift=.24*s(.75,.86);for(const[id,extra]of[['strut',0],['seat-lower',0],['mount',.40*s(.82,.90)],['seat-upper',.29*s(.86,.94)],['spring',.17*s(.90,.98)],['boot',.08*s(.94,1)]])poses.set(id,axis.clone().multiplyScalar(lift+extra).toArray());
 // The flexible lines are shown disconnected before units separate; no repair sequence is implied.
 for(const id of['hose','abs'])poses.set(id,[-.04*s(.25,.34),.24*s(.75,.86),-.07*s(.25,.34)]);
 return poses;
}
async function unzip(url){const r=await fetch(url);if(!r.ok)throw Error('Model HTTP '+r.status);return new Response(r.body.pipeThrough(new DecompressionStream('gzip')))}
export async function buildSuspension({quality='high'}={}){
 const base='./assets/engineering-v23/corner-'+quality;
 const [data,buffer]=await Promise.all([unzip(base+'.json.gz').then(r=>r.json()),unzip(base+'.bin.gz').then(r=>r.arrayBuffer())]);
 function revive(o){if(!o||typeof o!=='object')return;if(o.array?.binary){o.array=new globalThis[o.type](buffer,o.array.offset,o.array.length);return}for(const v of Object.values(o))revive(v)}revive(data);
 const root=await new T.ObjectLoader().parseAsync(data),groups=new Map(),pickables=[],textures=new Set();root.scale.setScalar(10);
 root.traverse(o=>{if(o.isGroup&&COMPONENTS.some(p=>p.id===o.userData.id))groups.set(o.userData.id,o);if(o.isMesh)pickables.push(o)});
 if(groups.size!==26)throw Error('Model contract: expected 26 parts');
 const makeNoise=(type,size=128)=>{const a=new Uint8Array(size*size*4);let seed=2301;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;if(type==='normal'){a[i]=115+rnd()*26;a[i+1]=115+rnd()*26;a[i+2]=252}else{const r=Math.hypot(x-size/2,y-size/2),v=type==='machining'?110+Math.sin(r*8)*22+rnd()*16:180+rnd()*65;a[i]=a[i+1]=a[i+2]=v}a[i+3]=255}const t=new T.DataTexture(a,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.needsUpdate=true;textures.add(t);return t};
 const castNormal=makeNoise('normal'),rubberNormal=makeNoise('normal'),grain=makeNoise('grain'),machining=makeNoise('machining',512);castNormal.repeat.set(24,24);rubberNormal.repeat.set(14,14);grain.repeat.set(8,8);machining.repeat.set(3.125,3.125);machining.offset.set(.5,.5);
 const materials=new Set();pickables.forEach(o=>{const m=o.material;if(materials.has(m))return;materials.add(m);const role=m.userData.role;if(role==='cast'){m.normalMap=castNormal;m.normalScale=new T.Vector2(.12,.12);m.roughnessMap=grain;m.roughness=.67}else if(role==='rubber'||role==='tread'){m.normalMap=rubberNormal;m.normalScale=new T.Vector2(.025,.025);m.roughnessMap=grain;m.roughness=.97;m.color.setHex(role==='tread'?0x1a1c1d:0x181a1c)}else if(role==='iron'){m.roughnessMap=machining;m.roughness=.96;m.color.setHex(0x788186)}else if(role==='gunmetal'){m.roughness=.3}else if(role==='bright'){m.roughness=.22}m.userData.baseColor=m.color.getHex();m.needsUpdate=true});
 try{const label=await new T.TextureLoader().loadAsync('./assets/engineering-v22/sidewall.png');textures.add(label);label.colorSpace=T.SRGBColorSpace;const geometry=new T.RingGeometry(.244,.302,96),material=new T.MeshStandardMaterial({map:label,transparent:true,roughness:.94,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});material.userData.baseColor=material.color.getHex();for(const side of[-1,1]){const decal=new T.Mesh(geometry,material);decal.position.z=side*.114;decal.rotation.y=side<0?Math.PI:0;decal.userData.component='wheel';groups.get('wheel').add(decal);pickables.push(decal)}}catch{}
 const bases=new Map([...groups].map(([id,g])=>[id,{position:g.position.clone(),quaternion:g.quaternion.clone()}]));
 const padBases=groups.get('pads').children.filter(o=>o.userData.padSide).map(o=>({o,z:o.position.z,side:o.userData.padSide}));
 function applyPose(progress){const p=clamp(progress,0,1),poses=poseAt(p);for(const [id,offset]of poses){const g=groups.get(id),base=bases.get(id);g.position.copy(base.position).add(new T.Vector3(...offset));g.quaternion.copy(base.quaternion)}padBases.forEach(({o,z,side})=>o.position.z=z+side*.055*smooth(p,.34,.40));}
 // One replaceable outline, owned by the scene: selecting repeatedly never grows retained geometry.
 let outline=null,selection=null;
 function clearOutline(){if(!outline)return;outline.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});outline.removeFromParent();outline=null}
 function highlight(id){if(id===selection)return;selection=id;clearOutline();if(id&&groups.has(id)){outline=new T.Group();outline.name='selection-outline';for(const o of groups.get(id).children){if(!o.isMesh||o.isInstancedMesh)continue;const line=new T.LineSegments(new T.EdgesGeometry(o.geometry,42),new T.LineBasicMaterial({color:0xe4c578,transparent:true,opacity:.75}));line.position.copy(o.position);line.quaternion.copy(o.quaternion);line.scale.copy(o.scale);outline.add(line)}groups.get(id).add(outline)}const seen=new Set();pickables.forEach(o=>{const m=o.material;if(seen.has(m))return;seen.add(m);m.color.setHex(m.userData.baseColor);if(id&&o.userData.component!==id)m.color.multiplyScalar(.78)})}
 let triangles=0;pickables.forEach(o=>triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1));
 return{group:root,groups,pickables,triangles,components:COMPONENTS,applyPose,highlight,dispose(){clearOutline();const geo=new Set(),mat=new Set();root.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.material)mat.add(o.material)});geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}};
}



