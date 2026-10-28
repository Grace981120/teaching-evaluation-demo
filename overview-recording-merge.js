import {overviewRecordingMergeVersion} from './overview-recording-merge-version.js';
import {mountOverviewRefinement} from './overview-refinement.js?v=20261028-1';

export function mountOverviewRecordingMerge(){
  if(overviewRecordingMergeVersion==='baseline') return;
  const recording=document.querySelector('#recording');
  const overview=document.querySelector('#overview');
  const main=recording?.querySelector('.recording-main');
  const recordingLink=document.querySelector('.topbar a[href="#recording"]');
  const overviewLink=document.querySelector('.topbar a[href="#overview"]');
  const sidebar=recording?.querySelector('.recording-sidebar');
  if(!recording||!overview||!main||!recordingLink||!sidebar) return;

  document.body.classList.add('overview-recording-merge');
  recording.dataset.overviewRecordingMerge=overviewRecordingMergeVersion;
  recording.setAttribute('aria-label','报告总览');
  recordingLink.textContent='报告总览';
  overviewLink?.remove();

  const merged=document.createElement('div');
  merged.id='merged-overview';
  merged.setAttribute('aria-label','课堂评价报告总览');
  while(overview.firstChild) merged.append(overview.firstChild);
  main.append(merged);

  sidebar.hidden=true;
  sidebar.setAttribute('aria-label','督导评价：量表评价、智能导读、语音转写与PPT');
  document.body.append(sidebar);
  const supervisionEntry=document.createElement('button');
  supervisionEntry.type='button';
  supervisionEntry.id='supervision-reopen';
  supervisionEntry.className='supervision-reopen';
  supervisionEntry.innerHTML='<span class="supervision-reopen-icon">▤</span><span>督导评价<small>量表 · 导读 · 转写 · PPT</small></span>';
  document.body.append(supervisionEntry);
  const openSupervision=()=>{
    const evaluationTab=sidebar.querySelector('[data-rec-tab="evaluation"]');
    if(evaluationTab)switchSupervisionTab(evaluationTab);
    sidebar.hidden=false;
    supervisionEntry.hidden=true;
    document.body.classList.add('supervision-open');
    sidebar.querySelector('[role="tab"]')?.focus({preventScroll:true});
  };
  const closeSupervision=()=>{
    sidebar.hidden=true;
    supervisionEntry.hidden=false;
    document.body.classList.remove('supervision-open');
    supervisionEntry.focus({preventScroll:true});
  };
  const switchSupervisionTab=tab=>{
    const key=tab.dataset.smartGuideTab||tab.dataset.realTab||tab.dataset.recTab;
    const panelByKey={evaluation:'recording-evaluation',guide:'recording-smart-guide',transcript:'recording-transcript',knowledge:'recording-knowledge'};
    sidebar.querySelectorAll('.recording-sidebar-head [role="tab"]').forEach(button=>{
      const selected=button===tab;
      button.setAttribute('aria-selected',selected);
      button.tabIndex=selected?0:-1;
    });
    Object.entries(panelByKey).forEach(([name,id])=>{
      const panel=document.getElementById(id);
      if(panel)panel.hidden=name!==key;
    });
  };
  supervisionEntry.addEventListener('click',openSupervision);
  sidebar.addEventListener('click',event=>{
    const tab=event.target.closest('.recording-sidebar-head [role="tab"]');
    if(!tab)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    switchSupervisionTab(tab);
  },true);
  sidebar.querySelector('.recording-sidebar-head [role="tablist"]')?.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const tabs=[...sidebar.querySelectorAll('.recording-sidebar-head [role="tab"]')];
    const current=Math.max(0,tabs.indexOf(document.activeElement));
    const target=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(current+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length];
    switchSupervisionTab(target);
    target.focus();
  },true);
  sidebar.querySelector('.recording-collapse')?.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    closeSupervision();
  },true);
  mountOverviewRefinement();
}
