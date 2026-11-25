const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const HOST = '127.0.0.1';
const API_PORT = 3001;
const ANGULAR_PORT = 4200;
const MODEL = 'gemini-3.5-flash-lite';

let angularProcess;
let ai;

async function getAI() {
  if (ai) return ai;
  if (!process.env.GEMINI_API_KEY) return null;
  const { GoogleGenAI } = await import('@google/genai');
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function handleRequest(request, response) {
  if (request.url === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, { configured: Boolean(process.env.GEMINI_API_KEY) });
    return;
  }

  if (request.url === '/api/chat' && request.method === 'POST') {
    try {
      const gemini = await getAI();
      if (!gemini) {
        sendJson(response, 503, { error: 'GEMINI_API_KEY לא הוגדר. יש להפעיל את השרת עם המפתח' });
        return;
      }

      const body = await readJson(request);
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) {
        sendJson(response, 400, { error: 'יש להזין הודעה.' });
        return;
      }
      if (message.length > 10000) {
        sendJson(response, 413, { error: 'ההודעה ארוכה מדי.' });
        return;
      }

      const stream = await gemini.models.generateContentStream({
        model: MODEL,
        config: {
          systemInstruction: 'אתה עוזר מערכת לניהול הצעות שידוכים בעברית. ענה בקצרה, בצורה מקצועית ומכבדת.',
          tools: [{ googleSearch: {} }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: message }]
        }]
      });

      let reply = '';
      for await (const chunk of stream) {
        if (chunk.text) reply += chunk.text;
      }
      sendJson(response, 200, { reply: reply.trim() || 'לא התקבלה תשובה מהסוכן.' });
    } catch (error) {
      console.error('Gemini request failed:', error?.message || error);
      const status = error?.status ?? error?.error?.code;
      if (status === 429 || status === 'RESOURCE_EXHAUSTED') {
        sendJson(response, 429, { error: 'מכסת Gemini נוצלה כרגע. יש לבדוק את התוכנית והמכסה ב-Google AI Studio ולנסות שוב.' });
        return;
      }
      sendJson(response, 502, { error: 'אירעה שגיאה בחיבור לסוכן Google.' });
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
}

const apiServer = http.createServer((request, response) => {
  handleRequest(request, response).catch(error => {
    console.error(error);
    sendJson(response, 500, { error: 'שגיאה פנימית בשרת.' });
  });
});

apiServer.listen(API_PORT, HOST, () => {
  console.log(`Chat API: http://${HOST}:${API_PORT}`);

  const ngEntry = path.join(__dirname, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
  angularProcess = spawn(process.execPath, [
    ngEntry,
    'serve',
    '--host', HOST,
    '--port', String(ANGULAR_PORT),
    '--proxy-config', 'proxy.conf.json'
  ], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });

  angularProcess.on('exit', code => {
    console.log(`Angular server stopped (${code ?? 'unknown'}).`);
    apiServer.close();
  });
});

function shutdown() {
  if (angularProcess && !angularProcess.killed) angularProcess.kill();
  apiServer.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
