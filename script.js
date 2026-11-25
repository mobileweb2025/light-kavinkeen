import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, onValue, set } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
const app=initializeApp({apiKey:'AIzaSyCdPpsW7x4MRQsV6iv30apCaatnttuJJEw',authDomain:'smart-room-kavinkeen.firebaseapp.com',databaseURL:'https://smart-room-kavinkeen-default-rtdb.europe-west1.firebasedatabase.app',projectId:'smart-room-kavinkeen',appId:'1:329920615952:web:b28c1074f7d9073ae91c95'});
const auth=getAuth(app), db=getDatabase(app), $=id=>document.getElementById(id);
let stop=[], status=null, command=null, connected=false, pending=false;
function render(){
 const fresh=connected && status && typeof status.timestamp==='number' && Math.abs(Date.now()-status.timestamp)<30000;
 $('connection').textContent=fresh?'Device online':connected?'Waiting for device':'Database disconnected';
 $('sensor').textContent=fresh&&typeof status.isDark==='boolean'?(status.isDark?'Dark':'Bright'):'—';
 $('actualMode').textContent=fresh&&status.mode?status.mode:'—';
 $('lamp').classList.toggle('lit',!!(fresh&&status.lampStatus===true));
 $('lampText').textContent=fresh&&typeof status.lampStatus==='boolean'?(status.lampStatus?'Lamp ON':'Lamp OFF'):'Lamp —';
 $('updated').textContent=status?.timestamp?'Last report: '+new Date(status.timestamp).toLocaleString():'No device data';
 $('requested').textContent='Requested: '+(command?.mode==='auto'?'Automatic':command?.mode==='manual'?'Manual / '+(command.on?'ON':'OFF'):'—');
 $('auto').disabled=$('manual').disabled=!fresh||pending;
 $('on').disabled=$('off').disabled=!fresh||pending||command?.mode!=='manual';
}
$('form').addEventListener('submit',async e=>{e.preventDefault();$('message').textContent='Signing in…';try{await signInWithEmailAndPassword(auth,$('email').value,$('password').value);$('password').value='';$('message').textContent='';}catch(e){$('message').textContent=e.message;}});
$('logout').onclick=()=>signOut(auth).catch(e=>$('message').textContent=e.message);
onAuthStateChanged(auth,user=>{stop.forEach(fn=>fn());stop=[];status=null;command=null;connected=false;$('login').hidden=!!user;$('dashboard').hidden=!user;if(user){const err=e=>{$('message').textContent=e.message;};stop.push(onValue(ref(db,'lighting/status'),s=>{status=s.val();render();},err),onValue(ref(db,'lighting/command'),s=>{command=s.val();render();},err),onValue(ref(db,'.info/connected'),s=>{connected=s.val()===true;render();},err));}render();});
async function send(mode,on){if(!auth.currentUser||pending)return;pending=true;render();try{await set(ref(db,'lighting/command'),{mode,on});$('message').textContent='Command saved. Waiting for device report.';}catch(e){$('message').textContent=e.message;}finally{pending=false;render();}}
$('auto').onclick=()=>send('auto',false);$('manual').onclick=()=>send('manual',status?.lampStatus===true);$('on').onclick=()=>send('manual',true);$('off').onclick=()=>send('manual',false);setInterval(render,1000);render();
