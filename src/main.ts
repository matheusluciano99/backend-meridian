import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para o frontend
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000', 
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    'https://meridian-insurance.vercel.app',
    'https://frontend-meridian-q0g7g1mdt-djairos-projects.vercel.app',
    'https://frontend-meridian-1.vercel.app',
    // Permitir qualquer subdomínio do Vercel para desenvolvimento
    /^https:\/\/.*\.vercel\.app$/,
    // Permitir Railway para desenvolvimento
    /^https:\/\/.*\.up\.railway\.app$/
  ].filter(Boolean);

  console.log('CORS configurado para as seguintes origens:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Verificar se a origin está na lista de permitidas
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        console.log(`CORS: Origin permitida: ${origin}`);
        return callback(null, true);
      } else {
        console.log(`CORS: Origin bloqueada: ${origin}`);
        return callback(new Error('Não permitido pelo CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin', 
      'X-Requested-With',
      'X-API-Key',
      'Cache-Control'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Servidor rodando na porta ${port}`);
}
void bootstrap();