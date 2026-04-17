# 📝 Estratégia: Menvo Blog (Content & SEO Hub)

## 🎯 Objetivo
Criar um canal de conteúdo (`blog.menvo.com.br`) para atrair tráfego orgânico (SEO), educar a comunidade sobre mentoria e fortalecer a autoridade da marca.

## 🏗️ Arquitetura: Subdomínio vs Subpasta
**Decisão:** Subdomínio (`blog.menvo.com.br`).
*   **Vantagens:** Independência tecnológica, isolamento de bugs, facilidade de escalar o time de conteúdo sem tocar no código do core app.

## 🛠️ Stack Tecnológica Sugerida
*   **Headless CMS:** 
    *   *Opção A (Low Touch):* **Sanity.io** ou **Contentful** (Free tier generoso, zero gestão de banco).
    *   *Opção B (Controle Total):* **Strapi** (Precisa de Docker/Servidor próprio).
*   **Frontend Generator:**
    *   **Next.js (SSG):** Recomendado pela familiaridade. Gera arquivos estáticos ultra rápidos.
    *   **Gatsby:** Excelente para SEO, mas mais complexo em plugins.

## 📅 Quando Implementar?
*   **Fase 1 (Atual):** Manter o Menvo Hub como centro de indicações.
*   **Fase 2 (Próxima):** Assim que o Menvo tiver > 100 mentores verificados, o blog servirá para dar "palco" para esses mentores (Entrevistas, Guest Posts).

## 🔗 Integração com o App
*   Os posts do blog devem ter CTAs dinâmicos: "Gostou do conteúdo? Agende uma mentoria com o autor: [Link para Perfil]".
*   O App pode exibir os "Últimos Posts" na Home via fetch da API do CMS.
