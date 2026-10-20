import {recordingAnomalyVersion} from './recording-anomaly-version.js';
import {recordingTranscript} from './recording-transcript-data.js';

const duration=2400;
const events=[
  {id:'t-phone-1',who:'teacher',type:'看手机',start:336,end:384,color:'#F56C6C'},
  {id:'t-sensitive',who:'teacher',type:'敏感词',start:804,end:828,color:'#E8590C'},
  {id:'t-call',who:'teacher',type:'接打电话',start:1260,end:1338,color:'#FF922B'},
  {id:'t-phone-2',who:'teacher',type:'看手机',start:2088,end:2130,color:'#F56C6C'},
  {id:'s-heads',who:'student',type:'抬头率低',start:192,end:300,color:'#3B82F6'},
  {id:'s-talk',who:'student',type:'交头接耳',start:564,end:636,color:'#6366F1'},
  {id:'s-phone',who:'student',type:'看手机',start:1050,end:1098,color:'#8B5CF6'},
  {id:'s-sleep',who:'student',type:'睡觉',start:1512,end:1626,color:'#4F46E5'},
  {id:'s-participation',who:'student',type:'参与度低',start:1860,end:2016,color:'#2563EB'}
];

const fmt=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
const safe=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const subject=who=>who==='teacher'?'教师':'学生';

function grouped(list,who){
  const counts=new Map();
  list.filter(item=>item.who===who).forEach(item=>counts.set(item.type,(counts.get(item.type)||0)+1));
  return [...counts].map(([type,count])=>`<button type="button" class="recording-anomaly-tag" data-anomaly-who="${who}" data-anomaly-type="${safe(type)}" aria-label="定位${subject(who)}${safe(type)}，共${count}次">${safe(type)} <b>${count}次</b></button>`).join('');
}

function nearestTranscript(seconds){
  return recordingTranscript.reduce((best,row)=>Math.abs(row.time-seconds)<Math.abs(best.time-seconds)?row:best,recordingTranscript[0]);
}

function evidenceBody(item){
  const transcript=nearestTranscript(item.start);
  const image=item.who==='teacher'?'assets/recording-screen-20260912/teacher-1440.jpg':'assets/recording-screen-20260912/student-1440.jpg';
  return `<div class="recording-anomaly-evidence-meta"><span>${subject(item.who)}异常</span><strong>${safe(item.type)}</strong><time>${fmt(item.start)}–${fmt(item.end)}</time></div>
    <figure class="recording-anomaly-evidence-image"><img src="${image}" alt="${subject(item.who)}${safe(item.type)}时段课堂截图"><figcaption>课堂截图 · ${fmt(item.start)}</figcaption></figure>
    <section class="recording-anomaly-transcript"><h3>转写片段</h3><div><time>${fmt(transcript.time)}</time><p><strong>${safe(transcript.speaker)}：</strong>${safe(transcript.text)}</p></div></section>`;
}

export function mountRecordingAnomaly(root,{openDialog,seek}){
  if(recordingAnomalyVersion==='baseline'||root.querySelector('#recording-anomaly-timeline'))return;
  const section=document.createElement('section');
  section.id='recording-anomaly-timeline';
  section.className='recording-anomaly-timeline';
  section.setAttribute('aria-labelledby','recording-anomaly-title');
  if(!events.length){
    section.innerHTML='<div class="recording-anomaly-head"><h3 id="recording-anomaly-title">课堂异常时间轴</h3></div><div class="recording-anomaly-empty">本堂课未检测到异常行为</div>';
    root.querySelector('#process-v4')?.before(section);
    return;
  }
  const teachers=events.filter(item=>item.who==='teacher');
  const students=events.filter(item=>item.who==='student');
  const marks=list=>list.map(item=>`<button type="button" class="recording-anomaly-mark" data-anomaly-id="${item.id}" style="left:${item.start/duration*100}%;width:${(item.end-item.start)/duration*100}%;--anomaly-color:${item.color}" aria-label="${subject(item.who)}异常：${safe(item.type)}，${fmt(item.start)}至${fmt(item.end)}"></button>`).join('');
  section.innerHTML=`<div class="recording-anomaly-head"><div><h3 id="recording-anomaly-title">课堂异常时间轴</h3><span>共 ${events.length} 条</span></div><p>悬停查看异常类型，点击可定位课堂录像</p></div>
    <div class="recording-anomaly-plot"><div class="recording-anomaly-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="recording-anomaly-row"><span>教师异常</span><div class="recording-anomaly-track" data-anomaly-track="teacher" role="slider" tabindex="0" aria-label="教师异常时间轴，点击定位视频" aria-valuemin="0" aria-valuemax="2400" aria-valuenow="0">${marks(teachers)}</div></div><div class="recording-anomaly-row"><span>学生异常</span><div class="recording-anomaly-track" data-anomaly-track="student" role="slider" tabindex="0" aria-label="学生异常时间轴，点击定位视频" aria-valuemin="0" aria-valuemax="2400" aria-valuenow="0">${marks(students)}</div></div><div class="recording-anomaly-axis" aria-hidden="true"><span>00:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>40:00</span></div></div>
    <div class="recording-anomaly-summary"><article><span class="recording-anomaly-subject teacher">师</span><div><strong>教师异常 · ${teachers.length} 次</strong><div class="recording-anomaly-tags">${grouped(events,'teacher')}</div></div></article><article><span class="recording-anomaly-subject student">生</span><div><strong>学生异常 · ${students.length} 次</strong><div class="recording-anomaly-tags">${grouped(events,'student')}</div></div></article></div>
    <div class="recording-anomaly-legend" aria-label="异常轨道颜色说明"><span><i class="teacher"></i>教师异常（红橙系）</span><span><i class="student"></i>学生异常（蓝紫系）</span></div><div class="recording-anomaly-tip" role="tooltip" hidden></div>`;
  root.querySelector('#process-v4')?.before(section);
  const tip=section.querySelector('.recording-anomaly-tip');
  const hideTip=()=>{tip.hidden=true;section.querySelectorAll('[aria-describedby]').forEach(node=>node.removeAttribute('aria-describedby'));};
  const locate=(seconds,play=false)=>{
    const target=Math.max(0,Math.min(duration,Math.round(seconds)));
    const timeOutput=root.querySelector('#recording-time'),seekInput=root.querySelector('#recording-seek'),total=timeOutput?.textContent.split('/')[1]?.trim(),max=seekInput?.max;
    seek(target);section.querySelectorAll('[data-anomaly-track]').forEach(track=>track.setAttribute('aria-valuenow',target));
    const video=root.querySelector('#real-classroom-video');
    if(root.classList.contains('real-recording')&&video?.readyState<1&&timeOutput&&total){timeOutput.textContent=`${fmt(target)} / ${total}`;if(seekInput&&max)seekInput.max=max;}
    if(video){if(video.readyState>=1)video.currentTime=target;if(play)video.play().catch(()=>{});}
    return target;
  };
  section.querySelectorAll('[data-anomaly-id]').forEach(mark=>{
    const item=events.find(row=>row.id===mark.dataset.anomalyId);
    const showTip=()=>{
      const box=mark.getBoundingClientRect();
      tip.innerHTML=`<b><i style="background:${item.color}"></i>${subject(item.who)} · ${safe(item.type)}</b><div><span>起止时间</span><span>${fmt(item.start)}–${fmt(item.end)}</span></div><div><span>点击后</span><span>定位到该异常时间</span></div>`;
      tip.hidden=false;tip.style.left=`${Math.max(8,Math.min(innerWidth-tip.offsetWidth-8,box.left+box.width/2-tip.offsetWidth/2))}px`;tip.style.top=`${Math.min(innerHeight-tip.offsetHeight-8,box.bottom+10)}px`;
      tip.id='recording-anomaly-tip';mark.setAttribute('aria-describedby',tip.id);
    };
    mark.addEventListener('pointerenter',showTip);mark.addEventListener('pointerleave',hideTip);mark.addEventListener('focus',showTip);mark.addEventListener('blur',hideTip);
    mark.addEventListener('click',event=>{
      event.stopPropagation();hideTip();locate(item.start,true);
    });
  });
  section.querySelectorAll('[data-anomaly-track]').forEach(track=>{
    track.addEventListener('click',event=>{const box=track.getBoundingClientRect();locate((event.clientX-box.left)/box.width*duration);});
    track.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const current=Number(track.getAttribute('aria-valuenow'))||0;locate(event.key==='Home'?0:event.key==='End'?duration:current+(event.key==='ArrowRight'?10:-10));});
  });
  const tagPositions=new Map();
  section.querySelectorAll('[data-anomaly-type]').forEach(tag=>tag.addEventListener('click',()=>{
    const matches=events.filter(item=>item.who===tag.dataset.anomalyWho&&item.type===tag.dataset.anomalyType);
    const key=`${tag.dataset.anomalyWho}:${tag.dataset.anomalyType}`,index=tagPositions.get(key)||0,item=matches[index%matches.length];
    tagPositions.set(key,(index+1)%matches.length);locate(item.start,true);
    tag.setAttribute('aria-label',`已定位${subject(item.who)}${item.type} ${fmt(item.start)}，共${matches.length}次${matches.length>1?'，再次点击定位下一次':''}`);
  }));
  window.addEventListener('scroll',hideTip,true);window.addEventListener('resize',hideTip);
}
