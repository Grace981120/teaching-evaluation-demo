const storageKey='teaching-evaluation-demo-report-versions';
const pages={
  '教学态度':'attitude','教学内容':'content','教学方法':'method','教学素养':'literacy','教学效果':'effect'
};

export function mountReportVersionConfig({dimensions,toast,onChange}){
  let state={active:'advanced',versions:{advanced:{name:'进阶版',dimensions:[...dimensions],modules:{}},basic:{name:'普通版',dimensions:[...dimensions],modules:{}}}};
  try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved?.versions?.advanced&&saved?.versions?.basic)state=saved;}catch{}
  const get=()=>state.versions[state.active];
  const moduleList=name=>{const root=document.querySelector('#'+pages[name]);return [...root.querySelectorAll(':scope > section.card.section, .content-detail-card[id]')].map(node=>({id:node.id||node.querySelector('h2,h3')?.id,name:node.querySelector('h2,h3')?.textContent.trim()||'分析模块'})).filter(m=>m.id);};
  const save=()=>localStorage.setItem(storageKey,JSON.stringify(state));
  let fullSummaryMarkup;
  let tagsExpanded=false;
  const apply=()=>{
    const config=get(); window.__reportVersionConfig={dimensions:config.dimensions};
    const isBasic=state.active==='basic';
    document.querySelectorAll('#overview .overview-v2-highlight,#overview .overview-v2-problem,#overview .overview-v2-outline,#overview-v2-highlights,#overview-v2-problems').forEach(node=>node.hidden=isBasic);
    const summary=document.querySelector('#overview .summary-grid');
    if(summary&&!fullSummaryMarkup)fullSummaryMarkup=summary.innerHTML;
    const tags=[
      ['异常标签','教师缺课','#attitude-basics'],['异常标签','疑似代课','#attitude-basics'],['异常标签','教师迟到','#attitude-basics'],['异常标签','教师早退','#attitude-basics'],['异常标签','就坐时长比例高','#effect-participation'],['异常标签','敏感词','#method-language'],['异常标签','教师异常行为','#attitude-body'],['异常标签','学习参与度低','#effect-participation'],['异常标签','学生出勤率低','#effect-participation'],['异常标签','学生迟到率高','#effect-participation'],['异常标签','学生早退率高','#effect-participation'],['异常标签','前排就坐率低','#effect-participation'],['异常标签','学生抬头率低','#effect-state'],['异常标签','学生异常行为','#effect-anomalies'],
      ['示范标签','课堂管理','#attitude-management'],['示范标签','教学目标','#content-goals'],['示范标签','教学重难点','#content-challenges'],['示范标签','理论联系实际次数','#content-practice'],['示范标签','学科思维','#literacy-critical'],['示范标签','学科历史','#content-features'],['示范标签','学科前沿','#content-features'],['示范标签','跨学科联系','#content-features'],['示范标签','审辩思维','#literacy-critical'],['示范标签','表达能力','#literacy-communication'],['示范标签','合作能力','#literacy-collaboration'],['示范标签','课程思政','#literacy-values'],['示范标签','学习参与度高','#effect-participation'],['示范标签','学生出勤率高','#effect-participation'],['示范标签','前排就坐率高','#effect-participation'],['示范标签','学生抬头率高','#effect-state'],['示范标签','学习行为类型多','#effect-actions']
    ];
    if(summary){summary.classList.toggle('basic-summary-grid',isBasic);summary.classList.toggle('basic-tags-expanded',isBasic&&tagsExpanded);summary.innerHTML=isBasic?['异常标签','示范标签'].map(kind=>{const list=tags.filter(([type])=>type===kind);const shown=tagsExpanded?list:list.slice(0,6);return `<section class="summary-item basic-summary-label"><h3>${kind}</h3><div>${shown.map(([,name,id])=>`<button type="button" data-basic-tag-target="${id}">${name}</button>`).join('')}</div>${list.length>6?`<button type="button" class="basic-tags-toggle" data-basic-tags-expand>${tagsExpanded?'收起':'展开全部'}</button>`:''}</section>`;}).join(''):fullSummaryMarkup;}
    dimensions.forEach(name=>{
      const visible=config.dimensions.includes(name), page=pages[name];
      document.querySelector(`.topbar a[href="#${page}"]`)?.toggleAttribute('hidden',!visible);
      const root=document.querySelector('#'+page);
      if(!visible&&location.hash.startsWith('#'+page))location.hash='#overview';
      const selected=config.modules[name];
      moduleList(name).forEach(module=>{
        const node=document.getElementById(module.id);
        if(!node)return;
        if(name==='教学效果'&&['effect-participation-legacy','effect-expressions-legacy'].includes(module.id)){node.hidden=true;return;}
        node.hidden=visible&&selected?.includes(module.id)===false;
      });
      if(name==='教学效果'){
        const state=document.querySelector('#effect-state');
        const legacyParticipation=document.querySelector('#effect-participation-legacy');
        const legacyExpressions=document.querySelector('#effect-expressions-legacy');
        const stateEnabled=!selected||selected.some(id=>['effect-state','effect-participation','effect-expressions'].includes(id));
        if(state)state.hidden=!visible||!stateEnabled;
        if(legacyParticipation)legacyParticipation.hidden=true;
        if(legacyExpressions)legacyExpressions.hidden=true;
      }
    });
    onChange();
  };
  const button=document.createElement('button');button.type='button';button.className='report-version-fab';button.textContent='配置版本';button.setAttribute('aria-label','配置报告版本');document.body.append(button);
  const panel=document.createElement('aside');panel.className='report-version-panel';panel.hidden=true;panel.innerHTML='<div class="report-version-head"><div><span>报告版本配置</span><h2>模块与维度</h2></div><button type="button" data-version-close aria-label="关闭">×</button></div><div class="report-version-body"></div><footer><button type="button" data-version-save>保存当前版本</button></footer>';document.body.append(panel);
  const render=()=>{
    const config=get();
    const ordered=[...config.dimensions,...dimensions.filter(name=>!config.dimensions.includes(name))];
    panel.querySelector('.report-version-body').innerHTML=`<div class="report-version-tabs" role="tablist">${Object.entries(state.versions).map(([id,v])=>`<button type="button" role="tab" data-version="${id}" aria-selected="${state.active===id}">${v.name}</button>`).join('')}</div><p class="report-version-hint">选择本版本包含的维度和模块；排序会同步到报告导航和诊断地图。</p><div class="version-dimensions">${ordered.map((name,index)=>{const enabled=config.dimensions.includes(name),mods=moduleList(name),visible=config.modules[name]||mods.map(m=>m.id);return `<section class="version-dimension" data-version-dimension="${name}"><header><label><input type="checkbox" data-dimension-toggle="${name}" ${enabled?'checked':''}>${name}</label><span><button type="button" data-dimension-move="${index},-1" ${index===0||!enabled?'disabled':''}>↑</button><button type="button" data-dimension-move="${index},1" ${index===config.dimensions.length-1||!enabled?'disabled':''}>↓</button></span></header>${enabled?`<div class="version-modules">${mods.map((m,i)=>`<div><label><input type="checkbox" data-module-toggle="${name}|${m.id}" ${visible.includes(m.id)?'checked':''}>${m.name}</label><span><button type="button" data-module-move="${name}|${m.id}|-1" ${i===0?'disabled':''}>↑</button><button type="button" data-module-move="${name}|${m.id}|1" ${i===mods.length-1?'disabled':''}>↓</button></span></div>`).join('')}</div>`:''}</section>`;}).join('')}</div>`;
  };
  const persistApply=(message)=>{save();apply();render();if(message)toast(message);};
  button.addEventListener('click',()=>{render();panel.hidden=false;});
  panel.addEventListener('click',event=>{
    const target=event.target.closest('button,input');if(!target)return;
    if(target.matches('[data-version-close]')){panel.hidden=true;return;}
    if(target.matches('[data-version-save]')){persistApply('当前版本配置已保存');return;}
    if(target.dataset.version){state.active=target.dataset.version;apply();render();return;}
    if(target.dataset.dimensionToggle){const name=target.dataset.dimensionToggle,config=get();config.dimensions=target.checked?[...config.dimensions,name]:config.dimensions.filter(n=>n!==name);config.modules[name]??=moduleList(name).map(m=>m.id);apply();render();return;}
    if(target.dataset.moduleToggle){const [name,id]=target.dataset.moduleToggle.split('|'),config=get();config.modules[name]??=moduleList(name).map(m=>m.id);config.modules[name]=target.checked?[...new Set([...config.modules[name],id])]:config.modules[name].filter(x=>x!==id);apply();return;}
    if(target.dataset.dimensionMove){const [index,delta]=target.dataset.dimensionMove.split(',').map(Number),config=get();const current=[...config.dimensions],next=index+delta;if(next>=0&&next<current.length){[current[index],current[next]]=[current[next],current[index]];config.dimensions=current;apply();render();}return;}
    if(target.dataset.moduleMove){const [name,id,delta]=target.dataset.moduleMove.split('|'),config=get();const list=config.modules[name]??moduleList(name).map(m=>m.id),index=list.indexOf(id),next=index+Number(delta);if(next>=0&&next<list.length){[list[index],list[next]]=[list[next],list[index]];config.modules[name]=list;const root=document.querySelector('#'+pages[name]),node=document.getElementById(id),reference=document.getElementById(list[next]);if(node&&reference)root.insertBefore(node,delta==='-1'?reference:reference.nextSibling);apply();render();}return;}
  });
  document.addEventListener('click',event=>{const tag=event.target.closest('[data-basic-tag-target]');if(!tag)return;location.hash=tag.dataset.basicTagTarget.replace('#','');document.querySelector(tag.dataset.basicTagTarget)?.scrollIntoView({behavior:'smooth',block:'start'});});
  document.addEventListener('click',event=>{if(event.target.closest('[data-basic-tags-expand]')){tagsExpanded=!tagsExpanded;apply();}});
  document.addEventListener('click',event=>{if(event.target.closest('[data-dimension]'))setTimeout(()=>{document.querySelectorAll('#detail-dialog .attitude-modal-row').forEach(row=>{const key=Object.keys(row.dataset).find(name=>name.endsWith('Target'));const prefix=key?.replace('Target','');const id=row.dataset[key];if(prefix&&id)row.hidden=document.getElementById(`${prefix}-${id}`)?.hidden===true;});},0);});
  apply();
}
