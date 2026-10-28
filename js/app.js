import { askQadamAI } from "./ai.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const completedChapters=new Set(JSON.parse(localStorage.getItem("qadam-lessons-done")||"[]"));
if($("#courseProgress")){$("#courseProgress").textContent=`${completedChapters.size} / 4 тарау`;$("#courseProgressBar").style.width=`${completedChapters.size/4*100}%`;}
const flow = [
  { tag:"Q · ҚАРА", value:"360 дәптер", text:"Бүтін мөлшер — 360 дәптер. Бірінші күні оның 25%-ы сатылды; екінші күнгі үлес қалғанына қатысты.", why:"Шарттағы «қалғанының» сөзін белгілеп қой." },
  { tag:"A · АНЫҚТА", value:"Қанша қалды?", text:"Біз сатылғанын емес, екі күннен кейін дүкенде қалған дәптер санын іздейміз.", why:"Ізделінді — соңғы қалған мөлшер." },
  { tag:"D · ДӘЛЕЛДЕ", value:"25% = ¼", text:"Бірінші күні 360 дәптердің төрттен бірі сатылады. Содан кейін ғана қалған 270-тің үштен бірін табамыз.", why:"Әр пайыз бен бөлшектің өз бүтіні бар." },
  { tag:"A · АТҚАР", value:"90 → 270 → 90", text:"360 ÷ 4 = 90 сатылды. 360 − 90 = 270 қалды. 270 ÷ 3 = 90 сатылды.", why:"270 − 90 = 180 дәптер қалды." },
  { tag:"M · МӘНІН ТЕКСЕР", value:"180 дәптер", text:"Сатылғаны: 90 + 90 = 180. Қалғаны да 180. 180 + 180 = бастапқы 360 дәптер.", why:"Кері тексеру бастапқы мөлшерді қайта береді." }
];
let flowIndex = 0;
function renderFlow() {
  const item = flow[flowIndex];
  $("#flowCount").textContent = `${String(flowIndex + 1).padStart(2,"0")} / 05`;
  $("#flowTrack").innerHTML = flow.map((step, i) => `<div class="flow-node ${i < flowIndex ? "done" : ""} ${i === flowIndex ? "current" : ""}"><span class="node-dot">${i < flowIndex ? "✓" : i + 1}</span><span>${step.value}</span></div>`).join("");
  $("#flowExplanation").innerHTML = `<span class="flow-label">${item.tag}</span><p>${item.text}</p><small>${item.why}</small>`;
  $("#flowDots").innerHTML = flow.map((_, i) => `<button aria-label="${i+1}-қадам" class="${i===flowIndex?"active":""}" data-dot="${i}"></button>`).join("");
  $$('[data-dot]').forEach(btn => btn.addEventListener("click", () => {flowIndex = Number(btn.dataset.dot);renderFlow();}));
}
renderFlow();
$("#flowNext").addEventListener("click",()=>{flowIndex=Math.min(4,flowIndex+1);renderFlow();});
$("#flowPrev").addEventListener("click",()=>{flowIndex=Math.max(0,flowIndex-1);renderFlow();});
$("#startSolve").addEventListener("click",()=>{flowIndex=0;renderFlow();document.querySelector("#flowTrack").scrollIntoView({behavior:"smooth",block:"center"});});

const steps=["Шарттағы маңызды деректі байқа.","Нені табатыныңды нақты ата.","Амалды неге таңдағаныңды түсіндір.","Есептеуді ретімен орында.","Нәтижені шартпен қайта салыстыр."];
$$('.step-item').forEach(btn=>btn.addEventListener("click",()=>{
  $$('.step-item').forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  const n=Number(btn.dataset.step);
  const hint=btn.querySelector(".step-hint"); hint.textContent=steps[n];
}));

$("#revealError").addEventListener("click",()=>{
 const box=$("#errorReveal");box.classList.toggle("hidden");$("#revealError").innerHTML=box.classList.contains("hidden")?"Алғашқы қатені көрсет <span>↗</span>":"Талдауды жап <span>↗</span>";
});

// The three book-style thinking stops keep a small progress journal on this device.
const completedTasks=new Set(JSON.parse(localStorage.getItem("qadam-practice-done")||"[]"));
function updateJournal(){
  $("#journalCount").textContent=`${completedTasks.size} / 3`;
  $("#journalProgress").style.width=`${completedTasks.size/3*100}%`;
}
$$(".reveal-btn").forEach(button=>button.addEventListener("click",()=>{
  const answer=$("#"+button.dataset.reveal);
  answer.classList.toggle("hidden");
  if(!completedTasks.has(button.dataset.reveal)){
    completedTasks.add(button.dataset.reveal);
    localStorage.setItem("qadam-practice-done",JSON.stringify([...completedTasks]));
    updateJournal();
  }
  button.setAttribute("aria-expanded",String(!answer.classList.contains("hidden")));
  button.innerHTML=answer.classList.contains("hidden")?"Жауапты қайта ашу <span>↗</span>":"Жауапты жасыру <span>↗</span>";
}));
updateJournal();

// Guided 3-minute practice: the clock begins only after the learner chooses to start.
const challenge=[
 {q:"48 × 5 = ?",a:"240",ex:"48 × 10 ÷ 2 = 240."},
 {q:"99 × 6 = ?",a:"594",ex:"100 × 6 − 6 = 594."},
 {q:"240 санының 25%-ы қанша?",a:"60",ex:"25% = 1/4; 240 ÷ 4 = 60."},
 {q:"360 санының 10%-ы қанша?",a:"36",ex:"10% = 1/10; 360 ÷ 10 = 36."},
 {q:"60 санының 3/4 бөлігі қанша?",a:"45",ex:"60 ÷ 4 × 3 = 45."},
 {q:"24 оқушының әрқайсысына 3 дәптерден берілді. Барлығы неше дәптер?",a:"72",ex:"24 бірдей топтың әрқайсысында 3 дәптер: 24 × 3 = 72."}
];
let current=0, correct=0, started=false, waiting=false, remaining=180, timerId=null, advanceId=null;
function showQuestion(){
 if(!started)return;
 if(current>=challenge.length){finishChallenge();return;}
 $("#challengeQuestion").textContent=challenge[current].q;
 $(".challenge-q-index").textContent=`${current+1} / ${challenge.length}`;
 $("#challengeProgress").style.width=`${current/challenge.length*100}%`;
 $("#answerInput").value="";$("#answerFeedback").textContent="";$("#answerInput").focus();
}
function stopTimer(){clearInterval(timerId);timerId=null;}
function tick(){remaining--;$("#timer").textContent=`${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;if(remaining<=0){stopTimer();finishChallenge(true);}}
function finishChallenge(timeUp=false){
 if(!started)return;
 started=false;waiting=false;stopTimer();clearTimeout(advanceId);$("#questionArea").classList.add("hidden");$("#challengeResult").classList.remove("hidden");
 const accuracy=current?Math.round(correct/current*100):0;
 $("#challengeResult").innerHTML=`<span class="result-icon">${accuracy>=75?"✳":"↗"}</span><h3>${timeUp?"Уақыт аяқталды":"Жарайсың, сынақ бітті"}</h3><p>${current} есептің ${correct}-і дұрыс. ${current?`Дәлдігің: <b>${accuracy}%</b>.`:"Әзірге есеп орындалмады — дәлдік есептелмейді."}</p><small>Бұл баға емес. Қай қадамда кідіргеніңді байқап, келесіде соған назар аудар.</small><button class="btn btn-dark" id="retryChallenge">Қайта байқап көру ↻</button>`;
 $("#retryChallenge").addEventListener("click",resetChallenge);
 $("#challengeProgress").style.width=`${current/challenge.length*100}%`;
}
function resetChallenge(){stopTimer();clearTimeout(advanceId);current=0;correct=0;started=false;waiting=false;remaining=180;$("#timer").textContent="03:00";$("#questionArea").classList.remove("hidden");$("#challengeResult").classList.add("hidden");}
$("#startChallenge").addEventListener("click",()=>{
 resetChallenge();started=true;timerId=setInterval(tick,1000);$("#answerInput").focus();$("#challengeCard").scrollIntoView({behavior:"smooth",block:"center"});
});
$("#answerForm").addEventListener("submit",e=>{
 e.preventDefault();if(!started||waiting)return;
 const val=$("#answerInput").value.trim().replace(",",".");if(!val)return;
 const ok=Number(val)===Number(challenge[current].a);if(ok)correct++;
 const fb=$("#answerFeedback");fb.innerHTML=`<b>${ok?"Дұрыс!":"Әлі сәйкес емес."}</b> ${challenge[current].ex}`;fb.className=`answer-feedback ${ok?"good":"try"}`;
 current++;waiting=true;advanceId=setTimeout(()=>{if(started){waiting=false;if(current>=challenge.length)finishChallenge();else showQuestion();}},1300);
});

// AI mentor
let chatHistory=[];let currentMode="hint";let busy=false;
$$('.mode-chip').forEach(btn=>btn.addEventListener("click",()=>{$$('.mode-chip').forEach(x=>x.classList.remove("active"));btn.classList.add("active");currentMode=btn.dataset.mode;}));
function addBubble(text,role="bot",typing=false){const b=document.createElement("div");b.className=`chat-bubble ${role==="user"?"user-bubble":"bot-bubble"}${typing?" typing":""}`;b.textContent=text;$("#chatMessages").append(b);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;return b;}
async function sendMessage(text){
 if(busy||!text.trim())return;
 busy=true;$("#chatSend").disabled=true;addBubble(text,"user");
 const modePrompt={hint:"Жауапты бірден ашпа. Алдымен бір ғана бағыттаушы сұрақ немесе шағын ишара бер.",check:"Шешім жолын QADAM қадамдарымен тексер. Бірінші күмәнді қадамды ата; толық жауапты бірден берме.",error:"Қатенің алғашқы қадамын және ықтимал түрін анықта. Оқушыға түзетуге бір сұрақ бер."}[currentMode];
 chatHistory.push({role:"user",content:`${modePrompt}\n\n${text.trim()}`});const loader=addBubble("Ойыңды қарап жатырмын…","bot",true);
 try{
   const answer=await askQadamAI(chatHistory.slice(-8));loader.remove();addBubble(answer,"bot");chatHistory.push({role:"assistant",content:answer});chatHistory=chatHistory.slice(-8);
 }catch(err){loader.remove();addBubble(err.message||"Байланыс болмады. Кейінірек көр.","bot");}
 finally{busy=false;$("#chatSend").disabled=false;$("#chatInput").focus();}
}
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();const input=$("#chatInput");const text=input.value.trim();if(!text)return;input.value="";input.style.height="auto";$("#charCount").textContent="0 / 1400";sendMessage(text);});
$("#chatInput").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=`${Math.min(e.target.scrollHeight,100)}px`;$("#charCount").textContent=`${e.target.value.length} / 1400`;});
$$('.quick-prompts button').forEach(btn=>btn.addEventListener("click",()=>sendMessage(btn.dataset.prompt)));

const menuBtn=$("#menuBtn"),mobileNav=$("#mobileNav");menuBtn.addEventListener("click",()=>{const open=menuBtn.getAttribute("aria-expanded")==="true";menuBtn.setAttribute("aria-expanded",String(!open));mobileNav.classList.toggle("open",!open);});
$$('.mobile-nav a').forEach(a=>a.addEventListener("click",()=>{mobileNav.classList.remove("open");menuBtn.setAttribute("aria-expanded","false");}));
