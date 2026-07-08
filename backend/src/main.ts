import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';import helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render sits behind a reverse proxy; without this, req.ip resolves to
  // Render's proxy address for every request, and ThrottlerGuard ends up
  // rate-limiting all users as if they were one client.
  app.set('trust proxy', 1);

  // Security headers — sets X-Content-Type-Options, Strict-Transport-Security,
  // X-Frame-Options, X-XSS-Protection, Referrer-Policy, and more.
  app.use(helmet());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[ip-debug] req.ip=${req.ip} xff=${req.headers['x-forwarded-for']}`);
    next();
  });

  // CORS — allow the frontend origin (from env) to call the backend.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Swagger — only expose API docs in non-production environments.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TRSYP 3.0 API')
      .setDescription('Backend API for TRSYP 3.0')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();