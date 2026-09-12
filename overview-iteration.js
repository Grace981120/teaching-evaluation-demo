import {overviewIterationVersion} from './overview-iteration-version.js';
import {details} from './overview-diagnosis-data.js?v=20260912-sync1';
import {reviews} from './overview-review-short.js';
import {chartEvidenceV2} from './overview-evidence-data.js';

const groups=[['attitude','教学态度',92.1],['content','教学内容',98.2],['method','教学方法',82.1],['literacy','课堂素养',95.1],['effect','教学效果',93.8]];
const modules={attitude:[['basics','基础情况'],['management','课堂管理'],['investment','教师教学投入'],['language','语言表达'],['body','教学姿态']],content:[['goals','教学目标'],['challenges','教学重难点'],['practice','理论联系实际'],['features','学科特点'],['accuracy','知识准确性']],method:[['multimedia','教师信息化应用'],['interaction','师生互动'],['questions','教学提问'],['board','课堂板书'],['homework','引导课后学习']],literacy:[['values','课程思政'],['collaboration','合作能力'],['critical','审辩思维'],['communication','沟通能力']],effect:[['monitoring','学情监测'],['state','学生学习状态'],['anomalies','学生异常行为'],['pyramid','学习金字塔'],['actions','学生动作']]};
const summaries=['准时到课、着装规范，部分课堂行为线索仍需结合情境核查。','教学目标与重难点清晰，学科前沿和跨学科联系较丰富。','课堂以教师讲授为主，建议增加高阶提问、学生表达和反馈。','已结合智慧医疗案例，建议增加论证、表达与合作任务。','课堂参与总体较高，建议结合低谷时段持续跟进参与质量。'];
const codes=['h0','h1','h2','p0','p1','p2'];
const star='<img src="assets/figma/content-img111111.svg" width="16" height="16" alt="">';
const ai=text=>`<div class="overview-v2-ai">${star}<p>${text}</p></div>`;

export function mountOverviewIteration({openDialog}){
  if(overviewIterationVersion==='baseline') return;
  const root=document.querySelector('#overview');
  if(!root || root.dataset.overviewIteration) return;
  root.dataset.overviewIteration='2.0';
  document.querySelector('a[href="#literacy"]').textContent='课堂素养';
  root.querySelector('.overall-score strong').textContent='88.2';
  root.querySelector('.overall-score>div p').textContent='本课节综合评价';
  root.querySelector('.score-context').hidden=true;
  const cards=root.querySelector('.summary-grid');
  const outline=root.querySelector('[data-outline-open]');
  const coverage='55%';
  cards.innerHTML=`<button type="button" class="summary-item overview-v2-highlight" data-overview-section="highlights"><span class="eyebrow">亮点 <span class="arrow" aria-hidden="true">↗</span></span><h3>联系医疗实际，引导有据判断</h3><p>结合病例与资料，培养审慎判断</p></button><button type="button" class="summary-item overview-v2-problem" data-overview-section="problems"><span class="eyebrow">问题 <span class="arrow" aria-hidden="true">↗</span></span><h3>${reviews.p0.title}</h3><p>补充学生回答，确认是否理解</p></button>`;
  if(outline){outline.className='summary-item overview-v2-outline';outline.innerHTML=`<span class="eyebrow">课程大纲匹配 <span class="arrow" aria-hidden="true">↗</span></span><h3>知识覆盖率 ${coverage}</h3><p>本次课与课程大纲的对应情况</p>`;cards.append(outline);}
  const dimensionRoot=root.querySelector('#dimensions');
  dimensionRoot.innerHTML=groups.map(([id,name,score],i)=>`<button type="button" class="dimension-card" data-overview-dimension="${id}" aria-haspopup="dialog"><h3>${name}</h3><span class="tag ${score<90?'orange':''}">${score>=90?'优秀':'可提升'}</span><strong class="dimension-score">${score.toFixed(1)}</strong><p>${summaries[i]}</p></button>`).join('');
  const oldEvidence=root.querySelector('#evidence'); if(oldEvidence) oldEvidence.hidden=true;
  const oldSuggestions=root.querySelector('#suggestions'); if(oldSuggestions) oldSuggestions.hidden=true;
  const tracking=root.querySelector('#tracking'); if(tracking) tracking.hidden=true;
  root.querySelector('footer').hidden=true;
  oldEvidence?.insertAdjacentHTML('afterend',sectionHTML('highlights','课堂亮点','本课较可取的是，教师能把技术问题放进医疗应用情境，并通过追问和资料比较，引导学生说明理由、审慎判断。部分学生的回答已体现出这样的思考。','h'));
  root.querySelector('#overview-v2-highlights').insertAdjacentHTML('afterend',sectionHTML('problems','问题及改进建议','后续可更多关注学生在讲解和提示之后如何回答：对解释不充分的地方继续引导，对已经暴露的误解再次确认，并补充关键概念的学习反馈。','p'));
  updateRadar(root);
  root.addEventListener('click',event=>{const trigger=event.target.closest('[data-overview-section]');if(!trigger)return;const section=root.querySelector('#overview-v2-'+trigger.dataset.overviewSection);const heading=section?.querySelector('h2');section?.scrollIntoView({behavior:'smooth',block:'start'});if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}});

  function sectionHTML(id,title,intro,prefix){return `<section class="card section overview-v2-section" id="overview-v2-${id}"><div class="section-heading"><h2>${title}</h2></div><div class="suggestion-grid">${codes.filter(c=>c[0]===prefix).map(code=>`<button type="button" class="suggestion-card overview-v2-finding overview-v2-${prefix==='h'?'highlight':'problem'}" data-overview-proof="${code}" aria-haspopup="dialog"><span class="eyebrow">${prefix==='h'?'课堂亮点':'重点改进'}</span><h3>${reviews[code].title}</h3><p>${reviews[code].summary}</p>${prefix==='p'?`<p class="overview-v2-advice">${reviews[code].suggestion}</p>`:''}</button>`).join('')}</div></section>`;}
  function diagnosis(id){const i=groups.findIndex(g=>g[0]===id),g=groups[i];openDialog(g[1],`<div class="modal-score"><strong>${g[2]}<small>分</small></strong><span class="tag ${g[2]<90?'orange':''}">${g[2]>=90?'优秀':'可提升'}</span></div>${ai(summaries[i])}<div class="overview-v2-breakdowns">${modules[id].map(([key,name])=>`<section class="overview-v2-breakdown"><h3><button type="button" data-overview-module="${id}-${key}">${name}</button></h3><table class="detail-table"><thead><tr><th>观测点</th><th>本课表现</th><th>得分 / 满分</th></tr></thead><tbody>${(details[key]||[]).map(row=>`<tr><td colspan="3"><button type="button" class="overview-v2-observation" data-overview-module="${id}-${key}"><span>${row[0]}</span><span>${row[1]}</span><span>${row[2]}</span></button></td></tr>`).join('')}</tbody></table></section>`).join('')}</div>`,'诊断地图 / 指标摘要');}
  function proof(code){const r=reviews[code];openDialog(r.title,`${ai(r.summary)}<section class="overview-v2-review">${r.paragraphs.map(p=>`<p>${p}</p>`).join('')}<h3>${code[0]==='h'?'进一步发挥教学优势':'教学建议'}</h3><p>${r.suggestion}</p></section><h3 class="overview-v2-evidence-title">相关课堂记录</h3>${chartEvidenceV2(code)}`,'课堂诊断');document.querySelector('#detail-dialog').classList.add('overview-v2-proof-dialog');}
  root.addEventListener('click',event=>{const score=event.target.closest('[data-action="scoring"]');const axis=event.target.closest('#radar [data-dimension]');if(!score&&!axis)return;event.preventDefault();event.stopImmediatePropagation();if(axis){diagnosis(groups[Number(axis.dataset.dimension)][0]);return;}openDialog('得分说明',`<p>五个维度采用百分制；观测点按各自满分及用户配置权重折算，模块不单独打分。</p><table class="detail-table"><thead><tr><th>评价维度</th><th>本课节得分</th><th>示例权重</th></tr></thead><tbody>${groups.map(g=>`<tr><td>${g[1]}</td><td>${g[2]}</td><td>20%</td></tr>`).join('')}</tbody></table><h3>综合得分：88.2 分</h3>`,'报告说明');},true);
  root.addEventListener('click',event=>{const card=event.target.closest('[data-overview-card]');if(card){const target=root.querySelector(`[data-overview-proof="${card.dataset.overviewCard}"]`);target?.scrollIntoView({behavior:'smooth',block:'center'});target?.focus({preventScroll:true});return;}const d=event.target.closest('[data-overview-dimension]');if(d){diagnosis(d.dataset.overviewDimension);return;}const finding=event.target.closest('[data-overview-proof]');if(finding) proof(finding.dataset.overviewProof);});
  document.querySelector('#detail-dialog').addEventListener('click',event=>{const jump=event.target.closest('[data-overview-module]');if(!jump)return;const id=jump.dataset.overviewModule;document.querySelector('#detail-dialog').close();setTimeout(()=>{location.hash='#'+id;},0);});
  document.querySelector('#detail-dialog').addEventListener('close',event=>event.currentTarget.classList.remove('overview-v2-proof-dialog'));
}

function updateRadar(root){const svg=root.querySelector('#radar svg');if(!svg)return;const point=(i,v)=>[175+Math.sin(i*Math.PI*2/5)*96*v/100,135-Math.cos(i*Math.PI*2/5)*96*v/100];const current=[...svg.querySelectorAll('polygon')].at(-1);current?.setAttribute('points',groups.map((g,i)=>point(i,g[2]).join(',')).join(' '));svg.querySelectorAll('.axis-label').forEach((label,i)=>{label.querySelector('text').textContent=groups[i][1];label.querySelector('.value').textContent=groups[i][2];});svg.querySelectorAll('circle[r="2.6"]').forEach((circle,i)=>{const p=point(i,groups[i][2]);circle.setAttribute('cx',p[0]);circle.setAttribute('cy',p[1]);});}
