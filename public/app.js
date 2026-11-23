(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s);
function h(tag,props,...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(props||{})){if(v==null||v===false)continue;
 if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);
 else if(['value','checked','disabled','type','placeholder','id','href','rows','min','max','step','maxLength','autocomplete'].includes(k))e[k]=v;
 else e.setAttribute(k,v===true?'':v)}
 for(const c of kids.flat(9)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}return e}
const uid=()=>Math.random().toString(36).slice(2,10);
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const sunday=d=>{const x=new Date(d);x.setDate(x.getDate()-x.getDay());x.setHours(0,0,0,0);return x};
const fmt=(o)=>new Intl.DateTimeFormat('pt-BR',o);
const brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const todayIso=()=>iso(new Date());
const pct=(a,b)=>b?Math.round(a/b*100):0;

const EXAMS=[['tjsp','TJSP'],['receita','Receita Federal'],['inss','INSS']];
const ICONS={
 inicio:'<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
 wishlists:'<svg viewBox="0 0 24 24"><path d="M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 21.5l8.8-8.8a5 5 0 000-7.1z"/></svg>',
 objetivos:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
 planner:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 concurso:'<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5M9 8h6M9 12h6"/></svg>',
 x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 link:'<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
 trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
 edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
 chev:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
 next:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
const ico=n=>h('span',{html:ICONS[n],style:'display:contents'});
const NAV=[['inicio','Início'],['wishlists','Wishlists'],['objetivos','Objetivos'],['planner','Planner'],['concurso','Concurso']];
const TONES=['mint','peach','pink','yellow','neutral'];
const TONE_NAME={mint:'Menta',peach:'Pêssego',pink:'Rosa',yellow:'Amarelo',neutral:'Neutro'};

/* ---------- estado ---------- */
function defaults(){
 return{
  wishlist:{cats:[
   {id:'c1',name:'Casa',tone:'mint'},{id:'c2',name:'Moda',tone:'pink'},{id:'c3',name:'Beleza',tone:'peach'},
   {id:'c4',name:'Tecnologia',tone:'neutral'}],items:[]},
  goals:{areas:[
   {id:'a1',name:'Viagens',tone:'mint'},{id:'a2',name:'Profissional',tone:'neutral'},{id:'a3',name:'Saúde',tone:'pink'},
   {id:'a4',name:'Desenvolvimento pessoal',tone:'yellow'},{id:'a5',name:'Estética',tone:'peach'},{id:'a6',name:'Estudos',tone:'mint'}],
   items:[
    {id:'g1',area:'a6',title:'Fazer o curso de Logística e Supply Chain',due:'',done:false,steps:[]},
    {id:'g2',area:'a6',title:'Fazer um curso de E-commerce',due:'',done:false,steps:[]}]},
  planner:{tasks:[],focus:{}},
  study:{exams:EXAMS.map(([id,name])=>({id,name,date:'',weeklyHours:10,subjects:[],log:[]}))}
 };
}
let S=defaults();
const SECS=['wishlist','goals','planner','study'];
const LS_BASE='meu-espaco-v1';let ME=null,canSeed=false;const LS=()=>LS_BASE+':'+(ME?ME.id:'x');
let mode='carregando',diag='';
function lsRead(){try{const r=localStorage.getItem(LS())||localStorage.getItem(LS_BASE);return r?JSON.parse(r):null}catch(e){return null}}
function lsWrite(){if(!ME)return;try{localStorage.setItem(LS(),JSON.stringify(S))}catch(e){}}
const dirty=new Set();let timer=null,online=false;
function save(sec){dirty.add(sec);lsWrite();setMode(online?'salvando':'local');clearTimeout(timer);timer=setTimeout(flush,400)}
async function api(path,opts){
 const r=await fetch(path,opts);
 if(!r.ok){let m='Erro '+r.status;try{m=(await r.json()).error||m}catch(e){}const err=new Error(m);err.status=r.status;if(r.status===401&&ME&&!path.startsWith('/api/auth/'))showAuth('Sua sessão expirou. Entre de novo.');throw err}
 return r.status===204?null:r.json()}
async function putSection(s,keepalive){
 await api('/api/state/'+s,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(S[s]),keepalive:!!keepalive})}
async function flush(){
 const secs=[...dirty];dirty.clear();
 if(!online||!secs.length)return;
 try{for(const s of secs)await putSection(s);diag='';setMode(dirty.size?'salvando':'banco')}
 catch(e){if(e.status===401)return;secs.forEach(s=>dirty.add(s));diag=e.message;setMode('erro');clearTimeout(timer);timer=setTimeout(flush,5000)}}
window.addEventListener('pagehide',()=>{if(!online||!dirty.size)return;for(const s of dirty){try{putSection(s,true)}catch(e){}}});
function setMode(m){mode=m;const el=$('#sync');if(!el)return;el.textContent='';
 const ok=m==='banco';
 const msg={banco:'Salvo no banco de dados',salvando:'Salvando…',erro:'Sem conexão com o banco'+(diag?' ('+diag+')':'')+'. Tentando de novo…',
  carregando:'Conectando ao banco…',local:'Servidor indisponível. Salvo só neste navegador'}[m];
 el.append(h('span',{class:'dot'+(ok?'':' off')}),h('span',{role:'status'},msg))}
const isArr=Array.isArray;
const VALID={
 wishlist:d=>isArr(d.cats)&&isArr(d.items),
 goals:d=>isArr(d.areas)&&isArr(d.items),
 planner:d=>isArr(d.tasks)&&d.focus&&typeof d.focus==='object',
 study:d=>isArr(d.exams)||(isArr(d.subjects)&&isArr(d.log)&&d.exam&&typeof d.exam==='object')};
async function init(){
 setMode('carregando');
 try{ME=(await api('/api/auth/me')).user}
 catch(e){if(e.status===401){showAuth();return}showFatal();return}
 startApp()}
async function startApp(){
 canSeed=!!ME.seed;
 document.body.classList.remove('is-auth');$('#auth').replaceChildren();
 const local=lsRead();
 if(local){for(const s of SECS)if(local[s]&&VALID[s](local[s]))S[s]=local[s]}
 applyMigrations();route();      /* mostra o cache local já, sem esperar o servidor */
 const who=$('#who');if(who)who.textContent=ME.email;
 try{
  const {sections}=await api('/api/state');
  online=true;
  for(const s of SECS){
   const d=sections[s];
   if(d&&VALID[s](d))S[s]=d;       /* o banco é a fonte da verdade */
   else dirty.add(s)}              /* seção nova no banco: envia o que há localmente (ou o modelo inicial) */
  applyMigrations();lsWrite();route();
  if(dirty.size)await flush();else setMode('banco');
 }catch(e){if(e.status!==401){online=false;diag='';setMode('local')}}
}
function showFatal(){
 document.body.classList.add('is-auth');
 $('#auth').replaceChildren(h('div',{class:'auth-card'},h('h1',null,'Sem ',h('em',null,'conexão')),
  h('p',{class:'muted'},'Não consegui falar com o servidor. Verifique sua internet e tente de novo.'),
  h('button',{class:'btn btn-primary',onclick:()=>location.reload()},'Tentar de novo')))}
async function logout(){
 try{await fetch('/api/auth/logout',{method:'POST'})}catch(e){}
 try{localStorage.removeItem(LS());localStorage.removeItem(LS_BASE)}catch(e){}
 location.hash='';location.reload()}
function showAuth(msg){
 ME=null;online=false;
 document.body.classList.add('is-auth');
 let signup=false;
 const draw=()=>{
  const err=h('p',{class:'err',role:'alert',style:msg?'':'display:none'},msg||'');
  const emailI=h('input',{class:'inp',name:'email',type:'email',autocomplete:'email',required:true,maxLength:254,placeholder:'voce@exemplo.com'});
  const passI=h('input',{class:'inp',name:'password',type:'password',autocomplete:signup?'new-password':'current-password',required:true,maxLength:128});
  const submit=h('button',{type:'submit',class:'btn btn-primary',style:'width:100%'},signup?'Criar conta':'Entrar');
  const form=h('form',{class:'auth-card',novalidate:true,onsubmit:async e=>{e.preventDefault();
    const fd=new FormData(form),email=String(fd.get('email')).trim(),password=String(fd.get('password'));
    const fail=m=>{err.textContent=m;err.style.display='block'};
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){fail('Digite um e-mail válido.');emailI.focus();return}
    if(!password){fail('Digite sua senha.');passI.focus();return}
    if(signup&&password.length<8){fail('A senha precisa ter pelo menos 8 caracteres.');passI.focus();return}
    submit.disabled=true;submit.textContent='Aguarde…';
    try{const r=await api(signup?'/api/auth/register':'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,name:String(fd.get('name')||'').trim()})});
     ME=r.user;S=defaults();startApp()}
    catch(e2){fail(e2.status?e2.message:'Não consegui falar com o servidor.');submit.disabled=false;submit.textContent=signup?'Criar conta':'Entrar'}}},
   h('div',{class:'brand',style:'padding:0 0 var(--space-3)'},'Meu ',h('em',null,'espaço')),
   h('h1',{style:'font-size:34px'},signup?['Criar ',h('em',null,'conta')]:['Entrar no ',h('em',null,'espaço')]),
   signup?field('Como devo te chamar? (opcional)',h('input',{class:'inp',name:'name',autocomplete:'given-name',maxLength:40})):null,
   field('E-mail',emailI),field('Senha',passI),
   signup?h('p',{class:'ds-hint',style:'margin:0'},'Use pelo menos 8 caracteres.'):null,
   err,submit,
   h('p',{class:'muted',style:'margin:0;text-align:center'},signup?'Já tem conta? ':'Ainda não tem conta? ',
    h('button',{type:'button',class:'linkbtn',onclick:()=>{signup=!signup;msg='';draw()}},signup?'Entrar':'Criar conta')));
  $('#auth').replaceChildren(form);emailI.focus()};
 draw()}


/* ---------- modal ---------- */
function modal(title,build,opts={}){
 const prev=document.activeElement;
 const err=h('p',{class:'err',style:'display:none',role:'alert'});
 const form=h('form',{class:'modal',role:'dialog','aria-modal':'true','aria-label':title});
 const close=()=>{veil.remove();document.removeEventListener('keydown',esc);if(prev&&prev.focus)prev.focus()};
 const esc=e=>{if(e.key==='Escape')close()};
 const fields=build(err);
 const actions=h('div',{class:'actions'},
  opts.onDelete?h('button',{type:'button',class:'btn btn-danger left',onclick:()=>{if(opts.onDelete(err)!==false)close()}},opts.deleteLabel||'Excluir'):null,
  h('button',{type:'button',class:'btn btn-ghost',onclick:close},'Cancelar'),
  h('button',{type:'submit',class:'btn btn-primary'},opts.submit||'Salvar'));
 form.append(h('h2',null,title),fields,err,actions);
 form.addEventListener('submit',e=>{e.preventDefault();err.style.display='none';
  const r=opts.onSubmit(new FormData(form),m=>{err.textContent=m;err.style.display='block'});
  if(r!==false)close()});
 const veil=h('div',{class:'veil',onmousedown:e=>{if(e.target===veil)close()}},form);
 document.body.append(veil);document.addEventListener('keydown',esc);
 const f=form.querySelector('input,select,textarea');if(f)f.focus();
}
const field=(label,input)=>{const id='f'+uid();(input.querySelector&&input.querySelector('button.ds-select-btn')||input).id=id;return h('div',{class:'field'},h('label',{for:id},label),input)};
const toneSwatches=(cur)=>{const inp=h('input',{type:'hidden',name:'tone',value:cur});
 const box=h('div',{class:'swatches',role:'group','aria-label':'Cor'},inp,TONES.map(t=>{
  const b=h('button',{type:'button',class:'sw tone-'+t,'aria-label':TONE_NAME[t],'aria-pressed':String(t===cur),onclick:()=>{inp.value=t;box.querySelectorAll('.sw').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}});return b}));
 return h('div',{class:'field'},h('span',{class:'muted',style:'font-weight:600;color:var(--text);font-size:14px'},'Cor'),box)};


/* ---------- componentes do DS: Select, Tabs, Upload ---------- */
const CHEV='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
function dropdown({name,value,options,label,onchange,small,placeholder}){
 let cur=value,menu=null,act=0;
 const hid=name?h('input',{type:'hidden',name,value:cur==null?'':cur}):null;
 const lab=h('span',null);
 const btn=h('button',{type:'button',class:'ds-select-btn','aria-haspopup':'listbox','aria-expanded':'false','aria-label':label||null});
 btn.append(lab);btn.insertAdjacentHTML('beforeend',CHEV);
 const wrap=h('div',{class:'ds-select'+(small?' ds-select-sm':'')},hid,btn);
 const text=()=>{const o=options.find(x=>x[0]===cur);lab.textContent=o?o[1]:(placeholder||'Selecione');lab.className=o?'':'ph'};text();
 const place=()=>{if(!menu)return;const r=btn.getBoundingClientRect();menu.style.minWidth=Math.max(r.width,small?150:0)+'px';menu.style.left=Math.min(r.left,innerWidth-menu.offsetWidth-8)+'px';
  if(innerHeight-r.bottom<menu.offsetHeight+16&&r.top>innerHeight-r.bottom){menu.style.top='auto';menu.style.bottom=(innerHeight-r.top+6)+'px'}else{menu.style.bottom='auto';menu.style.top=(r.bottom+6)+'px'}};
 const mark=()=>{[...menu.children].forEach((li,i)=>li.setAttribute('data-active',String(i===act)));btn.setAttribute('aria-activedescendant',menu.children[act].id);const el=menu.children[act];if(el.offsetTop<menu.scrollTop)menu.scrollTop=el.offsetTop-6;else if(el.offsetTop+el.offsetHeight>menu.scrollTop+menu.clientHeight)menu.scrollTop=el.offsetTop+el.offsetHeight-menu.clientHeight+6};
 const outside=e=>{if(menu&&!menu.contains(e.target)&&!btn.contains(e.target))close()};
 const away=e=>{if(menu&&!menu.contains(e.target))place()};
 function close(focus){if(!menu)return;menu.remove();menu=null;btn.setAttribute('aria-expanded','false');btn.removeAttribute('aria-activedescendant');
  document.removeEventListener('mousedown',outside,true);window.removeEventListener('scroll',away,true);window.removeEventListener('resize',close);if(focus)btn.focus()}
 function pick(v){cur=v;if(hid)hid.value=v;text();close(true);if(onchange)onchange(v)}
 function open(){if(menu)return;const pid='o'+uid();act=Math.max(0,options.findIndex(x=>x[0]===cur));
  menu=h('ul',{class:'ds-menu',role:'listbox','aria-label':label||'Opções',id:pid},options.map(([v,l],i)=>h('li',{class:'ds-option',role:'option',id:pid+'-'+i,'aria-selected':String(v===cur),onmousedown:e=>{e.preventDefault();pick(v)},onmousemove:()=>{act=i;mark()}},l)));
  document.body.append(menu);btn.setAttribute('aria-expanded','true');place();mark();
  document.addEventListener('mousedown',outside,true);window.addEventListener('scroll',away,true);window.addEventListener('resize',close)}
 btn.addEventListener('click',()=>menu?close():open());
 btn.addEventListener('keydown',e=>{
  if(!menu){if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();open()}return}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true)}
  else if(e.key==='ArrowDown'){e.preventDefault();act=(act+1)%options.length;mark()}
  else if(e.key==='ArrowUp'){e.preventDefault();act=(act-1+options.length)%options.length;mark()}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(options[act][0])}
  else if(e.key==='Tab')close()});
 btn.addEventListener('blur',()=>setTimeout(()=>{if(menu&&document.activeElement!==btn)close()},120));
 return wrap}
function tabs(items,cur,label,onSelect){
 const idOf=t=>'tab-'+t.id;
 const list=h('div',{class:'ds-tabs',role:'tablist','aria-label':label},items.map((t,i)=>h('button',{type:'button',class:'ds-tab',role:'tab',id:idOf(t),'aria-selected':String(t.id===cur),tabindex:t.id===cur?'0':'-1',
  onclick:()=>onSelect(t.id,idOf(t)),
  onkeydown:e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();const n=items[(i+d+items.length)%items.length];onSelect(n.id,idOf(n))}},t.name,t.count!=null?[' ',h('small',null,t.count)]:null)));
 const arrow=(dir)=>h('button',{type:'button',class:'tab-arrow',hidden:true,tabindex:'-1','aria-label':dir<0?'Ver abas anteriores':'Ver próximas abas',html:ICONS.chev,style:dir<0?'transform:rotate(180deg)':null,
  onclick:()=>list.scrollBy({left:dir*Math.max(160,list.clientWidth*.6),behavior:'smooth'})});
 const prev=arrow(-1),next=arrow(1);
 const update=()=>{prev.hidden=list.scrollLeft<=1;next.hidden=list.scrollLeft+list.clientWidth>=list.scrollWidth-1};
 list.addEventListener('scroll',update,{passive:true});
 requestAnimationFrame(()=>{
  const sel=list.querySelector('[aria-selected="true"]');
  if(sel){if(sel.offsetLeft<list.scrollLeft)list.scrollLeft=sel.offsetLeft-8;else if(sel.offsetLeft+sel.offsetWidth>list.scrollLeft+list.clientWidth)list.scrollLeft=sel.offsetLeft+sel.offsetWidth-list.clientWidth+8}
  update();
  if(window.ResizeObserver)new ResizeObserver(update).observe(list)});
 return h('div',{class:'ds-tabs-wrap'},prev,list,next)}
function shrink(file,max=480){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',0.82))};
 im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Não foi possível ler a imagem.'))};im.src=u})}
function shrinkUrl(src,max=480){return new Promise((res,rej)=>{const im=new Image();
 im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',0.82))};
 im.onerror=()=>rej(new Error('Não foi possível ler a foto do site.'));im.src=src})}
async function fetchLinkImage(url){
 const r=await api('/api/link-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
 return shrinkUrl(r.image)}
function adjustPhoto(src,done,cancel){
 const im=new Image(),st={z:1,x:50,y:50};
 const frame=h('div',{class:'adj-frame'}),pic=h('img',{alt:'Prévia da foto',draggable:'false'});frame.append(pic);
 const geo=()=>{const W=frame.clientWidth||320,H=W*3/4,s=Math.max(W/im.naturalWidth,H/im.naturalHeight)*st.z,w=im.naturalWidth*s,hh=im.naturalHeight*s;
  return{W,H,w,h:hh,l:w<=W?(W-w)/2:-(w-W)*st.x/100,t:hh<=H?(H-hh)/2:-(hh-H)*st.y/100}};
 const draw=()=>{if(!im.naturalWidth)return;const g=geo();Object.assign(pic.style,{width:g.w+'px',height:g.h+'px',left:g.l+'px',top:g.t+'px'})};
 const sl=(label,key,min,max,step)=>{const inp=h('input',{type:'range',min:String(min),max:String(max),step:String(step),value:String(st[key]),'aria-label':label,oninput:()=>{st[key]=+inp.value;draw()}});
  return h('label',{class:'adj-row'},h('span',null,label),inp)};
 const sZ=sl('Zoom','z',0.5,3,0.05),sX=sl('Horizontal','x',0,100,1),sY=sl('Vertical','y',0,100,1);
 const sync=()=>{sZ.querySelector('input').value=st.z;sX.querySelector('input').value=st.x;sY.querySelector('input').value=st.y};
 let drag=null;
 frame.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:st.x,py:st.y};frame.setPointerCapture(e.pointerId)});
 frame.addEventListener('pointermove',e=>{if(!drag)return;const g=geo();
  if(g.w>g.W)st.x=Math.min(100,Math.max(0,drag.px-(e.clientX-drag.x)/(g.w-g.W)*100));
  if(g.h>g.H)st.y=Math.min(100,Math.max(0,drag.py-(e.clientY-drag.y)/(g.h-g.H)*100));sync();draw()});
 frame.addEventListener('pointerup',()=>{drag=null});
 const apply=()=>{const g=geo(),f=640/g.W,c=document.createElement('canvas');c.width=640;c.height=480;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,640,480);x.drawImage(im,g.l*f,g.t*f,g.w*f,g.h*f);done(c.toDataURL('image/jpeg',0.85))};
 im.onload=()=>{pic.src=src;draw()};im.src=src;pic.src=src;
 const box=h('div',{class:'adj'},h('p',{class:'ds-hint',style:'margin:0'},'Arraste a foto ou use os controles. O recorte tem o formato do card (4:3).'),frame,sZ,sX,sY,
  h('div',{class:'row'},h('button',{type:'button',class:'btn btn-primary btn-sm',onclick:apply},'Aplicar'),h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:cancel},'Cancelar')));
 setTimeout(draw,0);return box}
function uploadField(label,state,alt,fail){
 const thumb=h('div',{class:'ds-upload-thumb'}),file=h('input',{type:'file',accept:'image/*',style:'display:none','aria-label':label}),
  pick=h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>file.click()}),
  rm=h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>{state.img='';draw()}},'Remover foto'),
  adj=h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>{ed.replaceChildren(adjustPhoto(state.img,v=>{state.img=v;ed.replaceChildren();draw()},()=>ed.replaceChildren()))}},'Ajustar foto'),
  ed=h('div');
 const draw=()=>{thumb.replaceChildren();if(state.img)thumb.append(h('img',{src:state.img,alt:alt||'Foto do item'}));else thumb.append('▢');
  pick.textContent=state.img?'Trocar foto':'Escolher foto';rm.style.display=state.img?'':'none';adj.style.display=state.img?'':'none'};
 file.addEventListener('change',async()=>{const f=file.files[0];if(!f)return;try{state.img=await shrink(f)}catch(e){fail&&fail(e.message)}draw()});
 draw();state.redraw=draw;
 return h('div',{class:'ds-field'},h('span',{class:'ds-label',style:'font-size:14px;font-weight:600'},label),h('div',{class:'ds-upload'},thumb,h('div',{class:'row'},pick,adj,rm,file),),ed,h('span',{class:'ds-hint'},'JPG ou PNG. A foto é reduzida antes de salvar.'))}

/* ---------- helpers de UI ---------- */
const prog=(v,t)=>h('div',{class:'prog-row'},h('div',{class:'prog',role:'progressbar','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(pct(v,t))},h('i',{style:'width:'+pct(v,t)+'%'})),h('span',null,pct(v,t)+'%'));
const head=(eyebrow,titleNodes,actions)=>h('div',{class:'head'},h('div',null,h('div',{class:'eyebrow'},eyebrow),h('h1',null,titleNodes)),actions?h('div',{class:'row'},actions):null);
const checkbox=(on,label,fn)=>h('input',{type:'checkbox',class:'check',checked:on,'aria-label':label,onchange:fn});
const xbtn=(label,fn)=>h('button',{type:'button',class:'icon-btn','aria-label':label,onclick:fn,html:ICONS.x});
const normUrl=u=>{u=(u||'').trim();if(!u)return'';if(!/^https?:\/\//i.test(u))u='https://'+u;try{const x=new URL(u);return/^https?:$/.test(x.protocol)?x.href:''}catch(e){return''}};
const toNum=v=>{const s=String(v||'').trim().replace(/\./g,'').replace(',','.');if(!s)return null;const n=Number(s);return isFinite(n)&&n>=0?n:NaN};
let refocus=null;
function rerender(focusId){refocus=focusId||null;route(true)}

/* ---------- Início ---------- */
function viewInicio(){
 const now=new Date(),hr=now.getHours();
 const hi=hr<12?'Bom dia':hr<18?'Boa tarde':'Boa noite';
 const tk=S.planner.tasks.filter(t=>t.date===todayIso());
 const gAll=S.goals.items,gDone=gAll.filter(g=>goalPct(g)===100).length;
 const wl=S.wishlist.items.filter(i=>!i.done),wlSum=wl.reduce((a,i)=>a+(i.price||0),0);
 const exs=S.study.exams,topics=exs.flatMap(e=>e.subjects.flatMap(s=>s.topics)),tDone=topics.filter(t=>t.d).length;
 const next=exs.filter(e=>e.date&&daysLeft(e)>=0).sort((a,b)=>daysLeft(a)-daysLeft(b))[0],left=next?daysLeft(next):null;
 const wk=weekMinutes();
 const card=(href,title,body)=>h('a',{class:'card',href:'#'+href},h('div',{class:'row',style:'justify-content:space-between'},h('h2',null,title),h('span',{class:'icon-btn',html:ICONS.chev,'aria-hidden':'true'})),body);
 return h('div',{class:'page'},
  head(fmt({weekday:'long',day:'numeric',month:'long'}).format(now),ME&&ME.name?[hi+', ',h('em',null,ME.name)]:[hi]),
  h('h2',{class:'bar'},'Resumo'),
  h('div',{class:'grid'},
   card('planner','Hoje',h('div',null,h('div',{class:'big'},tk.filter(t=>!t.done).length),h('p',{class:'muted',style:'margin:6px 0 0'},tk.length?'Feitas: '+tk.filter(t=>t.done).length+' de '+tk.length:'Nenhuma tarefa para hoje'))),
   card('objetivos','Objetivos',h('div',{style:'display:flex;flex-direction:column;gap:10px'},h('div',{class:'big'},gDone+'/'+gAll.length),h('p',{class:'muted',style:'margin:0'},'objetivos concluídos'),prog(gDone,gAll.length))),
   card('wishlists','Wishlists',h('div',null,h('div',{class:'big'},wl.length),h('p',{class:'muted',style:'margin:6px 0 0'},wl.length?'desejos · '+brl.format(wlSum)+' estimados':'Nenhum desejo ainda'))),
   card('concurso','Concurso',h('div',{style:'display:flex;flex-direction:column;gap:10px'},h('div',{class:'big'},left==null?'—':left),h('p',{class:'muted',style:'margin:0'},left==null?'Defina a data de uma prova':next.name+': '+(left===0?'a prova é hoje':left===1?'dia para a prova':'dias para a prova')),prog(tDone,topics.length))))
  ,
  h('div',{class:'row muted',style:'justify-content:space-between'},h('span',null,ME?ME.email:''),h('span',{class:'row'},h('a',{href:'/api/export',download:'meu-espaco-backup.json'},'Baixar backup'),h('button',{type:'button',class:'linkbtn',onclick:logout},'Sair'))),
  tk.length?h('div',{class:'card'},h('h3',null,'Tarefas de hoje'),tk.map(t=>h('div',{class:'li'+(t.done?' done':'')},checkbox(t.done,'Concluir '+t.text,e=>{t.done=e.target.checked;save('planner');rerender()}),h('span',{class:'t'},t.text)))):null);
}
function goalPct(g){return g.steps.length?pct(g.steps.filter(s=>s.d).length,g.steps.length):(g.done?100:0)}

/* ---------- Wishlists ---------- */
let wlNote='',wlBusy=false;
async function bulkImages(items){
 const todo=items.filter(i=>i.link&&!i.img);if(!todo.length||wlBusy){wlNote=wlBusy?'':'Nenhum desejo com link e sem foto nesta categoria.';rerender();return}
 wlBusy=true;let ok=0;
 for(let n=0;n<todo.length;n++){wlNote='Buscando fotos… '+(n+1)+' de '+todo.length;rerender();
  try{todo[n].img=await fetchLinkImage(todo[n].link);ok++;save('wishlist')}catch(e){}}
 wlBusy=false;wlNote=ok+' de '+todo.length+(todo.length===1?' foto encontrada.':' fotos encontradas.')+(ok<todo.length?' As outras lojas não informam foto. Escolha manualmente no botão de editar.':'');rerender()}
let wlFilter='all',wlShowDone=true,wlView='cartoes',seededMsg='';
const SEED_ID='eletros-2026-11';
const SEED=[
 ['Cozinha','Geladeira','Brastemp BRE58FK Frost Free Inverse 479 L Inox',6939],
 ['Cozinha','Fogão','Brastemp BFS5VCE 5 bocas, mesa de vidro',2250],
 ['Cozinha','Micro-ondas','LG MS3032 30 L',800],
 ['Cozinha','Liquidificador','Philips Walita RI2240',300],
 ['Cozinha','Mixer','Oster ou Philips Walita',200],
 ['Cozinha','Sanduicheira','Mondial ou Britânia',120],
 ['Cozinha','Air fryer','Electrolux 12 L Digital EAF86',550],
 ['Cozinha','Cafeteira programável','Electrolux ECM30',350],
 ['Cozinha','Purificador de água','Electrolux PE11B',500],
 ['Lavanderia e limpeza','Lava e seca','LG Smart VC4 12 kg CV5012WC4',4179],
 ['Lavanderia e limpeza','Aspirador de pó vertical sem fio','Electrolux Ergorapido ERG25B',700],
 ['Lavanderia e limpeza','Ferro de passar','Philips Walita Azur',250],
 ['Sala e outros','TV 50" 4K','LG 50AU801C0SA',2208],
 ['Sala e outros','Roteador mesh','Kit 2 un. Intelbras Twibi Force AX 1500',540],
 ['Sala e outros','Secador de cabelo','Taiff Fox Íon',350]];
function migrateCats(W){
 if(W.seeds.includes('cats-4'))return;
 W.cats=W.cats.filter(c=>!(['livros','viagens'].includes(c.name.trim().toLowerCase())&&!W.items.some(i=>i.cat===c.id)));
 for(const[n,t]of[['Casa','mint'],['Moda','pink'],['Beleza','peach'],['Tecnologia','neutral']])if(!W.cats.some(c=>c.name.trim().toLowerCase()===n.toLowerCase()))W.cats.push({id:uid(),name:n,tone:t});
 W.seeds.push('cats-4');save('wishlist')}
function migrateFocus(){
 const F=S.planner&&S.planner.focus;if(!F||typeof F!=='object')return;let ch=false;
 for(const k of Object.keys(F)){const d=parse(k);if(d.getDay()===1){const nk=iso(addDays(d,-1));if(!F[nk])F[nk]=F[k];delete F[k];ch=true}}
 if(ch)save('planner')}
function migrateStudy(){
 const X=S.study;if(isArr(X.exams))return;
 const old={name:(X.exam&&X.exam.name)||'',date:(X.exam&&X.exam.date)||'',weeklyHours:Number(X.weeklyHours)||10,subjects:isArr(X.subjects)?X.subjects:[],log:isArr(X.log)?X.log:[]};
 const fresh=defaults().study.exams;
 fresh[0]=Object.assign(fresh[0],{date:old.date,weeklyHours:old.weeklyHours,subjects:old.subjects,log:old.log});
 S.study={exams:fresh};save('study')}
function migrateBox(W){
 if(W.seeds.includes('box-1'))return;
 for(const c of W.cats)if(['casa','tecnologia'].includes(c.name.trim().toLowerCase()))c.box=true;
 W.seeds.push('box-1');save('wishlist')}
function migrateModa(W){
 if(W.seeds.includes('moda-3'))return;
 const cat=W.cats.find(c=>c.name.trim().toLowerCase()==='moda');if(!cat)return;
 const novos=[
  ['Bolsa Kiara média couro croco cabernet','Look My Bag',799.92,'https://www.lookmybag.com.br/kiara-media-couro-croco-cabernet-kiamcrocab','/img/moda-1.png'],
  ['Bolsa feminina couro textura croco rosa','Jorge Bischoff',418.99,'https://www.dafiti.com.br/Bolsa-Feminina-Jorge-Bischoff-Couro-Textura-Croco-Rosa-15369052.html','/img/moda-2.jpg'],
  ['Bolsa feminina detalhe metálico dourado branca','Jorge Bischoff',499.99,'https://www.dafiti.com.br/Bolsa-Feminina-Jorge-Bischoff-Detalhe-Metalico-Dourado-Branca-15029204.html','/img/moda-3.jpg'],
  ['Óculos de sol cat eye marrom','Ray-Ban',677.99,'https://www.dafiti.com.br/Oculos-de-Sol-Ray-Ban-Cat-Eye-Marrom-15414463.html','/img/moda-4.jpg'],
  ['Bolsa de ombro média couro antique azul corrente dourada','Corello',469.9,'https://www.corello.com.br/produto/bolsa-de-ombro-media-couro-antique-azul-corrente-frontal-dourada-159002','/img/moda-5.jpg']];
 for(const[name,brand,price,link,img]of novos){
  let it=W.items.find(i=>i.link===link);
  if(it){if(it.price==null)it.price=price;if(!it.img)it.img=img}
  else{it={id:uid(),cat:cat.id,name,brand,room:'',price,link,img,prio:'media',note:'',done:false,box:true};W.items.push(it)}
 }
 W.seeds.push('moda-3');save('wishlist')}
function applyMigrations(){
 migrateStudy();migrateFocus();
 const W=S.wishlist;if(!isArr(W.cats))W.cats=defaults().wishlist.cats;if(!isArr(W.items))W.items=[];if(!isArr(W.seeds))W.seeds=[];if(!isArr(W.deposits))W.deposits=[];
 migrateCats(W);migrateBox(W);migrateModa(W);
 if(W.seeds.includes(SEED_ID)||!canSeed)return false;
 let cat=W.cats.find(c=>c.name.trim().toLowerCase()==='casa');
 if(!cat){cat={id:uid(),name:'Casa',tone:'mint'};W.cats.unshift(cat)}
 let added=0,merged=0;
 for(const[room,name,brand,price]of SEED){
  const ex=W.items.find(i=>i.cat===cat.id&&i.name.trim().toLowerCase()===name.toLowerCase());
  if(ex){if(!ex.brand)ex.brand=brand;if(!ex.room)ex.room=room;if(ex.price==null)ex.price=price;merged++;continue}
  W.items.push({id:uid(),cat:cat.id,name,brand,room,price,link:'',prio:'media',note:'',done:false});added++}
 if(!cat.note)cat.note='Preços estimados em novembro/2026; podem mudar na Black Friday.';
 W.seeds.push(SEED_ID);wlFilter=cat.id;wlView='cartoes';
 if(added)seededMsg=added+' itens adicionados à categoria Casa'+(merged?(merged===1?' (1 já existia e foi mantido).':' ('+merged+' já existiam e foram mantidos).'):'.');
 save('wishlist');return true}
function itemModal(it){
 const cats=S.wishlist.cats;if(!cats.length){modal('Sem categorias',()=>h('p',null,'Crie uma categoria antes de adicionar desejos.'),{onSubmit:()=>true,submit:'Ok'});return}
 const isNew=!it;it=it||{id:uid(),cat:wlFilter!=='all'?wlFilter:cats[0].id,name:'',brand:'',room:'',price:null,link:'',img:'',prio:'media',note:'',done:false};
 const st={img:it.img||''};
 let curCat=it.cat,subVal=it.room||'';
 const subsOf=c=>[...new Set(S.wishlist.items.filter(i=>i.cat===c).map(i=>i.room).filter(Boolean))];
 const newSub=h('input',{class:'inp',name:'room_new',placeholder:'Nome da nova subcategoria',maxLength:60,autocomplete:'off'});
 const subHost=h('div',{style:'display:flex;flex-direction:column;gap:8px;min-width:0'});
 const drawSub=()=>{const subs=subsOf(curCat);if(subVal&&subVal!=='__new'&&!subs.includes(subVal))subs.push(subVal);
  newSub.hidden=subVal!=='__new';
  subHost.replaceChildren(field('Subcategoria',dropdown({name:'room',value:subVal,label:'Subcategoria',options:[['','Sem subcategoria'],...subs.map(x=>[x,x]),['__new','+ Nova subcategoria…']],
   onchange:v=>{subVal=v;newSub.hidden=v!=='__new';if(v==='__new')newSub.focus()}})),newSub)};
 drawSub();
 const catHasBox=id=>!!(cats.find(c=>c.id===id)||{}).box;
 const boxWrap=h('div',null,h('label',{class:'row',style:'gap:8px;font-size:14px;font-weight:600;cursor:pointer'},h('input',{type:'checkbox',class:'check',name:'box',value:'sim',checked:it.box!==false}),'Usar a caixinha para este desejo'));
 boxWrap.hidden=!catHasBox(it.cat);
 const modalErr=m=>{const e=document.querySelector('.modal .err');if(e){e.textContent=m;e.style.display='block'}};
 const fetchBtn=h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:async()=>{
  const link=normUrl((document.querySelector('.modal [name=link]')||{}).value);
  if(!link){modalErr('Cole o link do produto antes de buscar a foto.');return}
  fetchBtn.disabled=true;fetchBtn.textContent='Buscando a foto…';
  try{st.img=await fetchLinkImage(link);st.redraw&&st.redraw();const e=document.querySelector('.modal .err');if(e)e.style.display='none'}
  catch(e){modalErr(e.message)}
  finally{fetchBtn.disabled=false;fetchBtn.textContent='Buscar foto pelo link'}}},'Buscar foto pelo link');
 modal(isNew?'Novo desejo':'Editar desejo',()=>h('div',{style:'display:flex;flex-direction:column;gap:16px'},
  field('Item',h('input',{class:'inp',name:'name',value:it.name,placeholder:'Ex.: Luminária de mesa',maxLength:120,autocomplete:'off'})),
  field('Marca/modelo',h('input',{class:'inp',name:'brand',value:it.brand||'',maxLength:140,autocomplete:'off'})),
  h('div',{class:'form-grid'},
   subHost,
   field('Preço estimado (R$)',h('input',{class:'inp',name:'price',value:it.price==null?'':String(it.price).replace('.',','),placeholder:'0,00',autocomplete:'off'})),
   h('label',{class:'row',style:'gap:8px;font-size:14px;font-weight:600;align-self:flex-end;min-height:44px;cursor:pointer'},h('input',{type:'checkbox',class:'check',name:'done',value:'sim',checked:it.done}),'Comprei?')),
  h('div',{class:'form-grid'},
   field('Categoria',dropdown({name:'cat',value:it.cat,label:'Categoria',options:cats.map(c=>[c.id,c.name]),onchange:v=>{boxWrap.hidden=!catHasBox(v);curCat=v;subVal='';drawSub()}})),
   field('Prioridade',dropdown({name:'prio',value:it.prio,label:'Prioridade',options:[['alta','Alta'],['media','Média'],['baixa','Baixa']]}))),
  boxWrap,
  field('Link do produto',h('input',{class:'inp',name:'link',value:it.link,placeholder:'https://',autocomplete:'off'})),
  h('div',{class:'row'},fetchBtn),
  uploadField('Foto do produto',st,it.name,m=>{const e=document.querySelector('.modal .err');if(e){e.textContent=m;e.style.display='block'}}),
  field('Observação',h('textarea',{class:'inp',name:'note',maxLength:400},it.note||''))),{
  onSubmit(fd,fail){const name=String(fd.get('name')).trim();if(!name){fail('Escreva o nome do item.');return false}
   const price=toNum(fd.get('price'));if(Number.isNaN(price)){fail('Preço inválido. Use números, como 129,90.');return false}
   const raw=String(fd.get('link')).trim(),link=normUrl(raw);if(raw&&!link){fail('Link inválido. Cole o endereço completo da loja.');return false}
   Object.assign(it,{name,brand:String(fd.get('brand')).trim(),room:(fd.get('room')==='__new'?String(fd.get('room_new')||''):String(fd.get('room')||'')).trim().slice(0,60),cat:fd.get('cat'),prio:fd.get('prio'),price,link,img:st.img,note:String(fd.get('note')).trim(),done:fd.get('done')==='sim',box:catHasBox(fd.get('cat'))?fd.get('box')==='sim':true});
   if(isNew)S.wishlist.items.push(it);save('wishlist');rerender()},
  onDelete:isNew?null:()=>{S.wishlist.items=S.wishlist.items.filter(x=>x.id!==it.id);save('wishlist');rerender()},
  submit:isNew?'Adicionar':'Salvar'});
}
function catModal(c){
 const isNew=!c;c=c||{id:uid(),name:'',tone:'mint',note:''};
 modal(isNew?'Nova categoria':'Editar categoria',()=>h('div',{style:'display:flex;flex-direction:column;gap:16px'},
  field('Nome',h('input',{class:'inp',name:'name',value:c.name,maxLength:40,autocomplete:'off'})),toneSwatches(c.tone),
  field('Observação da categoria',h('textarea',{class:'inp',name:'note',maxLength:300},c.note||''))),{
  onSubmit(fd,fail){const name=String(fd.get('name')).trim();if(!name){fail('Escreva o nome da categoria.');return false}
   c.name=name;c.tone=fd.get('tone');c.note=String(fd.get('note')).trim();if(isNew)S.wishlist.cats.push(c);save('wishlist');rerender()},
  onDelete:isNew?null:(err)=>{if(S.wishlist.items.some(i=>i.cat===c.id)||S.wishlist.deposits.some(d=>d.cat===c.id)){err.textContent='Mova ou exclua os desejos e os valores da caixinha desta categoria antes de excluí-la.';err.style.display='block';return false}
   S.wishlist.cats=S.wishlist.cats.filter(x=>x.id!==c.id);if(wlFilter===c.id)wlFilter='all';save('wishlist');rerender()},
  submit:isNew?'Criar':'Salvar'});
}
const PRIO={alta:['Alta','peach'],media:['Média','warn'],baixa:['Baixa','']};
const num=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function wlTable(items){
 const rooms=[];items.forEach(i=>{const r=i.room||'Sem subcategoria';if(!rooms.includes(r))rooms.push(r)});
 const rows=[...items].sort((a,b)=>rooms.indexOf(a.room||'Sem subcategoria')-rooms.indexOf(b.room||'Sem subcategoria'));
 const total=items.reduce((a,i)=>a+(i.price||0),0),missing=items.filter(i=>!i.done).reduce((a,i)=>a+(i.price||0),0);
 const th=(t,c)=>h('th',{scope:'col',class:c||''},t);
 return h('div',{style:'display:flex;flex-direction:column;gap:var(--space-5)'},
  h('div',{class:'tbl-wrap',tabindex:'0',role:'region','aria-label':'Tabela de itens'},h('table',{class:'tbl'},
   h('thead',null,h('tr',null,th('Item'),th('Marca/modelo'),th('Subcategoria'),th('Preço estimado (R$)','num'),th('Comprei?'),h('th',{scope:'col'},h('span',{class:'sr'},'Ações')))),
   h('tbody',null,rows.map(i=>h('tr',{class:i.done?'done':''},
    h('td',{style:'font-weight:700'},i.img?h('img',{class:'thumb',src:i.img,alt:''}):null,i.name,i.link?[' ',h('a',{href:i.link,target:'_blank',rel:'noopener noreferrer',style:'font-weight:600;font-size:13px','aria-label':'Abrir '+i.name+' na loja'},'Loja')]:null),h('td',null,i.brand||'—'),h('td',null,i.room||'—'),
    h('td',{class:'num'},i.price!=null?num.format(i.price):'—'),
    h('td',null,checkbox(i.done,'Comprei '+i.name,e=>{i.done=e.target.checked;save('wishlist');rerender()})),
    h('td',null,h('button',{class:'icon-btn','aria-label':'Editar '+i.name,onclick:()=>itemModal(i),html:ICONS.edit}))))))),
  h('div',{class:'tbl-wrap',style:'max-width:560px'},h('table',{class:'tbl',style:'min-width:0'},
   h('caption',{class:'sr'},'Subtotal por subcategoria'),
   h('thead',null,h('tr',null,th('Subcategoria'),th('Itens','num'),th('Subtotal (R$)','num'))),
   h('tbody',null,rooms.map(r=>{const g=items.filter(i=>(i.room||'Sem subcategoria')===r);return h('tr',null,h('td',null,r),h('td',{class:'num'},g.length),h('td',{class:'num'},num.format(g.reduce((a,i)=>a+(i.price||0),0))))})),
   h('tfoot',null,h('tr',null,h('td',null,'Total geral'),h('td',{class:'num'},items.length),h('td',{class:'num'},num.format(total)))))),
  h('div',{class:'row'},h('span',{class:'badge'},'Total geral: '+brl.format(total)),h('span',{class:'badge peach'},'Falta comprar: '+brl.format(missing))));
}

/* ---------- ilustrações dos cards sem foto ---------- */
const PH_PATHS={
 geladeira:'<rect x="14" y="5" width="20" height="38" rx="3"/><path d="M14 20h20M18 11v5M18 26v8"/>',
 fogao:'<rect x="8" y="8" width="32" height="34" rx="3"/><path d="M8 18h32"/><circle cx="18" cy="13" r="1.6"/><circle cx="24" cy="13" r="1.6"/><circle cx="30" cy="13" r="1.6"/><rect x="14" y="24" width="20" height="12" rx="1.5"/>',
 microondas:'<rect x="5" y="12" width="38" height="24" rx="3"/><rect x="10" y="17" width="20" height="14" rx="1.5"/><path d="M35 18v0M35 24h3M35 29h3"/>',
 liquidificador:'<path d="M14 6h20l-3 24H17z"/><path d="M13 6h22M18 30v6h12v-6M16 42h16"/>',
 sanduicheira:'<path d="M6 28c0-6 8-10 18-10s18 4 18 10v4H6z"/><path d="M6 32h36v4a2 2 0 01-2 2H8a2 2 0 01-2-2zM14 24h20"/>',
 airfryer:'<path d="M10 12a4 4 0 014-4h20a4 4 0 014 4v22a4 4 0 01-4 4H14a4 4 0 01-4-4z"/><circle cx="24" cy="23" r="7"/><path d="M18 42h12"/>',
 cafeteira:'<path d="M12 8h22v10H12zM15 18v18h16V18M31 22h4a3 3 0 010 8h-4M12 42h24"/>',
 purificador:'<rect x="13" y="5" width="22" height="38" rx="4"/><path d="M19 15h10M24 24c-3 4-4 6-4 8a4 4 0 008 0c0-2-1-4-4-8z"/>',
 lavadora:'<rect x="9" y="5" width="30" height="38" rx="3"/><circle cx="24" cy="26" r="9"/><path d="M14 11h4M22 11h2M17 26c3-3 6 3 9 0"/>',
 aspirador:'<path d="M30 6h6v22a8 8 0 01-8 8h-2"/><rect x="12" y="30" width="16" height="12" rx="3"/><circle cx="20" cy="36" r="2"/>',
 ferro:'<path d="M5 34h38c0-10-8-18-18-18h-6c-8 0-14 6-14 18zM5 34v4h38v-4M15 24h10"/>',
 tv:'<rect x="4" y="9" width="40" height="26" rx="3"/><path d="M16 42h16M24 35v7"/>',
 roteador:'<rect x="7" y="28" width="34" height="12" rx="3"/><path d="M14 34h0M20 34h0M13 22a16 16 0 0122 0M17 17a10 10 0 0114 0"/>',
 secador:'<path d="M6 14a8 8 0 018-8h14a8 8 0 010 16H14a8 8 0 01-8-8zM30 20l4 22h-8l-2-16"/>',
 presente:'<rect x="7" y="18" width="34" height="9" rx="2"/><path d="M10 27v14h28V27M24 18v23M24 18c-4-8-12-6-9-1M24 18c4-8 12-6 9-1"/>'
};
const PH_RULES=[[/geladeira|refrigerador|freezer/,'geladeira'],[/fog[aã]o|cooktop|forno/,'fogao'],[/micro-?ondas/,'microondas'],[/liquidificador|mixer|batedeira|processador/,'liquidificador'],
 [/sanduicheira|torradeira|grill/,'sanduicheira'],[/air ?fryer|fritadeira/,'airfryer'],[/cafeteira|caf[eé]/,'cafeteira'],[/purificador|filtro|bebedouro/,'purificador'],
 [/lava|seca|lavadora|m[aá]quina de lavar/,'lavadora'],[/aspirador/,'aspirador'],[/ferro|passar/,'ferro'],[/\btv\b|televis/,'tv'],[/roteador|wi-?fi|mesh/,'roteador'],[/secador|chapinha|cabelo/,'secador']];
function phArt(name){const n=String(name||'').toLowerCase();const r=PH_RULES.find(([re])=>re.test(n));
 return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">'+PH_PATHS[r?r[1]:'presente']+'</svg>'}
function wlCard(i,cname){
 const c=cname(i.cat),[pl,pc]=PRIO[i.prio]||PRIO.media;
 const fl=(k,v)=>h('div',{style:'display:flex;flex-direction:column;gap:2px;min-width:0'},h('span',{class:'muted',style:'font-size:12px;font-weight:700'},k),v);
 return h('article',{class:'tile tone-'+c.tone+(i.done?' tile-done':'')},
  h('div',{class:'tile-media'},
   i.img?h('img',{class:'tile-img',src:i.img,alt:i.name}):h('div',{class:'tile-ph',html:phArt(i.name+' '+(i.brand||'')),'aria-hidden':'true'}),
   h('div',{class:'tile-badges'},h('span',{class:'badge badge-cat'},c.name),i.room?h('span',{class:'badge badge-sub'},i.room):null)),
  h('div',{class:'tile-body'},
   fl('Item',h('h3',{class:'tile-title',style:'margin:0'},i.name)),
   fl('Marca/modelo',h('span',{style:'overflow-wrap:anywhere'},i.brand||'—')),
   fl('Preço estimado (R$)',h('strong',null,i.price!=null?num.format(i.price):'—')),
   h('div',{class:'row'},h('span',{class:'badge '+pc},'Prioridade '+pl.toLowerCase())),
   i.note?h('p',{class:'muted',style:'margin:0;overflow-wrap:anywhere'},i.note):null,
   i.link?h('a',{class:'link-ico',href:i.link,target:'_blank',rel:'noopener noreferrer'},h('span',{html:ICONS.link,'aria-hidden':'true'}),'Abrir produto'):h('button',{type:'button',class:'btn btn-ghost btn-sm',style:'align-self:flex-start',onclick:()=>linkModal(i)},'+ Adicionar link')),
  h('div',{class:'tile-foot'},
   h('label',{class:'row',style:'gap:8px;font-size:14px;font-weight:600;cursor:pointer'},
    checkbox(i.done,'Comprei '+i.name,e=>{i.done=e.target.checked;save('wishlist');rerender()}),'Comprei?'),
   h('span',{class:'sp'}),h('button',{class:'icon-btn','aria-label':'Editar '+i.name,onclick:()=>itemModal(i),html:ICONS.edit}),h('button',{class:'icon-btn','aria-label':'Excluir '+i.name,onclick:()=>delItem(i),html:ICONS.trash})))}
function linkModal(i){
 modal('Link do produto',()=>field('Endereço da loja',h('input',{class:'inp',name:'link',value:i.link||'',placeholder:'https://',autocomplete:'off',inputmode:'url'})),{
  onSubmit(fd,fail){const raw=String(fd.get('link')).trim(),link=normUrl(raw);if(!link){fail('Cole o endereço completo da loja, como https://loja.com/produto.');return false}
   i.link=link;save('wishlist');rerender();
   if(!i.img)fetchLinkImage(link).then(img=>{if(!i.img&&i.link===link){i.img=img;save('wishlist');rerender()}}).catch(()=>{})},submit:'Salvar link'})}
function delItem(i){
 modal('Excluir desejo?',()=>h('p',{style:'margin:0'},'“'+i.name+'” será removido da lista.'),{submit:'Excluir',onSubmit:()=>{S.wishlist.items=S.wishlist.items.filter(x=>x.id!==i.id);save('wishlist');rerender()}})}
function wlCards(items,cname){
 const rooms=[];items.forEach(i=>{const r=i.room||'Sem subcategoria';if(!rooms.includes(r))rooms.push(r)});
 const total=items.reduce((a,i)=>a+(i.price||0),0);
 return h('div',{style:'display:flex;flex-direction:column;gap:var(--space-6)'},
  rooms.map(r=>{const g=items.filter(i=>(i.room||'Sem subcategoria')===r);
   return h('section',{'aria-label':r,style:'display:flex;flex-direction:column;gap:var(--space-3)'},
    h('div',{class:'row'},h('h2',{style:'margin:0;font-size:20px'},r),h('span',{class:'badge'},g.length+(g.length===1?' item':' itens')),h('span',{class:'badge'},'Subtotal '+brl.format(g.reduce((a,i)=>a+(i.price||0),0)))),
    h('div',{class:'grid grid-sm'},g.map(i=>wlCard(i,cname))))}),
  h('div',{class:'grid'},h('button',{class:'new',onclick:()=>itemModal()},'+ Novo desejo')),
  items.length?h('div',{class:'row'},h('span',{class:'badge'},'Total geral: '+brl.format(total))):null)}
function depositModal(c){
 modal('Adicionar à caixinha',()=>h('div',{style:'display:flex;flex-direction:column;gap:16px'},
  field('Valor (R$)',h('input',{class:'inp',name:'amount',placeholder:'0,00',autocomplete:'off',inputmode:'decimal'})),
  field('Data',h('input',{class:'inp',type:'date',name:'date',value:todayIso()})),
  field('Observação (opcional)',h('input',{class:'inp',name:'note',maxLength:80,autocomplete:'off',placeholder:'Ex.: 13º salário'}))),{
  onSubmit(fd,fail){const v=toNum(fd.get('amount'));
   if(v==null||Number.isNaN(v)||v<=0){fail('Digite um valor maior que zero, como 150,00.');return false}
   if(v>1e9){fail('Esse valor é alto demais.');return false}
   S.wishlist.deposits.push({id:uid(),cat:c.id,date:String(fd.get('date')||'')||todayIso(),amount:v,note:String(fd.get('note')).trim()});
   save('wishlist');rerender()},submit:'Adicionar'})}
function catTotals(all,c){
 const sum=l=>l.reduce((a,i)=>a+(i.price||0),0),missing=all.filter(i=>!i.done);
 const stat=(k,v,sub,cls)=>h('div',{class:'stat'+(cls?' '+cls:'')},h('span',{class:'stat-k'},k),h('strong',{class:'stat-v'},v),h('span',{class:'stat-s'},sub));
 const stats=[stat('Total geral estimado',brl.format(sum(all)),all.length+(all.length===1?' item':' itens'),'main'),
  stat('Falta comprar',brl.format(sum(missing)),missing.length+(missing.length===1?' item':' itens'))];
 if(!c.box)return h('section',{class:'stats','aria-label':'Totais de '+c.name},stats);
 const deps=S.wishlist.deposits.filter(d=>d.cat===c.id),saved=deps.reduce((a,d)=>a+d.amount,0);
 const boxed=missing.filter(i=>i.box!==false),pending=sum(boxed);
 stats.push(stat('Na caixinha',brl.format(saved),pending?pct(Math.min(saved,pending),pending)+'% do que a caixinha cobre':'nenhum item pendente na caixinha'));
 const list=[...deps].sort((x,y)=>y.date.localeCompare(x.date));
 return h('div',{style:'display:flex;flex-direction:column;gap:var(--space-4)'},
  h('section',{class:'stats','aria-label':'Totais de '+c.name},stats),
  h('section',{class:'card','aria-label':'Caixinha de '+c.name},
   h('div',{class:'row',style:'justify-content:space-between'},h('h3',null,'Caixinha · '+c.name),h('button',{type:'button',class:'btn btn-primary btn-sm',onclick:()=>depositModal(c)},'+ Adicionar dinheiro')),
   prog(Math.min(saved,pending),pending),
   h('p',{class:'muted',style:'margin:0'},!pending?'Nenhum item pendente usa a caixinha. Ative a opção ao criar ou editar um desejo.':saved>=pending?'Você já juntou o suficiente para os '+boxed.length+(boxed.length===1?' item':' itens')+' da caixinha.':'Faltam '+brl.format(pending-saved)+' para cobrir '+boxed.length+(boxed.length===1?' item':' itens')+' da caixinha ('+brl.format(pending)+').'),
   list.length?h('div',{class:'dep-list'},list.map(d=>h('div',{class:'li'},h('span',{class:'t'},fmt({day:'numeric',month:'short',year:'numeric'}).format(parse(d.date))+' · ',h('strong',null,brl.format(d.amount)),d.note?' · '+d.note:''),
    h('span',{class:'acts'},xbtn('Remover depósito de '+brl.format(d.amount),()=>{S.wishlist.deposits=S.wishlist.deposits.filter(x=>x.id!==d.id);save('wishlist');rerender()}))))):h('p',{class:'empty'},'Nenhum valor adicionado ainda.')))}
function viewWishlists(){
 const W=S.wishlist;if(wlFilter==='all'||!W.cats.some(c=>c.id===wlFilter))wlFilter=(W.cats[0]||{}).id||'all';
 const cname=id=>(W.cats.find(c=>c.id===id)||{name:'Sem categoria',tone:'neutral'});
 let items=W.items.filter(i=>wlFilter==='all'||i.cat===wlFilter);
 if(!wlShowDone)items=items.filter(i=>!i.done);
 const order={alta:0,media:1,baixa:2};
 const cardItems=[...items].sort((a,b)=>(a.done-b.done)||(order[a.prio]-order[b.prio]));
 const pend=items.filter(i=>!i.done),sum=pend.reduce((a,i)=>a+(i.price||0),0);
 const count=id=>W.items.filter(i=>(id==='all'||i.cat===id)&&!i.done).length;
 const cur=W.cats.find(c=>c.id===wlFilter);
 return h('div',{class:'page'},
  head('Lista de desejos',['Minhas ',h('em',null,'wishlists')],[h('button',{class:'btn btn-ghost',onclick:()=>catModal()},'+ Categoria'),h('button',{class:'btn btn-primary',onclick:()=>itemModal()},'+ Novo desejo')]),
  wlNote?h('p',{class:'callout',role:'status'},wlNote):null,
  h('div',{class:'hd-row'},tabs(W.cats.map(c=>({id:c.id,name:c.name,count:count(c.id)})),wlFilter,'Categorias',(id,fid)=>{wlFilter=id;rerender(fid)}),
   cur?h('button',{class:'icon-btn','aria-label':'Editar categoria '+cur.name,onclick:()=>catModal(cur),html:ICONS.edit}):null),
  cur?catTotals(W.items.filter(i=>i.cat===cur.id),cur):null,
  h('div',{class:'row'},
   h('button',{class:'chip',disabled:wlBusy,onclick:()=>bulkImages(W.items.filter(i=>i.cat===wlFilter))},wlBusy?'Buscando…':'Buscar fotos dos links'),
   h('div',{class:'row',role:'group','aria-label':'Visualização'},
    h('button',{class:'chip','aria-pressed':String(wlView==='tabela'),onclick:()=>{wlView='tabela';rerender()}},'Tabela'),
    h('button',{class:'chip','aria-pressed':String(wlView==='cartoes'),onclick:()=>{wlView='cartoes';rerender()}},'Cartões')),
   
   h('label',{class:'row',style:'margin-left:auto;font-size:14px;font-weight:600;gap:8px'},h('input',{type:'checkbox',class:'check',checked:wlShowDone,onchange:e=>{wlShowDone=e.target.checked;rerender()}}),'Mostrar comprados')),
  wlView==='tabela'?(items.length?wlTable(items):null):
  wlCards(cardItems,cname),
  !items.length?h('p',{class:'empty'},'Nada aqui ainda. Adicione o primeiro desejo e organize por categoria.'):null,
  cur&&cur.note?h('p',{class:'muted',style:'margin:0'},cur.note):null);
}

/* ---------- Objetivos ---------- */
const expanded=new Set();
let goalArea=null;
function viewObjetivos(){
 const G=S.goals,all=G.items,done=all.filter(g=>goalPct(g)===100).length;
 if(!G.areas.some(a=>a.id===goalArea))goalArea=(G.areas[0]||{}).id;
 const a=G.areas.find(x=>x.id===goalArea);
 const gs=a?all.filter(g=>g.area===a.id):[];
 const inpId='ng-'+(a?a.id:'x');
 const addGoal=()=>{const el=document.getElementById(inpId),v=el.value.trim();if(!v)return;G.items.push({id:uid(),area:a.id,title:v,due:'',done:false,steps:[]});save('goals');rerender(inpId)};
 return h('div',{class:'page'},
  head('Vision board',['Meus ',h('em',null,'objetivos')]),
  h('div',{class:'row'},h('span',{class:'badge'},done+' de '+all.length+' concluídos')),
  tabs(G.areas.map(x=>({id:x.id,name:x.name,count:all.filter(g=>g.area===x.id).length})),goalArea,'Áreas dos objetivos',(id,fid)=>{goalArea=id;rerender(fid)}),
  a?h('section',{class:'tile tone-'+a.tone,style:'min-width:0;max-width:720px','aria-label':a.name},
   h('div',{class:'tile-top'},h('span',null,a.name),h('span',null,gs.filter(g=>goalPct(g)===100).length+'/'+gs.length)),
   h('div',{class:'tile-body',style:'gap:var(--space-3)'},
    gs.length?null:h('p',{class:'empty'},'Sem objetivos nesta área.'),
    gs.map(g=>goalNode(g)),
    h('div',{class:'add'},h('input',{class:'inp',id:inpId,placeholder:'Novo objetivo',maxLength:140,autocomplete:'off','aria-label':'Novo objetivo em '+a.name,onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();addGoal()}}}),h('button',{class:'btn btn-ghost',onclick:addGoal},'Adicionar')))):null);
}
function goalNode(g){
 const open=expanded.has(g.id),p=goalPct(g);
 const stepInp='ns-'+g.id;
 const addStep=()=>{const el=document.getElementById(stepInp),v=el.value.trim();if(!v)return;g.steps.push({id:uid(),t:v,d:false});save('goals');rerender(stepInp)};
 return h('div',{style:'border-top:1px solid var(--line);padding-top:var(--space-3)'},
  h('div',{class:'li'+(p===100?' done':''),style:'align-items:center'},
   g.steps.length?h('span',{class:'badge'+(p===100?'':' peach'),style:'min-width:44px;justify-content:center'},p+'%'):checkbox(g.done,'Concluir '+g.title,e=>{g.done=e.target.checked;save('goals');rerender()}),
   h('span',{class:'t'},g.title),
   h('button',{class:'icon-btn','aria-expanded':String(open),'aria-label':(open?'Fechar':'Abrir')+' detalhes de '+g.title,onclick:()=>{open?expanded.delete(g.id):expanded.add(g.id);rerender()},html:ICONS.chev,style:'transform:rotate('+(open?90:0)+'deg)'})),
  open?h('div',{style:'display:flex;flex-direction:column;gap:var(--space-2);padding:var(--space-2) 0 0 var(--space-5)'},
   g.steps.length?prog(g.steps.filter(s=>s.d).length,g.steps.length):null,
   g.steps.map(s=>h('div',{class:'li'+(s.d?' done':'')},checkbox(s.d,'Concluir etapa '+s.t,e=>{s.d=e.target.checked;save('goals');rerender()}),h('span',{class:'t'},s.t),
    h('span',{class:'acts'},xbtn('Remover etapa '+s.t,()=>{g.steps=g.steps.filter(x=>x.id!==s.id);save('goals');rerender()})))),
   h('div',{class:'add'},h('input',{class:'inp',id:stepInp,placeholder:'Nova etapa',maxLength:140,autocomplete:'off','aria-label':'Nova etapa',onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();addStep()}}}),h('button',{class:'btn btn-ghost',onclick:addStep},'Etapa')),
   h('div',{class:'row'},h('label',{style:'font-size:13px;font-weight:600',for:'due-'+g.id},'Prazo'),
    h('input',{class:'inp',id:'due-'+g.id,type:'month',value:g.due||'',style:'width:auto;min-height:36px;border-radius:var(--radius-pill);font-size:14px',onchange:e=>{g.due=e.target.value;save('goals')}}),
    h('button',{class:'btn btn-danger',style:'min-height:36px;margin-left:auto;font-size:13px',onclick:()=>modal('Excluir objetivo?',()=>h('p',{style:'margin:0'},'“'+g.title+'” e suas etapas serão removidos.'),{submit:'Excluir',onSubmit:()=>{S.goals.items=S.goals.items.filter(x=>x.id!==g.id);save('goals');rerender()}})},'Excluir'))):null);
}

/* ---------- Planner semanal ---------- */
let weekStart=sunday(new Date()),calOpen=false,calMonth=new Date(weekStart.getFullYear(),weekStart.getMonth(),1);
const dm=d=>pad(d.getDate())+'/'+pad(d.getMonth()+1);
let calOff=null;
function calStop(){if(calOff){const f=calOff;calOff=null;f()}}
function calWatch(){
 if(calOff||!calOpen)return;
 const close=()=>{calOpen=false;calStop();rerender()};
 const away=e=>{if(!e.target.closest('.cal-pop,[data-cal-btn]'))close()};
 const esc=e=>{if(e.key==='Escape')close()};
 document.addEventListener('mousedown',away,true);document.addEventListener('keydown',esc);
 calOff=()=>{document.removeEventListener('mousedown',away,true);document.removeEventListener('keydown',esc)}}
function calendarPanel(P){
 const first=calMonth,start=sunday(first),ws=iso(weekStart),we=iso(addDays(weekStart,6)),t=todayIso();
 const withTasks=new Set(P.tasks.map(x=>x.date));
 const go=n=>{calMonth=new Date(first.getFullYear(),first.getMonth()+n,1);rerender()};
 return h('section',{class:'card cal cal-pop',role:'dialog','aria-label':'Calendário'},
  h('div',{class:'row',style:'justify-content:space-between;flex-wrap:nowrap'},
   h('button',{type:'button',class:'icon-btn','aria-label':'Mês anterior',onclick:()=>go(-1),html:ICONS.chev,style:'transform:rotate(180deg)'}),
   h('strong',{class:'cal-title'},fmt({month:'long',year:'numeric'}).format(first)),
   h('button',{type:'button',class:'icon-btn','aria-label':'Próximo mês',onclick:()=>go(1),html:ICONS.chev})),
  h('div',{class:'cal-grid'},
   ['D','S','T','Q','Q','S','S'].map((w,i)=>h('span',{class:'cal-h','aria-hidden':'true'},w)),
   Array.from({length:42},(_,i)=>addDays(start,i)).map(d=>{const k=iso(d),inWeek=k>=ws&&k<=we;
    return h('button',{type:'button',disabled:d.getDay()!==0,class:'cal-d'+(d.getMonth()!==first.getMonth()?' out':'')+(k===t?' today':'')+(inWeek?' sel':''),'aria-pressed':String(inWeek),
     'aria-label':d.getDay()===0?'Semana de '+dm(d)+' a '+dm(addDays(d,6)):fmt({weekday:'long',day:'numeric',month:'long'}).format(d)+' (escolha o domingo da semana)',
     onclick:()=>{weekStart=sunday(d);calMonth=new Date(d.getFullYear(),d.getMonth(),1);calOpen=false;calStop();rerender()}},d.getDate(),withTasks.has(k)?h('i',{class:'cal-dot'}):null)})),
  ws!==iso(sunday(new Date()))?h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>{weekStart=sunday(new Date());calMonth=new Date(weekStart.getFullYear(),weekStart.getMonth(),1);calOpen=false;calStop();rerender()}},'Ir para esta semana'):null)}
function moveTaskModal(t){
 modal('Mudar data da tarefa',()=>h('div',{style:'display:flex;flex-direction:column;gap:16px'},
  h('p',{style:'margin:0;overflow-wrap:anywhere'},t.text),
  field('Nova data',h('input',{class:'inp',type:'date',name:'date',value:t.date}))),{
  onSubmit(fd,fail){const v=String(fd.get('date')||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){fail('Escolha uma data.');return false}
   t.date=v;weekStart=sunday(parse(v));save('planner');rerender()},submit:'Mudar data'})}
const WD=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
function weekMinutes(ex){const s=iso(sunday(new Date())),e=iso(addDays(sunday(new Date()),6));return (ex?ex.log:S.study.exams.flatMap(x=>x.log)).filter(l=>l.date>=s&&l.date<=e).reduce((a,l)=>a+l.min,0)}
function viewPlanner(){
 if(calOpen)setTimeout(calWatch,0);
 const P=S.planner,ws=iso(weekStart),we=addDays(weekStart,6),isThis=ws===iso(sunday(new Date()));
 const range=fmt({day:'numeric',month:'short'}).format(weekStart)+' – '+fmt({day:'numeric',month:'short',year:'numeric'}).format(we);
 const wkTasks=P.tasks.filter(t=>t.date>=ws&&t.date<=iso(we));
 return h('div',{class:'page'},
  head(range,['Planner ',h('em',null,'semanal')],[h('div',{class:'cal-anchor'},
   h('button',{class:'btn btn-ghost','aria-label':'Semana anterior',onclick:()=>{weekStart=addDays(weekStart,-7);rerender()}},'‹'),
   h('button',{class:'btn btn-ghost','data-cal-btn':true,'aria-expanded':String(calOpen),'aria-haspopup':'dialog',onclick:()=>{calOpen=!calOpen;calStop();calMonth=new Date(weekStart.getFullYear(),weekStart.getMonth(),1);rerender()}},isThis?'Esta semana':dm(weekStart)+' a '+dm(we)),
   h('button',{class:'btn btn-ghost','aria-label':'Próxima semana',onclick:()=>{weekStart=addDays(weekStart,7);rerender()}},'›'),
   calOpen?calendarPanel(P):null)]),
  h('div',{class:'row',style:'align-items:flex-start;gap:var(--space-5)'},
   h('div',{class:'postit'},h('label',{for:'focus'},'Foco da semana'),h('textarea',{id:'focus',rows:3,placeholder:'O que mais importa nesta semana?',maxLength:200,oninput:e=>{P.focus[ws]=e.target.value;save('planner')}},P.focus[ws]||'')),
   h('div',{style:'flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px;padding-top:8px'},h('span',{class:'muted',style:'font-weight:700'},'Tarefas feitas: '+wkTasks.filter(t=>t.done).length+' de '+wkTasks.length),prog(wkTasks.filter(t=>t.done).length,wkTasks.length))),
  h('div',{class:'week'},WD.map((w,i)=>{
   const d=addDays(weekStart,i),k=iso(d),ts=P.tasks.filter(t=>t.date===k),inpId='nt-'+k;
   const add=()=>{const el=document.getElementById(inpId),v=el.value.trim();if(!v)return;P.tasks.push({id:uid(),date:k,text:v,done:false});save('planner');rerender(inpId)};
   return h('section',{class:'day'+(k===todayIso()?' today':''),'aria-label':w+' '+d.getDate()},
    h('div',{class:'day-h'},h('span',{class:'day-n'},d.getDate()),h('span',{class:'day-w'},w)),
    ts.length?null:h('p',{class:'empty'},'Livre'),
    ts.map(t=>h('div',{class:'li'+(t.done?' done':'')},checkbox(t.done,'Concluir '+t.text,e=>{t.done=e.target.checked;save('planner');rerender()}),h('span',{class:'t'},t.text),
     h('span',{class:'acts'},
      h('button',{class:'icon-btn','aria-label':'Mudar a data de '+t.text,onclick:()=>moveTaskModal(t),html:ICONS.planner}),
      h('button',{class:'icon-btn','aria-label':'Mover '+t.text+' para o dia seguinte',onclick:()=>{t.date=iso(addDays(d,1));save('planner');rerender()},html:ICONS.next}),
      xbtn('Remover '+t.text,()=>{P.tasks=P.tasks.filter(x=>x.id!==t.id);save('planner');rerender()})))),
    h('div',{class:'add'},h('input',{class:'inp',id:inpId,placeholder:'Nova tarefa',maxLength:140,autocomplete:'off','aria-label':'Adicionar tarefa em '+w+' '+d.getDate(),onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();add()}}}),h('button',{class:'btn btn-ghost','aria-label':'Adicionar',onclick:add},'+')))}))
 );
}

/* ---------- Concurso ---------- */
const SUGGEST=['Língua Portuguesa','Matemática e Raciocínio Lógico','Informática','Atualidades','Direito Constitucional','Direito Administrativo','Direito Civil','Direito Processual Civil','Direito Penal','Direito Processual Penal'];
let examSel=null;
const daysLeft=e=>e.date?Math.ceil((parse(e.date)-parse(todayIso()))/864e5):null;
const goTop=()=>{window.scrollTo(0,0);const m=$('#main');if(m)m.scrollTop=0};
function viewConcurso(){
 const e=S.study.exams.find(x=>x.id===examSel);
 if(!e)examSel=null;
 return e?viewExam(e):viewExamList()}
function examCard(e){
 const topics=e.subjects.flatMap(s=>s.topics),tDone=topics.filter(t=>t.d).length,left=daysLeft(e),wk=weekMinutes(e);
 return h('button',{type:'button',class:'card exam-card',onclick:()=>{examSel=e.id;rerender();goTop()}},
  h('div',{class:'row',style:'justify-content:space-between;flex-wrap:nowrap'},h('h2',null,e.name||'Sem nome'),h('span',{class:'icon-btn','aria-hidden':'true',html:ICONS.chev})),
  h('div',{style:'display:flex;flex-direction:column;gap:10px'},
   h('div',{class:'big'},left==null?'—':left<0?'Feito':left),
   h('p',{class:'muted',style:'margin:0'},left==null?'Defina a data da prova':left<0?'prova já realizada':left===0?'a prova é hoje':left===1?'dia para a prova':'dias para a prova'),
   prog(tDone,topics.length),
   h('p',{class:'muted',style:'margin:0'},tDone+' de '+topics.length+' tópicos · '+e.subjects.length+(e.subjects.length===1?' matéria':' matérias'))))}
function viewExamList(){
 return h('div',{class:'page'},
  head('Estudos para concurso',['Meus ',h('em',null,'concursos')]),
  h('p',{class:'muted',style:'margin:0'},'Escolha um concurso para ver as matérias, os tópicos e o registro de estudo.'),
  h('div',{class:'grid',style:'grid-template-columns:repeat(auto-fill,minmax(280px,1fr))'},S.study.exams.map(examCard)))}
function viewExam(X){
 const subs=X.subjects,topics=subs.flatMap(s=>s.topics),tDone=topics.filter(t=>t.d).length;
 const left=daysLeft(X);
 const wk=weekMinutes(X),goalMin=Math.round((Number(X.weeklyHours)||0)*60);
 const logSubj=subs;
 const addSubj=name=>{name=name.trim();if(!name||subs.some(s=>s.name.toLowerCase()===name.toLowerCase()))return;subs.push({id:uid(),name,topics:[]});save('study')};
 const subInp='nsub';
 return h('div',{class:'page'},
  head('Concurso',[h('em',null,X.name||'Sem nome')],[h('button',{class:'btn btn-ghost',onclick:()=>{examSel=null;rerender();goTop()}},'‹ Concursos')]),
  h('div',{class:'row'},
   h('span',{class:'badge'},left==null?'Sem data da prova':left<0?'Prova já realizada':left===0?'A prova é hoje':left+(left===1?' dia':' dias')+' para a prova'),
   h('span',{class:'badge'},tDone+' de '+topics.length+' tópicos estudados')),
  h('div',{class:'card'},h('h2',null,'Configuração'),
   h('div',{class:'form-grid'},
    field('Nome do concurso',h('input',{class:'inp',value:X.name,maxLength:80,placeholder:'Ex.: TJSP',autocomplete:'off',onchange:e=>{X.name=e.target.value.trim();save('study');rerender()}})),
    field('Data da prova',h('input',{class:'inp',type:'date',value:X.date,onchange:e=>{X.date=e.target.value;save('study');rerender()}})),
    field('Meta semanal (horas)',h('input',{class:'inp',type:'number',min:'0',max:'100',step:'1',value:String(X.weeklyHours),onchange:e=>{X.weeklyHours=Math.max(0,Number(e.target.value)||0);save('study');rerender()}}))),
   h('div',{style:'display:flex;flex-direction:column;gap:8px'},h('span',{class:'muted',style:'font-weight:700'},'Esta semana: '+(Math.round(wk/6)/10)+' h de '+X.weeklyHours+' h'),prog(wk,goalMin))),
  h('h2',{class:'bar'},'Matérias'),
  subs.length<SUGGEST.length?h('div',{class:'card'},h('h3',null,'Sugestões de matérias'),h('div',{class:'suggest'},SUGGEST.filter(n=>!subs.some(s=>s.name===n)).map(n=>h('button',{class:'chip',onclick:()=>{addSubj(n);rerender()}},'+ '+n)))):null,
  h('div',{class:'grid',style:'grid-template-columns:repeat(auto-fill,minmax(300px,1fr))'},
   subs.map(s=>{const done=s.topics.filter(t=>t.d).length,ti='nt-'+s.id;
    const addT=()=>{const el=document.getElementById(ti),v=el.value.trim();if(!v)return;s.topics.push({id:uid(),t:v,d:false});save('study');rerender(ti)};
    return h('section',{class:'card','aria-label':s.name},
     h('div',{class:'subj-head'},h('h3',null,s.name),h('button',{class:'icon-btn','aria-label':'Excluir matéria '+s.name,onclick:()=>modal('Excluir matéria?',()=>h('p',{style:'margin:0'},'“'+s.name+'” e seus tópicos serão removidos.'),{submit:'Excluir',onSubmit:()=>{X.subjects=X.subjects.filter(x=>x.id!==s.id);save('study');rerender()}}),html:ICONS.x})),
     prog(done,s.topics.length),
     s.topics.length?null:h('p',{class:'empty'},'Adicione os tópicos do edital.'),
     s.topics.map(t=>h('div',{class:'li'+(t.d?' done':'')},checkbox(t.d,'Estudado: '+t.t,e=>{t.d=e.target.checked;save('study');rerender()}),h('span',{class:'t'},t.t),
      h('span',{class:'acts'},xbtn('Remover tópico '+t.t,()=>{s.topics=s.topics.filter(x=>x.id!==t.id);save('study');rerender()})))),
     h('div',{class:'add'},h('input',{class:'inp',id:ti,placeholder:'Novo tópico',maxLength:140,autocomplete:'off','aria-label':'Novo tópico em '+s.name,onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();addT()}}}),h('button',{class:'btn btn-ghost',onclick:addT},'Adicionar')))}),
   h('div',{class:'card',style:'justify-content:center'},h('h3',null,'Nova matéria'),h('div',{class:'add'},h('input',{class:'inp',id:subInp,placeholder:'Nome da matéria',maxLength:60,autocomplete:'off','aria-label':'Nome da nova matéria',onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();const el=document.getElementById(subInp);addSubj(el.value);rerender(subInp)}}}),h('button',{class:'btn btn-ghost',onclick:()=>{addSubj(document.getElementById(subInp).value);rerender(subInp)}},'Adicionar')))),
  h('h2',{class:'bar'},'Registro de estudo'),
  h('div',{class:'card'},
   h('form',{class:'form-grid',onsubmit:e=>{e.preventDefault();const f=new FormData(e.target),min=Math.round(Number(f.get('min')));if(!(min>0)||min>1440)return;
     X.log.unshift({id:uid(),date:f.get('date')||todayIso(),subject:String(f.get('subject')||''),min});save('study');rerender()}},
    field('Matéria',dropdown({name:'subject',value:'',label:'Matéria',options:[['','Geral'],...logSubj.map(s=>[s.name,s.name])]})),
    field('Data',h('input',{class:'inp',type:'date',name:'date',value:todayIso()})),
    field('Minutos',h('input',{class:'inp',type:'number',name:'min',min:'1',max:'1440',placeholder:'60',required:true})),
    h('div',{style:'display:flex;align-items:flex-end'},h('button',{class:'btn btn-primary',type:'submit'},'Registrar'))),
   X.log.length?X.log.slice(0,10).map(l=>h('div',{class:'li'},h('span',{class:'t'},fmt({day:'numeric',month:'short'}).format(parse(l.date))+' · '+(l.subject||'Geral')+' · '+l.min+' min'),
    h('span',{class:'acts'},xbtn('Remover registro',()=>{X.log=X.log.filter(x=>x.id!==l.id);save('study');rerender()})))):h('p',{class:'empty'},'Nenhum estudo registrado ainda.')));
}

/* ---------- rotas ---------- */
const VIEWS={inicio:viewInicio,wishlists:viewWishlists,objetivos:viewObjetivos,planner:viewPlanner,concurso:viewConcurso};
function cur(){const k=location.hash.replace('#','');return VIEWS[k]?k:'inicio'}
function route(keepScroll){
 if(!ME)return;
 if(cur()!=='planner'){calOpen=false;calStop()}
 const k=cur(),main=$('#main'),y=main.scrollTop,wy=window.scrollY;
 for(const[id,sel]of[['nav','#nav'],['bottom','#bottom']]){const el=$(sel);el.textContent='';
  NAV.forEach(([r,l])=>el.append(h('a',{href:'#'+r,'aria-current':r===k?'page':null},ico(r),h('span',null,l))))}
 main.textContent='';
 try{main.append(VIEWS[k]())}catch(e){main.append(h('div',{class:'page'},h('h1',null,'Algo deu errado'),h('p',{class:'err',role:'alert'},String(e&&e.message||e)),h('button',{class:'btn btn-primary',onclick:()=>{try{localStorage.removeItem(LS())}catch(_){}S=defaults();applyMigrations();route()}},'Restaurar modelo inicial neste navegador')))}
 document.title=NAV.find(n=>n[0]===k)[1]+' · Meu Espaço Pessoal';
 if(keepScroll===true){window.scrollTo(0,wy);main.scrollTop=y}else{window.scrollTo(0,0)}
 if(refocus){const e=document.getElementById(refocus);refocus=null;if(e)e.focus()}
}
window.addEventListener('hashchange',()=>route());
setMode(mode);
init();

document.addEventListener('click',e=>{if(e.target.closest('#logout'))logout()});
})();
