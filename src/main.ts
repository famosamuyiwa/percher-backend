import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS (Move before app.listen)
  app.enableCors({
    origin: '*', // Allow all origins (change this in production)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Enable Global ValidationPipe (Move before app.listen)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform request payloads into DTO instances
      whitelist: true, // Remove properties that are not in the DTO
      forbidNonWhitelisted: true, // Throw error if extra properties exist
    }),
  );

  // Start the application (Must be last)
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
