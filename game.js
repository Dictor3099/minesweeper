const levels={
 easy:{name:"ЛЁГКИЙ",rows:9,cols:9,mines:10},
 medium:{name:"СРЕДНИЙ",rows:16,cols:16,mines:40},
 hard:{name:"СЛОЖНЫЙ",rows:16,cols:30,mines:99}
};
let levelKey="easy",cfg,grid=[],first=true,ended=false,flags=0,seconds=0,timerId=null,soundOn=true;
const $=s=>document.querySelector(s), boardEl=$("#board"), menu=$("#menu"),game=$("#game"),modal=$("#modal");

document.querySelectorAll(".level").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".level").forEach(x=>x.classList.remove("selected")); b.classList.add("selected"); levelKey=b.dataset.level; showBest();
});
function bestKey(){return "minesweeper_best_"+levelKey}
function showBest(){const v=localStorage.getItem(bestKey());$("#bestMenu").textContent=v?`${v} сек.`:"—"}
$("#play").onclick=()=>{menu.classList.add("hidden");game.classList.remove("hidden");newGame()};
$("#home").onclick=()=>{stopTimer();game.classList.add("hidden");menu.classList.remove("hidden");modal.classList.add("hidden");showBest()};
$("#restart").onclick=newGame; $("#again").onclick=()=>{modal.classList.add("hidden");newGame()};
$("#toMenu").onclick=()=>$("#home").click();
$("#sound").onclick=()=>{soundOn=!soundOn;$("#sound").textContent=soundOn?"🔊":"🔇"};

function beep(freq=440,dur=.07){
 if(!soundOn)return;
 try{const A=window.AudioContext||window.webkitAudioContext,a=new A(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.035;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.stop(a.currentTime+dur)}catch(e){}
}
function cellSize(){
 const available=Math.max(280,Math.min(window.innerWidth-38,1000));
 if(cfg.cols<=9)return Math.min(34,Math.floor(available/cfg.cols)-2);
 if(cfg.cols<=16)return Math.min(32,Math.max(24,Math.floor(available/cfg.cols)-2));
 return Math.min(30,Math.max(24,Math.floor(available/16)-2));
}
function sizeBoard(){
 if(!cfg)return; const s=cellSize(); boardEl.style.setProperty("--cell-size",s+"px"); boardEl.style.gridTemplateColumns=`repeat(${cfg.cols}, ${s}px)`;
}
window.addEventListener("resize",sizeBoard);

function newGame(){
 stopTimer(); cfg=levels[levelKey];grid=[];first=true;ended=false;flags=0;seconds=0;
 $("#timer").textContent="000";$("#minesLeft").textContent=cfg.mines;$("#restart").textContent="🙂";$("#levelTitle").textContent=cfg.name;boardEl.innerHTML="";boardEl.className="board";sizeBoard();
 for(let r=0;r<cfg.rows;r++){grid[r]=[];for(let c=0;c<cfg.cols;c++){
  const cell={r,c,mine:false,open:false,flag:false,n:0};grid[r][c]=cell;
  const d=document.createElement("button");d.type="button";d.className="cell";d.dataset.r=r;d.dataset.c=c;d.setAttribute("aria-label",`Клетка ${r+1}, ${c+1}`);
  let pressTimer=null,longTriggered=false,startX=0,startY=0;
  d.addEventListener("click",e=>{if(longTriggered){e.preventDefault();longTriggered=false;return}openClick(cell)});
  d.addEventListener("contextmenu",e=>{e.preventDefault();toggleFlag(cell)});
  d.addEventListener("pointerdown",e=>{
   if(e.pointerType!=="touch")return; startX=e.clientX;startY=e.clientY;longTriggered=false;
   pressTimer=setTimeout(()=>{longTriggered=true;toggleFlag(cell);if(navigator.vibrate)navigator.vibrate(25)},520);
  });
  d.addEventListener("pointermove",e=>{if(pressTimer&&Math.hypot(e.clientX-startX,e.clientY-startY)>10){clearTimeout(pressTimer);pressTimer=null}});
  const cancelPress=()=>{if(pressTimer){clearTimeout(pressTimer);pressTimer=null}};
  d.addEventListener("pointerup",cancelPress);d.addEventListener("pointercancel",cancelPress);d.addEventListener("pointerleave",cancelPress);
  boardEl.appendChild(d);
 }}
}
function el(cell){return boardEl.querySelector(`[data-r="${cell.r}"][data-c="${cell.c}"]`)}
function neighbors(r,c){const a=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;let rr=r+dr,cc=c+dc;if(rr>=0&&rr<cfg.rows&&cc>=0&&cc<cfg.cols)a.push(grid[rr][cc])}return a}
function plant(safe){
 let p=0;while(p<cfg.mines){let r=Math.floor(Math.random()*cfg.rows),c=Math.floor(Math.random()*cfg.cols),x=grid[r][c];if(x.mine||(Math.abs(r-safe.r)<=1&&Math.abs(c-safe.c)<=1))continue;x.mine=true;p++}
 grid.flat().forEach(x=>{if(!x.mine)x.n=neighbors(x.r,x.c).filter(y=>y.mine).length});
}
function openClick(cell){
 if(ended||cell.open||cell.flag)return;
 if(first){first=false;plant(cell);startTimer()}
 if(cell.mine){lose(cell);return}
 flood(cell);beep(520,.035);checkWin();
}
function flood(cell){
 if(cell.open||cell.flag||cell.mine)return;cell.open=true;const d=el(cell);d.classList.add("open");
 if(cell.n){d.textContent=cell.n;d.classList.add("n"+cell.n);return}
 neighbors(cell.r,cell.c).forEach(flood);
}
function toggleFlag(cell){
 if(ended||cell.open)return;
 if(!cell.flag&&flags>=cfg.mines)return;
 cell.flag=!cell.flag;flags+=cell.flag?1:-1;const d=el(cell);d.textContent=cell.flag?"🚩":"";d.classList.toggle("flagged",cell.flag);$("#minesLeft").textContent=cfg.mines-flags;beep(cell.flag?700:350,.05);
}
function reveal(){grid.flat().forEach(x=>{if(x.mine){const d=el(x);d.textContent="💣";d.classList.add("open","mine")}})}
function lose(hit){
 ended=true;stopTimer();reveal();el(hit).classList.add("boom");$("#restart").textContent="😵";beep(100,.35);
 setTimeout(()=>showResult(false),550);
}
function checkWin(){
 if(grid.flat().filter(x=>x.open).length!==cfg.rows*cfg.cols-cfg.mines)return;
 ended=true;stopTimer();grid.flat().forEach(x=>{if(x.mine){x.flag=true;el(x).textContent="🚩"}});$("#minesLeft").textContent=0;$("#restart").textContent="😎";
 const old=Number(localStorage.getItem(bestKey())||0);if(!old||seconds<old)localStorage.setItem(bestKey(),seconds);beep(880,.18);setTimeout(()=>showResult(true),250);
}
function showResult(win){
 $("#resultEmoji").textContent=win?"🏆":"💥";$("#resultTitle").textContent=win?"Победа!":"Ты подорвался!";
 $("#resultText").textContent=win?`Время: ${seconds} сек. Лучший результат: ${localStorage.getItem(bestKey())} сек.`:"Попробуй ещё раз — расположение мин будет новым.";
 modal.classList.remove("hidden");
}
function startTimer(){if(timerId)return;timerId=setInterval(()=>{seconds=Math.min(seconds+1,999);$("#timer").textContent=String(seconds).padStart(3,"0")},1000)}
function stopTimer(){if(timerId)clearInterval(timerId);timerId=null}
showBest();
