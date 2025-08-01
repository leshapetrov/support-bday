const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';
const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // Проверяем подпись (если настроена)
        const signature = req.headers['x-hub-signature-256'];
        if (signature) {
          const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(body)
            .digest('hex');
          
          if (signature !== expectedSignature) {
            res.writeHead(401);
            res.end('Unauthorized');
            return;
          }
        }
        
        const payload = JSON.parse(body);
        
        // Проверяем, что это пуш в main ветку
        if (payload.ref === 'refs/heads/main') {
          console.log('🚀 Получен webhook для деплоя...');
          
          // Выполняем деплой
          exec('./deploy.sh', (error, stdout, stderr) => {
            if (error) {
              console.error('❌ Ошибка деплоя:', error);
              res.writeHead(500);
              res.end('Deploy failed');
              return;
            }
            
            console.log('✅ Деплой успешно завершен');
            console.log('stdout:', stdout);
            if (stderr) console.log('stderr:', stderr);
            
            res.writeHead(200);
            res.end('Deploy successful');
          });
        } else {
          res.writeHead(200);
          res.end('Ignored (not main branch)');
        }
      } catch (error) {
        console.error('❌ Ошибка обработки webhook:', error);
        res.writeHead(400);
        res.end('Bad request');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Webhook сервер запущен на порту ${PORT}`);
  console.log(`📡 Webhook URL: http://your-server-ip:${PORT}/webhook`);
}); 