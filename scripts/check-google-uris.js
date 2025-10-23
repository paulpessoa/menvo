/**
 * Script para verificar qual URI está configurada no Google Cloud Console
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

console.log('🔍 Verificando configuração do Google OAuth...\n');
console.log('Client ID:', CLIENT_ID);
console.log('');
console.log('📋 URIs que você provavelmente tem configuradas:');
console.log('');
console.log('Verifique no Google Cloud Console qual dessas URIs está configurada:');
console.log('https://console.cloud.google.com/apis/credentials');
console.log('');
console.log('Procure pelo cliente OAuth "Menvo" e veja quais URIs estão em');
console.log('"URIs de redirecionamento autorizados"');
console.log('');
console.log('Depois execute:');
console.log('node scripts/generate-production-token-simple.js');
console.log('');
console.log('E escolha a URI que está configurada lá!');
