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
 sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>',
 link:'<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
 trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
 edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
 chev:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
 next:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
const ico=n=>h('span',{html:ICONS[n],style:'display:contents'});
const NAV=[['inicio','Início'],['wishlists','Wishlists'],['objetivos','Objetivos'],['planner','Planner'],['concurso','Concurso']];
const TONES=['mint','peach','pink','yellow','neutral'];
const TONE_NAME={mint:'Menta',peach:'Verde claro',pink:'Sálvia',yellow:'Lima',neutral:'Neutro'};

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
  tjsp:{topicos:{},revisados:{},registros:[],meta:80},
  inss:{topicos:{},revisados:{},registros:[],meta:80},
  rfb:{topicos:{},revisados:{},registros:[],meta:80,sim:{},simDisc:null},
  study:{exams:EXAMS.map(([id,name])=>({id,name,date:'',weeklyHours:10,subjects:[],log:[]}))},
  board:{items:[]}
 };
}
let S=defaults();
const SECS=['wishlist','goals','planner','study','tjsp','inss','rfb','board'];
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
const validPanel=d=>d.topicos&&typeof d.topicos==='object'&&isArr(d.registros);
const VALID={
 wishlist:d=>isArr(d.cats)&&isArr(d.items),
 goals:d=>isArr(d.areas)&&isArr(d.items),
 planner:d=>isArr(d.tasks)&&d.focus&&typeof d.focus==='object',
 tjsp:validPanel,
 inss:validPanel,
 rfb:validPanel,
 board:d=>isArr(d.items),
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
 greet();
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
function greet(){
 const b=$('#brand');if(!b||!ME)return;
 const hr=new Date().getHours(),hi=hr<12?'Bom dia':hr<18?'Boa tarde':'Boa noite';
 b.replaceChildren(...(ME.name?[hi+', ',h('em',null,ME.name)]:[hi]))}
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
function uploadField(label,state,alt,fail,max){
 const thumb=h('div',{class:'ds-upload-thumb'}),file=h('input',{type:'file',accept:'image/*',style:'display:none','aria-label':label}),
  pick=h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>file.click()}),
  rm=h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>{state.img='';draw()}},'Remover foto'),
  adj=h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>{ed.replaceChildren(adjustPhoto(state.img,v=>{state.img=v;ed.replaceChildren();draw()},()=>ed.replaceChildren()))}},'Ajustar foto'),
  ed=h('div');
 const draw=()=>{thumb.replaceChildren();if(state.img)thumb.append(h('img',{src:state.img,alt:alt||'Foto do item'}));else thumb.append('▢');
  pick.textContent=state.img?'Trocar foto':'Escolher foto';rm.style.display=state.img?'':'none';adj.style.display=state.img?'':'none'};
 file.addEventListener('change',async()=>{const f=file.files[0];if(!f)return;try{state.img=await shrink(f,max)}catch(e){fail&&fail(e.message)}draw()});
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
const BOARD_MAX=4000000;   /* a Vercel aceita pedidos de até 4,5 MB */
const BD_TYPES={image:'Foto',quote:'Frase',note:'Nota'};
let dragId=null;
function boardModal(type,it){
 const isNew=!it;it=it||{id:uid(),type,img:'',text:'',caption:'',tone:'mint'};type=it.type;
 const st={img:it.img||''};
 modal(isNew?'Nova '+BD_TYPES[type].toLowerCase():'Editar '+BD_TYPES[type].toLowerCase(),()=>h('div',{style:'display:flex;flex-direction:column;gap:16px'},
  type==='image'?[uploadField('Foto',st,it.caption,m=>{const e=document.querySelector('.modal .err');if(e){e.textContent=m;e.style.display='block'}},640),
   field('Legenda (opcional)',h('input',{class:'inp',name:'caption',value:it.caption||'',maxLength:120,autocomplete:'off'}))]:
  [field(type==='quote'?'Frase':'Nota',h('textarea',{class:'inp',name:'text',maxLength:type==='quote'?240:600,rows:4,style:'padding-top:10px;min-height:110px'},it.text||'')),toneSwatches(it.tone||'mint')]),{
  onSubmit(fd,fail){
   if(type==='image'){if(!st.img){fail('Escolha uma foto.');return false}it.img=st.img;it.caption=String(fd.get('caption')||'').trim()}
   else{const t=String(fd.get('text')||'').trim();if(!t){fail('Escreva o texto.');return false}it.text=t;it.tone=fd.get('tone')}
   const prev=S.board.items.slice();if(isNew)S.board.items.push(it);
   if(JSON.stringify(S.board).length>BOARD_MAX){S.board.items=prev;fail('O quadro está cheio. Remova alguma foto antes de adicionar outra.');return false}
   save('board');rerender()},
  onDelete:isNew?null:()=>{S.board.items=S.board.items.filter(x=>x.id!==it.id);save('board');rerender()},
  submit:isNew?'Adicionar':'Salvar'});
}
function boardMove(id,toIdx){const a=S.board.items,i=a.findIndex(x=>x.id===id);if(i<0)return;toIdx=Math.max(0,Math.min(a.length-1,toIdx));const[x]=a.splice(i,1);a.splice(toIdx,0,x);save('board');rerender()}
function boardItem(it,i){
 const body=it.type==='image'?[h('img',{class:'bd-img',src:it.img,alt:it.caption||'Imagem do vision board',draggable:'false'}),it.caption?h('p',{class:'bd-cap'},it.caption):null]:
  it.type==='quote'?h('blockquote',{class:'bd-quote'},it.text):h('p',{class:'bd-note'},it.text);
 const el=h('article',{class:'bd tone-'+(it.tone||'mint'),draggable:'true',
  ondragstart:e=>{dragId=it.id;el.classList.add('dragging');try{e.dataTransfer.setData('text/plain',it.id);e.dataTransfer.effectAllowed='move'}catch(_){}},
  ondragend:()=>{dragId=null;el.classList.remove('dragging');document.querySelectorAll('.bd.over').forEach(x=>x.classList.remove('over'))},
  ondragover:e=>{if(dragId&&dragId!==it.id){e.preventDefault();el.classList.add('over')}},
  ondragleave:()=>el.classList.remove('over'),
  ondrop:e=>{e.preventDefault();el.classList.remove('over');if(dragId&&dragId!==it.id)boardMove(dragId,i)}},
  body,
  h('div',{class:'bd-acts'},
   h('button',{type:'button',class:'icon-btn','aria-label':'Mover para antes',onclick:()=>boardMove(it.id,i-1)},'‹'),
   h('button',{type:'button',class:'icon-btn','aria-label':'Mover para depois',onclick:()=>boardMove(it.id,i+1)},'›'),
   h('button',{type:'button',class:'icon-btn','aria-label':'Editar '+BD_TYPES[it.type].toLowerCase(),onclick:()=>boardModal(it.type,it),html:ICONS.edit})));
 return el}
function viewInicio(){
 const items=S.board.items;
 const add=(t,l)=>h('button',{class:'btn '+(t==='image'?'btn-primary':'btn-ghost'),onclick:()=>boardModal(t)},l);
 return h('div',{class:'page'},
  head(fmt({weekday:'long',day:'numeric',month:'long'}).format(new Date()),['Meu vision board'],[add('note','+ Nota'),add('quote','+ Frase'),add('image','+ Foto')]),
  items.length?h('div',{class:'board'},items.map(boardItem)):
  h('div',{class:'bd-empty'},h('p',{style:'margin:0;font-size:18px;color:var(--text);font-weight:600'},'Seu quadro está vazio'),h('p',{style:'margin:0'},'Comece com fotos que inspiram, frases e notas sobre o que você quer construir. Depois arraste para reorganizar.'),
   h('div',{class:'row',style:'justify-content:center'},add('image','+ Foto'),add('quote','+ Frase'),add('note','+ Nota'))),
  h('div',{class:'row muted',style:'justify-content:space-between'},h('span',null,ME?ME.email:''),h('span',{class:'row'},h('a',{href:'/api/export',download:'meu-espaco-backup.json'},'Baixar backup'),h('button',{type:'button',class:'linkbtn',onclick:logout},'Sair'))));
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
   i.room?h('div',{class:'tile-badges'},h('span',{class:'badge badge-sub'},i.room)):null),
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
 return h('div',{style:'display:flex;flex-direction:column;gap:var(--space-6)'},
  rooms.map(r=>{const g=items.filter(i=>(i.room||'Sem subcategoria')===r);
   return h('section',{'aria-label':r,style:'display:flex;flex-direction:column;gap:var(--space-3)'},
    h('div',{class:'row'},h('h2',{style:'margin:0;font-size:20px'},r),h('span',{class:'badge'},g.length+(g.length===1?' item':' itens')),h('span',{class:'badge'},'Subtotal '+brl.format(g.reduce((a,i)=>a+(i.price||0),0)))),
    h('div',{class:'grid grid-sm'},g.map(i=>wlCard(i,cname))))}))}
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
let examSel=null;
const daysLeft=e=>e.date?Math.ceil((parse(e.date)-parse(todayIso()))/864e5):null;
const goTop=()=>{window.scrollTo(0,0);const m=$('#main');if(m)m.scrollTop=0};
function viewConcurso(){
 const e=S.study.exams.find(x=>x.id===examSel&&PANELS[x.id]);
 if(!e)examSel=null;
 return e?viewPanel(e):viewExamList()}
function examCard(e){
 P=PANELS[e.id];
 const g=tjGeral(),left=daysLeft(e);
 return h('button',{type:'button',class:'card exam-card',onclick:()=>{examSel=e.id;tjTab='painel';tjFilter='';rerender();goTop()}},
  h('div',{class:'row',style:'justify-content:space-between;flex-wrap:nowrap'},h('h2',null,e.name||'Sem nome'),h('span',{class:'icon-btn','aria-hidden':'true',html:ICONS.chev})),
  h('div',{style:'display:flex;flex-direction:column;gap:10px'},
   h('div',{class:'big'},left==null?'—':left<0?'Feito':left),
   h('p',{class:'muted',style:'margin:0'},left==null?'Defina a data da prova':left<0?'prova já realizada':left===0?'a prova é hoje':left===1?'dia para a prova':'dias para a prova'),
   prog(g.top,P.topicos),
   h('p',{class:'muted',style:'margin:0'},g.top+' de '+P.topicos+' tópicos · '+P.mats.length+' matérias')))}
function viewExamList(){
 return h('div',{class:'page'},
  head('Estudos para concurso',['Meus ',h('em',null,'concursos')]),
  h('p',{class:'muted',style:'margin:0'},'Escolha um concurso para ver as matérias, os tópicos e o registro de questões.'),
  h('div',{class:'exam-grid'},S.study.exams.filter(e=>PANELS[e.id]).map(examCard)))}

/* ---------- Painéis dos concursos (TJSP, INSS e Receita Federal) ----------
   Cada concurso vira uma configuração com o mesmo formato; as telas são as mesmas para todos.
   Tópico: {nome, ref, selos:[{c,txt,title}], notas:[]} e os dados originais usados nos filtros. */
const NOME_SELO={R:'Receita',I:'INSS',T:'TJSP'};
const selo=(c,txt,title)=>({c,txt,title});
function panel(cfg){
 const mats=cfg.edital.flatMap(b=>b.materias.map(m=>({...m,bloco:b.bloco,blocoNome:b.nome,topicos:m.topicos.map((t,i)=>cfg.topico(t,m.id+'-'+i,m))})));
 return{unidade:['questão','questões'],blocoLabel:b=>'Bloco '+b.bloco,extraTabs:[],fonte:[],...cfg,mats,mat:Object.fromEntries(mats.map(m=>[m.id,m])),topicos:mats.reduce((s,m)=>s+m.topicos.length,0)}}

const TJD=window.TJSP_DATA,PD=window.PAINEIS_DATA;
const PANELS={
 tjsp:panel({id:'tjsp',edital:TJD.EDITAL,total:TJD.TOTAL_Q,curto:TJD.CURTO,
  topico(t,k){
   const o=(TJD.OUTROS[k]||'').split('').filter(Boolean),cai=TJD.CAI_MUITO[k],nota=TJD.NOTA_OUTROS[k],selos=[],notas=[];
   if(cai)selos.push(selo('M','Cai muito','Um dos tópicos que mais caem na prova'));
   for(const x of o)selos.push(selo(x,NOME_SELO[x],'Também cai no edital '+TJD.CONCURSOS[x]+(nota?' · '+nota:'')));
   if(nota)notas.push([nota]);
   if(cai)notas.push([h('b',null,'Nas provas: '),(cai.q?tjQ(cai.q,'questão','questões')+' em '+cai.n+' das 4 provas (2014–2021). ':'')+'Mais cobrado: '+cai.foco]);
   return{nome:t[0],ref:t[1]||'',selos,notas,cai:!!cai,outros:o}},
  filtros:[['M','Cai muito',t=>t.cai],['R','Também na Receita',t=>t.outros.includes('R')],['I','Também no INSS',t=>t.outros.includes('I')]],
  semComum:'Nenhum tópico desta matéria aparece nos editais da Receita Federal ou do INSS.',
  comum(){
   const dir=P.mats.filter(m=>m.bloco==='II'),resto=P.mats.filter(m=>m.bloco!=='II');
   return[
    tjPanel('O que mais cai na prova','tópicos com selo “Cai muito” · clique numa matéria para ver só eles',h('div',{class:'tj-grid2'},
     tjGrupoBox([['M','Cai muito']],'Conhecimentos em Direito','tópicos que mais caem já estudados',dir,'M'),
     tjGrupoBox([['M','Cai muito']],'Português e Conhecimentos Gerais','tópicos que mais caem já estudados',resto,'M'))),
    tjPanel('Também cai na Receita Federal e no INSS','tópicos do TJSP presentes nos últimos editais',h('div',{class:'tj-grid2'},
     tjGrupoBox([['R','Receita']],'Receita Federal','tópicos em comum já estudados',P.mats,'R'),
     tjGrupoBox([['I','INSS']],'INSS','tópicos em comum já estudados',P.mats,'I')))]}}),

 inss:panel({id:'inss',edital:PD.inss.EDITAL,total:PD.inss.TOTAL_Q,curto:PD.inss.CURTO,fonte:PD.inss.FONTE,
  unidade:['item','itens'],blocoLabel:b=>b.bloco,marcaVisiveis:true,
  topico(t){
   const inc={A:'Cai muito',M:'Cai médio',B:'Cai pouco'}[t[2]],o=(t[3]||'').split('').filter(Boolean);
   return{nome:t[0],ref:t[1]||'',selos:[selo(t[2]==='A'?'M':'N',inc,'Incidência em provas anteriores do Cebraspe'),...o.map(x=>selo(x,NOME_SELO[x],'Também cai no edital '+NOME_SELO[x]))],notas:[],inc:t[2],outros:o}},
  filtros:[['tjsp','TJSP',t=>t.outros.includes('T')],['receita','Receita',t=>t.outros.includes('R')],['tres','Nos três',t=>t.outros.includes('T')&&t.outros.includes('R')],['alta','Cai muito',t=>t.inc==='A']],
  notaAcerto:g=>{const certos=Math.round(g.accPond*P.total);return'nota líquida estimada ≈ '+(2*certos-P.total)+' de '+P.total+' (mínimo 36) · base: matérias que valem '+g.pesoPrat+' itens'},
  comum(){return[tjPanel('Vale também para TJSP e Receita','tópicos do INSS que aparecem nos outros editais · clique numa matéria para ver só esses tópicos',h('div',{class:'tj-grid3'},
   tjGrupoBox([['T','TJSP'],['R','Receita']],'Nos três concursos','INSS, TJSP e Receita',P.mats,'tres'),
   tjGrupoBox([['T','TJSP']],'Também no TJSP','Escrevente Técnico Judiciário',P.mats,'tjsp'),
   tjGrupoBox([['R','Receita']],'Também na Receita','Analista-Tributário e Auditor-Fiscal',P.mats,'receita')))]}}),

 receita:panel({id:'rfb',edital:PD.rfb.EDITAL,total:PD.rfb.TOTAL_Q,curto:PD.rfb.CURTO,fonte:PD.rfb.FONTE,
  blocoLabel:b=>'Módulo '+b.bloco,marcaVisiveis:true,estimada:PD.rfb.PROVA_ESTIMADA,
  extraTabs:[{id:'simulado',name:'Simulado',view:()=>rfbSimulado()},{id:'edital',name:'Edital',view:()=>rfbEdital()}],
  topico(t){const o=(t[2]||'').split('').filter(Boolean);
   return{nome:t[0],ref:t[1]||'',selos:o.map(x=>selo(x,NOME_SELO[x],'Também cai no edital '+NOME_SELO[x])),notas:[],outros:o}},
  filtros:[['T','Também no TJSP',t=>t.outros.includes('T')],['I','Também no INSS',t=>t.outros.includes('I')]],
  semComum:'Nenhum tópico desta matéria tem etiqueta de TJSP ou INSS.',
  comum(){
   let tot=0,totF=0;
   const rows=P.mats.map(m=>{
    const idx=m.topicos.map((t,i)=>t.outros.length?i:-1).filter(i=>i>=0);
    if(!idx.length&&!m.tambem)return null;
    const f=idx.filter(i=>tjT().topicos[m.id+'-'+i]).length;tot+=idx.length;totF+=f;
    const tags=[...new Set((m.tambem||idx.map(i=>m.topicos[i].outros.join('')).join('')).split(''))];
    return h('tr',{class:'tj-row',tabindex:'0',onclick:()=>tjGo(m.id),onkeydown:e=>{if(e.key==='Enter')tjGo(m.id)}},
     h('td',{style:'font-weight:700'},m.nome),h('td',null,h('div',{class:'tj-selos'},tags.map(x=>h('span',{class:'tj-selo '+x},NOME_SELO[x])))),
     h('td',{class:'num'},idx.length?String(idx.length):'matéria toda'),h('td',{class:'num'},idx.length?f+'/'+idx.length:'–'))});
   return[tjPanel('Em comum com TJSP e INSS','tópicos da Receita que também caem nesses concursos · clique numa matéria para abrir',
    tjTable(['Matéria','Também cai em',['Tópicos em comum'],['Concluídos']],[rows,h('tr',{class:'tj-bloco'},h('td',null,'Total'),h('td'),h('td',{class:'num'},String(tot)),h('td',{class:'num'},totF+'/'+tot))]))]}})
};

let P=PANELS.tjsp,tjTab='painel',tjFilter='';
const tjT=()=>S[P.id];
const tjPct=x=>x==null||isNaN(x)?'–':Math.round(x*100)+'%';
const tjDate=s=>{if(!s||typeof s!=='string')return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y.slice(2)};
const tjEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tjShort=m=>P.curto[m.id]||m.nome;
const tjGo=(id,f)=>{tjTab=id;tjFilter=f||'';rerender();goTop()};
const tjPill=(cls,txt)=>h('span',{class:'tj-pill '+cls},txt);
function tjQ(n,one,many){return n+' '+(n===1?one:many)}
const tjFiltro=id=>P.filtros.find(f=>f[0]===id);

function tjStatus(acc){
 if(acc==null)return['none','sem questões'];
 const meta=tjT().meta/100;
 return acc>=meta?['good','na meta']:acc>=meta-.15?['warn','atenção']:['bad','abaixo']}
function tjStats(id){
 const m=P.mat[id],T=tjT(),feitos=m.topicos.filter((_,i)=>T.topicos[id+'-'+i]).length;
 let f=0,a=0;for(const r of T.registros)if(r.m===id){f+=r.f;a+=r.a}
 return{feitos,total:m.topicos.length,prog:feitos/m.topicos.length,f,a,acc:f?a/f:null}}
function tjGeral(){
 let prog=0,top=0,f=0,a=0,pesoPrat=0,accPond=0;
 for(const m of P.mats){const s=tjStats(m.id);prog+=s.prog*m.peso;top+=s.feitos;f+=s.f;a+=s.a;if(s.acc!=null){pesoPrat+=m.peso;accPond+=s.acc*m.peso}}
 return{prog:prog/P.total,top,f,a,accPond:pesoPrat?accPond/pesoPrat:null,pesoPrat}}
function tjGrupos(){
 const g={};
 for(const r of tjT().registros){if(!P.mat[r.m])continue;const t=r.t==null||!P.mat[r.m].topicos[r.t]?-1:r.t,k=r.m+'|'+t;(g[k]=g[k]||{m:r.m,t,f:0,a:0});g[k].f+=r.f;g[k].a+=r.a}
 return Object.values(g).map(x=>({...x,e:x.f-x.a,acc:x.a/x.f}))}
const tjByErr=(x,y)=>y.e-x.e||x.acc-y.acc;
const tjTopicName=(m,t)=>t<0?'Vários tópicos / sem tópico definido':P.mat[m].topicos[t].nome;

/* ----- peças visuais ----- */
function tjRank(items,comMateria){
 const max=items[0]?items[0].e:1;
 return h('ol',{class:'tj-rank'},items.map((x,i)=>h('li',null,
  h('button',{type:'button',class:'tj-rank-btn',title:'Abrir '+P.mat[x.m].nome,onclick:()=>tjGo(x.m)},
   h('span',{class:'pos'},String(i+1)),
   h('span',{class:'nm'},x.nome,comMateria?h('small',null,P.mat[x.m].nome):null),
   h('span',{class:'ev'},h('b',null,String(x.e)),' '+(x.e===1?'erro':'erros')+' · '+tjPct(x.acc)+' de acerto')),
  h('span',{class:'tj-rank-bar'},h('i',{style:'width:'+Math.max(4,x.e/max*100).toFixed(0)+'%'})))))}
function tjSelos(t){
 return[t.selos.length?h('div',{class:'tj-selos'},t.selos.map(s=>h('span',{class:'tj-selo '+s.c,title:s.title},s.txt))):null,
  t.notas.map(n=>h('span',{class:'tj-nota'},n))]}
function tjGrupoBox(selos,titulo,legenda,mats,filtro){
 const test=tjFiltro(filtro)[2],T=tjT();let tot=0,feitos=0;const porMat=[];
 for(const m of mats){let n=0,d=0;m.topicos.forEach((t,i)=>{if(test(t)){n++;if(T.topicos[m.id+'-'+i])d++}});if(n){porMat.push({m,n,d});tot+=n;feitos+=d}}
 return h('div',{class:'tj-outro'},
  h('div',{class:'row'},selos.map(([c,l])=>h('span',{class:'tj-selo '+c},l)),h('b',null,titulo)),
  h('div',{class:'tj-big'},String(feitos),h('small',null,' / '+tot)),h('span',{class:'muted',style:'font-size:13px'},legenda),
  prog(feitos,tot),
  h('div',{class:'row'},porMat.map(x=>h('button',{type:'button',class:'chip',title:x.d+' de '+x.n+' estudados',onclick:()=>tjGo(x.m.id,filtro)},tjShort(x.m),' ',h('b',null,String(x.n))))))}
function tjDonut(segs,big,small){
 const R=52,C=2*Math.PI*R;let off=0;
 let s='<svg viewBox="0 0 140 140" width="120" height="120" role="img" aria-label="'+tjEsc(big+' '+small)+'"><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="var(--surface-2)" stroke-width="18"/>';
 for(const g of segs){if(!(g.frac>0))continue;const len=g.frac*C;
  s+='<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="'+g.cor+'" stroke-width="18" stroke-dasharray="'+len.toFixed(2)+' '+(C-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 70 70)"/>';off+=len}
 return s+'<text x="70" y="72" text-anchor="middle" font-size="26" font-weight="600" fill="var(--text)">'+tjEsc(big)+'</text><text x="70" y="91" text-anchor="middle" font-size="11" fill="var(--muted)">'+tjEsc(small)+'</text></svg>'}
function tjChartMat(){
 const T=tjT(),rowH=30,labelW=118,padR=44,W=520,top=22,H=top+P.mats.length*rowH+22,plotW=W-labelW-padR,x=v=>labelW+v*plotW,meta=T.meta/100;
 let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Taxa de acerto por matéria">';
 for(const t of[0,.25,.5,.75,1])s+='<line x1="'+x(t)+'" x2="'+x(t)+'" y1="'+(top-4)+'" y2="'+(H-20)+'" stroke="var(--line)"/><text x="'+x(t)+'" y="'+(H-6)+'" font-size="11" fill="var(--muted)" text-anchor="middle">'+t*100+'%</text>';
 P.mats.forEach((m,i)=>{
  const st=tjStats(m.id),y=top+i*rowH,lab=tjStatus(st.acc)[1];
  s+='<text x="'+(labelW-10)+'" y="'+(y+rowH/2+4)+'" font-size="12.5" fill="var(--text)" text-anchor="end">'+tjEsc(tjShort(m))+'</text>';
  s+='<g data-goto="'+m.id+'" style="cursor:pointer"><title>'+tjEsc(m.nome+(st.f?' · '+st.a+' de '+st.f+' questões · '+tjPct(st.acc)+' · '+lab:' · nenhuma questão registrada'))+'</title><rect x="'+labelW+'" y="'+(y+2)+'" width="'+plotW+'" height="'+(rowH-4)+'" fill="transparent"/>';
  if(st.acc!=null){const w=Math.max(st.acc*plotW,5);
   s+='<rect x="'+labelW+'" y="'+(y+8)+'" width="'+w+'" height="'+(rowH-16)+'" rx="4" fill="var(--primary)"/><text x="'+(x(st.acc)+6)+'" y="'+(y+rowH/2+4)+'" font-size="12" font-weight="700" fill="var(--text)">'+tjPct(st.acc)+'</text>'}
  else s+='<text x="'+(labelW+4)+'" y="'+(y+rowH/2+4)+'" font-size="11.5" fill="var(--muted)">sem questões</text>';
  s+='</g>'});
 s+='<line x1="'+x(meta)+'" x2="'+x(meta)+'" y1="'+(top-8)+'" y2="'+(H-20)+'" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="'+x(meta)+'" y="'+(top-11)+'" font-size="11" font-weight="600" fill="var(--text)" text-anchor="middle">meta '+T.meta+'%</text></svg>';
 return h('div',{class:'tj-chart',html:s,onclick:e=>{const g=e.target.closest('[data-goto]');if(g)tjGo(g.dataset.goto)}})}
function tjChartEvo(regs){
 const porDia={};
 for(const r of regs){(porDia[r.d]=porDia[r.d]||{f:0,a:0});porDia[r.d].f+=r.f;porDia[r.d].a+=r.a}
 const dias=Object.keys(porDia).sort();
 if(!dias.length)return h('p',{class:'empty'},'A linha aparece depois do primeiro registro de questões.');
 let cf=0,ca=0;
 const pts=dias.map(d=>{cf+=porDia[d].f;ca+=porDia[d].a;return{d,f:porDia[d].f,a:porDia[d].a,cum:ca/cf,cf}});
 const W=460,H=240,L=40,R=16,T=18,B=30,pw=W-L-R,ph=H-T-B,x=i=>L+(pts.length===1?pw/2:i*pw/(pts.length-1)),y=v=>T+(1-v)*ph,meta=tjT().meta/100;
 let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Evolução do acerto acumulado">';
 for(const t of[0,.25,.5,.75,1])s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(t)+'" y2="'+y(t)+'" stroke="var(--line)"/><text x="'+(L-6)+'" y="'+(y(t)+4)+'" font-size="11" fill="var(--muted)" text-anchor="end">'+t*100+'%</text>';
 s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(meta)+'" y2="'+y(meta)+'" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="4 3"/>';
 const line=pts.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.cum).toFixed(1)).join(' ');
 if(pts.length>1)s+='<path d="'+line+' L'+x(pts.length-1)+' '+y(0)+' L'+x(0)+' '+y(0)+' Z" fill="var(--tj-good)" opacity=".09"/><path d="'+line+'" fill="none" stroke="var(--tj-good)" stroke-width="2.2" stroke-linejoin="round"/>';
 const step=Math.ceil(pts.length/6);
 pts.forEach((p,i)=>{const last=i===pts.length-1;
  if(i%step===0||last)s+='<text x="'+x(i)+'" y="'+(H-10)+'" font-size="11" fill="var(--muted)" text-anchor="middle">'+tjDate(p.d).slice(0,5)+'</text>';
  s+='<circle cx="'+x(i)+'" cy="'+y(p.cum)+'" r="'+(last?5:3.5)+'" fill="var(--tj-good)" stroke="var(--surface)" stroke-width="2"><title>'+tjEsc(tjDate(p.d)+' · no dia: '+p.a+'/'+p.f+' ('+tjPct(p.a/p.f)+') · acumulado: '+tjPct(p.cum)+' em '+p.cf+' questões')+'</title></circle>'});
 const lp=pts[pts.length-1];
 s+='<text x="'+Math.min(x(pts.length-1),W-R-4)+'" y="'+(y(lp.cum)-10)+'" font-size="12" font-weight="700" fill="var(--text)" text-anchor="end">'+tjPct(lp.cum)+'</text></svg>';
 return h('div',{class:'tj-chart',html:s})}
const tjPanel=(title,sub,...kids)=>h('section',{class:'card tj-panel'},h('div',{class:'tj-ph'},h('h3',null,title),sub?h('span',{class:'muted tj-sub'},sub):null),...kids);
const tjLegend=rows=>h('ul',{class:'tj-legend'},rows.map(([cor,l,v])=>h('li',null,h('span',null,h('i',{style:'background:'+cor}),l),h('b',null,String(v)))));
/* cabeçalhos em lista ([nome]) ficam alinhados à direita, como os números */
const tjTable=(cols,rows)=>h('div',{class:'tbl-wrap'},h('table',{class:'tbl tj-tbl'},h('thead',null,h('tr',null,cols.map(c=>h('th',{scope:'col',class:isArr(c)?'num':null},isArr(c)?c[0]:c)))),h('tbody',null,rows)));
const tjStat=(k,v,sub,cls)=>h('div',{class:'stat'+(cls?' '+cls:'')},h('span',{class:'stat-k'},k),h('strong',{class:'stat-v'},v),h('span',{class:'stat-s'},sub));

/* ----- aba "Painel" ----- */
function tjPainel(){
 const T=tjT(),g=tjGeral();
 const stats=h('section',{class:'stats tj-stats','aria-label':'Resumo'},
  tjStat('Progresso no edital',Math.round(g.prog*100)+'%','ponderado pelo peso','main'),
  tjStat('Tópicos estudados',g.top+' / '+P.topicos,g.top?Math.round(g.top/P.topicos*100)+'% dos tópicos do edital':'nenhum marcado ainda'),
  tjStat('Questões feitas',g.f.toLocaleString('pt-BR'),g.f?g.a.toLocaleString('pt-BR')+' acertos · '+tjPct(g.a/g.f)+' sem ponderar':'nenhuma registrada ainda'),
  tjStat('Acerto ponderado',tjPct(g.accPond),g.accPond==null?'registre questões para calcular':P.notaAcerto?P.notaAcerto(g):'≈ '+Math.round(g.accPond*P.total)+' de '+P.total+' na prova'));

 const charts=h('div',{class:'tj-grid2'},
  tjPanel('Acerto por matéria','clique numa barra para abrir a matéria',T.registros.length?null:h('p',{class:'empty'},'Registre baterias de questões nas abas das matérias para ver as barras.'),tjChartMat()),
  tjPanel('Evolução do acerto','acumulado, por dia',tjChartEvo(T.registros)));

 const grupos=tjGrupos();
 const mats=P.mats.map(m=>{const s=tjStats(m.id);return{m:m.id,nome:m.nome,e:s.f-s.a,acc:s.acc}}).filter(x=>x.e>0).sort(tjByErr);
 const tops=grupos.filter(x=>x.e>0).sort(tjByErr).slice(0,10).map(x=>({...x,nome:tjTopicName(x.m,x.t)}));
 const totalE=mats.reduce((s,x)=>s+x.e,0);
 const erros=tjPanel('Onde você mais erra',totalE?totalE+' erros registrados no total · clique para abrir a matéria':'soma dos erros nas baterias registradas',
  h('div',{class:'tj-stack',style:'gap:var(--space-5)'},
   h('div',null,h('span',{class:'eyebrow'},'Erros por matéria'),mats.length?tjRank(mats,false):h('p',{class:'empty'},'Nenhum erro registrado ainda.')),
   h('div',null,h('span',{class:'eyebrow'},'Tópicos com mais erros no edital'),tops.length?tjRank(tops,true):h('p',{class:'empty'},'Escolha o tópico ao registrar cada bateria para ver aqui os 10 que mais derrubam você.'))));

 const rows=P.edital.map(b=>[
  h('tr',{class:'tj-bloco'},h('td',{colspan:'7'},P.blocoLabel(b)+' · '+b.nome+' · '+b.questoes+' '+P.unidade[1])),
  b.materias.map(({id})=>{const m=P.mat[id],s=tjStats(id),[cls,lab]=tjStatus(s.acc);
   return h('tr',{class:'tj-row',tabindex:'0',onclick:()=>tjGo(id),onkeydown:e=>{if(e.key==='Enter')tjGo(id)}},
    h('td',{style:'font-weight:700'},m.nome),h('td',{class:'num'},String(m.peso)),
    h('td',null,h('span',{class:'tj-mini'},h('i',{style:'width:'+(s.prog*100).toFixed(0)+'%'})),s.feitos+'/'+s.total),
    h('td',{class:'num'},String(s.f)),h('td',{class:'num'},String(s.a)),h('td',{class:'num'},tjPct(s.acc)),h('td',null,tjPill(cls,lab)))})]);
 const quadro=tjPanel('Quadro por matéria','peso = '+P.unidade[1]+' na prova · clique numa matéria para abrir',
  tjTable(['Matéria',['Peso'],'Tópicos',['Questões'],['Acertos'],['Acerto'],'Situação'],rows));
 return h('div',{class:'tj-stack'},stats,charts,erros,P.comum(),quadro)}

/* ----- aba de uma matéria ----- */
function tjMateria(m){
 const T=tjT(),s=tjStats(m.id),[cls,lab]=tjStatus(s.acc),regs=T.registros.filter(r=>r.m===m.id);
 const key=i=>m.id+'-'+i;
 const topicStats=i=>{let f=0,a=0;for(const r of regs)if(r.t===i){f+=r.f;a+=r.a}return{f,a}};
 const toggle=(i,on)=>{const k=key(i);if(on)T.topicos[k]=todayIso();else{delete T.topicos[k];delete T.revisados[k]}save(P.id);rerender()};
 const rev=m.topicos.filter((_,i)=>T.topicos[key(i)]&&T.revisados[key(i)]).length,e=s.f-s.a;
 const hasF=f=>m.topicos.some(f[2]);
 const disponiveis=P.filtros.filter(hasF);
 const ativo=tjFiltro(tjFilter),visible=t=>!ativo||ativo[2](t);
 const marcaveis=m.topicos.map((t,i)=>i).filter(i=>!P.marcaVisiveis||visible(m.topicos[i]));
 const allDone=marcaveis.length>0&&marcaveis.every(i=>T.topicos[key(i)]);
 const filtroBtn=(f,txt)=>h('button',{type:'button',class:'chip tj-chip','aria-pressed':String(tjFilter===f),onclick:()=>{tjFilter=f;rerender()}},txt);

 const itens=m.topicos.map((t,i)=>{
  if(!visible(t))return null;
  const k=key(i),dt=T.topicos[k],rv=T.revisados[k],ts=topicStats(i);
  let txt=dt?'estudado em '+tjDate(dt):'';if(dt&&rv)txt+=' · revisado em '+tjDate(rv);
  const st=ts.f?tjStatus(ts.a/ts.f)[0]:'';
  return h('li',{class:dt?'done':''},
   h('label',{class:'tj-topic'},checkbox(!!dt,'Estudado: '+t.nome,ev=>toggle(i,ev.target.checked)),
    h('span',{class:'tj-tbody'},
     h('span',{class:'tj-tname'},t.nome),t.ref?h('span',{class:'tj-ref'},t.ref):null,tjSelos(t),
     txt?h('span',{class:'tj-date'},txt):null,
     ts.f?h('span',{class:'tj-tq '+st},ts.a+'/'+ts.f+' questões · '+tjPct(ts.a/ts.f)+' · '+tjQ(ts.f-ts.a,'erro','erros')):null)),
   dt?h('button',{type:'button',class:'btn btn-ghost btn-sm','aria-pressed':String(!!rv),onclick:()=>{if(rv)delete T.revisados[k];else T.revisados[k]=todayIso();save(P.id);rerender()}},rv?'Revisado ✓':'Revisar'):null)});
 const topics=itens.some(Boolean)?h('ul',{class:'tj-topics'},itens):h('p',{class:'empty'},'Nenhum tópico desta matéria entra nesse filtro.');

 const errBox=h('p',{class:'err',role:'alert',style:'display:none'});
 const topicOpts=[['','Vários tópicos / matéria toda'],...m.topicos.map((t,i)=>{const q=topicStats(i);return[String(i),(i+1)+'. '+t.nome+(q.f?' · '+q.a+'/'+q.f:'')]})];
 const form=h('form',{class:'form-grid tj-form',onsubmit:ev=>{
   ev.preventDefault();const fd=new FormData(ev.target),dt=String(fd.get('d')||''),f=parseInt(fd.get('f'),10),a=parseInt(fd.get('a'),10),n=String(fd.get('n')||'').trim(),tv=String(fd.get('t')||'');
   const fail=msg=>{errBox.textContent=msg;errBox.style.display='block'};
   if(!dt)return fail('Escolha a data da bateria.');
   if(!(f>0))return fail('Informe quantas questões você fez.');
   if(!(a>=0))return fail('Informe quantas você acertou (pode ser 0).');
   if(a>f)return fail('Os acertos não podem passar do número de questões feitas.');
   T.registros.push({id:uid(),m:m.id,d:dt,f,a,...(tv!==''?{t:+tv}:{}),...(n?{n:n.slice(0,200)}:{})});save(P.id);rerender()}},
  h('div',{style:'grid-column:1/-1'},field('Tópico',dropdown({name:'t',value:'',label:'Tópico',options:topicOpts}))),
  field('Data',h('input',{class:'inp',type:'date',name:'d',value:todayIso()})),
  field('Questões feitas',h('input',{class:'inp',type:'number',name:'f',min:'1',step:'1',inputmode:'numeric',placeholder:'20'})),
  field('Acertos',h('input',{class:'inp',type:'number',name:'a',min:'0',step:'1',inputmode:'numeric',placeholder:'15'})),
  field('Fonte ou anotação (opcional)',h('input',{class:'inp',name:'n',maxLength:200,autocomplete:'off',placeholder:'ex.: prova anterior, errei crase'})),
  errBox,h('div',{style:'grid-column:1/-1'},h('button',{class:'btn btn-primary',type:'submit'},'Registrar bateria')));

 const ordered=[...regs].sort((x,y)=>y.d.localeCompare(x.d));
 const delReg=r=>modal('Apagar registro?',()=>h('p',{style:'margin:0'},'A bateria de '+tjDate(r.d)+' ('+r.a+' de '+r.f+') será removida.'),{submit:'Apagar',onSubmit:()=>{T.registros=T.registros.filter(x=>x.id!==r.id);save(P.id);rerender()}});
 const list=ordered.length?h('div',{class:'tj-qlist'},ordered.map(r=>h('div',{class:'li'},
  h('span',{class:'t'},tjDate(r.d)+' · '+r.a+' de '+r.f+' · '+tjPct(r.a/r.f),h('small',{class:'muted',style:'display:block'},(r.t!=null&&m.topicos[r.t]?m.topicos[r.t].nome:'Vários tópicos')+(r.n?' · '+r.n:''))),
  h('span',{class:'acts'},xbtn('Apagar registro de '+tjDate(r.d),()=>delReg(r)))))):h('p',{class:'empty'},'Nenhuma bateria registrada nesta matéria.');
 const ge=tjGrupos().filter(x=>x.m===m.id&&x.e>0).sort(tjByErr).map(x=>({...x,nome:tjTopicName(x.m,x.t)}));

 return h('div',{class:'tj-stack'},
  h('div',{class:'tj-mhead'},
   h('div',null,h('span',{class:'eyebrow'},P.blocoLabel({bloco:m.bloco})+' · '+m.blocoNome+(m.nota?' · '+m.nota:'')),h('h2',null,m.nome)),
   h('div',{class:'row'},h('span',{class:'badge'},tjQ(m.peso,...P.unidade)+' na prova'),h('span',{class:'badge'},s.feitos+'/'+s.total+' tópicos'),
    s.f?h('span',{class:'badge'},s.a+'/'+s.f+' questões'):null,tjPill(cls,s.f?tjPct(s.acc)+' · '+lab:'sem questões'))),
  h('div',{class:'tj-grid3'},
   tjPanel('Acertos e erros',null,h('div',{class:'tj-donut'},h('div',{html:tjDonut(s.f?[{frac:s.a/s.f,cor:'var(--tj-good)'},{frac:e/s.f,cor:'var(--tj-bad)'}]:[],s.f?tjPct(s.acc):'–',s.f?'de acerto':'sem questões')}),
    s.f?tjLegend([['var(--tj-good)','Acertos',s.a],['var(--tj-bad)','Erros',e],['var(--muted)','Total',s.f]]):h('p',{class:'muted',style:'margin:0;font-size:14px'},'Registre a primeira bateria para ver acertos e erros.'))),
   tjPanel('Edital da matéria',null,h('div',{class:'tj-donut'},h('div',{html:tjDonut([{frac:rev/s.total,cor:'var(--text)'},{frac:(s.feitos-rev)/s.total,cor:'var(--tj-good)'}],Math.round(s.prog*100)+'%','estudado')}),
    tjLegend([['var(--text)','Revisados',rev],['var(--tj-good)','Estudados',s.feitos-rev],['var(--line-strong)','A estudar',s.total-s.feitos]]))),
   tjPanel('Evolução do acerto','acumulado, por dia',tjChartEvo(regs))),
  h('div',{class:'tj-cols'},
   h('div',{class:'tj-stack'},
    h('div',{class:'tj-ph'},h('h3',null,'Tópicos do edital'),h('button',{type:'button',class:'btn btn-ghost btn-sm',disabled:!marcaveis.length,onclick:()=>{marcaveis.forEach(i=>{const k=key(i);if(allDone){delete T.topicos[k];delete T.revisados[k]}else if(!T.topicos[k])T.topicos[k]=todayIso()});save(P.id);rerender()}},allDone?'Desmarcar todos':'Marcar todos')),
    h('div',{class:'row',role:'group','aria-label':'Filtrar tópicos'},h('span',{class:'muted',style:'font-size:13px;font-weight:700'},'Mostrar:'),filtroBtn('','Todos'),P.filtros.filter(f=>hasF(f)||f[0]===tjFilter).map(f=>filtroBtn(f[0],f[1]))),
    P.semComum&&!disponiveis.some(f=>f[0]!=='M')?h('p',{class:'muted',style:'margin:0;font-size:13px'},P.semComum):null,
    topics),
   h('div',{class:'tj-stack'},
    h('section',{class:'card'},h('h3',null,'Registrar questões'),form),
    h('section',{class:'card'},h('h3',null,'Baterias registradas'),s.f?h('div',{class:'row'},h('span',{class:'badge'},'Total '+s.f),h('span',{class:'badge'},'Acertos '+s.a),h('span',{class:'badge'},'Erros '+e)):null,list),
    h('section',{class:'card'},h('h3',null,'Onde você mais erra nesta matéria'),ge.length?tjRank(ge,false):h('p',{class:'empty'},s.f?'Nenhum erro nesta matéria. Mandou bem!':'Registre baterias escolhendo o tópico para ver o ranking.')))))}

/* ----- Receita: simulado (mínimos do item 9.6.12 do edital) e resumo do edital ----- */
const SIM={modulo:35,disc:30,discMin:15};
function rfbSimulado(){
 const T=tjT();if(!T.sim||typeof T.sim!=='object')T.sim={};
 const result=h('section',{class:'card tj-panel','aria-live':'polite'});
 const draw=()=>{
  let b=0,e=0;for(const m of P.mats){const v=T.sim[m.id]||0;if(m.bloco==='I')b+=v;else e+=v}
  const disc=T.simDisc||0,zeradas=P.mats.filter(m=>!(T.sim[m.id]>0)).map(m=>m.nome),any=Object.keys(T.sim).length>0||T.simDisc!=null;
  const pass=b>=SIM.modulo&&e>=SIM.modulo&&!zeradas.length&&disc>=SIM.discMin,fmtN=n=>n.toLocaleString('pt-BR'),max=P.total+SIM.disc;
  const modulo=id=>P.edital.find(x=>x.bloco===id).questoes;
  const crit=(ok,txt)=>h('li',null,tjPill(ok?'good':'bad',ok?'ok':'falta'),h('span',null,txt));
  result.replaceChildren(h('div',{class:'tj-ph'},h('h3',null,'Resultado')),
   h('div',{class:'tj-outro'},h('span',{class:'eyebrow'},'Nota final estimada'),h('div',{class:'tj-big'},fmtN(b+e+disc),h('small',null,' / '+max)),
    h('span',{class:'muted',style:'font-size:13px'},!any?'Preencha os acertos ao lado.':pass?'Atende todos os critérios mínimos do edital.':'Ainda não atende os critérios mínimos.')),
   tjTable(['Parte',['Acertos']],[['Conhecimentos Básicos',b+' / '+modulo('I')],['Conhecimentos Específicos',e+' / '+modulo('II')],['Objetiva',(b+e)+' / '+P.total],['Discursiva',fmtN(disc)+' / '+SIM.disc]].map(([l,v])=>h('tr',null,h('td',null,l),h('td',{class:'num'},v)))),
   h('ul',{class:'tj-crit'},crit(b>=SIM.modulo,'Mínimo de '+SIM.modulo+' em Básicos'),crit(e>=SIM.modulo,'Mínimo de '+SIM.modulo+' em Específicos'),
    crit(!zeradas.length,zeradas.length?'Matérias zeradas: '+zeradas.join(', '):'Nenhuma matéria zerada'),crit(disc>=SIM.discMin,'Mínimo de '+SIM.discMin+' na discursiva')),
   h('p',{class:'muted tj-note'},'Passar nos mínimos não garante classificação: em 2022 só as 1.053 melhores objetivas da ampla concorrência tiveram a discursiva corrigida.'))};
 const linha=(id,label,max,value,step,set)=>h('div',{class:'tj-sim'},h('label',{for:id},label),
  h('input',{class:'inp',id,type:'number',min:'0',max:String(max),step:String(step),inputmode:'decimal',placeholder:'0',value:value==null?'':String(value),
   oninput:ev=>{const raw=ev.target.value,v=raw===''?null:Math.max(0,Math.min(max,(step<1?parseFloat(raw):parseInt(raw,10))||0));if(v!=null&&v!==Number(raw))ev.target.value=v;set(v);save(P.id);draw()}}),
  h('span',{class:'muted'},'/ '+max));
 const campos=P.edital.map(b=>[h('span',{class:'eyebrow'},P.blocoLabel(b)+' · '+b.nome),
  b.materias.map(m=>linha('sim-'+m.id,m.nome,m.peso,T.sim[m.id],1,v=>{if(v==null)delete T.sim[m.id];else T.sim[m.id]=v}))]);
 draw();
 return h('div',{class:'tj-stack'},
  h('div',{class:'tj-mhead'},h('div',null,h('span',{class:'eyebrow'},'Prova objetiva + discursiva'),h('h2',null,'Simulado')),h('span',{class:'badge'},P.total+' questões + '+SIM.disc+' pontos')),
  h('div',{class:'tj-grid2',style:'align-items:start'},
   tjPanel('Seus acertos',null,h('p',{class:'muted tj-note'},'Digite os acertos de um simulado no formato da prova. Regras do item 9.6.12 do edital: 50% em cada módulo e nenhuma disciplina zerada; na discursiva, pelo menos 50%.'),
    campos,linha('simDisc','Discursiva (mínimo '+SIM.discMin+')',SIM.disc,T.simDisc,0.5,v=>{T.simDisc=v}),
    h('button',{type:'button',class:'btn btn-ghost btn-sm',style:'align-self:flex-start',onclick:()=>{T.sim={};T.simDisc=null;save(P.id);rerender()}},'Limpar')),
   result))}
function rfbEdital(){
 const el=h('div',{class:'tj-stack tj-edital',html:PD.rfb.EDITAL_HTML});   /* HTML fixo do próprio app */
 for(const a of el.querySelectorAll('a')){a.target='_blank';a.rel='noopener noreferrer'}
 const t=el.querySelector('table[data-pesos]');
 if(t)t.replaceChildren(h('thead',null,h('tr',null,h('th',null,'Disciplina'),h('th',null,'Módulo'),h('th',{class:'num'},'Questões'),h('th',{class:'num'},'% da prova'))),
  h('tbody',null,P.mats.map(m=>h('tr',null,h('td',null,m.nome),h('td',null,m.bloco+' · '+(m.bloco==='I'?'Básicos':'Específicos')),h('td',{class:'num'},String(m.peso)),h('td',{class:'num'},(m.peso/P.total*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%'))),
   h('tr',{class:'tj-bloco'},h('td',null,'Total'),h('td'),h('td',{class:'num'},String(P.total)),h('td',{class:'num'},'100%'))));
 return el}

/* ----- página de um concurso ----- */
function viewPanel(X){
 P=PANELS[X.id];
 const T=tjT(),g=tjGeral(),left=daysLeft(X),extra=P.extraTabs.find(t=>t.id===tjTab);
 if(tjTab!=='painel'&&!P.mat[tjTab]&&!extra)tjTab='painel';
 const items=[{id:'painel',name:'Painel'},...P.mats.map(m=>({id:m.id,name:tjShort(m)})),...P.extraTabs.map(({id,name})=>({id,name}))];
 return h('div',{class:'page'},
  head('Concurso',[h('em',null,X.name||'Sem nome')],[h('button',{class:'btn btn-ghost',onclick:()=>{examSel=null;rerender();goTop()}},'‹ Concursos')]),
  h('div',{class:'row'},
   h('span',{class:'badge'},left==null?'Sem data da prova':left<0?'Prova já realizada':left===0?'A prova é hoje':left+(left===1?' dia':' dias')+' para a prova'),
   h('span',{class:'badge'},g.top+' de '+P.topicos+' tópicos estudados')),
  h('div',{class:'card tj-config'},h('div',{class:'tj-config-row'},
   field('Data da prova',h('input',{class:'inp',type:'date',value:X.date,onchange:e=>{X.date=e.target.value;save('study');rerender()}})),
   field('Meta de acerto (%)',h('input',{class:'inp',type:'number',min:'0',max:'100',step:'1',value:String(T.meta),onchange:e=>{T.meta=Math.min(100,Math.max(0,parseInt(e.target.value,10)||0));save(P.id);rerender()}})),
   P.estimada&&!X.date?h('button',{type:'button',class:'btn btn-ghost btn-sm',onclick:()=>{X.date=P.estimada;save('study');rerender()}},'Usar data estimada ('+tjDate(P.estimada)+')'):null)),
  tabs(items,tjTab,'Painel e matérias do concurso',(id,fid)=>{tjTab=id;tjFilter='';rerender(fid);goTop()}),
  tjTab==='painel'?tjPainel():P.mat[tjTab]?tjMateria(P.mat[tjTab]):P.extraTabs.find(t=>t.id===tjTab).view(),
  P.fonte.map(f=>h('p',{class:'muted tj-note'},f)))}

/* ---------- rotas ---------- */
const VIEWS={inicio:viewInicio,wishlists:viewWishlists,objetivos:viewObjetivos,planner:viewPlanner,concurso:viewConcurso};
function cur(){const k=location.hash.replace('#','');return VIEWS[k]?k:'inicio'}
function route(keepScroll){
 if(!ME)return;
 if(cur()!=='planner'){calOpen=false;calStop()}
 const k=cur(),main=$('#main'),y=main.scrollTop,wy=window.scrollY;
 for(const[id,sel]of[['nav','#nav'],['bottom','#bottom']]){const el=$(sel);el.textContent='';
  NAV.forEach(([r,l])=>el.append(h('a',{href:'#'+r,'aria-current':r===k?'page':null},ico(r),h('span',null,l))))}
 main.textContent='';main.dataset.page=k;
 try{main.append(VIEWS[k]())}catch(e){main.append(h('div',{class:'page'},h('h1',null,'Algo deu errado'),h('p',{class:'err',role:'alert'},String(e&&e.message||e)),h('button',{class:'btn btn-primary',onclick:()=>{try{localStorage.removeItem(LS())}catch(_){}S=defaults();applyMigrations();route()}},'Restaurar modelo inicial neste navegador')))}
 document.title=NAV.find(n=>n[0]===k)[1]+' · Meu Espaço Pessoal';
 if(keepScroll===true){window.scrollTo(0,wy);main.scrollTop=y}else{window.scrollTo(0,0)}
 if(refocus){const e=document.getElementById(refocus);refocus=null;if(e)e.focus()}
}
window.addEventListener('hashchange',()=>route());
/* ---------- tema claro/escuro ---------- */
const themeNow=()=>document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('meu-espaco-tema',t)}catch(e){}drawTheme()}
function drawTheme(){
 const dark=themeNow()==='dark';
 for(const id of['theme','themeFab']){const el=document.getElementById(id);if(!el)continue;
  el.replaceChildren(h('button',{type:'button',class:id==='theme'?'backup theme-btn':'theme-fab','aria-label':dark?'Mudar para o modo claro':'Mudar para o modo escuro',title:dark?'Modo claro':'Modo escuro',onclick:()=>setTheme(dark?'light':'dark')},
   h('span',{class:'theme-ic',html:dark?ICONS.sun:ICONS.moon,'aria-hidden':'true'}),id==='theme'?(dark?'Modo claro':'Modo escuro'):null))}}
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',drawTheme);
drawTheme();
setMode(mode);
init();

document.addEventListener('click',e=>{if(e.target.closest('#logout'))logout()});
})();
