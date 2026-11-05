(function(root){
 const round=x=>x==null?null:Number(Number(x).toFixed(1));
 const fmt=x=>x==null?'—':Number(x).toLocaleString('vi-VN',{maximumFractionDigits:1});
 function facts(data){const bp=data.bp_stats?.[7];if(!bp||bp.n_readings===0)return null;return{blood_pressure:{systolic:round(bp.mean_systolic),diastolic:round(bp.mean_diastolic),readings:bp.n_readings,unit:'mmHg'},interaction:{sessions:data.tasks.week_sessions,minutes:data.tasks.week_interaction_minutes,days:data.tasks.week_interaction_days},sleep:{hours:data.week.sleep.n>=3?round(data.week.sleep.mean):null,confirmed_days:data.week.sleep.n},medication:{confirmed:data.medication.confirmed,expected:data.medication.expected}}}
 function summarize(data,pack,profile){
  const f=facts(data);if(!f)return{mode:'insufficient',statements:[],bp_insight:null};
  const cached=pack?.profiles?.[profile];
  if(cached&&cached.period_end===data.meta.end&&JSON.stringify(cached.facts)===JSON.stringify(f)&&cached.statements.length===4)return{mode:cached.mode,statements:cached.statements,bp_insight:cached.bp_insight};
  // A changed source invalidates the cached LLM text; fall back to current facts.
  return{mode:'source_template',bp_insight:null,statements:[
   {metric_id:'blood_pressure',text:`Huyết áp trung bình ${fmt(f.blood_pressure.systolic)}/${fmt(f.blood_pressure.diastolic)} mmHg từ ${f.blood_pressure.readings} lần đo.`},
   {metric_id:'interaction',text:`Có ${f.interaction.sessions} cuộc trò chuyện với Myka, tổng ${f.interaction.minutes} phút trong ${f.interaction.days} ngày có tương tác.`},
   {metric_id:'sleep',text:f.sleep.hours==null?`Chưa đủ thông tin giấc ngủ để tổng hợp: mới có ${f.sleep.confirmed_days} ngày tự báo được xác nhận.`:`Giấc ngủ tự báo trung bình ${fmt(f.sleep.hours)} giờ từ ${f.sleep.confirmed_days} ngày đã xác nhận.`},
   {metric_id:'medication',text:`Đã nhận xác nhận ${f.medication.confirmed}/${f.medication.expected} lần nhắc thuốc; không chứng minh đã uống thuốc thực tế.`}
  ]};
 }
 function present(statement){
  const labels={blood_pressure:'Huyết áp',interaction:'Trò chuyện',sleep:'Giấc ngủ tự báo',medication:'Xác nhận lịch thuốc'};
  let text=String(statement.text||'').replace(/(\d)\.(\d)/g,'$1,$2');
  if(statement.metric_id==='blood_pressure')text=text.replace(/^huyết áp\s*/i,'');
  if(statement.metric_id==='sleep')text=text.replace(/^giấc ngủ(?: tự báo)?\s*/i,'');
  if(statement.metric_id==='medication')text=text.replace(/\s*(?:[,;]\s*)?không chứng minh/i,'; không chứng minh');
  return{label:labels[statement.metric_id]||'',text};
 }
 root.MykaWeeklySummary={facts,summarize,present};if(typeof module!=='undefined')module.exports=root.MykaWeeklySummary;
})(globalThis);
