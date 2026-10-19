/* Single deadline scheduler; no looping MP4, no replacement of the V2.2 scene. */
(()=>{'use strict';
const stage=document.querySelector('.dual-hero-stage');if(!stage)return;
const hero=stage.closest('.hero'),scenes=[...stage.querySelectorAll('[data-hero-scene]')],video=stage.querySelector('video'),controls=stage.querySelector('.dual-hero-controls'),pause=stage.querySelector('.dual-hero-pause'),status=stage.querySelector('.dual-hero-status'),motion=matchMedia('(prefers-reduced-motion: reduce)');
let active=0,paused=false,inView=true,timeout=null,deadline=0,remaining=9000,loaded=false,failed=false,token=0,destroyed=false;
const DURATION=9000,FADE=1500;let transitionUntil=0;
const resize=new ResizeObserver(()=>stage.style.setProperty('--dual-stage-height',stage.clientHeight+'px'));resize.observe(stage);
const blocked=()=>paused||motion.matches||document.hidden||!inView||destroyed;
const stopTimer=()=>{if(timeout!==null){remaining=Math.max(0,deadline-performance.now());clearTimeout(timeout);timeout=null}};
const automotive=()=>{hero.dataset.automotiveActive=String(active===0&&!blocked());hero.dispatchEvent(new Event('schmid:automotive-state'))};
const state=()=>{stage.heroState={active,paused,reduced:motion.matches,inView,timer:timeout!==null,remaining:timeout===null?remaining:Math.max(0,deadline-performance.now()),videoTime:video.currentTime,duration:video.duration,videoPaused:video.paused,videoReady:video.readyState,failed,source:video.currentSrc,transitioning:performance.now()<transitionUntil}};
const arm=ms=>{stopTimer();remaining=ms;if(blocked())return;deadline=performance.now()+ms;timeout=setTimeout(()=>{timeout=null;remaining=0;if(blocked())return;if(active===0)select(1,false);else select(0,false)},ms);state()};
const source=()=>{if(loaded||motion.matches)return;loaded=true;video.src=matchMedia('(max-width:700px)').matches?'assets/cinematic-v26/autohaus-mobile.mp4':'assets/cinematic-v26/autohaus-desktop.mp4';video.load()};
const play=async()=>{if(active!==1||blocked()||failed)return;video.autoplay=true;source();arm(10000);const n=++token;try{await video.play();if(n!==token||active!==1||blocked()){video.autoplay=false;video.pause();return}scenes[1].dataset.playing='true';stopTimer();state()}catch{if(n!==token)return;failed=true;video.autoplay=false;video.pause();scenes[1].dataset.playing='false';arm(Number.isFinite(video.duration)?video.duration*1000:10000);status.textContent='Video nicht automatisch verfügbar. Standbild des Autohauses.';state()}};
const sync=()=>{stopTimer();if(blocked()){++token;video.pause()}else if(active===1&&!failed){play()}else arm(remaining||DURATION);pause.setAttribute('aria-pressed',String(paused||motion.matches));pause.disabled=motion.matches;pause.setAttribute('aria-label',motion.matches?'Automatischer Wechsel wegen reduzierter Bewegung deaktiviert':paused?'Automatischen Szenenwechsel fortsetzen':'Automatischen Szenenwechsel pausieren');pause.querySelector('.dual-pause-label').textContent=motion.matches?'Reduziert':paused?'Weiter':'Pause';pause.firstElementChild.textContent=paused||motion.matches?'▷':'Ⅱ';automotive();state()};
function select(index,manual=true){if(index===active){if(manual){remaining=DURATION;sync()}return}stopTimer();++token;video.pause();active=index;transitionUntil=performance.now()+(motion.matches?0:FADE);remaining=DURATION;stage.dataset.active=String(index);scenes.forEach((s,i)=>{s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index))});controls.querySelectorAll('[data-hero-select]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.heroSelect)===index)));if(index===1){video.currentTime=0;scenes[1].dataset.playing='false';if(!blocked())play()}else{arm(DURATION)}if(manual)status.textContent=index===1?'Szene 2 von 2: Unser Autohaus':'Szene 1 von 2: Fahrzeuge';automotive();state()}
controls.hidden=false;stage.dataset.active='0';controls.querySelectorAll('[data-hero-select]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.heroSelect),true)));pause.addEventListener('click',()=>{paused=!paused;sync()});
controls.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(active?0:1,true);controls.querySelector(`[data-hero-select="${active}"]`).focus()}});
video.addEventListener('ended',()=>{scenes[1].dataset.playing='true';if(active===1&&!blocked())select(0,false);state()});
video.addEventListener('error',()=>{failed=true;scenes[1].dataset.playing='false';if(active===1&&!blocked())arm(10000);state()});
video.addEventListener('playing',()=>{if(active===1&&!blocked()&&!failed){scenes[1].dataset.playing='true';stopTimer()}else{video.autoplay=false;video.pause();if(failed)scenes[1].dataset.playing='false'}state()});video.addEventListener('timeupdate',state);
video.addEventListener('waiting',()=>{if(active===1&&!blocked())arm(10000)});
document.addEventListener('visibilitychange',sync);motion.addEventListener('change',()=>{if(motion.matches){scenes[1].dataset.playing='false'}sync()});
const observer=new IntersectionObserver(entries=>{const next=entries[0].isIntersecting;if(next!==inView){inView=next;sync()}},{threshold:0});observer.observe(stage);
addEventListener('pagehide',e=>{stopTimer();++token;video.pause();if(!e.persisted){destroyed=true;observer.disconnect();resize.disconnect()}automotive()});addEventListener('pageshow',e=>{if(e.persisted)sync()});
sync();
})();
