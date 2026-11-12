/* Ведьмин домик · SVG Character Editor
   Every asset shares a transparent 600×1400 Figma frame.
   New hair/eyes/clothes are registered in assets/character/catalog.json.
   This file is intentionally independent of garden, kitchen, shop and quests. */
(() => {
  'use strict';
  const BASE = 'assets/character/base/';
  const CATALOG_URL = 'assets/character/catalog.json';
  const PALETTE = [
    {id:'#f6d9c3',name:'Фарфоровый'},
    {id:'#f7c4ac',name:'Розовый персик'},
    {id:'#dcaa88',name:'Тёплый'},
    {id:'#ad785e',name:'Золотисто-смуглый'},
    {id:'#90614e',name:'Каштановый'},
    {id:'#724937',name:'Тёмный'}
  ];
  const CATEGORIES = [
    {id:'skin', title:'Кожа', icon:'◈'},
    {id:'eyes', title:'Глаза', icon:'◉'},
    {id:'hair', title:'Волосы', icon:'✧'},
    {id:'expressions', title:'Эмоции', icon:'☺'},
    {id:'clothing', title:'Одежда', icon:'♢'}
  ];
  const CATALOG_DEFAULT = {eyes:[],hair:[],expressions:[],clothing:[]};
  let catalog = {...CATALOG_DEFAULT};
  let catalogLoaded = false;
  let catalogPromise = null;
  const sourceCache = new Map();
  const svgBlobCache = new Map();
  const missingAssets = new Set();
  const xmlParser = new DOMParser();
  const serializer = new XMLSerializer();

  function safeRelativePath(s) {
    if (typeof s !== 'string' || !s.trim() || s.length > 240) return '';
    if (/^(?:[a-z]+:|\/|\\)/i.test(s) || s.includes('..') || /[<>"'\\]/.test(s)) return '';
    if (!/^assets\/character\/[\w./-]+\.svg$/i.test(s)) return '';
    return s;
  }
  function validateCatalog(value) {
    const result = {...CATALOG_DEFAULT};
    for (const category of Object.keys(result)) {
      if (!Array.isArray(value?.[category])) continue;
      result[category] = value[category].slice(0,80).filter(x => x && /^[a-z0-9_-]{1,40}$/i.test(x.id) && typeof x.name==='string').map(x => {
        const entry = {id:x.id,name:x.name.slice(0,50)};
        for (const key of ['file','back','front','top','bottom','thumbnail']) {
          if (x[key]) entry[key] = safeRelativePath(x[key]);
        }
        return entry;
      }).filter(x => x.file || x.back || x.front || x.top || x.bottom);
    }
    return result;
  }
  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    catalogPromise = fetch(CATALOG_URL,{cache:'no-cache'})
      .then(r => {if(!r.ok) throw Error('catalog HTTP '+r.status); return r.json();})
      .then(data => {catalog = validateCatalog(data);catalogLoaded=true;return catalog;})
      .catch(err => {catalogLoaded=true;console.info('Каталог внешности недоступен; используются базовые SVG.',err.message);return catalog;});
    return catalogPromise;
  }
  function options(category) {return catalog[category] || [];}
  function option(category,id){return options(category).find(x=>x.id===id) || null;}
  function appearanceFrom(character) {
    const src = character?.appearance && typeof character.appearance==='object' ? character.appearance : {};
    const skin = PALETTE.some(x=>x.id===src.skin) ? src.skin :
      (PALETTE.some(x=>x.id===character?.skin)?character.skin:PALETTE[0].id);
    return {
      skin,
      eyes: typeof src.eyes==='string' ? src.eyes : '',
      hair: typeof src.hair==='string' ? src.hair : '',
      expressions: typeof src.expressions==='string' ? src.expressions : '',
      clothing: typeof src.clothing==='string' ? src.clothing : '',
      name:String(character?.name || 'Луна').slice(0,24)
    };
  }
  function normalizedSelection(a){
    const n={...a};
    for(const k of ['eyes','hair','expressions','clothing']){
      if(n[k] && !option(k,n[k])) n[k]='';
    }
    return n;
  }
  function escapeHtml(value) {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  /* Z order is deliberate: rear hair, anatomy, underwear, arms, face,
     optional clothing and then front hair. Nothing is auto-resized separately. */
  function layers(appearance) {
    const selected = normalizedSelection(appearance);
    const hair = option('hair',selected.hair), eyes = option('eyes',selected.eyes);
    const expression = option('expressions',selected.expressions);
    const clothes = option('clothing',selected.clothing);
    const all=[];
    const add=(key,src,tint=false)=>{const path=safeRelativePath(src);if(path)all.push({key,src:path,tint});};
    if(hair?.back) add('hair-back',hair.back);
    if(clothes?.back) add('clothes-back',clothes.back);
    add('legs',BASE+'legs.svg',true);
    add('body',BASE+'body.svg',true);
    add('neck',BASE+'neck.svg',true);
add('shorts',clothes?.bottom || BASE+'shorts_basic.svg');
add('arm-left',BASE+'arm_left.svg',true);
add('arm-right',BASE+'arm_right.svg',true);
add('top',clothes?.top || BASE+'top_basic.svg');
add('head',BASE+'head.svg',true);
    if(eyes?.file) add('eyes',eyes.file);
    if(expression?.file) add('expression',expression.file);
    if(clothes?.front) add('clothing-front',clothes.front);
    else if(clothes?.file) add('clothing-front',clothes.file);
    if(hair?.front) add('hair-front',hair.front);
    else if(hair?.file) add('hair-front',hair.file);
    return all;
  }
  function spriteHtml(appearance, variant='full') {
    const a=appearance || appearanceFrom({});
    const aSkin=PALETTE.some(x=>x.id===a.skin)?a.skin:PALETTE[0].id;
    const html=layers(a).map(l=>`<span class="witch-doll-layer" data-svg-src="${escapeHtml(l.src)}" data-skin="${l.tint ? escapeHtml(aSkin):''}" data-layer="${escapeHtml(l.key)}"><img src="${escapeHtml(l.src)}" alt="" draggable="false" loading="eager"></span>`).join('');
    return `<div class="witch-doll witch-doll--${variant}" role="img" aria-label="Векторная модель ведьмочки">${html}</div>`;
  }

  // SVG recolouring keeps original paths, gradients and vector geometry intact.
  // Only the six anatomical layers are recoloured; white underwear and
  // additional custom assets never change colour accidentally.
  function recolour(code, targetHex) {
    const doc=xmlParser.parseFromString(code,'image/svg+xml');
    if(doc.querySelector('parsererror') || doc.documentElement.localName!=='svg') throw Error('invalid SVG');
    const root=doc.documentElement;
    root.querySelectorAll('script,foreignObject,iframe,audio,video').forEach(x=>x.remove());
    const base=[246,217,195];
    const target=[1,3,5].map(i=>parseInt(targetHex.slice(i,i+2),16));
    function mapColor(color){
      if(!color) return color;
      const input=color.trim();
      const m=input.match(/^#([\da-f]{6})([\da-f]{2})?$/i);
      if(!m) return input;
      const rgb=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16));
      const [r,g,b]=rgb;
      // Warm, non-neutral skin tones. Grays, ink outlines, white details stay untouched.
      if(!(r>=90 && r>g*1.035 && g>b*1.015 && r-b>12 && g>55 && b>35)) return input;
      const mapped=rgb.map((n,i)=> Math.max(0,Math.min(255,Math.round(n*(target[i]/base[i])))));
      return '#'+mapped.map(n=>n.toString(16).padStart(2,'0')).join('')+(m[2]||'');
    }
    function replaceColors(str){return str.replace(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?/g,mapColor);}
    [root,...root.querySelectorAll('*')].forEach(node=>{
      for(const attr of Array.from(node.attributes||[])){
        if(/^on/i.test(attr.name)) {node.removeAttribute(attr.name); continue;}
        if((attr.name==='href'||attr.name==='xlink:href') && !attr.value.startsWith('#')) {node.removeAttribute(attr.name);continue;}
        if(['fill','stroke','stop-color','style'].includes(attr.name)) node.setAttribute(attr.name,replaceColors(attr.value));
      }
    });
    root.setAttribute('width','600');root.setAttribute('height','1400');
    if(!root.hasAttribute('viewBox')) root.setAttribute('viewBox','0 0 600 1400');
    return serializer.serializeToString(root);
  }
  function fetchSource(path){
    if(sourceCache.has(path)) return sourceCache.get(path);
    const p=fetch(path).then(r=>{if(!r.ok)throw Error(path+' HTTP '+r.status);return r.text();});
    sourceCache.set(path,p); return p;
  }
  async function tintedUrl(path,skin){
    const key=path+'|'+skin;
    if(svgBlobCache.has(key)) return svgBlobCache.get(key);
    const task=fetchSource(path).then(code=>URL.createObjectURL(new Blob([recolour(code,skin)],{type:'image/svg+xml'})));
    svgBlobCache.set(key,task);return task;
  }
  function hydrate(root=document){
    root.querySelectorAll('.witch-doll-layer[data-svg-src]').forEach(layer=>{
      const path=layer.dataset.svgSrc;
      const image=layer.querySelector('img');
      if(!image)return;
      const skin=layer.dataset.skin;
      image.addEventListener('error',()=>{
        missingAssets.add(path);
        layer.classList.add('witch-doll-layer--missing');
        const msg=document.querySelector('.witch-editor-asset-warning');
        if(msg)msg.hidden=false;
      },{once:true});
      // Do not alter Figma's source colour for the first palette option.
      if(!skin || skin===PALETTE[0].id)return;
      tintedUrl(path,skin).then(url=>{
        if(image.isConnected)image.src=url;
      }).catch(err=>{console.warn('Не удалось перекрасить SVG',path,err.message);});
    });
  }

  function controlHtml(draft,active){
    const item=CATEGORIES.find(x=>x.id===active) || CATEGORIES[0];
    if(item.id==='skin') {
      return `<div class="witch-editor-intro"><h3>Оттенок кожи</h3><p>Выбери тон. Все части тела меняют цвет одновременно.</p></div>
        <div class="witch-editor-swatches">${PALETTE.map(p=>`<button type="button" class="witch-editor-swatch ${draft.skin===p.id?'is-selected':''}" data-action="editor-skin" data-id="${p.id}" aria-label="${escapeHtml(p.name)}" aria-pressed="${draft.skin===p.id}" title="${escapeHtml(p.name)}"><span style="background-color:${p.id}"></span></button>`).join('')}</div><p class="witch-editor-selection">${escapeHtml(PALETTE.find(p=>p.id===draft.skin)?.name||PALETTE[0].name)}</p>`;
    }
    const list=options(item.id);
    if(!catalogLoaded) return `<div class="witch-editor-empty"><span>✧</span><h3>Загружаем каталог</h3><p>Подготавливаем доступные варианты.</p></div>`;
    if(!list.length) return `<div class="witch-editor-empty"><span>✧</span><h3>Пока нет элементов</h3><p>${item.id==='hair'?'Здесь появятся твои SVG-причёски.':item.id==='eyes'?'Здесь появятся нарисованные глаза.':item.id==='expressions'?'Здесь будут эмоции и выражения лица.':'Здесь будет гардероб ведьмочки.'}</p><small>Добавим их позже, не меняя код редактора.</small></div>`;
    return `<div class="witch-editor-intro"><h3>${escapeHtml(item.title)}</h3><p>Выбери внешний вид для ведьмочки.</p></div><div class="witch-editor-options">
      <button class="witch-editor-option ${!draft[item.id]?'is-selected':''}" type="button" data-action="editor-option" data-category="${item.id}" data-id="" aria-pressed="${!draft[item.id]}"><span class="witch-editor-option-art">∅</span><strong>Не выбрано</strong></button>
      ${list.map(p=>`<button class="witch-editor-option ${draft[item.id]===p.id?'is-selected':''}" type="button" data-action="editor-option" data-category="${item.id}" data-id="${p.id}" aria-pressed="${draft[item.id]===p.id}"><span class="witch-editor-option-art">${p.thumbnail?`<img src="${escapeHtml(p.thumbnail)}" alt="" loading="lazy">`:'✧'}</span><strong>${escapeHtml(p.name)}</strong></button>`).join('')}
    </div>`;
  }
  function editorHtml(draft,active='skin'){
    const i=Math.max(0,CATEGORIES.findIndex(x=>x.id===active));
    return `<section class="witch-editor-shell" aria-label="Редактор персонажа">
      <div class="witch-editor-stage">
        <div class="witch-editor-topline"><span>✦ Ведьмин домик</span><span>ОБЛИК ВЕДЬМЫ <em>${String(i+1).padStart(2,'0')} / 05</em></span></div>
        <div class="witch-editor-doll-holder">${spriteHtml(draft,'full')}</div>
        <div class="witch-editor-stage-footer"><span>✦ Твоя ведьмочка</span><span class="witch-editor-hint">Все SVG: 600 × 1400</span></div>
        <p class="witch-editor-asset-warning" ${missingAssets.size?'':'hidden'}>Не удалось загрузить часть SVG. Проверь папку assets/character/base/ и точные имена файлов.</p>
      </div>
      <div class="witch-editor-sidebar">
        <div class="witch-editor-sidebar-head"><div class="witch-editor-overline">✧ Личная магия</div><h2>Создай свой образ</h2><p>Каждая ведьмочка неповторима</p></div>
        <div class="witch-editor-namebox"><label for="witch-editor-name">Имя ведьмочки</label><input id="witch-editor-name" maxlength="24" value="${escapeHtml(draft.name)}" placeholder="Как её зовут?" autocomplete="off" /></div>
        <div class="witch-editor-tabs" role="group" aria-label="Категории внешности">${CATEGORIES.map(x=>`<button class="witch-editor-tab ${active===x.id?'is-selected':''}" data-action="editor-tab" data-id="${x.id}" type="button" aria-pressed="${active===x.id}"><span class="witch-editor-tab-icon">${x.icon}</span><span>${escapeHtml(x.title)}</span></button>`).join('')}</div>
        <div class="witch-editor-controls" aria-live="polite">${controlHtml(draft,active)}</div>
        <div class="witch-editor-actions"><p>Изменения вступят в силу после сохранения.</p><div class="witch-editor-action-row"><button class="witch-editor-back" type="button" data-action="editor-cancel">← Отмена</button><button class="witch-editor-save" type="button" data-action="editor-save">Сохранить образ ✧</button></div></div>
      </div>
    </section>`;
  }
  window.WitchEditor = Object.freeze({PALETTE,CATEGORIES,loadCatalog,options,option,appearanceFrom,spriteHtml,editorHtml,hydrate,isLoaded:()=>catalogLoaded,missingAssets});
})();
