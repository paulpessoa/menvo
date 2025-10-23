import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('❌ [OAUTH] Erro na autorização:', error);
    return NextResponse.json(
      { error: 'Authorization failed', details: error },
      { status: 400 }
    );
  }

  if (!code) {
    console.error('❌ [OAUTH] Código não encontrado na URL');
    return NextResponse.json(
      { error: 'No code provided' },
      { status: 400 }
    );
  }

  // IMPORTANTE: Mostrar o código no console do servidor
  console.log('');
  console.log('='.repeat(70));
  console.log('✅ [OAUTH] CÓDIGO RECEBIDO!');
  console.log('');
  console.log('📋 Copie este código e cole no terminal:');
  console.log('');
  console.log(code);
  console.log('');
  console.log('='.repeat(70));
  console.log('');

  // Retornar página HTML que mostra o código
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Código OAuth - Google Calendar</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          color: #22c55e;
          margin-top: 0;
        }
        .code-box {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
          font-family: monospace;
          word-break: break-all;
          font-size: 14px;
        }
        button {
          background: #22c55e;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-right: 10px;
        }
        button:hover {
          background: #16a34a;
        }
        .info {
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
        }
        .success {
          color: #22c55e;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ Autorização Concedida!</h1>
        
        <p>Seu código OAuth foi gerado com sucesso.</p>
        
        <div class="info">
          <strong>📋 Próximos passos:</strong>
          <ol>
            <li>Copie o código abaixo (clique no botão "Copiar")</li>
            <li>Volte para o terminal onde está rodando o script</li>
            <li>Cole o código quando solicitado</li>
            <li>Pressione Enter</li>
          </ol>
        </div>

        <h3>Código de Autorização:</h3>
        <div class="code-box" id="code">${code}</div>
        
        <button onclick="copyCode()">📋 Copiar Código</button>
        <button onclick="showInConsole()">🖥️ Mostrar no Console</button>
        
        <p id="status"></p>

        <div class="info" style="margin-top: 30px; background: #fef3c7; border-color: #f59e0b;">
          <strong>💡 Dica:</strong> O código também foi impresso no console do servidor Vercel.
          Se você tem acesso aos logs, pode copiar de lá também!
        </div>
      </div>

      <script>
        function copyCode() {
          const code = document.getElementById('code').textContent;
          navigator.clipboard.writeText(code).then(() => {
            document.getElementById('status').innerHTML = '<span class="success">✅ Código copiado!</span>';
            setTimeout(() => {
              document.getElementById('status').innerHTML = '';
            }, 3000);
          });
        }

        function showInConsole() {
          const code = document.getElementById('code').textContent;
          console.log('='.repeat(70));
          console.log('CÓDIGO OAUTH:');
          console.log(code);
          console.log('='.repeat(70));
          document.getElementById('status').innerHTML = '<span class="success">✅ Código mostrado no console do navegador (F12)</span>';
        }

        // Mostrar automaticamente no console
        window.onload = function() {
          showInConsole();
        };
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
