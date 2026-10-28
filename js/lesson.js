const slug=location.pathname.split('/').pop().replace('.html','');
const doneKey='qadam-lessons-done';
let done=new Set(JSON.parse(localStorage.getItem(doneKey)||'[]'));
document.querySelectorAll('.lesson-answer').forEach(form=>form.addEventListener('submit',e=>{
 e.preventDefault();const input=form.querySelector('input');const raw=input.value.trim().replace(',','.');const expected=form.dataset.answer;const ok=raw.toLowerCase()===expected.toLowerCase()||Number(raw)===Number(expected);const out=form.parentElement.querySelector('.lesson-feedback');if(['жоқ','кері','408'].includes(expected)){out.className='lesson-feedback';out.textContent='Өз жауабыңды үлгімен салыстыр: '+form.dataset.explain;return;}out.className=`lesson-feedback ${ok?'good':'try'}`;out.textContent=ok?`Дұрыс! ${form.dataset.explain}`:'Әзірге сәйкес емес. Шарттағы бүтінді қайта анықтап, бір қадамнан тексер.';
}));
document.querySelector('#completeLesson').addEventListener('click',()=>{done.add(slug);localStorage.setItem(doneKey,JSON.stringify([...done]));document.querySelector('#lessonStatus').textContent='Тарау белгіленді. Келесі тарауға өте аласың.';document.querySelector('#completeLesson').textContent='Аяқталды ✓';});
if(done.has(slug)){document.querySelector('#lessonStatus').textContent='Бұл тарауды аяқтағансың.';document.querySelector('#completeLesson').textContent='Аяқталды ✓';}
