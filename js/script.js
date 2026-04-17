const GROUPS={
  lapa:['hemeson.jasp@gmail.com','givanildo.sacolaohigienopolis@gmail.com','leandrosaclapa@yahoo.com.br','jvitorlima19@hotmail.com','josicarla8@gmail.com','adrianacosta.sacolaolapa@gmail.com'],
  perdizes:['hemeson.jasp@gmail.com','atendimento@sacolaoperdizes.com.br','jennyfferperdizes@gmail.com','leandrosaclapa@yahoo.com.br'],
  hig:['hemeson.jasp@gmail.com','lara.higienopolis@gmail.com','laurasacolao4@gmail.com','luciana_lapa@hotmail.com','leandrosaclapa@yahoo.com.br','adrianacosta.sacolaolapa@gmail.com'],
  ce:['hemeson.jasp@gmail.com','cleiane_nani@hotmail.com','jamile.sacolaocampos@gmail.com','leandrosaclapa@yahoo.com.br']
};

let selGroup=null,files=[],accessToken=null,CLIENT_ID='';

function getGreeting(){return new Date().getHours()<12?'Bom dia!':'Boa tarde!';}

function selectGroup(g,btn){
  selGroup=g;
  document.querySelectorAll('.grp-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const a=document.getElementById('rec-area');
  a.innerHTML=GROUPS[g].map(e=>`<span class="chip">${e}</span>`).join('');
  updatePreview();
}

function updatePreview(){
  const notes=document.getElementById('notes').value.trim();
  const att=document.getElementById('att').value.trim()||'Wendell';
  let msg=getGreeting()+'\n\n';
  if(notes)msg+=notes+'\n\n';
  msg+='Att: '+att;
  document.getElementById('preview').textContent=msg;
}

function handleFiles(e){
  files=[...files,...Array.from(e.target.files)];
  renderChips();
}

function renderChips(){
  document.getElementById('file-chips').innerHTML=files.map((f,i)=>
    `<div class="fchip">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
      ${f.name}
      <button class="fchip-del" onclick="removeFile(${i})">✕</button>
    </div>`
  ).join('');
}

function removeFile(i){
  files.splice(i,1);
  renderChips();
}

function startAuth(){
  const id=prompt('Cole seu Google OAuth2 Client ID (tipo web):','');
  if(!id)return;
  CLIENT_ID=id.trim();

  const params=new URLSearchParams({
    client_id:CLIENT_ID,
    redirect_uri:window.location.origin,
    response_type:'token',
    scope:'https://www.googleapis.com/auth/gmail.send',
    prompt:'consent'
  });

  const popup=window.open('https://accounts.google.com/o/oauth2/v2/auth?'+params,'google-oauth','width=500,height=600');

  const timer=setInterval(()=>{
    try{
      const url=popup.location.href;
      if(url.includes('access_token')){
        clearInterval(timer);
        popup.close();

        const hash=new URLSearchParams(url.split('#')[1]);
        accessToken=hash.get('access_token');

        document.getElementById('auth-btn-txt').textContent='Conta conectada';
        document.getElementById('auth-btn').style.background='#0ff';
        document.getElementById('auth-btn').style.color='#000';
        document.getElementById('auth-btn').style.borderColor='#0ff';
        document.getElementById('auth-btn').disabled=true;

        showStatus('ok','Conta Google conectada com sucesso!');
      }
    }catch(e){}
  },500);
}

function toBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result.split(',')[1]);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}

function buildMime(to,subject,body,attachments){
  const boundary='----=_Part_'+Math.random().toString(36).slice(2);

  let mime='MIME-Version: 1.0\r\n';
  mime+=`To: ${to}\r\n`;
  mime+=`Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=\r\n`;
  mime+=`Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  mime+=`--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
  mime+=btoa(unescape(encodeURIComponent(body)))+'\r\n';

  for(const a of attachments){
    mime+=`--${boundary}\r\nContent-Type: ${a.type}; name="${a.name}"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="${a.name}"\r\n\r\n${a.data}\r\n`;
  }

  mime+=`--${boundary}--`;

  return btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g,'-')
    .replace(/\//g,'_')
    .replace(/=+$/,'');
}

async function sendEmail(){
  if(!accessToken){
    showStatus('err','Conecte sua conta Google primeiro.');
    return;
  }

  if(!selGroup){
    showStatus('err','Selecione um grupo destinatário.');
    return;
  }

  const subject=document.getElementById('subject').value.trim();
  if(!subject){
    showStatus('err','Digite um assunto.');
    return;
  }

  const notes=document.getElementById('notes').value.trim();
  const att=document.getElementById('att').value.trim()||'Wendell';

  let body=getGreeting()+'\n\n';
  if(notes)body+=notes+'\n\n';
  body+='Att: '+att;

  const btn=document.getElementById('send-btn');
  btn.disabled=true;
  btn.textContent='Enviando...';

  try{
    const attachments=await Promise.all(
      files.map(async f=>({
        name:f.name,
        type:f.type||'application/octet-stream',
        data:await toBase64(f)
      }))
    );

    for(const email of GROUPS[selGroup]){
      const raw=buildMime(email,subject,body,attachments);

      await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+accessToken,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({raw})
      });
    }

    showStatus('ok',`Email enviado para ${GROUPS[selGroup].length} destinatários com sucesso!`);
    btn.textContent='Enviado!';

    setTimeout(()=>{
      btn.disabled=false;
      btn.textContent='Enviar email';
    },3000);

  }catch(e){
    showStatus('err','Erro ao enviar: '+e.message);
    btn.disabled=false;
    btn.textContent='Enviar email';
  }
}

function showStatus(type,msg){
  const s=document.getElementById('status');
  s.className='status-bar '+type;
  s.textContent=msg;
}

updatePreview();