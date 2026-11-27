(() => {
  'use strict';

  const stopWords = new Set('а без бы в во вот где дай для до уже ещё же за и из или как какие какой какая какое к ко ли мне можно по на над не но о об от перед под после при про с со так у что это чем кто сколько покажи расскажи напиши сделай найди есть мы я'.split(' '));
  const normalize = text => String(text ?? '').normalize('NFKC').toLowerCase().replaceAll('ё','е');
  const words = text => (normalize(text).match(/[\p{L}\p{N}]+/gu)||[]).filter(word=>!stopWords.has(word));
  function features(text) {
    const tokens = new Set();
    for (const word of words(text)) {
      if (word.length<3) continue;
      tokens.add('w:'+word.slice(0,5));
      const padded='^'+word+'$';
      for(let i=0;i+3<=padded.length;i++)tokens.add(padded.slice(i,i+3));
    }
    return [...tokens];
  }
  function classify(text,model) {
    const tokens=features(text).filter(token=>model.classes.some(group=>Object.hasOwn(group.counts,token)));
    if (tokens.length<4 || !tokens.some(token=>token.startsWith('w:'))) return null;
    const scores=model.classes.map(group=>({
      name:group.name,
      score:tokens.reduce((sum,token)=>sum+Math.log((Object.hasOwn(group.counts,token)?group.counts[token]+1:1)/(group.total+model.vocabularySize)),0)
    })).sort((a,b)=>b.score-a.score);
    return scores[0].score-scores[1].score>=1.15?scores[0]:null;
  }

  const cardRef = node => ({id:node.id,label:node.label||'Карточка'});
  const capped = (items, max=4) => items.slice(0,max);
  const response = (title, text=[], refs=[]) => ({title,text,refs});

  function quickReply(question){
    const text=normalize(question).replace(/[^\p{L}\p{N}\s-]+/gu,' ').trim().replace(/\s+/g,' ');
    if(/^(?:ку+|ку ку|привет(?:ик)?|прив|здарова|здорова|здравствуй(?:те)?|доброе утро|добрый (?:день|вечер)|хай|хей|hello|hi|hey)(?: синапс)?$/.test(text))
      return response('Ку!',['Что обсудим? Можешь спросить про доску или задать обычный вопрос.']);
    if(/^(?:как (?:ты|дела|жизнь)|как поживаешь|как оно)(?: синапс)?$/.test(text))
      return response('Я на связи',['Что разбираем?']);
    if(/^(?:спасибо(?: большое)?|благодарю|мерси|спс|thanks)(?: синапс)?$/.test(text))
      return response('Пожалуйста!',['Если понадоблюсь, я здесь.']);
    if(/^(?:пока|до встречи|до свидания|увидимся|bye)(?: синапс)?$/.test(text))
      return response('До встречи!');
    if(/^(?:кто ты|как тебя зовут|ты кто|назови себя|ты (?:какая|чья|какой) (?:языковая )?модель|какая (?:у тебя )?(?:языковая )?модель|(?:кто|какая компания) (?:тебя |вас )?(?:создал[аи]?|разработал[аи]?|сделал[аи]?)(?: тебя| вас| синапс[а]?)?|кто (?:твой )?(?:создатель|разработчик)|who (?:made|created) you)(?: синапс)?$/.test(text))
      return response('Синапс',['Меня создала команда SHADOWGRAPH.']);
    if(/^(?:кто ты|как тебя зовут|что ты умеешь|что можешь|помощь|помоги|help)$/.test(text))
      return response('Я Синапс',['На доске умею искать карточки, разбирать связи и собирать черновик отчёта. На общие вопросы отвечаю через локальную языковую модель.']);
    const askingHow=/^(?:(?:как|где|куда|объясни как|подскажи как) |(?:экспорт|импорт|сохранить доску)$)/.test(text);
    const siteContext=/доск|проект|shadowgraph|карточ|граф|отч[её]т|резервн/.test(text);
    if(askingHow){
      if(/(?:pdf|пдф)/.test(text)&&(siteContext||/^(?:как |где )?(?:экспортировать |сохранить |скачать )?(?:pdf|пдф)$/.test(text)))
        return response('Как экспортировать PDF',['В верхней панели доски открой «Экспорт», затем выбери «PDF-отчёт». Для отчёта с обложкой и отдельными разделами открой «PDF-кейсы» с главной.']);
      if(/экспорт|скачат|выгруз|сохранить доску|резервн/.test(text)&&(siteContext||/^(?:как |где )?экспорт(?:ировать)?$/.test(text)))
        return response('Как экспортировать доску',['Нажми «Экспорт» вверху доски. Отметь JSON для резервной копии, SVG для карты или CSV для таблиц и нажми «Скачать ZIP».']);
      if(/импорт|загруз|добавить файл/.test(text)&&(siteContext||/^(?:как |где )?(?:импорт(?:ировать)?|(?:загрузить|добавить) файл)$/.test(text)))
        return response('Как добавить материалы',['Перетащи файл на доску или нажми «＋» в верхней панели. Для восстановления проекта открой «Импорт проектов» на главной и выбери резервную копию JSON.']);
    }
    return null;
  }

  const workplace = /работа\s+(?:в|на|за)|работает|работал|место работы|работодатель|место трудоустройства/iu;
  function careerReply(question,nodes,byId,pairs){
    const text=normalize(question).replace(/[^\p{L}\p{N}\s-]+/gu,' ').trim().replace(/\s+/g,' ');
    const work=/(?:^| )(?:работа(?:ет|ют|л[аи]?|ть)?|мест[оа] работы|работодател\p{L}*|должност\p{L}*|професси\p{L}*)(?= |$)/u.test(text);
    const income=/(?:^| )(?:доход\p{L}*|зарплат\p{L}*|оклад\p{L}*|заработ\p{L}*)(?= |$)/u.test(text);
    if(!work&&!income)return null;

    const people=nodes.filter(node=>node.type==='person');
    const target=text.match(/(?:^| )у (.+?)(?: на доске)?$/u)?.[1]
      || text.match(/^где (?:работает|работал[а]?) (?!на доске$)(.+?)(?: на доске)?$/u)?.[1];
    const boardQuestion=/^(?:кто|где|покажи|перечисли|у кого|сколько) |(?:^| )(?:на доске|по доске)(?: |$)/u.test(text);
    if(!target&&!boardQuestion)return null;

    const title=work&&income?'Работа и доход по доске':work?'Работа по доске':'Доход по доске';
    const nameStem=word=>word.length>3?word.replace(/(?:ого|ому|ыми|ами|ой|й|ь|ы|а|я|у|е|ю)$/u,''):word;
    const requestedNames=target?words(target).map(nameStem):[];
    const selected=target?people.filter(person=>{
      const name=words(person.label).map(nameStem);
      return requestedNames.length&&requestedNames.every(part=>name.includes(part));
    }):people;
    if(target&&selected.length!==1)return selected.length
      ?response('Нашёл несколько людей',['Уточни полное имя.'],capped(selected,8).map(cardRef))
      :response('Человек не найден',['Напиши имя так, как оно указано на карточке.']);

    function neighbors(node,accept){
      const found=new Map();
      for(const edge of pairs.get(node.id)||[]){
        const other=byId.get(edge.from===node.id?edge.to:edge.from);
        if(other.id!==node.id&&accept(other,edge))found.set(other.id,other);
      }
      return [...found.values()];
    }
    const result=[];
    for(const person of selected){
      const jobs=neighbors(person,node=>node.type==='employment');
      const organizations=neighbors(person,(node,edge)=>node.type==='organization'&&workplace.test(edge.label));
      const salaries=neighbors(person,node=>node.type==='income');
      const rows=[];
      const refs=new Map([[person.id,person]]);
      const seen=new Set();
      function row(label,cards){
        if(seen.has(label))return;
        seen.add(label);
        rows.push('• '+label);
        for(const card of cards)refs.set(card.id,card);
      }
      const listedOrganizations=new Set();
      if(work)for(const job of jobs){
        const employers=neighbors(job,(node,edge)=>node.type==='organization'&&workplace.test(edge.label));
        for(const employer of employers)listedOrganizations.add(employer.id);
        row([job.label,...employers.map(node=>node.label)].join(' · '),[job,...employers]);
      }
      if(work)for(const organization of organizations)if(!listedOrganizations.has(organization.id))row(organization.label,[organization]);
      if(income){
        for(const job of jobs){
          if(neighbors(job,node=>node.type==='person').length!==1)continue;
          salaries.push(...neighbors(job,(node,edge)=>node.type==='income'&&/доход|зарплат|оклад/iu.test(edge.label)));
        }
        for(const salary of salaries)row('Доход — '+salary.label,[salary]);
      }
      if(!rows.length&&!target)continue;
      if(work&&!jobs.length&&!organizations.length)rows.push('• Работа не указана.');
      if(income&&!salaries.length)rows.push('• Доход не указан.');
      const limited=capped(rows,12);
      if(rows.length>limited.length)limited.push('Ещё записей: '+(rows.length-limited.length)+'.');
      result.push({text:[person.label,...limited].join('\n'),refs:[...refs.values()]});
    }
    if(!result.length)return response(title,['На доске нет связанных карточек по этому запросу.']);
    const visible=capped(result,8),paragraphs=visible.map(item=>item.text);
    if(result.length>visible.length)paragraphs.push('Ещё людей: '+(result.length-visible.length)+'. Можно спросить по имени.');
    paragraphs.push('Сведения взяты из карточек доски. Указанные периоды сохранены.');
    const refs=new Map(visible.flatMap(item=>item.refs).map(node=>[node.id,node]));
    return response(title,paragraphs,capped([...refs.values()],24).map(cardRef));
  }

  function summarize(question,project,model,typeName) {
    const {nodes,edges,files}=project;
    const classified=model?classify(question,model)?.name:null;
    const intent=classified==='code'?null:classified;
    const byId=new Map(nodes.map(node=>[node.id,node])),degree=new Map(),pairs=new Map();
    for(const edge of edges) {
      if(!byId.has(edge.from)||!byId.has(edge.to))continue;
      for(const id of new Set([edge.from,edge.to])){
        degree.set(id,(degree.get(id)||0)+1);
        if(!pairs.has(id))pairs.set(id,[]);
        pairs.get(id).push(edge);
      }
    }
    const career=careerReply(question,nodes,byId,pairs);
    if(career)return career;
    if (intent&&!nodes.length&&!files.length)
      return response('На доске пока пусто',['Добавь карточку или файл, чтобы разобрать материалы проекта.']);
    const counts='Карточки: '+nodes.length+' · Связи: '+edges.length+' · Файлы: '+files.length+'.';
    const review=nodes.filter(node=>node.review!=='confirmed');
    const origins=new Map();
    for(const node of nodes)if(node.fileId&&!origins.has(node.fileId))origins.set(node.fileId,node);
    const sources=capped(files,5).map(file=>({id:origins.get(file.id)?.id,label:file.name||'Материал'}));
    const hubs=capped([...degree].sort((a,b)=>b[1]-a[1]));

    const requested=normalize(question).trim();
    const terms=words(requested);
    const precise=capped(nodes.map(node=>{
      const label=normalize(node.label).trim();
      if (label.length<2)return {node,score:0};
      if (requested===label || (label.length>=4&&requested.includes(label)))return {node,score:50+label.length};
      const labels=words(label);
      return {node,score:labels.filter(word=>word.length>=3&&terms.includes(word)).length};
    }).filter(match=>match.score>(intent?1:0)).sort((a,b)=>b.score-a.score));

    if(precise.length&&(precise[0].score>=50||!intent)){
      const [best]=precise;
      if(precise.length===1||best.score>precise[1].score){
        const node=best.node;
        const linked=capped([...new Set((pairs.get(node.id)||[]).map(edge=>edge.from===node.id?edge.to:edge.from))].filter(id=>id!==node.id));
        const details=[typeName(node.type)+' · Связи: '+(degree.get(node.id)||0)+'.'];
        if(node.detail)details.push(String(node.detail).slice(0,360));
        if(linked.length)details.push('Связанные карточки перечислены ниже.');
        return response(node.label||'Карточка', details, [cardRef(node),...linked.map(id=>cardRef(byId.get(id)))]);
      }
      return response('Нашёл несколько карточек',['Уточните название или откройте нужную карточку.'],precise.map(match=>cardRef(match.node)));
    }
    if(intent==='overview'){
      const types=new Map();
      for(const node of nodes)types.set(node.type,(types.get(node.type)||0)+1);
      const common=capped([...types].sort((a,b)=>b[1]-a[1])).map(([type,count])=>typeName(type)+' — '+count).join(', ');
      return response('Сводка доски',common?[counts,common+'.']:[counts],hubs.map(([id])=>cardRef(byId.get(id))));
    }
    if(intent==='connections')return hubs.length
      ?response('Самые связанные карточки',['Число рядом с названием — количество связей на доске.'],
        hubs.map(([id,total])=>({id,label:cardRef(byId.get(id)).label+' · '+total})))
      :response('Связей пока нет',['Свяжите две карточки, чтобы появился результат.']);
    if(intent==='sources')return response('Прикреплённые источники',[
      files.length?'Файлов на доске: '+files.length+'.'+(files.length>sources.length?' Ниже первые '+sources.length+'.':''):'Прикреплённых файлов пока нет.'
    ],sources);
    if(intent==='review'){
      const isolated=nodes.filter(node=>!degree.has(node.id));
      const priority=[...review.filter(node=>node.review==='error'||node.review==='doubtful'),
        ...review.filter(node=>node.review!=='error'&&node.review!=='doubtful'),...isolated];
      return response('Что проверить',[
        'Без отметки «Подтверждено»: '+review.length+'. Карточки без связей: '+isolated.length+'.',
        'Откройте карточки ниже и сравните сведения с прикреплёнными материалами.'
      ],capped([...new Set(priority)]).map(cardRef));
    }
    if(intent==='report')return response('Черновик отчёта',[
      'Проект «'+project.name+'». '+counts,
      'Подтверждённые карточки: '+(nodes.length-review.length)+'. Остальные требуют проверки.',
      ...(hubs.length?['Объекты с наибольшим числом связей: '+hubs.map(([id])=>byId.get(id).label).join(', ')+'.']:[]),
      ...(sources.length?['Материалы: '+sources.map(source=>source.label).join(', ')+'.']:[])
    ],hubs.map(([id])=>cardRef(byId.get(id))));
    return null;
  }

  function isCodeQuestion(question,model){
    const text=normalize(question);
    return /\u0060{3}|(?:напиши|сгенерируй|сделай|приведи|исправь|разбери)\s+(?:(?:мне|пример)\s+)?(?:код|скрипт|функци|программ)|\b(?:python|javascript|typescript|html|css|sql|rust)\b/i.test(text)
      || Boolean(model&&classify(text,model)?.name==='code');
  }
  const weatherPlaces = {
    'шахтах':'Шахты', 'москве':'Москва', 'ростове':'Ростов-на-Дону',
    'ростове-на-дону':'Ростов-на-Дону', 'санкт-петербурге':'Санкт-Петербург'
  };
  const weatherPlace = /^[\p{L}][\p{L}\p{M}\s,.'’-]{1,69}$/u;
  function weatherQuery(question,previous=null){
    const text=question.normalize('NFKC').trim().replace(/[‐‑–—]/g,'-');
    const explicit=text.match(/^(?:(?:какая|какой)\s+)?(?:погода|погоду|прогноз\s+погоды)(?=$|\s|[:?])/iu);
    if(!explicit&&!previous)return null;

    const tail=(explicit?text.slice(explicit[0].length):text.replace(/^а\s+/iu,''))
      .replace(/[?!:]+/g,' ').trim();
    const day=/(?:^|\s)(сейчас|сегодня|завтра)(?=$|\s)/iu;
    const requestedDay=tail.match(day)?.[1].toLowerCase();
    const where=tail.replace(day,' ').trim();
    const prefix=where.match(/^(?:в|во|для)\s+(.+)$/iu);
    const glued=normalize(where).match(/^в(.+)$/u)?.[1];
    const gluedAlias=glued&&Object.hasOwn(weatherPlaces,glued)?weatherPlaces[glued]:null;
    const place=prefix?.[1]||gluedAlias||where;
    if(!explicit){
      const waitingForPlace=!previous.place&&where.split(/\s+/u).length<=3&&!stopWords.has(normalize(where.split(/\s/u,1)[0]));
      if(where&&(!(prefix||gluedAlias||waitingForPlace)||!weatherPlace.test(place)))return null;
      if(!where&&!requestedDay)return null;
    }

    const alias=normalize(place);
    return {
      place:place?(Object.hasOwn(weatherPlaces,alias)?weatherPlaces[alias]:place):previous?.place||'',
      tomorrow:requestedDay?requestedDay==='завтра':previous?.tomorrow??false
    };
  }
  async function weatherReply(query,signal){
    if(!weatherPlace.test(query.place))
      return response('Уточни город',['Например, «погода Москва завтра».']);
    async function fetchJson(url,params){
      const result=await fetch(url+'?'+new URLSearchParams(params),{signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!result.ok)throw Error('Forecast service unavailable');
      return result.json();
    }
    const found=await fetchJson('https://geocoding-api.open-meteo.com/v1/search',{name:query.place,count:5,language:'ru'});
    const city=found.results?.find(result=>normalize(result.name)===normalize(query.place))||found.results?.[0];
    if(!city||!Number.isFinite(city.latitude)||!Number.isFinite(city.longitude))
      return response('Город не найден',['Проверь написание или укажи полное название города.']);
    const forecast=await fetchJson('https://api.open-meteo.com/v1/forecast',{latitude:city.latitude,longitude:city.longitude,
      current:'temperature_2m,apparent_temperature,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max',timezone:'auto',forecast_days:2});
    const label=[city.name,city.admin1!==city.name?city.admin1:null,city.country].filter(Boolean).join(', ');
    const temp=value=>Number.isFinite(value)?value.toLocaleString('ru-RU')+' °C':'—';
    const daily=forecast.daily,current=forecast.current;
    const rows=query.tomorrow
      ?['Завтра: от '+temp(daily?.temperature_2m_min?.[1])+' до '+temp(daily?.temperature_2m_max?.[1])+'.',
        ...(Number.isFinite(daily?.precipitation_probability_max?.[1])?['Вероятность осадков — '+daily.precipitation_probability_max[1]+'%.']:[])]
      :['Сейчас: '+temp(current?.temperature_2m)+', ощущается как '+temp(current?.apparent_temperature)+'.',
        ...(Number.isFinite(current?.wind_speed_10m)?['Ветер — '+current.wind_speed_10m.toLocaleString('ru-RU')+' км/ч.']:[]),
        ...(current?.time?['По местному времени на '+current.time.replace('T',' в ')+'.']:[])];
    if(query.tomorrow?!Number.isFinite(daily?.temperature_2m_max?.[1]):!Number.isFinite(current?.temperature_2m))throw Error('Missing forecast data');
    return {...response('Погода · '+label,rows),weatherSource:true};
  }

  async function generalReply(question,history,signal,code=false){
    const system='Ты Синапс, помощник, созданный командой SHADOWGRAPH. Если тебя спрашивают о создателе помощника, называй только SHADOWGRAPH. Отвечай на языке собеседника, кратко, по сути. В русских ответах пиши русские названия кириллицей, например: «Столица Франции — Париж». У тебя нет доступа к доске, файлам, интернету или инструментам. Если не знаешь ответа или нужны свежие данные, скажи об этом. Не давай практических указаний для насилия, создания оружия или опасных биологических агентов, взлома, вредоносных программ и вторжения. Предлагай безопасную помощь.';
    const instruction=code?' Для безопасных задач программирования предоставляй рабочие примеры. Код оформляй отдельным блоком Markdown с названием языка.':'';
    const request=model=>fetch('http://127.0.0.1:11434/api/chat',{
      method:'POST',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal,
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model,stream:false,keep_alive:'5m',
        messages:[{role:'system',content:system+instruction},...history,{role:'user',content:question}],
        options:{temperature:code?.2:.35,num_ctx:3072,num_predict:code?650:300,num_gpu:0}})
    });
    let result=await request(code?'qwen2.5-coder:1.5b':'qwen2.5:1.5b');
    if(code&&result.status===404)result=await request('qwen2.5:1.5b');
    if(!result.ok)throw Error('Ollama недоступна или модель не загружена.');
    const data=await result.json(),answer=data.message?.content?.trim();
    if(!answer)throw Error('Модель вернула пустой ответ.');
    return answer.slice(0,code?10000:4200);
  }

  const api={features,classify,quickReply,summarize,isCodeQuestion,weatherQuery,weatherReply,generalReply};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else window.ShadowSynapse=api;
})();
