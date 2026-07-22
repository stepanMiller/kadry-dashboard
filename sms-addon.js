(function(){
  function text(v){return String(v??'').trim();}
  function isReduction(v){return text(v).toLowerCase().includes('сокращ');}
  function isRemote(x){return ['да','yes','true','1'].includes(text(x.rem).toLowerCase()) || /удал[её]н/i.test(text(x.m)+' '+text(x.hrn));}
  function isVacancy(x){return text(x.f).toLowerCase().includes('вакан') || text(x.s).toLowerCase()==='вакансия';}
  function shortName(full){
    const p=text(full).replace(/^Вакансия\s*[—-]?\s*/i,'').split(/\s+/).filter(Boolean);
    if(!p.length)return '';
    if(p.length===1)return p[0];
    return p[0]+' '+p.slice(1,3).map(v=>v[0]?v[0]+'.':'').join('');
  }
  function dept(x){return text(x.od)||text(x.d)||text(x.b)||text(x.nd)||'Подразделение не указано';}
  function word(n,one,few,many){const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many;}
  function buildSms(){
    const source=[];
    if(typeof D!=='undefined'&&Array.isArray(D))source.push(...D);
    if(typeof VACANCIES_SOURCE!=='undefined'&&Array.isArray(VACANCIES_SOURCE))source.push(...VACANCIES_SOURCE);
    const seen=new Set();
    const rows=source.filter(x=>isReduction(x.s)).filter(x=>{const k=text(x.id)||[text(x.f),dept(x),text(x.s)].join('|');if(seen.has(k))return false;seen.add(k);return true;});
    if(!rows.length)return 'По сокращению данные не найдены.';
    const groups=new Map();
    for(const x of rows){const k=dept(x);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x);}
    const lines=['По сокращению (включая сокращаемые вакансии):',''];
    let totalPeople=0,totalRemote=0,totalVac=0,i=1;
    for(const [name,list] of [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0],'ru'))){
      const people=list.filter(x=>!isVacancy(x));
      const vacancies=list.filter(isVacancy);
      const remote=people.filter(isRemote);
      totalPeople+=people.length;totalRemote+=remote.length;totalVac+=vacancies.length;
      let line=i+'. '+name+' — '+people.length+' '+word(people.length,'человек','человека','человек');
      if(remote.length)line+='; удалёнка — '+remote.length;
      if(people.length)line+=': '+people.map(x=>shortName(x.f)).join(', ');
      if(vacancies.length)line+='; '+word(vacancies.length,'вакансия','вакансии','вакансий')+' — '+vacancies.length+(vacancies.some(x=>text(x.f).replace(/^Вакансия\s*[—-]?\s*/i,''))?': '+vacancies.map(x=>text(x.f)).join(', '):'');
      lines.push(line+'.');i++;
    }
    lines.push('','Итого: '+totalPeople+' '+word(totalPeople,'сотрудник','сотрудника','сотрудников')+', удалёнка — '+totalRemote+', сокращаемых вакансий — '+totalVac+'.');
    return lines.join('\n');
  }
  function show(){
    const value=buildSms();
    let box=document.getElementById('smsReductionModal');
    if(!box){
      box=document.createElement('div');box.id='smsReductionModal';
      box.innerHTML='<div class="sms-card"><div class="sms-head"><b>СМС по сокращению</b><button type="button" id="smsClose">×</button></div><textarea id="smsReductionText"></textarea><div class="sms-actions"><button type="button" id="smsCopy">Копировать</button></div></div>';
      document.body.appendChild(box);
      document.getElementById('smsClose').onclick=()=>box.classList.remove('open');
      box.onclick=e=>{if(e.target===box)box.classList.remove('open');};
      document.getElementById('smsCopy').onclick=async()=>{const t=document.getElementById('smsReductionText');t.select();try{await navigator.clipboard.writeText(t.value);}catch(e){document.execCommand('copy');}const b=document.getElementById('smsCopy');b.textContent='Скопировано';setTimeout(()=>b.textContent='Копировать',1300);};
    }
    document.getElementById('smsReductionText').value=value;box.classList.add('open');
  }
  function init(){
    if(document.getElementById('smsReductionBtn'))return true;
    const anchor=document.getElementById('excelExportWrap')||document.querySelector('main')||document.body;
    const wrap=document.createElement('div');wrap.id='smsReductionWrap';
    const btn=document.createElement('button');btn.id='smsReductionBtn';btn.type='button';btn.textContent='СМС по сокращению';btn.onclick=show;wrap.appendChild(btn);
    if(anchor.id==='excelExportWrap')anchor.parentNode.insertBefore(wrap,anchor.nextSibling);else anchor.insertBefore(wrap,anchor.firstChild);
    return true;
  }
  const style=document.createElement('style');style.textContent='#smsReductionWrap{display:flex;justify-content:flex-end;margin:0 0 16px}#smsReductionBtn,#smsCopy{border:0;border-radius:12px;padding:12px 18px;font:600 15px Arial,sans-serif;background:#244b7a;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.12)}#smsReductionModal{display:none;position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9999;padding:20px;align-items:center;justify-content:center}#smsReductionModal.open{display:flex}.sms-card{width:min(760px,100%);background:#fff;border-radius:16px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.25)}.sms-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font:600 18px Arial}.sms-head button{border:0;background:transparent;font-size:28px;cursor:pointer}.sms-card textarea{width:100%;min-height:420px;box-sizing:border-box;border:1px solid #d0d5dd;border-radius:12px;padding:14px;font:14px/1.45 Arial;resize:vertical}.sms-actions{display:flex;justify-content:flex-end;margin-top:12px}@media(max-width:700px){#smsReductionWrap{justify-content:stretch}#smsReductionBtn{width:100%}.sms-card textarea{min-height:60vh}}';document.head.appendChild(style);
  let n=0;const timer=setInterval(()=>{try{if(typeof D!=='undefined'&&init()||++n>60)clearInterval(timer);}catch(e){if(++n>60)clearInterval(timer)}},250);
})();