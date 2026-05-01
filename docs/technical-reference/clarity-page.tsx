import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Documentação - Cookie Consent & Clarity | MENVO",
    description: "Documentação técnica sobre o sistema de consentimento de cookies e integração com Microsoft Clarity",
}

export default function ClarityDocPage() {
    return (
        <div className="container max-w-4xl py-12">
            <article className="prose prose-slate dark:prose-invert max-w-none">
                <h1>Sistema de Consentimento de Cookies - MENVO</h1>

                <h2>Arquivos Principais</h2>
                <ol>
                    <li><strong><code>components/cookie-consent-banner.tsx</code></strong> - Banner de cookies</li>
                    <li><strong><code>app/layout.tsx</code></strong> - Inicialização do Clarity</li>
                </ol>

                <hr />

                <h2>Como Funciona</h2>

                <h3>1. Armazenamento (localStorage)</h3>
                <pre><code className="language-javascript">{`// Chave que guarda as preferências do usuário
"cookie-consent" → {"necessary":true,"analytics":true,"functional":false}

// Chave que guarda a data do consentimento
"cookie-consent-date" → "2025-11-25T10:30:00.000Z"`}</code></pre>

                <h3>2. Interface de Preferências</h3>
                <pre><code className="language-typescript">{`interface CookiePreferences {
  necessary: boolean;   // Sempre true
  analytics: boolean;   // Microsoft Clarity (true = ativado)
  functional: boolean;  // Futuro
}`}</code></pre>

                <hr />

                <h2>Fluxo Principal</h2>

                <h3>Primeira Visita (sem consentimento)</h3>
                <pre><code>{`1. Usuário acessa o site
2. Clarity carrega com consent=false (desativado)
3. Banner aparece após 1 segundo
4. Usuário escolhe uma opção
5. Preferências salvas no localStorage
6. Clarity recebe sinal: clarity('consent', true/false)`}</code></pre>

                <h3>Visitas Seguintes (com consentimento)</h3>
                <pre><code>{`1. Usuário acessa o site
2. Sistema lê localStorage
3. Aplica preferências salvas
4. Clarity recebe sinal automaticamente
5. Banner NÃO aparece`}</code></pre>

                <hr />

                <h2>Funções Importantes</h2>

                <h3><code>applyClarityConsent(analyticsConsent: boolean)</code></h3>
                <p>Envia sinal de consentimento para o Microsoft Clarity.</p>
                <pre><code className="language-typescript">{`const applyClarityConsent = (analyticsConsent: boolean) => {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("consent", analyticsConsent);
  }
};`}</code></pre>

                <h3><code>savePreferences(prefs: CookiePreferences)</code></h3>
                <p>Salva preferências e aplica consentimento.</p>
                <pre><code className="language-typescript">{`const savePreferences = (prefs: CookiePreferences) => {
  localStorage.setItem("cookie-consent", JSON.stringify(prefs));
  localStorage.setItem("cookie-consent-date", new Date().toISOString());
  applyClarityConsent(prefs.analytics);
  setShowBanner(false);
};`}</code></pre>

                <h3><code>acceptAll()</code></h3>
                <p>Aceita todos os cookies (Clarity ativado).</p>
                <pre><code className="language-typescript">{`const acceptAll = () => {
  savePreferences({
    necessary: true,
    analytics: true,    // ✅ Clarity ON
    functional: true,
  });
};`}</code></pre>

                <h3><code>acceptNecessary()</code></h3>
                <p>Aceita apenas cookies necessários (Clarity desativado).</p>
                <pre><code className="language-typescript">{`const acceptNecessary = () => {
  savePreferences({
    necessary: true,
    analytics: false,   // ❌ Clarity OFF
    functional: false,
  });
};`}</code></pre>

                <hr />

                <h2>Inicialização do Clarity (layout.tsx)</h2>
                <pre><code className="language-javascript">{`// Script carrega e verifica localStorage
var consent = localStorage.getItem("cookie-consent");

if (consent) {
  var prefs = JSON.parse(consent);
  clarity("consent", prefs.analytics || false);
} else {
  clarity("consent", false);  // Padrão: desativado
}`}</code></pre>
                <p><strong>ID do Projeto:</strong> <code>rz28fusa38</code></p>

                <hr />

                <h2>Como Testar</h2>

                <h3>Resetar Consentimento</h3>
                <pre><code className="language-javascript">{`// No console do navegador (F12)
localStorage.removeItem("cookie-consent");
localStorage.removeItem("cookie-consent-date");
location.reload();`}</code></pre>

                <h3>Verificar Consentimento Atual</h3>
                <pre><code className="language-javascript">{`// Ver preferências salvas
localStorage.getItem("cookie-consent");

// Ver logs do Clarity
// Console mostra: "[Clarity] Consent signal sent: true/false"`}</code></pre>

                <h3>Testar Fluxos</h3>
                <ol>
                    <li><strong>Aceitar Todos:</strong> Clarity deve ativar</li>
                    <li><strong>Apenas Necessários:</strong> Clarity deve desativar</li>
                    <li><strong>Personalizar:</strong> Escolher analytics ON/OFF</li>
                    <li><strong>Recarregar página:</strong> Banner não deve aparecer novamente</li>
                </ol>

                <hr />

                <h2>Variáveis Chave</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Variável</th>
                            <th>Onde</th>
                            <th>O que faz</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>cookie-consent</code></td>
                            <td>localStorage</td>
                            <td>Guarda preferências</td>
                        </tr>
                        <tr>
                            <td><code>showBanner</code></td>
                            <td>State</td>
                            <td>Mostra/esconde banner</td>
                        </tr>
                        <tr>
                            <td><code>preferences</code></td>
                            <td>State</td>
                            <td>Estado atual das preferências</td>
                        </tr>
                        <tr>
                            <td><code>window.clarity</code></td>
                            <td>Global</td>
                            <td>API do Clarity</td>
                        </tr>
                    </tbody>
                </table>

                <hr />

                <h2>Pontos Importantes</h2>
                <ol>
                    <li><strong>Clarity desativado por padrão</strong> até usuário consentir</li>
                    <li><strong>Banner aparece 1 segundo</strong> após carregar a página</li>
                    <li><strong>Preferências persistem</strong> entre sessões</li>
                    <li><strong>Sempre usa try/catch</strong> para segurança</li>
                    <li><strong>Fallback seguro:</strong> Em caso de erro, Clarity fica desativado</li>
                </ol>

                <hr />

                <h2>O que é <code>window.clarity</code>?</h2>
                <p>É uma <strong>função JavaScript global</strong> criada pelo script do Microsoft Clarity quando carrega no navegador.</p>

                <h3>Como funciona:</h3>
                <pre><code className="language-javascript">{`// 1. Script do Clarity carrega e cria a função
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){...};  // ← Cria window.clarity
})(window, document, "clarity", "script", "rz28fusa38");

// 2. Depois você pode chamar:
window.clarity('consent', true)   // ✅ Pode trackear
window.clarity('consent', false)  // ❌ Não pode trackear`}</code></pre>

                <h3>Comandos Disponíveis:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Comando</th>
                            <th>Exemplo</th>
                            <th>O que faz</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>consent</code></td>
                            <td><code>clarity(&apos;consent&apos;, true)</code></td>
                            <td>Liga/desliga tracking</td>
                        </tr>
                        <tr>
                            <td><code>event</code></td>
                            <td><code>clarity(&apos;event&apos;, &apos;clicou_mentor&apos;)</code></td>
                            <td>Registra evento customizado</td>
                        </tr>
                        <tr>
                            <td><code>identify</code></td>
                            <td><code>clarity(&apos;identify&apos;, &apos;user-123&apos;, {'{...}'})</code></td>
                            <td>Identifica usuário</td>
                        </tr>
                        <tr>
                            <td><code>set</code></td>
                            <td><code>clarity(&apos;set&apos;, &apos;plano&apos;, &apos;premium&apos;)</code></td>
                            <td>Adiciona metadados</td>
                        </tr>
                    </tbody>
                </table>

                <hr />

                <h2>Eventos Personalizados (Custom Events)</h2>
                <p>Você pode usar a mesma função <code>window.clarity()</code> para registrar eventos customizados:</p>

                <pre><code className="language-javascript">{`// Exemplo: Registrar quando usuário agenda mentoria
const handleAgendarMentoria = () => {
  if (window.clarity) {
    window.clarity("event", "agendou_mentoria");
  }
  agendarMentoria();
};

// Exemplo: Registrar quando clica em um mentor
const handleClickMentor = (mentorId) => {
  if (window.clarity) {
    window.clarity("event", "clicou_mentor");
    window.clarity("set", "mentor_id", mentorId);
  }
  router.push(\`/mentors/\${mentorId}\`);
};

// Exemplo: Identificar usuário após login
const handleLogin = (user) => {
  if (window.clarity) {
    window.clarity("identify", user.id, {
      email: user.email,
      tipo: user.is_mentor ? "mentor" : "mentee",
    });
  }
};`}</code></pre>

                <h3>Fluxo Completo:</h3>
                <pre><code>{`1. Usuário aceita cookies
   → clarity('consent', true) ✅

2. Clarity começa a trackear automaticamente
   → Gravações de sessão, mapas de calor

3. Você pode registrar eventos customizados
   → clarity('event', 'nome_do_evento')
   → Aparece no dashboard do Clarity`}</code></pre>

                <hr />

                <h2>Conformidade</h2>
                <p>
                    ✅ GDPR, LGPD, CCPA<br />
                    ✅ Microsoft Clarity Requirements (prazo: 31/10/2025)<br />
                    ✅ Consentimento explícito obrigatório<br />
                    ✅ Opt-in (não opt-out)
                </p>
            </article>
        </div>
    )
}
