
'use client';

import { useState } from 'react';

export default function DebugCalendarPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function runTest() {
    setLoading(true);
    setResult(null);
    try {
      // Usaremos um endpoint de API temporário para o teste para evitar problemas de Server Actions em builds complexos
      const response = await fetch('/api/calendar/test-integration', { method: 'POST' });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: 'Erro na requisição', details: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">🛠️ Diagnóstico Google Calendar</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <p className="mb-4 text-gray-600">
          Este teste tentará criar um evento fictício no Google Calendar usando as credenciais configuradas no servidor.
        </p>
        
        <button 
          onClick={runTest}
          disabled={loading}
          className={`px-6 py-3 rounded-md font-bold text-white transition-all ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? 'Executando teste...' : '🚀 Executar Teste Real'}
        </button>

        {result && (
          <div className={`mt-8 p-6 rounded-md border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h2 className={`text-xl font-bold mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? '✅ Sucesso!' : '❌ Falha no Teste'}
            </h2>
            
            <div className="space-y-4">
              {result.env && (
                <div>
                  <h3 className="font-semibold text-gray-700">Estado das Variáveis:</h3>
                  <pre className="text-xs bg-white p-2 border rounded overflow-auto">
                    {JSON.stringify(result.env, null, 2)}
                  </pre>
                </div>
              )}

              {result.error && (
                <div>
                  <h3 className="font-semibold text-red-800">Erro:</h3>
                  <p className="text-sm font-mono bg-red-100 p-2 rounded">{result.error}</p>
                </div>
              )}

              {result.details && (
                <div>
                  <h3 className="font-semibold text-gray-700">Detalhes Técnicos:</h3>
                  <pre className="text-xs bg-white p-2 border rounded overflow-auto max-h-60">
                    {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.response && (
                <div>
                  <h3 className="font-semibold text-gray-700">Resposta do Google:</h3>
                  <pre className="text-xs bg-white p-2 border rounded overflow-auto">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-1">Como usar:</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Faça o deploy desta alteração para a Vercel.</li>
          <li>Acesse <code>/debug-calendar</code> no seu navegador.</li>
          <li>Clique no botão e me mande o "Erro" ou "Detalhes Técnicos" que aparecerem em vermelho.</li>
        </ol>
      </div>
    </div>
  );
}
