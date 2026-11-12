/* Ведьмин домик — учебный прототип без зависимостей.
   Все данные хранятся локально в браузере игрока. */
'use strict';

const SAVE_KEY = 'vedmin-domik-save-v1';
const $app = document.querySelector('#app');
const CROPS = {
  tomato:   {name:'Помидоры', icon:'🍅', seed:'Семена томатов', days:1, yield:2, cost:4, sell:3, sprout:'🌱'},
  rosemary: {name:'Розмарин', icon:'🌿', seed:'Семена розмарина', days:2, yield:2, cost:5, sell:4, sprout:'🌱'},
  berry:    {name:'Лесные ягоды', icon:'🫐', seed:'Семена ягод', days:2, yield:2, cost:6, sell:5, sprout:'🌿'},
  wheat:    {name:'Пшеница', icon:'🌾', seed:'Семена пшеницы', days:3, yield:3, cost:7, sell:4, sprout:'🌱'}
};
const INGREDIENTS = {rosemary:{name:'Розмарин',icon:'🌿'},tomato:{name:'Помидор',icon:'🍅'},berry:{name:'Ягоды',icon:'🫐'},wheat:{name:'Пшеница',icon:'🌾'},salt:{name:'Соль',icon:'🧂'}};
const RECIPES = {
  soup: {name:'Томатный суп',icon:'🍲',ingredients:{tomato:2,rosemary:1,salt:1},sell:19,energy:3,desc:'Согревает даже в самый туманный вечер.'},
  jam:  {name:'Ягодное варенье',icon:'🫙',ingredients:{berry:2,salt:1},sell:22,energy:2,desc:'Сладкое волшебство в маленькой баночке.'},
  bread:{name:'Хлеб с травами',icon:'🍞',ingredients:{wheat:2,rosemary:1,salt:1},sell:27,energy:4,desc:'Хрустящая корочка и аромат леса.'},
  tea:  {name:'Лесной чай',icon:'🫖',ingredients:{berry:1,rosemary:2},sell:18,energy:3,desc:'Возвращает силы и ясность мыслей.'}
};
const REPAIRS = {
  roof: {name:'Починить крышу',icon:'🏠',description:'Больше никакого дождя в кровати.',coins:22,wood:4},
  window: {name:'Заменить окна',icon:'🪟',description:'В доме станет светлее и уютнее.',coins:18,wood:3},
  hearth: {name:'Разжечь камин',icon:'🔥',description:'Максимум энергии увеличится на 2.',coins:30,wood:5},
  porch: {name:'Починить крыльцо',icon:'🪵',description:'Можно будет приглашать гостей.',coins:25,wood:4}
};
const DECOR = {
  lights:{name:'Гирлянда светлячков',icon:'✨',coins:14},
  flowers:{name:'Цветы у крыльца',icon:'🌼',coins:12},
  rug:{name:'Коврик с луной',icon:'🌙',coins:20}
};
const QUESTS = [
  {id:'plant',name:'Первые ростки',icon:'🌱',text:'Посадить 2 растения',stat:'planted',target:2,reward:12},
  {id:'cook',name:'Ужин настоящей ведьмы',icon:'🍲',text:'Приготовить первое блюдо',stat:'cooked',target:1,reward:15},
  {id:'repair',name:'Дом, который оживает',icon:'🔨',text:'Выполнить первый ремонт',stat:'repairs',target:1,reward:15},
  {id:'sell',name:'Маленькая торговка',icon:'🪙',text:'Продать 2 товара',stat:'sold',target:2,reward:12},
  {id:'harvest',name:'Урожай под луной',icon:'🌾',text:'Собрать 3 урожая',stat:'harvested',target:3,reward:22},
  {id:'home',name:'Дом, милый дом',icon:'🏡',text:'Закончить весь ремонт',stat:'repairs',target:4,reward:55}
];
const ORDERS = [
  {person:'Тётушка Можжевельник',text:'За простуженную малиновку и моего кота — нужен горячий суп.',dish:'soup',count:1,reward:34},
  {person:'Почтальон с болот',text:'Перед дальней дорогой мечтаю о ягодном варенье.',dish:'jam',count:1,reward:39},
  {person:'Госпожа Сова',text:'В библиотеке собрание. Пришли хлеб с травами!',dish:'bread',count:1,reward:49},
  {person:'Лис из чащи',text:'Пакет лесного чая, пожалуйста. Плачу звонкой монетой.',dish:'tea',count:1,reward:34}
];
const CHOICES = {
  skin:[['#f6d9c3','Светлая'],['#dcaa88','Персиковая'],['#ad785e','Смуглая'],['#724937','Тёмная']],
  hair:[['#3b2c2b','Тёмные'],['#a96644','Рыжие'],['#e6ca87','Золотистые'],['#d5d9e0','Серебряные'],['#84517e','Сиреневые']],
  dress:[['#a36d88','Малиновое'],['#527e75','Хвойное'],['#7275a4','Лавандовое'],['#a77e52','Медовое']],
  hat:[['#40324d','Сливовая'],['#344b45','Лесная'],['#6b4a3b','Шоколадная'],['#333e6c','Ночная']],
  style:[['long','Длинные'],['bob','Каре'],['braids','Косы']],
  pet:[['cat','🐈‍⬛ Кошка'],['fox','🦊 Лис'],['owl','🦉 Сова']]
};

function newGame(){return {
  version:1,created:true,day:1,weather:'☀️ Ясно',nav:'home',level:1,coins:45,wood:4,energy:8,
  character:{name:'Луна',skin:'#f6d9c3',hair:'#3b2c2b',dress:'#a36d88',hat:'#40324d',style:'long',pet:'cat'},
  seeds:{tomato:3,rosemary:2,berry:2,wheat:2},
  inventory:{tomato:2,rosemary:1,berry:1,wheat:0,salt:3},
  dishes:{soup:0,jam:0,bread:0,tea:0},plots:Array.from({length:6},()=>null),
  selectedPlot:0,selectedSeed:'tomato',mix:{tomato:0,rosemary:0,berry:0,wheat:0,salt:0},
  repairs:{roof:false,window:false,hearth:false,porch:false},decor:{lights:false,flowers:false,rug:false},
  stats:{planted:0,cooked:0,repairs:0,sold:0,harvested:0,eaten:0},claimed:[],discovered:[],ordersCompleted:0,pettedDay:0,
  log:['День 1. В конце заросшей тропинки ты нашла дом, который будто ждал именно тебя.']
};}
function validGame(data){
  if(!data || data.version!==1 || !data.character || !data.inventory || !Array.isArray(data.plots) || data.plots.length!==6 || !data.stats || !data.repairs || !data.dishes || !data.seeds || !data.decor || !data.mix || !Array.isArray(data.claimed))return false;
  return true;
}
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return validGame(s)?s:newGame();}catch{return newGame();}}
let state=load();
// В версии 0.2 персонаж по умолчанию уже создан; редактор откроется отдельным разделом позже.
state.created=true;
state.level=Number.isFinite(state.level)?Math.max(1,state.level):1;
if(!['home','garden','kitchen','shop','journal','companion','mailbox','profile'].includes(state.nav))state.nav='home';
let menuOpen=false;let toastTimer=null;
// Editor draft is separate from the saved witch: Cancel never changes the game.
let editorDraft=null;
let editorCategory='skin';
function ensureEditorDraft(){
  if(!editorDraft)editorDraft=WitchEditor.appearanceFrom(state.character);
  return editorDraft;
}
WitchEditor.loadCatalog().then(()=>{
  if(state.nav==='profile')render();
});
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){console.warn('Не удалось сохранить игру',e);}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function formatCost(coins,wood=0){return `${coins} 🪙${wood?' · '+wood+' 🪵':''}`;}
function canSpend(energy){if(state.energy<energy){notice('Не хватает сил. Съешь блюдо или начни новый день.');return false;}return true;}
function spendCoins(n){if(state.coins<n){notice('Не хватает монет. Продай урожай или выполни заказ.');return false;}return true;}
function maxEnergy(){return state.repairs.hearth?10:8;}
function addLog(text){state.log.unshift(`День ${state.day}. ${text}`);state.log=state.log.slice(0,18);}
function notice(text){let old=document.querySelector('.toast');if(old)old.remove();const div=document.createElement('div');div.className='toast';div.setAttribute('role','status');div.textContent=text;document.body.append(div);clearTimeout(toastTimer);toastTimer=setTimeout(()=>div.remove(),3800);}
function renderAvatar(c){
  const skin=CHOICES.skin.some(a=>a[0]===c.skin)?c.skin:CHOICES.skin[0][0];
  const hair=CHOICES.hair.some(a=>a[0]===c.hair)?c.hair:CHOICES.hair[0][0];
  const dress=CHOICES.dress.some(a=>a[0]===c.dress)?c.dress:CHOICES.dress[0][0];
  const hat=CHOICES.hat.some(a=>a[0]===c.hat)?c.hat:CHOICES.hat[0][0];
  const style=CHOICES.style.some(a=>a[0]===c.style)?c.style:'long';
  const pet=CHOICES.pet.some(a=>a[0]===c.pet)?c.pet:'cat';
  const backHair=style==='bob'?`<path d="M126 158Q119 95 186 98q69 6 61 70l-17 29-13-14-87 2Z" fill="${hair}"/>`:style==='braids'?`<path d="M132 139q-16 20-14 88l-10 14 18 2 8-13 12-79Zm104 0q16 20 14 88l10 14-18 2-8-13-12-79Z" fill="${hair}"/>`:`<path d="M131 132q-27 58-21 140 11 18 30-4l16-104 62-3 18 107q20 16 31-9 2-84-26-131Z" fill="${hair}"/>`;
  const petSvg=pet==='cat'?`<path d="M260 293q1-40 26-40l14-14 5 17 20-2 8-15 8 19q11 14 10 37Z" fill="#262732"/><circle cx="299" cy="277" r="3" fill="#f6cb78"/><circle cx="318" cy="277" r="3" fill="#f6cb78"/><path d="M330 284q30-6 10-38" fill="none" stroke="#262732" stroke-width="8" stroke-linecap="round"/>`:pet==='fox'?`<path d="M267 290q4-37 31-33l-14-14 23 10 25-13-5 21q16 10 10 29Z" fill="#cb754e"/><path d="M286 274q19 24 37 0" fill="#fff1dc"/><circle cx="298" cy="268" r="2.5"/><circle cx="317" cy="268" r="2.5"/><path d="M333 291q32 0 11-29" fill="none" stroke="#cb754e" stroke-width="10"/>`:`<ellipse cx="304" cy="269" rx="29" ry="30" fill="#b08c68"/><path d="M278 251q25 10 52 0" stroke="#78604e" stroke-width="6" fill="none"/><circle cx="291" cy="269" r="8" fill="#f1e7c7"/><circle cx="317" cy="269" r="8" fill="#f1e7c7"/><circle cx="291" cy="270" r="3"/><circle cx="317" cy="270" r="3"/><path d="m304 279-8 6 16 0Z" fill="#d6af66"/>`;
  return `<svg viewBox="0 0 380 380" role="img" aria-label="Портрет ведьмочки" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="184" cy="336" rx="122" ry="17" fill="#0b26241c"/><circle cx="190" cy="193" r="114" fill="#f1e3c418" stroke="#ebd6a23d" stroke-width="2" stroke-dasharray="4 10"/>
    <path d="M131 270q-34 22-40 70h195q-12-65-53-74Z" fill="${dress}"/><path d="M137 279q48 49 98-2l6 60H122Z" fill="${dress}"/><path d="M181 271v65" stroke="#eed8be" stroke-width="3" stroke-dasharray="5 7"/><circle cx="181" cy="289" r="4" fill="#eddfb4"/><circle cx="181" cy="311" r="4" fill="#eddfb4"/>
    ${backHair}<rect x="172" y="239" width="35" height="39" rx="14" fill="${skin}"/><ellipse cx="188" cy="177" rx="61" ry="75" fill="${skin}"/>
    <path d="M128 168q8-69 63-70 45 2 56 66-8-10-17-17-33-13-47-27-18 31-55 48Z" fill="${hair}"/>
    <path d="M153 191q11-8 25 0M204 191q11-8 24 0" stroke="#463734" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="165" cy="191" r="2.8" fill="#342e32"/><circle cx="215" cy="191" r="2.8" fill="#342e32"/><path d="M182 218q9 9 18 0" stroke="#a76f69" stroke-width="3.6" fill="none" stroke-linecap="round"/><circle cx="142" cy="211" r="10" fill="#d989842f"/><circle cx="239" cy="211" r="10" fill="#d989842f"/>
    <path d="M91 143 184 16q12-15 23 10l69 119Q189 168 91 143Z" fill="${hat}"/><path d="M184 18q-12 63 34 100" stroke="#ffffff20" stroke-width="7" fill="none"/><path d="m116 119 144 4 13 22q-90 17-169 0Z" fill="#c49c69"/><ellipse cx="185" cy="145" rx="111" ry="19" fill="${hat}"/><path d="M80 143q105 30 209 0" stroke="#cfb381" stroke-width="4" stroke-linecap="round" fill="none"/><path d="m235 95 5 10 11 2-10 6-2 11-5-10-10-4 10-4Z" fill="#f1d68f"/>
    <path d="M118 284q-25 10-26 42" stroke="${skin}" stroke-width="16" stroke-linecap="round"/><path d="M255 285q18 12 21 36" stroke="${skin}" stroke-width="16" stroke-linecap="round"/>
    <path d="m61 84 4 12 12 4-12 4-4 12-4-12-12-4 12-4ZM300 90l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#e6d49a"/>${petSvg}
  </svg>`;
}
function renderCreator(){
  const c=state.character;
  const swatch=(key,label)=>`<div class="field"><span class="picker-label">${label}</span><div class="swatches">${CHOICES[key].map(([value,desc])=>`<button type="button" class="swatch" aria-label="${esc(desc)}" title="${esc(desc)}" aria-pressed="${c[key]===value}" data-action="setting" data-setting="${key}" data-value="${value}" style="background:${value}"></button>`).join('')}</div></div>`;
  const styles=(key,label)=>`<div class="field"><span class="picker-label">${label}</span><div class="style-options">${CHOICES[key].map(([value,desc])=>`<button type="button" class="style-btn" aria-pressed="${c[key]===value}" data-action="setting" data-setting="${key}" data-value="${value}">${desc}</button>`).join('')}</div></div>`;
  $app.innerHTML=`<div class="opening">
    <section class="opening-art"><div class="opening-logo">✧ маленькая история ✧</div><div class="avatar-frame">${renderAvatar(c)}</div><h1>Ведьмин домик</h1><p>Где-то за туманным лесом тебя ждёт заброшенный домик. Кажется, ему очень нужна хозяйка.</p></section>
    <section class="opening-content"><div><span class="tiny-caps">Глава I · Новая хозяйка</span><h2>Создай свою ведьмочку</h2><p class="subtitle">Имя, любимые цвета, причёска и волшебный спутник. Эту историю ты пишешь сама.</p>
      <div class="field"><label for="witchname">Как её зовут?</label><input id="witchname" maxlength="24" value="${esc(c.name)}" placeholder="Например, Луна" autocomplete="off"></div>
      <div class="editor-grid">${swatch('skin','Оттенок кожи')}${swatch('hair','Цвет волос')}${swatch('dress','Цвет платья')}${swatch('hat','Цвет шляпы')}</div>
      ${styles('style','Причёска')}${styles('pet','Волшебный спутник')}
      <div class="creator-footer"><button class="btn" data-action="start">Отправиться в Туманный лес ✨</button><div class="mini-note">Прогресс сохраняется автоматически на этом устройстве.</div></div>
    </div></section></div>`;
}
function navButton(id,label){
  return `<button class="nav-btn ${state.nav===id?'active':''}" data-action="nav" data-id="${id}" aria-current="${state.nav===id?'page':'false'}"><span>${label}</span></button>`;
}
function render(){
  if(!state.created)state.created=true;
  const c=state.character;
  const screens={home:renderHome,garden:renderGarden,kitchen:renderKitchen,shop:renderShop,journal:renderJournal,companion:renderCompanion,mailbox:renderMailbox,profile:renderProfile};
  if(state.nav==='profile')ensureEditorDraft();
  const current=(screens[state.nav]||renderHome)();
  const locked=Array.from({length:5},()=>`<button class="locked-tile" type="button" disabled><span>Скоро будут<br>доступны</span></button>`).join('');
  $app.innerHTML=`<div class="game-shell ${menuOpen?'menu-open':''}">
    <main class="scene-area">
      ${state.nav!=='home'&&state.nav!=='profile'?`<button class="back-home" data-action="nav" data-id="home">← Дом</button>`:''}
      <div class="scene-content">${current}</div>
      <small class="version-label">Версия 0.3</small>
    </main>
    <aside class="drawer" aria-label="Игровое меню" aria-hidden="${!menuOpen}">
      <section class="profile-block">
        <button class="profile-avatar" data-action="profile" aria-label="Открыть редактор персонажа">${WitchEditor.spriteHtml(WitchEditor.appearanceFrom(c),'portrait')}</button>
        <div class="profile-copy"><strong>${esc(c.name)}</strong><span>Уровень ${state.level}</span><small>День ${state.day} · Энергия ${state.energy}/${maxEnergy()} · Монеты ${state.coins}</small></div>
      </section>
      <nav class="nav-grid" aria-label="Разделы игры">
        ${navButton('garden','Огород')}
        ${navButton('kitchen','Котёл')}
        ${navButton('shop','Лавка')}
        ${navButton('journal','Дневник')}
        ${navButton('companion','Спутник')}
        ${navButton('mailbox','Почтовый ящик')}
      </nav>
      <div class="locked-grid">${locked}</div>
      <div class="drawer-footer"><small>${state.weather} · День ${state.day}</small><button class="sleep-button" data-action="next-day">Завершить день →</button></div>
    </aside>
    <button class="menu-toggle" data-action="toggle-menu" aria-label="${menuOpen?'Закрыть меню':'Открыть меню'}" aria-expanded="${menuOpen}"><span></span><span></span><span></span></button>
  </div>`;
  WitchEditor.hydrate($app);
}
function renderSide(opts={}){
  return `<div class="right-column"><section class="panel"><h3 class="subheading">🎒 В кармашках</h3><div class="mini-list">${Object.entries(INGREDIENTS).map(([id,item])=>`<div class="resource-row"><span>${item.icon} ${item.name}</span><b>${state.inventory[id]||0}</b></div>`).join('')}<div class="resource-row"><span>🪵 Древесина</span><b>${state.wood}</b></div></div></section>
  <section class="panel"><h3 class="subheading">🌙 Завершить день</h3><p class="muted" style="font-size:12px">Отдохни до утра. Растения подрастут, а силы восстановятся.</p><div class="banner" style="margin-bottom:12px">${state.weather} · Сегодня день ${state.day}</div><button class="btn dark wide" data-action="next-day">Спать до утра →</button></section>
  ${opts.extra||''}</div>`;
}
function homeSVG(){
  return `<svg viewBox="0 0 900 560" role="img" aria-label="Фасад старого дома на зелёном дворе" xmlns="http://www.w3.org/2000/svg">
    <rect width="900" height="560" fill="#82A86F"/>
    <path d="M256 231 450 73 644 231Z" fill="#604638" stroke="#463329" stroke-width="10" stroke-linejoin="round"/>
    <path d="M284 226 450 91 616 226" fill="none" stroke="#8A6850" stroke-width="13" stroke-linecap="square"/>
    <path d="M330 171 450 74 570 171Z" fill="#B98E67" stroke="#76563F" stroke-width="7"/>
    <rect x="303" y="224" width="294" height="250" fill="#D8C19A" stroke="#76563F" stroke-width="9"/>
    <path d="M303 260H597M303 296H597M303 332H597M303 368H597M303 404H597M303 440H597" stroke="#B99A72" stroke-width="3" opacity=".65"/>
    <path d="M286 475H614" stroke="#594333" stroke-width="13" stroke-linecap="square"/>
    <rect x="337" y="279" width="76" height="83" fill="#A9C3B4" stroke="#674B39" stroke-width="9"/>
    <path d="M375 283V358M342 320H409" stroke="#76563F" stroke-width="6"/>
    <rect x="487" y="279" width="76" height="83" fill="#A9C3B4" stroke="#674B39" stroke-width="9"/>
    <path d="M525 283V358M492 320H559" stroke="#76563F" stroke-width="6"/>
    <path d="M421 474V365Q421 351 435 351H465Q479 351 479 365V474Z" fill="#765039" stroke="#4F382B" stroke-width="8"/>
    <circle cx="464" cy="418" r="5" fill="#E5C27A"/>
    <path d="M414 352H486" stroke="#4F382B" stroke-width="8"/>
    <rect x="545" y="111" width="39" height="85" fill="#76533E" stroke="#4F382B" stroke-width="7"/>
    <path d="M536 111H593" stroke="#4F382B" stroke-width="9"/>
    <path d="M280 230 450 93 620 230" fill="none" stroke="#3E2D25" stroke-width="7"/>
    <path d="M303 474H597" stroke="#E5D3B0" stroke-width="4" opacity=".6"/>
  </svg>`;
}
function renderHome(){
  return `<section class="screen-page home-page">
    <h1 class="screen-title">Дом</h1>
    <div class="yard-stage">${homeSVG()}</div>
  </section>`;
}
function renderGarden(){
  const plots=state.plots.map((p,i)=>{
    const crop=p&&CROPS[p.type];const ripe=p&&p.growth>=crop.days;
    return `<button class="plot ${!p?'empty':''}" data-action="plot" data-index="${i}" aria-pressed="${state.selectedPlot===i}" style="${state.selectedPlot===i?'outline:3px solid #f6d8a6;outline-offset:3px':''}"><span class="plant">${p?(ripe?crop.icon:crop.sprout):'✚'}</span><span class="plot-label">${p?crop.name:'Пустая грядка'}</span><span class="plot-progress">${p?(ripe?'Готово к сбору!':`${Math.round(p.growth/crop.days*100)}% · ${crop.days-p.growth} дн.`):'Посадить'}</span></button>`;
  }).join('');
  const p=state.plots[state.selectedPlot];const crop=p&&CROPS[p.type];const ripe=p&&p.growth>=crop.days;
  const control=!p?`<p>Выбери пакетик семян и посади их на этой грядке.</p><button class="btn small" data-action="plant">Посадить ${CROPS[state.selectedSeed].icon} <span>−1 ⚡</span></button>`:
    ripe?`<p>${crop.name} созрели! Собери урожай (+${crop.yield} шт.).</p><button class="btn small" data-action="harvest">Собрать урожай <span>−1 ⚡</span></button>`:
    `<p>${crop.name} растут. Можно полить, чтобы ускорить рост на день.</p><button class="btn small" data-action="water" ${p.wateredDay===state.day?'disabled':''}>💧 ${p.wateredDay===state.day?'Уже полито':'Полить · −1 ⚡'}</button>`;
  const seeds=Object.entries(CROPS).map(([id,item])=>`<button class="seed ${state.selectedSeed===id?'selected':''}" data-action="seed" data-id="${id}"><span class="emoji">${item.icon}</span><span class="seed-info"><strong>${item.name}</strong><small>${item.days} дн. до сбора</small></span><b>×${state.seeds[id]}</b></button>`).join('');
  return `<section class="screen-page">
    <div class="screen-heading"><h1>Огород</h1><p>Сажай травы и овощи, поливай грядки и собирай ингредиенты для новых рецептов.</p></div>
    <section class="panel garden-panel"><div class="section-head"><h2>Шесть волшебных грядок</h2><span class="tag">День ${state.day}</span></div><div class="garden-field"><div class="garden-grid">${plots}</div></div><p class="muted helper-text">Нажми на грядку, чтобы посадить, полить или собрать урожай.</p></section>
    <section class="panel"><h2 class="subheading">Твои семена</h2><div class="seed-grid">${seeds}</div><div class="selected-plot"><h3>Грядка №${state.selectedPlot+1}</h3>${control}</div></section>
  </section>`;
}
function renderCauldron(){
  return `<svg viewBox="0 0 450 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Чугунный котёл с зелёным зельем">
    <defs><radialGradient id="liquid"><stop offset="0" stop-color="#88c68e"/><stop offset=".78" stop-color="#33774b"/><stop offset="1" stop-color="#1b4c42"/></radialGradient><linearGradient id="pot" x1="0" x2="1"><stop stop-color="#141a21"/><stop offset=".35" stop-color="#444850"/><stop offset=".67" stop-color="#292d36"/><stop offset="1" stop-color="#111923"/></linearGradient></defs>
    <g fill="#dbd6bb" opacity=".55"><circle cx="201" cy="78" r="5"/><circle cx="258" cy="45" r="3"/><circle cx="306" cy="72" r="4"/></g>
    <g stroke="#a6d19a" fill="none" stroke-linecap="round" opacity=".7"><path d="M183 119q-11-24 5-43t-2-35" stroke-width="5"/><path d="M247 121q-11-27 7-43t-1-33" stroke-width="5"/><path d="M300 123q-11-20 1-42" stroke-width="4"/></g>
    <path d="M100 149Q86 261 160 293H298Q373 261 352 149Z" fill="url(#pot)" stroke="#111b22" stroke-width="8"/><path d="m148 286 12 23h21l-3-20m100-3-7 23h20l15-23" fill="#181c24"/>
    <ellipse cx="225" cy="150" rx="137" ry="46" fill="#29303a" stroke="#14191e" stroke-width="13"/><ellipse cx="225" cy="144" rx="126" ry="36" fill="url(#liquid)"/>
    <path d="M133 143q41-22 82-4 47 18 99-4" stroke="#acd4a2" opacity=".35" stroke-width="6" fill="none"/><ellipse cx="266" cy="141" rx="23" ry="6" fill="#a8e3a2" opacity=".3"/><circle cx="163" cy="145" r="7" fill="#addcb1" opacity=".5"/><circle cx="276" cy="139" r="4" fill="#bde8b1" opacity=".65"/>
    <path d="M104 168q-28 19-40 5m289-4q30 19 40 1" stroke="#21242b" stroke-width="15" stroke-linecap="round" fill="none"/>
    <ellipse cx="225" cy="174" rx="119" ry="16" fill="none" stroke="#72787d" stroke-width="3" opacity=".24"/>
    <path d="M147 229q7 38 37 49" stroke="#ffffff" opacity=".15" stroke-width="12" fill="none" stroke-linecap="round"/>
    <g fill="#efd195"><path d="m112 61 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z"/><path d="m330 35 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g>
  </svg>`;
}
function recipeIngredients(ingredients){return Object.entries(ingredients).map(([k,v])=>`${INGREDIENTS[k].icon} ${v}`).join(' · ');}
function renderKitchen(){
  const chips=Object.entries(state.mix).filter(([,count])=>count>0).map(([key,count])=>`<button class="mix-chip" data-action="remove-mix" data-id="${key}" title="Убрать один">${INGREDIENTS[key].icon} ×${count} −</button>`).join('')||'<span class="muted" style="font-size:12px">Пока пусто. Нажимай на ингредиенты ниже.</span>';
  const ingredients=Object.entries(INGREDIENTS).map(([id,item])=>`<button class="ingredient ${state.mix[id]>0?'selected':''}" data-action="add-mix" data-id="${id}" ${!state.inventory[id]||state.mix[id]>=state.inventory[id]?'disabled':''}><span class="emoji">${item.icon}</span><b>${item.name}</b><small>есть ${state.inventory[id]||0}</small></button>`).join('');
  const recipes=Object.entries(RECIPES).map(([id,x])=>`<div class="recipe"><span class="recipe-icon">${x.icon}</span><div style="flex:1"><b>${x.name} ${state.discovered.includes(id)?'✧':''}</b><p>${recipeIngredients(x.ingredients)} · +${x.energy} ⚡ при еде</p></div><button class="btn small secondary" data-action="use-recipe" data-id="${id}">В котёл</button></div>`).join('');
  const dishes=Object.entries(RECIPES).filter(([id])=>state.dishes[id]>0).map(([id,x])=>`<div class="dish"><div><strong>${x.icon} ${x.name} <small>×${state.dishes[id]}</small></strong><small>Съесть: +${x.energy} ⚡ / Продать: ${x.sell} 🪙</small></div><div class="pill-row"><button class="btn small secondary" data-action="eat" data-id="${id}">Съесть</button><button class="btn small" data-action="sell-dish" data-id="${id}">Продать</button></div></div>`).join('')||'<div class="empty-msg">Пока нет готовых блюд. Пора ставить котёл!</div>';
  return `<section class="screen-page">
    <div class="screen-heading"><h1>Котёл</h1><p>Добавляй ингредиенты, открывай рецепты, угощайся или продавай свои творения.</p></div>
    <section class="panel"><div class="section-head"><h2>Большой чугунный котёл</h2><span class="tag">Огонь разожжён ✧</span></div><div class="kitchen-stage"><span class="scene-caption">Варись, волшебство…</span>${renderCauldron()}</div><div class="divider"></div><h3 class="subheading">Выбери ингредиенты</h3><div class="ingredient-grid">${ingredients}</div><div class="mix-area"><div class="tiny-caps">В котле сейчас:</div><div class="mix-line">${chips}</div></div><div class="action-row"><button class="btn" data-action="cook">✨ Сварить блюдо <small>−2 ⚡</small></button><button class="btn secondary" data-action="clear-mix">Очистить котёл</button></div></section>
    <section class="panel"><div class="section-head"><h2>Книга рецептов</h2><span class="tag">Открыто: ${state.discovered.length}/${Object.keys(RECIPES).length}</span></div><div class="recipes">${recipes}</div></section>
    <section class="panel"><h2 class="subheading">🍴 Готовые блюда</h2><div class="dish-list">${dishes}</div></section>
  </section>`;
}
function renderShop(){
  const buyables=[...Object.entries(CROPS).map(([id,x])=>({id:'seed-'+id,name:x.seed,icon:x.icon,cost:x.cost,type:'семена'})),{id:'salt',name:'Щепотка соли',icon:'🧂',cost:3,type:'специи'},{id:'wood',name:'Связка древесины',icon:'🪵',cost:6,type:'стройматериал'}];
  const buys=buyables.map(x=>`<div class="shop-item"><span class="item-icon">${x.icon}</span><div class="item-main"><strong>${x.name}</strong><small>${x.type} · 1 шт.</small></div><button class="btn small" data-action="buy" data-id="${x.id}" ${state.coins<x.cost?'disabled':''}>${x.cost} 🪙</button></div>`).join('');
  const selling=Object.entries(CROPS).map(([id,x])=>`<div class="shop-item"><span class="item-icon">${x.icon}</span><div class="item-main"><strong>${x.name}</strong><small>У тебя: ${state.inventory[id]} шт.</small></div><button class="btn small secondary" data-action="sell-ingredient" data-id="${id}" ${!state.inventory[id]?'disabled':''}>+${x.sell} 🪙</button></div>`).join('');
  const order=ORDERS[state.ordersCompleted%ORDERS.length],meal=RECIPES[order.dish];
  return `<section class="screen-page">
    <div class="screen-heading"><h1>Лавка</h1><p>Покупай семена, специи и материалы, продавай урожай и выполняй заказы жителей леса.</p></div>
    <section class="panel"><div class="section-head"><h2>Прилавок</h2><span class="tag">Кошелёк: ${state.coins} 🪙</span></div><div class="shop-grid">${buys}</div></section>
    <section class="panel"><h2>Продать урожай</h2><p class="muted helper-text">Можно продать лишнее, но кое-что лучше оставить для кухни.</p><div class="shop-grid">${selling}</div></section>
    <section class="panel"><div class="tiny-caps">Письмо от жителя леса</div><div class="order-card" style="margin-top:11px"><div class="tiny-caps">Заказ №${state.ordersCompleted+1}</div><h3>✉️ ${order.person}</h3><p>«${order.text}»</p><p>Нужно: ${meal.icon} ${meal.name} ×${order.count}<br>Награда: <b>${order.reward} 🪙</b></p><button class="btn" data-action="order" ${state.dishes[order.dish]<order.count?'disabled':''}>Отдать заказ</button></div><p class="muted helper-text">Уже выполнено заказов: ${state.ordersCompleted}. После сдачи появится новый.</p></section>
  </section>`;
}
function renderJournal(){
  const tasks=QUESTS.map(q=>{const n=Math.min(state.stats[q.stat],q.target),claimed=state.claimed.includes(q.id),ready=n>=q.target&&!claimed;return `<div class="quest"><span class="quest-icon">${q.icon}</span><div class="quest-desc"><h3>${q.name}</h3><p>${q.text} · ${n}/${q.target}</p><div class="progress-track" style="height:5px"><div class="progress-fill" style="width:${Math.round(n/q.target*100)}%"></div></div></div>${claimed?'<span class="tag">✓ Готово</span>':`<button class="btn small ${ready?'':'secondary'}" data-action="claim" data-id="${q.id}" ${ready?'':'disabled'}>+${q.reward} 🪙</button>`}</div>`}).join('');
  return `<section class="screen-page">
    <div class="screen-heading"><h1>Дневник</h1><p>Задания, заметки и маленькие события из жизни ведьмочки.</p></div>
    <section class="panel"><div class="section-head"><h2>Маленькие цели</h2><span class="tag">Выполнено ${state.claimed.length}/${QUESTS.length}</span></div>${tasks}</section>
    <section class="panel"><h2>Страницы истории</h2><div class="diary-list">${state.log.map(x=>{const i=x.indexOf('. ');return `<div class="diary-entry"><b>${esc(x.slice(0,i+1))}</b>${esc(x.slice(i+2))}</div>`}).join('')}</div></section>
    <section class="panel"><h2>Статистика и сохранение</h2><div class="stats-grid">${[['🌱 Посадок',state.stats.planted],['🧺 Урожаев',state.stats.harvested],['🍲 Блюд',state.stats.cooked],['🔨 Ремонтов',state.stats.repairs],['🪙 Продаж',state.stats.sold],['✉️ Заказов',state.ordersCompleted]].map(([k,v])=>`<div class="stat-card"><span>${k}</span><b>${v}</b></div>`).join('')}</div><p class="muted helper-text">Игра сохраняется в этом браузере. Для переноса на другое устройство скачай файл сохранения.</p><div class="foot-actions"><button class="btn small dark" data-action="export">Скачать сохранение</button><button class="btn small secondary" data-action="import">Загрузить</button><button class="btn small danger" data-action="reset">Начать заново</button></div><input type="file" id="import-save" accept="application/json,.json" hidden></section>
  </section>`;
}
function renderCompanion(){
  const pet={cat:{name:'Кошка',icon:'🐈‍⬛',text:'Любит дремать на тёплом подоконнике и мурлыкать рядом, когда ты колдуешь.'},fox:{name:'Лис',icon:'🦊',text:'Любопытный и шустрый спутник. Иногда приносит из леса маленькие находки.'},owl:{name:'Сова',icon:'🦉',text:'Наблюдает за всем с высоты и не пропускает ни одной тайны.'}}[state.character.pet]||{name:'Спутник',icon:'✨',text:'Твой маленький волшебный помощник.'};
  return `<section class="screen-page"><div class="screen-heading"><h1>Спутник</h1><p>Тот, кто всегда рядом, даже когда в котле что-то пошло не так.</p></div><section class="panel companion-card"><div class="companion-portrait">${pet.icon}</div><div><h2>${pet.name}</h2><p>${pet.text}</p><p class="muted helper-text">Спутник может поделиться с тобой одной единицей энергии в день.</p><button class="btn" data-action="pet">Поиграть со спутником · +1 ⚡</button></div></section></section>`;
}
function renderMailbox(){
  return `<section class="screen-page"><div class="screen-heading"><h1>Почтовый ящик</h1><p>Здесь будут появляться письма от жителей леса, подарки и приглашения от подруг.</p></div><section class="panel mailbox-empty"><div>✉️</div><h2>Пока писем нет</h2><p>Кажется, почтальон ещё не добрался до твоего домика.</p></section></section>`;
}
function renderProfile(){
  return WitchEditor.editorHtml(ensureEditorDraft(),editorCategory);
}
function selectedPlot(){return state.plots[state.selectedPlot];}
function action(name,id,element){
  switch(name){
  case 'setting': {
    const key=element.dataset.setting, value=element.dataset.value;
    if(CHOICES[key]?.some(([v])=>v===value))state.character[key]=value;break;
  }
  case 'start':{
    const name=String(state.character.name).trim();state.character.name=name.slice(0,24)||'Луна';state.created=true;addLog(`${state.character.name} переступила порог нового дома. Рядом её верный спутник.`);break;
  }
  case 'nav':{if(['home','garden','kitchen','shop','journal','companion','mailbox','profile'].includes(id)){state.nav=id;menuOpen=false;if(id==='profile'){editorDraft=WitchEditor.appearanceFrom(state.character);editorCategory='skin';}}break;}
  case 'toggle-menu':{menuOpen=!menuOpen;render();return;}
  case 'profile':{editorDraft=WitchEditor.appearanceFrom(state.character);editorCategory='skin';state.nav='profile';menuOpen=false;break;}
  case 'editor-tab':{
    if(WitchEditor.CATEGORIES.some(x=>x.id===id)) editorCategory=id;
    break;
  }
  case 'editor-skin':{
    if(WitchEditor.PALETTE.some(x=>x.id===id))ensureEditorDraft().skin=id;
    break;
  }
  case 'editor-eye-color':{
    if(WitchEditor.EYE_PALETTE.some(x=>x.id===id))ensureEditorDraft().eyeColor=id;
    break;
  }
  case 'editor-option':{
    const category=element.dataset.category;
    if(!['eyes','hair','expressions','clothing'].includes(category))return;
    if(id && !WitchEditor.option(category,id))return;
    ensureEditorDraft()[category]=id||'';
    break;
  }
  case 'editor-save':{
    const draft=ensureEditorDraft();
    const name=String(draft.name||'').trim().slice(0,24)||'Луна';
    state.character.name=name;
    state.character.skin=draft.skin;
    state.character.appearance={
      skin:draft.skin,eyeColor:draft.eyeColor||'amethyst',
      eyes:draft.eyes||'',hair:draft.hair||'',
      expressions:draft.expressions||'',clothing:draft.clothing||''
    };
    editorDraft=null;
    state.nav='home';menuOpen=false;
    notice('Внешность ведьмочки сохранена ✨');
    break;
  }
  case 'editor-cancel':{
    editorDraft=null;
    state.nav='home';menuOpen=false;
    break;
  }
  case 'next-day':{
    state.day++;state.energy=maxEnergy();state.weather=['☀️ Ясно','🌦️ Переменная облачность','🌫️ Туманно','🌧️ Дождь'][Math.floor(Math.random()*4)];
    state.plots.forEach(p=>{if(p&&p.growth<CROPS[p.type].days)p.growth=Math.min(CROPS[p.type].days,p.growth+1);});
    addLog(`Наступило новое утро. За окном ${state.weather.toLowerCase()}.`);notice(`Доброе утро! День ${state.day}. Силы восстановлены.`);break;
  }
  case 'forest':{
    if(!canSpend(2))return;state.energy-=2;state.wood+=2;
    if(Math.random()<.25){state.inventory.berry++;notice('Ты нашла 2 🪵 древесины и 1 🫐 ягодку!');}else notice('Ты собрала 2 🪵 древесины в лесу.');
    addLog('Прогулка в лес принесла немного древесины.');break;
  }
  case 'pet':{
    if(state.pettedDay===state.day){notice('Ты уже поиграла со спутником сегодня.');return;}
    if(state.energy>=maxEnergy()){notice('Сил и так достаточно. Вернись, когда устанешь.');return;}
    state.energy++;state.pettedDay=state.day;notice('Твой спутник радуется! +1 ⚡');break;
  }
  case 'repair':{
    const x=REPAIRS[id];if(!x||state.repairs[id])return;
    if(!spendCoins(x.coins))return;
    if(state.wood<x.wood){notice(`Нужно ещё ${x.wood-state.wood} 🪵 древесины.`);return;}
    state.coins-=x.coins;state.wood-=x.wood;state.repairs[id]=true;state.stats.repairs++;
    if(id==='hearth')state.energy=Math.min(maxEnergy(),state.energy+2);
    addLog(`В доме закончена работа: ${x.name.toLowerCase()}.`);notice(`${x.icon} ${x.name} — готово!`);break;
  }
  case 'decorate':{
    const x=DECOR[id];if(!x||state.decor[id]||!spendCoins(x.coins))return;
    state.coins-=x.coins;state.decor[id]=true;addLog(`Дом украсили: ${x.name.toLowerCase()}.`);notice('Теперь в домике ещё уютнее ✨');break;
  }
  case 'plot': {const i=Number(element.dataset.index);if(Number.isInteger(i)&&i>=0&&i<6)state.selectedPlot=i;break;}
  case 'seed': {if(CROPS[id])state.selectedSeed=id;break;}
  case 'plant':{
    if(selectedPlot())return;
    const crop=state.selectedSeed;if(!CROPS[crop])return;
    if(!state.seeds[crop]){notice('Семена закончились. Загляни в лавку!');return;}
    if(!canSpend(1))return;
    state.seeds[crop]--;state.energy--;state.plots[state.selectedPlot]={type:crop,growth:0,wateredDay:0};state.stats.planted++;
    notice(`${CROPS[crop].icon} Семена посажены. Пусть растут!`);break;
  }
  case 'water':{
    const p=selectedPlot();if(!p||!CROPS[p.type]||p.growth>=CROPS[p.type].days||p.wateredDay===state.day)return;
    if(!canSpend(1))return;
    state.energy--;p.growth=Math.min(CROPS[p.type].days,p.growth+1);p.wateredDay=state.day;notice('💧 Растению понравился дождик из лейки!');break;
  }
  case 'harvest':{
    const p=selectedPlot();if(!p||!CROPS[p.type]||p.growth<CROPS[p.type].days)return;
    if(!canSpend(1))return;
    const crop=CROPS[p.type];state.energy--;state.inventory[p.type]+=crop.yield;state.plots[state.selectedPlot]=null;state.stats.harvested++;
    addLog(`Собран урожай: ${crop.name.toLowerCase()} (${crop.yield} шт.).`);notice(`${crop.icon} Урожай собран: +${crop.yield}!`);break;
  }
  case 'add-mix':{
    if(!INGREDIENTS[id])return;
    if(state.mix[id]<(state.inventory[id]||0))state.mix[id]++;break;
  }
  case 'remove-mix':{if(INGREDIENTS[id])state.mix[id]=Math.max(0,state.mix[id]-1);break;}
  case 'clear-mix':{clearMix();break;}
  case 'use-recipe':{if(!RECIPES[id])return;clearMix();Object.assign(state.mix,RECIPES[id].ingredients);break;}
  case 'cook':{
    if(!canSpend(2))return;
    const recipe=Object.entries(RECIPES).find(([,x])=>Object.keys(INGREDIENTS).every(k=>(x.ingredients[k]||0)===(state.mix[k]||0)));
    if(!recipe){notice('Котёл задумчиво булькает… В книге есть подсказки к рецептам.');return;}
    const [key,x]=recipe;
    for(const [ing,num] of Object.entries(x.ingredients))if(state.inventory[ing]<num){notice(`Не хватает: ${INGREDIENTS[ing].name}. Вырасти или купи ингредиент.`);return;}
    for(const [ing,num] of Object.entries(x.ingredients))state.inventory[ing]-=num;
    state.dishes[key]++;state.energy-=2;state.stats.cooked++;
    if(!state.discovered.includes(key))state.discovered.push(key);
    addLog(`На кухне приготовлено: ${x.name.toLowerCase()}.`);clearMix();notice(`✨ Получилось: ${x.icon} ${x.name}!`);break;
  }
  case 'eat':{
    const x=RECIPES[id];if(!x||!state.dishes[id])return;
    if(state.energy>=maxEnergy()){notice('Ты уже полна сил. Прибереги блюдо на потом.');return;}
    state.dishes[id]--;state.energy=Math.min(maxEnergy(),state.energy+x.energy);state.stats.eaten++;
    notice(`${x.icon} Вкусно! Восстановлено до ${x.energy} ⚡.`);break;
  }
  case 'sell-dish':{
    const x=RECIPES[id];if(!x||!state.dishes[id])return;
    state.dishes[id]--;state.coins+=x.sell;state.stats.sold++;
    notice(`Продано: ${x.name}. +${x.sell} 🪙`);break;
  }
  case 'sell-ingredient':{
    const x=CROPS[id];if(!x||!state.inventory[id])return;
    state.inventory[id]--;state.coins+=x.sell;state.stats.sold++;
    notice(`${x.icon} Продано! +${x.sell} 🪙`);break;
  }
  case 'buy':{
    if(id==='salt'){if(!spendCoins(3))return;state.coins-=3;state.inventory.salt++;notice('🧂 Соль куплена.');}
    else if(id==='wood'){if(!spendCoins(6))return;state.coins-=6;state.wood++;notice('🪵 Древесина куплена.');}
    else if(id.startsWith('seed-')){const crop=id.slice(5),x=CROPS[crop];if(!x||!spendCoins(x.cost))return;state.coins-=x.cost;state.seeds[crop]++;notice(`${x.icon} Семена куплены!`);}
    break;
  }
  case 'order':{
    const x=ORDERS[state.ordersCompleted%ORDERS.length];if(state.dishes[x.dish]<x.count)return;
    state.dishes[x.dish]-=x.count;state.coins+=x.reward;state.stats.sold+=x.count;state.ordersCompleted++;
    addLog(`Выполнен заказ для ${x.person}.`);notice(`Заказ доставлен! +${x.reward} 🪙`);break;
  }
  case 'claim':{
    const x=QUESTS.find(q=>q.id===id);
    if(!x||state.claimed.includes(id)||state.stats[x.stat]<x.target)return;
    state.claimed.push(id);state.coins+=x.reward;notice(`Награда получена: ${x.reward} 🪙`);break;
  }
  case 'export':{exportSave();return;}
  case 'import':{document.getElementById('import-save')?.click();return;}
  case 'reset':{
    if(!confirm('Удалить прогресс этой ведьмочки и создать новую? Сначала можно скачать сохранение в дневнике.'))return;
    state=newGame();menuOpen=false;notice('История начинается заново.');break;
  }
  default:return;
  }
  save();render();
}
function clearMix(){for(const k of Object.keys(INGREDIENTS))state.mix[k]=0;}
function exportSave(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vedmin-domik-save.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Файл сохранения скачивается.');
}
$app.addEventListener('click',e=>{
  const target=e.target.closest('[data-action]');if(!target||target.disabled)return;
  action(target.dataset.action,target.dataset.id,target);
});
$app.addEventListener('input',e=>{
  if(e.target?.id==='witchname'){
    state.character.name=e.target.value.slice(0,24);save();
  }
  if(e.target?.id==='witch-editor-name'){
    ensureEditorDraft().name=e.target.value.slice(0,24);
  }
});
$app.addEventListener('change',async e=>{
  if(e.target?.id!=='import-save')return;
  const file=e.target.files?.[0];if(!file)return;
  try{
    if(file.size>1000000)throw new Error('Файл слишком большой.');
    const data=JSON.parse(await file.text());if(!validGame(data))throw new Error('Это не сохранение «Ведьминого домика».');
    // Basic integrity checks against malformed or edited saves.
    if(!Number.isFinite(data.day)||data.day<1||!Number.isFinite(data.coins)||data.coins<0||typeof data.created!=='boolean')throw new Error('Некорректные данные сохранения.');
    if(!confirm(`Загрузить сохранение ведьмочки «${String(data.character.name).slice(0,24)}»? Текущий прогресс будет заменён.`))return;
    state=data;state.character.name=String(data.character.name).slice(0,24);state.created=true;state.level=Number.isFinite(data.level)?Math.max(1,data.level):1;state.nav=['home','garden','kitchen','shop','journal','companion','mailbox','profile'].includes(data.nav)?data.nav:'home';menuOpen=false;editorDraft=null;editorCategory='skin';
    state.selectedPlot=Number.isInteger(data.selectedPlot)&&data.selectedPlot>=0&&data.selectedPlot<6?data.selectedPlot:0;
    state.selectedSeed=CROPS[data.selectedSeed]?data.selectedSeed:'tomato';
    save();render();notice('Сохранение загружено!');
  }catch(err){notice(`Не удалось загрузить файл: ${err.message}`);}
});
render();
