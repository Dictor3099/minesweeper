const L={easy:{n:"ЛЕГКО",r:9,c:9,m:10,t:180},medium:{n:"СРЕДНЕ",r:12,c:12,m:24,t:300},hard:{n:"СЛОЖНО",r:16,c:16,m:45,t:480}},
T={red:["Хвойный лес","Классический"],blast:["Взрывной лес","Аркановый"],enchanted:["Заколдованный лес","Сова"],winter:["Зимний лес","Пингвин"],farm:["Поле воронов","Фермерский"]};
let key="easy",C,g=[],op=0,fl=0,started=false,end=false,left=0,iv,paused=false,theme=localStorage.theme||"red",
vibrationEnabled=localStorage.getItem("vibrationEnabled")!=="false";
const $=x=>document.querySelector(x),menu=$("#menu"),settings=$("#settings"),game=$("#game"),board=$("#board");
const fmt=s=>String(s/60|0).padStart(2,"0")+":"+String(s%60).padStart(2,"0");

function apply(k){
  theme=k; document.body.className=k; localStorage.theme=k;
  $("#skin").textContent=T[k][1]+" скин";
  document.querySelectorAll("[data-t]").forEach(b=>b.classList.toggle("active",b.dataset.t==k));
  makeAmbient();
}
function records(){
  Object.keys(L).forEach(k=>{
    let x=localStorage["rec-"+k];
    $("#r-"+k).textContent=x?"Рекорд: "+fmt(+x):"Рекорд: —";
  });
}
document.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>start(b.dataset.l));
document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>apply(b.dataset.t));
$("#set").onclick=()=>{menu.classList.add("hide");settings.classList.remove("hide")};
$("#setback").onclick=()=>{settings.classList.add("hide");menu.classList.remove("hide")};
$("#back").onclick=show;
$("#restart").onclick=()=>start(key);
$("#pause").onclick=togglePause;
$("#resume").onclick=togglePause;
$("#again").onclick=()=>{$("#modal").classList.add("hide");start(key)};
$("#tomenu").onclick=()=>{$("#modal").classList.add("hide");show()};

function show(){
  clearInterval(iv); paused=false; $("#pause-screen").classList.add("hide");
  game.classList.add("hide"); settings.classList.add("hide"); menu.classList.remove("hide"); records();
}
function start(k){
  key=k; C=L[k]; g=[]; op=fl=0; started=end=paused=false; left=C.t; clearInterval(iv);
  $("#pause-screen").classList.add("hide"); $("#modal").classList.add("hide");
  menu.classList.add("hide"); settings.classList.add("hide"); game.classList.remove("hide");
  $("#title").textContent=T[theme][0]+" · "+C.n; $("#time").textContent=fmt(left); upd(); build(); makeAmbient();
}
function build(){
  board.innerHTML=""; board.classList.remove("win-flash","lose-shake");
  board.style.gridTemplateColumns=`repeat(${C.c},auto)`;
  for(let r=0;r<C.r;r++){g[r]=[];
    for(let c=0;c<C.c;c++){
      let e=document.createElement("button"),x={r,c,mine:0,open:0,flag:0,n:0,e};
      e.className="cell"; g[r][c]=x; board.append(e);
      let hold=null,sup=0,px=0,py=0;
      e.onpointerdown=q=>{
        if(q.pointerType==="touch"){
          px=q.clientX; py=q.clientY;
          hold=setTimeout(()=>{if(!paused&&!end){flag(x);sup=1}},250);
        }
      };
      e.onpointermove=q=>{
        if(hold && (Math.abs(q.clientX-px)>12 || Math.abs(q.clientY-py)>12)){clearTimeout(hold);hold=null}
      };
      e.onpointerup=()=>{clearTimeout(hold);hold=null};
      e.onpointercancel=()=>{clearTimeout(hold);hold=null};
      e.onpointerleave=()=>{clearTimeout(hold);hold=null};
      e.oncontextmenu=q=>{q.preventDefault();flag(x)};
      e.onclick=()=>{if(sup){sup=0;return}open(x)};
    }
  }
}
function begin(first){
  let a=[];
  for(let r=0;r<C.r;r++)for(let c=0;c<C.c;c++)
    if(Math.abs(r-first.r)>1||Math.abs(c-first.c)>1)a.push(g[r][c]);
  a.sort(()=>Math.random()-.5).slice(0,C.m).forEach(x=>x.mine=1);
  g.flat().forEach(x=>x.n=nb(x).filter(y=>y.mine).length);
  started=true; runTimer();
}
function runTimer(){
  clearInterval(iv);
  if(!started||end||paused)return;
  iv=setInterval(()=>{
    if(paused||end)return;
    left--; $("#time").textContent=fmt(left);
    if(left<=0)finish(0,"Время вышло!");
  },1000);
}
function togglePause(){
  if(end||!started)return;
  paused=!paused;
  if(paused){clearInterval(iv);$("#pause-screen").classList.remove("hide");board.classList.add("board-paused")}
  else{$("#pause-screen").classList.add("hide");board.classList.remove("board-paused");runTimer()}
}
function nb(x){
  let a=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc)continue;let y=g[x.r+dr]?.[x.c+dc];if(y)a.push(y)
  }return a;
}
function open(x){
  if(end||paused||x.flag)return;
  if(x.open){
    if(x.n){
      let a=nb(x);
      if(a.filter(y=>y.flag).length==x.n)for(let y of a){
        if(y.flag||y.open)continue;
        if(y.mine){explode(y,"Флажок стоял неверно!");return}
        reveal(y);
      }
      win();
    }return;
  }
  if(!started)begin(x);
  if(x.mine){explode(x,"Ты попал на мину!");return}
  reveal(x);win();
}
function reveal(x){
  if(x.open||x.flag||x.mine)return;
  x.open=1;op++;draw(x);
  if(!x.n)nb(x).forEach(reveal);
}
function mobileVibrate(){
  if(!vibrationEnabled)return;
  if(window.matchMedia("(pointer: coarse)").matches && "vibrate" in navigator)navigator.vibrate(35);
}
function flag(x){
  if(end||paused||x.open)return;
  x.flag=!x.flag;fl+=x.flag?1:-1;draw(x);upd();mobileVibrate();
}
function draw(x){
  x.e.className="cell";
  if(x.open){
    x.e.classList.add("open");
    if(x.mine){x.e.classList.add("mine");x.e.textContent="💣"}
    else{x.e.textContent=x.n||"";if(x.n)x.e.classList.add("n"+x.n)}
  }else if(x.flag){x.e.classList.add("flag");x.e.textContent="🚩"}
  else x.e.textContent="";
}
function upd(){$("#left").textContent=Math.max(0,(C?.m||0)-fl)}
function win(){if(op==C.r*C.c-C.m)finish(1,"Лес очищен!")}
function explode(x,msg){
  if(end)return;
  x.open=1;draw(x);x.e.classList.add("exploding");board.classList.add("lose-shake");
  if(vibrationEnabled && window.matchMedia("(pointer: coarse)").matches && "vibrate" in navigator)navigator.vibrate([60,35,100]);
  setTimeout(()=>finish(0,msg),430);
}
function finish(w,msg){
  if(end)return;end=true;clearInterval(iv);paused=false;$("#pause-screen").classList.add("hide");board.classList.remove("board-paused");
  g.flat().forEach(x=>{if(x.mine){x.open=1;draw(x)}});
  if(w){
    board.classList.add("win-flash"); victoryBurst();
    let e=C.t-left,o=+(localStorage["rec-"+key]||0);
    if(!o||e<o){localStorage["rec-"+key]=e;msg+=" 🏆 НОВЫЙ РЕКОРД: "+fmt(e)}
    else msg+=" Время: "+fmt(e);
  }
  setTimeout(()=>{
    $("#mt").textContent=w?"ПОБЕДА!":"ПОРАЖЕНИЕ";
    $("#mx").textContent=msg;$("#modal").classList.remove("hide");records();
  },w?650:180);
}
function makeAmbient(){
  const a=$("#ambient"); if(!a)return;a.innerHTML="";a.className=theme;
  let count=theme==="winter"?22:theme==="blast"?14:theme==="enchanted"?16:theme==="red"?12:7;
  for(let i=0;i<count;i++){
    let s=document.createElement("i");s.style.left=(Math.random()*100)+"%";
    s.style.animationDelay=(-Math.random()*9)+"s";s.style.animationDuration=(5+Math.random()*7)+"s";
    s.style.setProperty("--drift",(Math.random()*80-40)+"px");a.append(s);
  }
}
function victoryBurst(){
  const a=$("#ambient");
  for(let i=0;i<24;i++){
    let s=document.createElement("b");s.className="victory-particle";s.textContent=["✦","◆","★"][i%3];
    s.style.left=(45+Math.random()*10)+"%";s.style.top=(45+Math.random()*10)+"%";
    s.style.setProperty("--x",(Math.random()*360-180)+"px");s.style.setProperty("--y",(Math.random()*-260-40)+"px");
    a.append(s);setTimeout(()=>s.remove(),1300);
  }
}
const vibrationToggle=$("#vibration-toggle");
if(vibrationToggle){
  vibrationToggle.checked=vibrationEnabled;
  vibrationToggle.onchange=()=>{vibrationEnabled=vibrationToggle.checked;localStorage.setItem("vibrationEnabled",String(vibrationEnabled))}
}
apply(theme);records();
