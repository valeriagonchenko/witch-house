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
    {id:'#724937',name:'Тёмный'},
    {id:'#a4d9ef',name:'Лунно-голубой'},
    {id:'#f5a8cb',name:'Розовая фея'},
    {id:'#a4d6a2',name:'Лесная зелень'}
  ];
  // Iris colours. Each preset replaces only three existing Figma gradient stops.
  // Both base eye SVGs remain untouched on disk.
  const EYE_PALETTE = [
    {id:'amethyst', name:'Аметистовые', stops:['#CC5FE2','#C13CDB','#70347C']},
    {id:'emerald', name:'Изумрудные', stops:['#9EF2BF','#42C783','#175B43']},
    {id:'sapphire', name:'Сапфировые', stops:['#91DDFF','#489EE8','#234C93']},
    {id:'amber', name:'Янтарные', stops:['#FFE5A5','#E3A43E','#82451D']},
    {id:'rose', name:'Розовые', stops:['#FFC7EB','#ED81BF','#8D3869']},
    {id:'silver', name:'Серебряные', stops:['#E6E9FF','#A5B4DA','#515C85']},
    {id:'ruby', name:'Рубиновые', stops:['#FF8797','#DC4058','#731B34']},
    {id:'onyx', name:'Чёрные', stops:['#9393A3','#484756','#12111D']}
  ];
  const ORIGINAL_IRIS_STOPS = EYE_PALETTE[0].stops.map(s=>s.toLowerCase());
  const EYE_COLOR_IDS = new Set(EYE_PALETTE.map(p=>p.id));
  // The base blush SVG is a transparent 600x1400 layer on top of the head.
  // 'original' never modifies the Figma source. 'none' hides the layer.
  const BLUSH_PALETTE = [
    {id:'none',name:'Без румянца',color:null},
    {id:'original',name:'Оригинальный',color:'#F29E9E'},
    {id:'pink',name:'Нежно-розовый',color:'#F8A9C7'},
    {id:'coral',name:'Коралловый',color:'#F38D79'},
    {id:'berry',name:'Ягодный',color:'#C96591'},
    {id:'peach',name:'Персиковый',color:'#F6AD86'},
    {id:'lilac',name:'Лавандовый',color:'#B99AE6'}
  ];
  const BLUSH_IDS = new Set(BLUSH_PALETTE.map(x=>x.id));
  // Lash recolouring is independent from iris recolouring. It targets
  // burgundy eyelash/eyelid paths, not brown pupils or white reflections.
  const LASH_PALETTE = [
    {id:'original',name:'Оригинальные',color:'#702A49'},
    {id:'black',name:'Чёрные',color:'#202027'},
    {id:'chocolate',name:'Шоколадные',color:'#63423B'},
    {id:'auburn',name:'Медные',color:'#A75A3D'},
    {id:'plum',name:'Сливовые',color:'#80518F'},
    {id:'emerald',name:'Изумрудные',color:'#396F59'},
    {id:'silver',name:'Серебряные',color:'#B9B6C3'}
  ];
  const LASH_IDS = new Set(LASH_PALETTE.map(x=>x.id));
  const CATEGORIES = [
    {id:'skin', title:'Кожа', icon:'◈'},
    {id:'eyes', title:'Глаза', icon:'◉'},
    {id:'eyebrows', title:'Брови', icon:'⌁'},
    {id:'hair', title:'Волосы', icon:'✧'},
    {id:'expressions', title:'Эмоции', icon:'☺'},
    {id:'clothing', title:'Одежда', icon:'♢'}
  ];
  const CATALOG_DEFAULT = {eyes:[],eyebrows:[],hair:[],expressions:[],clothing:[]};
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
        for (const key of ['file','back','front','top','bottom','left','right','thumbnail']) {
          if (x[key]) entry[key] = safeRelativePath(x[key]);
        }
        return entry;
      }).filter(x => x.file || x.back || x.front || x.top || x.bottom || x.left || x.right);
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
      eyeColor: EYE_COLOR_IDS.has(src.eyeColor) ? src.eyeColor : 'amethyst',
      lashColor: LASH_IDS.has(src.lashColor) ? src.lashColor : 'original',
      blushColor: BLUSH_IDS.has(src.blushColor) ? src.blushColor : 'original',
      eyes: typeof src.eyes==='string' ? src.eyes : '',
      eyebrows: typeof src.eyebrows==='string' ? src.eyebrows : '',
      hair: typeof src.hair==='string' ? src.hair : '',
      expressions: typeof src.expressions==='string' ? src.expressions : '',
      clothing: typeof src.clothing==='string' ? src.clothing : '',
      name:String(character?.name || 'Луна').slice(0,24)
    };
  }
  function normalizedSelection(a){
    const n={...a};
    for(const k of ['eyes','eyebrows','hair','expressions','clothing']){
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
    const brows = option('eyebrows',selected.eyebrows);
    const expression = option('expressions',selected.expressions);
    const clothes = option('clothing',selected.clothing);
    const all=[];
    const add=(key,src,tint=false,eye=false,blush=false)=>{const path=safeRelativePath(src);if(path)all.push({key,src:path,tint,eye,blush});};
    if(hair?.back) add('hair-back',hair.back);
    if(clothes?.back) add('clothes-back',clothes.back);
    add('legs',BASE+'legs.svg',true);
    add('body',BASE+'body.svg',true);
    add('neck',BASE+'neck.svg',true);
    add('shorts',clothes?.bottom || BASE+'shorts_basic.svg');
    add('arm-left',BASE+'arm_left.svg',true);
    add('arm-right',BASE+'arm_right.svg',true);
    // Top covers both arms, as in the latest manually adjusted base model.
    add('top',clothes?.top || BASE+'top_basic.svg');
    add('head',BASE+'head.svg',true);
    // The cheek tint and brows are face layers between the head and eyes.
    if(selected.blushColor!=='none') add('blush',BASE+'blush.svg',false,false,true);
    if(brows?.file) add('eyebrows',brows.file);
    // Original left and right eyes, each already positioned in a 600×1400 frame.
    // A later eye-shape variant can supply one merged file or a left/right pair.
    if(eyes?.file) add('eyes',eyes.file,false,true);
    else {
      add('eye-left',eyes?.left || BASE+'eye_left.svg',false,true);
      add('eye-right',eyes?.right || BASE+'eye_right.svg',false,true);
    }
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
    const eyeColor=EYE_COLOR_IDS.has(a.eyeColor)?a.eyeColor:'amethyst';
    const lashColor=LASH_IDS.has(a.lashColor)?a.lashColor:'original';
    const blushColor=BLUSH_IDS.has(a.blushColor)?a.blushColor:'original';
    const html=layers({...a,blushColor}).map(l=>`<span class="witch-doll-layer" data-svg-src="${escapeHtml(l.src)}" data-skin="${l.tint ? escapeHtml(aSkin):''}" data-eye-color="${l.eye ? eyeColor:''}" data-lash-color="${l.eye ? lashColor:''}" data-blush-color="${l.blush ? blushColor:''}" data-layer="${escapeHtml(l.key)}"><img src="${escapeHtml(l.src)}" alt="" draggable="false" loading="eager"></span>`).join('');
    // Move ONLY the small profile portrait upwards; preserve the user's
    // manually customised position of the large doll in the wardrobe.
    const portraitOffset=variant==='portrait'?' style="top:-30px"':'';
    return `<div class="witch-doll witch-doll--${variant}"${portraitOffset} role="img" aria-label="Векторная модель ведьмочки">${html}</div>`;
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
  // A light shade-aware tint for the separate blush SVG. Coloured
  // paint and gradient stops change hue while neutral masks stay unchanged.
  function recolourBlush(code, colorId) {
    const preset=BLUSH_PALETTE.find(p=>p.id===colorId);
    if(!preset || !preset.color) throw Error('Неизвестный цвет румянца');
    const doc=xmlParser.parseFromString(code,'image/svg+xml');
    if(doc.querySelector('parsererror') || doc.documentElement.localName!=='svg')throw Error('Некорректный SVG румянца');
    const root=doc.documentElement;
    root.querySelectorAll('script,foreignObject,iframe,audio,video').forEach(x=>x.remove());
    const target=[1,3,5].map(i=>parseInt(preset.color.slice(i,i+2),16));
    const recolor=v=>v.replace(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?/g,hex=>{
      const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
      const hi=Math.max(...rgb),lo=Math.min(...rgb);
      if(hi-lo<17 || hi<55 || lo>246)return hex; // preserve whites, ink, neutral masks
      const ratio=(rgb[0]*.3+rgb[1]*.59+rgb[2]*.11)/175;
      const mapped=target.map(channel=>Math.max(0,Math.min(255,Math.round(channel*(.68+.32*ratio)))));
      return '#'+mapped.map(x=>x.toString(16).padStart(2,'0')).join('')+(hex.length===9?hex.slice(7):'');
    });
    root.querySelectorAll('*').forEach(el=>{
      for(const attr of ['fill','stroke','stop-color','style']){
        const current=el.getAttribute(attr);
        if(current)el.setAttribute(attr,recolor(current));
      }
    });
    root.setAttribute('width','600');root.setAttribute('height','1400');
    if(!root.hasAttribute('viewBox'))root.setAttribute('viewBox','0 0 600 1400');
    return serializer.serializeToString(root);
  }
  // Figma typically exports lashes/upper eyelids in a dark burgundy ink,
  // whereas pupils are dark BROWN. Keep these separate using named group
  // ids when present, then a conservative burgundy colour test as fallback.
  function recolourLashes(root, colorId){
    const preset=LASH_PALETTE.find(p=>p.id===colorId);
    if(!preset || colorId==='original')return;
    const target=preset.color;
    const isLashInk=hex=>{
      const m=String(hex).match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
      if(!m)return false;
      const [r,g,b]=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16));
      return r>=45 && r<205 && g<115 && b<155 && r>g*1.35 && b>g*1.17 && r>b*1.07;
    };
    let changed=0;
    root.querySelectorAll('*').forEach(el=>{
      if(el.closest('defs') || el.tagName.toLowerCase()==='stop')return;
      let labeled=false;
      for(let n=el;n && n!==root;n=n.parentElement){
        if(/lash|eyelid|ресниц/i.test(n.getAttribute('id')||'')){labeled=true;break;}
      }
      for(const attr of ['fill','stroke','style']){
        const current=el.getAttribute(attr);
        if(!current)continue;
        const updated=current.replace(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?/g,hex=>{
          if(labeled ? !/^#[0-9a-f]{6,8}$/i.test(hex) : !isLashInk(hex))return hex;
          changed++;return target+(hex.length===9?hex.slice(7):'');
        });
        if(updated!==current)el.setAttribute(attr,updated);
      }
    });
    if(!changed)console.warn('В SVG не найдены отдельные заливки ресниц. При необходимости назови соответствующую группу в Figma «lashes» и экспортируй SVG повторно.');
  }
  // Recolour only the iris gradient stops, not the pupil, eyelashes,
  // sclera or highlights. SVG geometry and radialGradient coordinates stay as-is.
  function recolourEyes(code, colorId, lashColor='original') {
    const preset=EYE_PALETTE.find(p=>p.id===colorId);
    if(!preset) throw Error('Неизвестный цвет глаз');
    const doc=xmlParser.parseFromString(code,'image/svg+xml');
    if(doc.querySelector('parsererror') || doc.documentElement.localName!=='svg') throw Error('Некорректный SVG глаза');
    const root=doc.documentElement;
    root.querySelectorAll('script,foreignObject,iframe,audio,video').forEach(el=>el.remove());
    // Figma generally writes <stop stop-color="#CC5FE2">. Some SVGs use
    // style="stop-color:#CC5FE2"; support both notations.
    let changed=0;
    const norm=value=>String(value||'').trim().toLowerCase();
    root.querySelectorAll('radialGradient stop, linearGradient stop').forEach(stop=>{
      const attr=stop.getAttribute('stop-color');
      const inlineStyle=stop.getAttribute('style')||'';
      const styleMatch=inlineStyle.match(/(?:^|;)\s*stop-color\s*:\s*(#[0-9a-f]{6})\b/i);
      const current=norm(attr || styleMatch?.[1]);
      const index=ORIGINAL_IRIS_STOPS.indexOf(current);
      if(index<0)return;
      const replacement=preset.stops[index];
      if(attr!==null)stop.setAttribute('stop-color',replacement);
      if(styleMatch)stop.setAttribute('style',inlineStyle.replace(/(stop-color\s*:\s*)#[0-9a-f]{6}\b/i,(_,prefix)=>prefix+replacement));
      changed++;
    });
    if(!changed && colorId!=='amethyst') {
      console.warn('В SVG не найдены исходные точки градиента радужки (#CC5FE2, #C13CDB, #70347C).',colorId);
    }
    recolourLashes(root,lashColor);
    root.setAttribute('width','600');
    root.setAttribute('height','1400');
    if(!root.hasAttribute('viewBox'))root.setAttribute('viewBox','0 0 600 1400');
    return serializer.serializeToString(root);
  }
  async function eyeUrl(path,colorId,lashColor) {
    const key='eye|'+path+'|'+colorId+'|'+lashColor;
    if(svgBlobCache.has(key))return svgBlobCache.get(key);
    const task=fetchSource(path).then(code=>URL.createObjectURL(new Blob([recolourEyes(code,colorId,lashColor)],{type:'image/svg+xml'})));
    svgBlobCache.set(key,task);
    return task;
  }
  async function blushUrl(path,colorId){
    const key='blush|'+path+'|'+colorId;
    if(svgBlobCache.has(key))return svgBlobCache.get(key);
    const task=fetchSource(path).then(code=>URL.createObjectURL(new Blob([recolourBlush(code,colorId)],{type:'image/svg+xml'})));
    svgBlobCache.set(key,task);
    return task;
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
      const eyeColor=layer.dataset.eyeColor;
      const lashColor=layer.dataset.lashColor;
      const blushColor=layer.dataset.blushColor;
      image.addEventListener('error',()=>{
        missingAssets.add(path);
        layer.classList.add('witch-doll-layer--missing');
        const msg=document.querySelector('.witch-editor-asset-warning');
        if(msg)msg.hidden=false;
      },{once:true});
      // Apply iris and eyelash colours independently to the SAME eye SVG.
      if(eyeColor && (eyeColor!=='amethyst' || lashColor!=='original')) {
        eyeUrl(path,eyeColor,lashColor).then(url=>{
          if(image.isConnected)image.src=url;
        }).catch(err=>console.warn('Не удалось перекрасить глаз',path,err.message));
        return;
      }
      if(blushColor && blushColor!=='original'){
        blushUrl(path,blushColor).then(url=>{
          if(image.isConnected)image.src=url;
        }).catch(err=>console.warn('Не удалось перекрасить румянец',path,err.message));
        return;
      }
      // Do not alter Figma's source colour for the first skin palette option.
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
        <div class="witch-editor-swatches">${PALETTE.map(p=>`<button type="button" class="witch-editor-swatch ${draft.skin===p.id?'is-selected':''}" data-action="editor-skin" data-id="${p.id}" aria-label="${escapeHtml(p.name)}" aria-pressed="${draft.skin===p.id}" title="${escapeHtml(p.name)}"><span style="background-color:${p.id}"></span></button>`).join('')}</div><p class="witch-editor-selection">${escapeHtml(PALETTE.find(p=>p.id===draft.skin)?.name||PALETTE[0].name)}</p>
        <div class="witch-editor-intro" style="margin-top:24px"><h3>Румянец</h3><p>Оригинальный blush.svg или цвет на выбор.</p></div>
        <div class="witch-editor-swatches">${BLUSH_PALETTE.map(p=>`<button type="button" class="witch-editor-swatch ${draft.blushColor===p.id?'is-selected':''}" data-action="editor-blush-color" data-id="${p.id}" aria-label="${escapeHtml(p.name)}" aria-pressed="${draft.blushColor===p.id}" title="${escapeHtml(p.name)}"><span style="background:${p.id==='none'?'linear-gradient(135deg,#eee 44%,#b94949 45%,#b94949 55%,#eee 56%)':p.color}"></span></button>`).join('')}</div><p class="witch-editor-selection">${escapeHtml(BLUSH_PALETTE.find(p=>p.id===draft.blushColor)?.name||'Оригинальный')}</p>`;
    }
    if(item.id==='eyes') {
      const selected=EYE_PALETTE.find(p=>p.id===draft.eyeColor)||EYE_PALETTE[0];
      const swatches=EYE_PALETTE.map(p=>{
        const gradient=`radial-gradient(circle at 42% 68%, ${p.stops[0]}, ${p.stops[1]} 48%, ${p.stops[2]})`;
        return `<button type="button" class="witch-editor-swatch ${selected.id===p.id?'is-selected':''}" data-action="editor-eye-color" data-id="${p.id}" aria-label="${escapeHtml(p.name)}" aria-pressed="${selected.id===p.id}" title="${escapeHtml(p.name)}"><span style="background:${gradient}"></span></button>`;
      }).join('');
      const variants=options('eyes');
      const variantMarkup=variants.length ? `<div class="witch-editor-options" style="margin-top:18px">
        <button class="witch-editor-option ${!draft.eyes?'is-selected':''}" type="button" data-action="editor-option" data-category="eyes" data-id=""><span class="witch-editor-option-art">◉</span><strong>Базовая форма</strong></button>
        ${variants.map(p=>`<button class="witch-editor-option ${draft.eyes===p.id?'is-selected':''}" type="button" data-action="editor-option" data-category="eyes" data-id="${p.id}"><span class="witch-editor-option-art">${p.thumbnail?`<img src="${escapeHtml(p.thumbnail)}" alt="">`:'◉'}</span><strong>${escapeHtml(p.name)}</strong></button>`).join('')}
      </div>` : '<p class="witch-editor-selection" style="font-size:12px;opacity:.8">Форма глаз пока одна — твоя оригинальная.</p>';
      return `<div class="witch-editor-intro"><h3>Цвет радужки</h3><p>Меняем только оттенки градиента, сохраняя блики.</p></div>
        <div class="witch-editor-swatches">${swatches}</div>
        <p class="witch-editor-selection">${escapeHtml(selected.name)}</p>
        <div class="witch-editor-intro" style="margin-top:26px"><h3>Цвет ресниц</h3><p>Отдельно от радужки и зрачков.</p></div>
        <div class="witch-editor-swatches">${LASH_PALETTE.map(p=>`<button type="button" class="witch-editor-swatch ${draft.lashColor===p.id?'is-selected':''}" data-action="editor-lash-color" data-id="${p.id}" aria-label="${escapeHtml(p.name)}" aria-pressed="${draft.lashColor===p.id}" title="${escapeHtml(p.name)}"><span style="background:${p.color}"></span></button>`).join('')}</div>
        <p class="witch-editor-selection">${escapeHtml(LASH_PALETTE.find(p=>p.id===draft.lashColor)?.name||'Оригинальные')}</p>
        ${variantMarkup}`;
    }
    const list=options(item.id);
    if(!catalogLoaded) return `<div class="witch-editor-empty"><span>✧</span><h3>Загружаем каталог</h3><p>Подготавливаем доступные варианты.</p></div>`;
    if(!list.length) return `<div class="witch-editor-empty"><span>✧</span><h3>Пока нет элементов</h3><p>${item.id==='hair'?'Здесь появятся твои SVG-причёски.':item.id==='eyes'?'Здесь появятся нарисованные глаза.':item.id==='eyebrows'?'Здесь появятся варианты формы бровей.':item.id==='expressions'?'Здесь будут эмоции и выражения лица.':'Здесь будет гардероб ведьмочки.'}</p><small>Добавим их позже, не меняя код редактора.</small></div>`;
    return `<div class="witch-editor-intro"><h3>${escapeHtml(item.title)}</h3><p>Выбери внешний вид для ведьмочки.</p></div><div class="witch-editor-options">
      <button class="witch-editor-option ${!draft[item.id]?'is-selected':''}" type="button" data-action="editor-option" data-category="${item.id}" data-id="" aria-pressed="${!draft[item.id]}"><span class="witch-editor-option-art">∅</span><strong>Не выбрано</strong></button>
      ${list.map(p=>`<button class="witch-editor-option ${draft[item.id]===p.id?'is-selected':''}" type="button" data-action="editor-option" data-category="${item.id}" data-id="${p.id}" aria-pressed="${draft[item.id]===p.id}"><span class="witch-editor-option-art">${p.thumbnail?`<img src="${escapeHtml(p.thumbnail)}" alt="" loading="lazy">`:'✧'}</span><strong>${escapeHtml(p.name)}</strong></button>`).join('')}
    </div>`;
  }
  function editorHtml(draft,active='skin'){
    const i=Math.max(0,CATEGORIES.findIndex(x=>x.id===active));
    const total=String(CATEGORIES.length).padStart(2,'0');
    return `<section class="witch-editor-shell" aria-label="Редактор персонажа">
      <div class="witch-editor-stage">
        <div class="witch-editor-topline"><span>✦ Ведьмин домик</span><span>ОБЛИК ВЕДЬМЫ <em>${String(i+1).padStart(2,'0')} / ${total}</em></span></div>
        <div class="witch-editor-doll-holder">${spriteHtml(draft,'full')}</div>
        <div class="witch-editor-stage-footer"><span>✦ Твоя ведьмочка</span><span class="witch-editor-hint">Все SVG: 600 × 1400</span></div>
        <p class="witch-editor-asset-warning" ${missingAssets.size?'':'hidden'}>Не удалось загрузить часть SVG. Проверь папку assets/character/base/ и точные имена файлов.</p>
      </div>
      <div class="witch-editor-sidebar">
        <div class="witch-editor-sidebar-head"><div class="witch-editor-overline">✧ Личная магия</div><h2>Создай свой образ</h2><p>Каждая ведьмочка неповторима</p></div>
        <div class="witch-editor-namebox"><label for="witch-editor-name">Имя ведьмочки</label><input id="witch-editor-name" maxlength="24" value="${escapeHtml(draft.name)}" placeholder="Как её зовут?" autocomplete="off" /></div>
        <div class="witch-editor-tabs" style="grid-template-columns:repeat(3,minmax(0,1fr))" role="group" aria-label="Категории внешности">${CATEGORIES.map(x=>`<button class="witch-editor-tab ${active===x.id?'is-selected':''}" data-action="editor-tab" data-id="${x.id}" type="button" aria-pressed="${active===x.id}"><span class="witch-editor-tab-icon">${x.icon}</span><span>${escapeHtml(x.title)}</span></button>`).join('')}</div>
        <div class="witch-editor-controls" aria-live="polite">${controlHtml(draft,active)}</div>
        <div class="witch-editor-actions"><p>Изменения вступят в силу после сохранения.</p><div class="witch-editor-action-row"><button class="witch-editor-back" type="button" data-action="editor-cancel">← Отмена</button><button class="witch-editor-save" type="button" data-action="editor-save">Сохранить образ ✧</button></div></div>
      </div>
    </section>`;
  }
  window.WitchEditor = Object.freeze({PALETTE,EYE_PALETTE,BLUSH_PALETTE,LASH_PALETTE,CATEGORIES,loadCatalog,options,option,appearanceFrom,spriteHtml,editorHtml,hydrate,isLoaded:()=>catalogLoaded,missingAssets});
})();
