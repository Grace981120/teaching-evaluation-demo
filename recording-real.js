import {recordingRealVersion} from './recording-real-version.js';
import {realVideos,realKnowledge} from './recording-real-data.js';

export function mountRealRecording(root,{toast}) {
  if(recordingRealVersion==='baseline')return;
  root.classList.add('real-recording');
  const $=s=>root.querySelector(s), fmt=t=>{t=Math.floor(t||0);return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;};
  const link=document.createElement('link');link.rel='stylesheet';link.href='./recording-real.css';document.head.append(link);
  let selected=1,activeTab='evaluation',pendingTime=0;
  const video=document.createElement('video');video.id='real-classroom-video';video.preload='metadata';video.playsInline=true;video.setAttribute('aria-label','智慧医疗创新体验课堂录像');
  $('.recording-teacher').append(video);
  $('.recording-teacher figcaption').textContent='教师全景';
  const absent=document.createElement('span');absent.className='real-feed-empty';absent.textContent='学生画面加载中';$('.recording-students').append(absent);
  const student=document.createElement('video');student.id='real-student-video';student.preload='metadata';student.muted=true;student.defaultMuted=true;student.playsInline=true;student.setAttribute('aria-label','学生全景');$('.recording-students').append(student);
  function alignStudent(force=false){
    if(student.readyState<1)return;
    const target=Math.min(video.currentTime,student.duration);
    if(force||Math.abs(student.currentTime-target)>.2)student.currentTime=target;
    student.playbackRate=video.playbackRate;
  }
  async function playStudent(){
    if(student.readyState<1||video.paused||video.seeking)return;
    alignStudent();
    if(student.currentTime>=student.duration)return;
    try{await student.play();}catch{absent.hidden=false;absent.textContent='学生画面播放未成功';}
  }
  student.addEventListener('loadedmetadata',()=>alignStudent(true));
  student.addEventListener('loadeddata',()=>{absent.hidden=true;playStudent();});
  student.addEventListener('error',()=>{absent.hidden=false;absent.textContent='学生画面加载失败';});
  video.addEventListener('playing',playStudent);
  for(const event of ['pause','waiting','ended'])video.addEventListener(event,()=>student.pause());
  video.addEventListener('seeking',()=>{student.pause();alignStudent(true);});
  video.addEventListener('seeked',()=>{alignStudent(true);playStudent();});
  video.addEventListener('timeupdate',()=>alignStudent());
  video.addEventListener('ratechange',()=>{student.playbackRate=video.playbackRate;});
  const screen=document.createElement('canvas');screen.width=840;screen.height=490;screen.setAttribute('aria-label','导播画面中屏幕区域的同步局部放大');$('.recording-screen').append(screen);
  $('.recording-screen figcaption').textContent='电脑画面';
  const context=screen.getContext('2d');
  function drawScreen(){if(video.readyState>=2)context.drawImage(video,460,420,840,490,0,0,840,490);}
  if(video.requestVideoFrameCallback){const frame=()=>{drawScreen();video.requestVideoFrameCallback(frame);};video.requestVideoFrameCallback(frame);}
  else video.addEventListener('timeupdate',drawScreen);
  video.addEventListener('seeked',drawScreen);
  video.addEventListener('loadeddata',drawScreen);
  video.addEventListener('emptied',()=>context.clearRect(0,0,840,490));
  $('.recording-title h1').textContent='智慧医疗创新体验';
  $('.recording-meta').innerHTML='<span>授课老师：周晋</span><span>日期：2024-09-10</span><span>导播画面</span>';
  const tabs=$('[role=tablist]');
  const tab=document.createElement('button');tab.type='button';tab.id='recording-knowledge-tab';tab.dataset.realTab='knowledge';tab.setAttribute('role','tab');tab.setAttribute('aria-controls','recording-knowledge');tab.setAttribute('aria-selected','false');tab.tabIndex=-1;tab.textContent='PPT';tabs.append(tab);
  const panel=document.createElement('section');panel.id='recording-knowledge';panel.className='recording-side-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=true;
  panel.innerHTML='<div class="real-knowledge-tools"><label><input type="search" class="real-search" aria-label="搜索知识点" placeholder="搜索知识点"></label></div><div class="real-knowledge-list"></div>';
  $('.recording-sidebar').append(panel);
  const missing=document.createElement('p');missing.className='recording-empty real-transcript-empty';missing.textContent='暂无本段录像的语音转写';$('#recording-transcript').append(missing);
  // Attendance placeholder removed per confirmed layout.
  const picker=document.createElement('span');picker.className='real-segment-picker';picker.innerHTML=realVideos.map(v=>`<button type="button" data-real-video="${v.id}" aria-pressed="${v.id===1}">${v.title} · ${v.start}</button>`).join('');$('.recording-segments').append(picker);
  const feedback=document.createElement('div');feedback.className='real-playback-status';feedback.setAttribute('role','status');feedback.hidden=true;$('.recording-player').append(feedback);
  function status(text=''){feedback.textContent=text;feedback.hidden=!text;}
  function useStaticPreview(){
    root.classList.add('real-video-unavailable');
    video.hidden=true;
    student.hidden=true;
    screen.hidden=true;
    absent.hidden=true;
    status();
  }
  function render(){const q=$('.real-search').value.trim();const entries=realKnowledge.filter(k=>k.video===selected&&k.title.includes(q));$('.real-knowledge-list').innerHTML=entries.length?entries.map(k=>`<button type="button" class="real-knowledge-item" data-real-seek="${k.time}"><img src="${k.image}" alt="${k.title}课件截图"><span class="real-ppt-copy"><strong>${k.title}</strong><span class="real-ppt-meta"><time>${fmt(k.time)}</time>${Number.isFinite(k.dwellSeconds)?`<span>停留 ${Math.floor(k.dwellSeconds/60)}分${k.dwellSeconds%60?`${k.dwellSeconds%60}秒`:""}</span>`:""}${k.hasBoard===true?'<span class="real-ppt-board">板书</span>':""}</span></span></button>`).join(''):'<p class="recording-empty">没有匹配的知识点</p>';sync();}
  function sync(){const duration=Number.isFinite(video.duration)?video.duration:realVideos[selected-1].duration;const t=video.currentTime||0;$('#recording-seek').max=duration;$('#recording-seek').value=t;$('#recording-seek').setAttribute('aria-valuetext',`${fmt(t)}，总时长 ${fmt(duration)}`);$('#recording-time').textContent=`${fmt(t)} / ${fmt(duration)}`;const paths=$('.recording-progress-art').querySelectorAll('path');const x=1288*t/duration;paths[0].setAttribute('d',`M0 0H${x}V3.75875H0Z`);paths[1].setAttribute('d',`M${x} 0H1288V3.75875H${x}Z`);const play=$('[data-rec-action=play]');play.setAttribute('aria-label',video.paused?'播放':'暂停');play.querySelector('img').hidden=!video.paused;play.querySelector('span').hidden=video.paused;const matches=[...root.querySelectorAll('[data-real-seek]')];const current=matches.find(n=>Math.abs(Number(n.dataset.realSeek)-t)<2);matches.forEach(n=>{n.classList.toggle('active',n===current);if(n===current)n.setAttribute('aria-current','true');else n.removeAttribute('aria-current');});}
  function select(id,time=0){video.pause();student.pause();selected=id;pendingTime=time;video.src=`/local-media/${id}.mp4`;video.load();absent.hidden=false;absent.textContent='学生画面加载中';student.src=`/local-media/student/${id}.mp4`;student.load();status();root.querySelectorAll('[data-real-video]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.realVideo)===id));render();}
  function seek(t){if(video.readyState<1){pendingTime=t;return;}video.currentTime=Math.max(0,Math.min(video.duration,t));sync();}
  function switchTab(name){activeTab=name;tabs.querySelectorAll('[role=tab]').forEach(b=>{const yes=(b.dataset.realTab||b.dataset.recTab)===name;b.setAttribute('aria-selected',yes);b.tabIndex=yes?0:-1;});$('#recording-evaluation').hidden=name!=='evaluation';$('#recording-transcript').hidden=name!=='transcript';panel.hidden=name!=='knowledge';}
  // Capture only playback/tab events so the original demo clock cannot simulate playback.
  root.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const ds=b.dataset;
    if(ds.recTab||ds.realTab){e.stopImmediatePropagation();switchTab(ds.realTab||ds.recTab);return;}
    if(ds.realVideo){e.stopImmediatePropagation();select(Number(ds.realVideo));return;}
    if(ds.realSeek){e.stopImmediatePropagation();seek(Number(ds.realSeek));return;}
    if(!['play','mute','fit','layout','captions','segment','download'].includes(ds.recAction))return;
    e.stopImmediatePropagation();
    if(ds.recAction==='play'){
      if(root.classList.contains('real-video-unavailable')){toast('当前为课堂画面预览');return;}
      if(!video.paused)video.pause();else try{await video.play();status();}catch{useStaticPreview();toast('当前为课堂画面预览');}
    }
    if(ds.recAction==='mute'){video.muted=!video.muted;b.classList.toggle('is-muted',video.muted);b.setAttribute('aria-pressed',video.muted);b.setAttribute('aria-label',video.muted?'取消静音':'静音');}
    if(ds.recAction==='fit'){const contain=$('.recording-feeds').classList.toggle('contain');b.setAttribute('aria-pressed',contain);b.setAttribute('aria-label',contain?'填充显示画面':'完整显示画面');}
    if(ds.recAction==='layout'){const single=$('.recording-feeds').classList.toggle('single');b.setAttribute('aria-pressed',single);b.setAttribute('aria-label',single?'切换为三分屏':'切换为导播单画面');}
    if(ds.recAction==='captions'||ds.recAction==='download')toast('暂无本段录像的语音转写');
  },true);
  root.addEventListener('input',e=>{if(e.target.id==='recording-seek'){e.stopImmediatePropagation();seek(Number(e.target.value));}if(e.target.matches('.real-search')){e.stopImmediatePropagation();render();}},true);
  root.addEventListener('change',e=>{if(e.target.matches('.recording-speed select')){e.stopImmediatePropagation();video.playbackRate=Number(e.target.value);}},true);
  tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();const names=['evaluation','transcript','knowledge'];const i=names.indexOf(activeTab);switchTab(e.key==='Home'?names[0]:e.key==='End'?names[2]:names[(i+(e.key==='ArrowRight'?1:2))%3]);tabs.querySelector('[aria-selected=true]').focus();},true);
  video.addEventListener('loadedmetadata',()=>{video.playbackRate=Number($('.recording-speed select').value);seek(pendingTime);pendingTime=0;sync();});
  for(const event of ['timeupdate','play','pause','ended','seeked'])video.addEventListener(event,sync);
  video.addEventListener('error',useStaticPreview);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
  new MutationObserver(()=>{if(root.hidden)video.pause();}).observe(root,{attributes:true,attributeFilter:['hidden']});
  select(1);
}
