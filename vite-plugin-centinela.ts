import type { Plugin } from 'vite';

export function centinelaApiPlugin(): Plugin {
    return {
        name: 'centinela-api',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Configurar CORS
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                if (req.method === 'OPTIONS') {
                    res.statusCode = 200;
                    res.end();
                    return;
                }

                if (req.method === 'POST' && req.url === '/api/report') {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });
                    req.on('end', () => {
                        try {
                            const errorData = JSON.parse(body);
                            // Enviar al cliente de Centinela vía WebSocket
                            server.ws.send('centinela:error', errorData);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: true }));
                        } catch (e) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: 'Invalid JSON' }));
                        }
                    });
                    return;
                }

                next();
            });
        }
    };
}
