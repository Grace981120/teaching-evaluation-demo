export const realVideos = [
  {id:1, title:'第1段', start:'13:25:10', duration:3290.157},
  {id:2, title:'第2段', start:'14:21:10', duration:3290.135},
  {id:3, title:'第3段', start:'15:17:10', duration:3290.101},
];
// Manually checked screenshot timestamps, NOT segment start/end or PPT dwell durations.
export const realKnowledge = [
  [1,720,'教学目标与教学安排'],[1,1200,'报告参考结构'],
  [1,1440,'人文社科类人才'],[1,1560,'商科类人才'],[1,1680,'艺术类人才'],
  [1,2400,'便携式超声机'],[1,2520,'口腔门诊语音电子病历'],[1,2640,'导诊导医机器人'],
  [2,2640,'主要内容'],[2,3000,'本讲提纲'],
  [3,120,'MYCIN专家系统与细菌感染疾病'],[3,360,'专家系统的概念与优缺点'],
  [3,480,'贝叶斯网络与内科诊断'],[3,960,'远程医疗和电子病历的兴起'],
  [3,1320,'移动医疗和大数据的应用'],[3,1560,'Google Flu Trends'],
  [3,1680,'人工智能和机器学习的突破'],[3,2040,'Watson Health与DeepQA'],
  [3,2520,'ChatGPT与医疗能力'],[3,2760,'医疗服务机器人'],[3,3120,'智慧医疗的本质优势'],
].map(([video,time,title])=>({video,time,title,image:`assets/recording-real/${video}-${time}.jpg`}));
