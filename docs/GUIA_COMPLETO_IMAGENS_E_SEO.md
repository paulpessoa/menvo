# 📸 Guia Completo: Imagens e SEO

## 🎯 Resumo Executivo

Implementamos melhorias de SEO e criamos um guia completo para as imagens necessárias na página How It Works.

---

## 📐 ESPECIFICAÇÕES DAS IMAGENS

### Tamanho e Formato
```
Tamanho de exibição: 400x300px (proporção 4:3)
Tamanho real: 800x600px (2x para Retina displays)
Formato: JPG
Peso máximo: 150KB
Qualidade: 80-85%
```

### Por que 800x600px?
- **Retina displays**: Telas modernas têm densidade de pixels 2x
- **Qualidade**: Imagens ficam nítidas em qualquer dispositivo
- **Performance**: Com compressão adequada, mantém tamanho pequeno
- **Responsividade**: Next.js Image otimiza automaticamente

---

## 🔍 ONDE BUSCAR NO UNSPLASH

### 1. NGO Register (ngo-register.jpg)
**Busque por:**
- "nonprofit organization meeting"
- "social work team"
- "community organization"

**Links diretos:**
- https://unsplash.com/s/photos/nonprofit-organization
- https://unsplash.com/s/photos/social-work
- https://unsplash.com/s/photos/community-meeting

**O que procurar:**
- Pessoas diversas trabalhando juntas
- Ambiente colaborativo
- Visual acolhedor e profissional

---

### 2. NGO Connect (ngo-connect.jpg)
**Busque por:**
- "youth mentoring"
- "young people learning"
- "mentor and student"

**Links diretos:**
- https://unsplash.com/s/photos/youth-mentoring
- https://unsplash.com/s/photos/students-learning
- https://unsplash.com/s/photos/career-guidance

**O que procurar:**
- Jovens em ambiente de aprendizado
- Conexão entre gerações
- Expressões de crescimento e desenvolvimento

---

### 3. Company Volunteer (company-volunteer.jpg)
**Busque por:**
- "corporate volunteering"
- "business professionals helping"
- "workplace mentoring"

**Links diretos:**
- https://unsplash.com/s/photos/corporate-volunteering
- https://unsplash.com/s/photos/business-mentoring
- https://unsplash.com/s/photos/corporate-social-responsibility

**O que procurar:**
- Profissionais em ambiente corporativo
- Ações de voluntariado
- Engajamento social

---

### 4. Company ESG (company-esg.jpg)
**Busque por:**
- "business analytics dashboard"
- "sustainability report"
- "data visualization business"

**Links diretos:**
- https://unsplash.com/s/photos/business-analytics
- https://unsplash.com/s/photos/data-visualization
- https://unsplash.com/s/photos/sustainability-report

**O que procurar:**
- Gráficos e dashboards
- Relatórios profissionais
- Métricas e dados

---

### 5. Company Benefits (company-benefits.jpg)
**Busque por:**
- "employee recognition"
- "team celebration"
- "professional development"

**Links diretos:**
- https://unsplash.com/s/photos/employee-recognition
- https://unsplash.com/s/photos/team-celebration
- https://unsplash.com/s/photos/professional-development

**O que procurar:**
- Celebração de conquistas
- Reconhecimento profissional
- Ambiente positivo

---

## 🛠️ PROCESSO PASSO A PASSO

### Passo 1: Download do Unsplash
1. Acesse o link da busca acima
2. Escolha a imagem que melhor representa o conceito
3. Clique no botão "Download free"
4. Selecione o tamanho "Large" (geralmente 1920px de largura)

### Passo 2: Otimizar a Imagem

#### Opção A - Online (Recomendado para iniciantes)
1. Acesse: https://squoosh.app/
2. Arraste a imagem baixada
3. No painel direito:
   - Resize: 800 x 600
   - Quality: 85%
   - Format: MozJPEG
4. Clique em "Download"

#### Opção B - Photoshop
1. Abra a imagem
2. Image > Image Size
3. Width: 800px, Height: 600px
4. File > Export > Save for Web (Legacy)
5. JPEG, Quality: 85%, Progressive

#### Opção C - Linha de Comando (ImageMagick)
```bash
convert input.jpg -resize 800x600 -quality 85 output.jpg
```

### Passo 3: Renomear e Salvar
1. Renomeie o arquivo conforme a lista:
   - ngo-register.jpg
   - ngo-connect.jpg
   - company-volunteer.jpg
   - company-esg.jpg
   - company-benefits.jpg

2. Salve em: `public/images/how-it-works/`

### Passo 4: Verificar
- Tamanho: 800x600px ✓
- Peso: < 150KB ✓
- Formato: JPG ✓
- Nome correto ✓

---

## ✅ MELHORIAS DE SEO IMPLEMENTADAS

### 1. Sitemap Atualizado
- ✅ Adicionada página `/faq`
- ✅ Adicionada página `/events`
- ✅ Atualizada data de `/how-it-works`

### 2. Robots.txt Criado
- ✅ Permite rastreamento de páginas públicas
- ✅ Bloqueia áreas privadas
- ✅ Referencia o sitemap

### 3. Structured Data (Schema.org)
- ✅ FAQPage schema na página FAQ
- ✅ Rich snippets para Google

### 4. Metadata Otimizada
- ✅ Títulos descritivos
- ✅ Descriptions com palavras-chave
- ✅ Open Graph tags
- ✅ Twitter Cards

---

## 📊 PALAVRAS-CHAVE ALVO

### Principais
- mentoria gratuita
- mentores voluntários
- plataforma de mentoria
- como funciona mentoria

### Novas (ONGs e Empresas)
- ongs mentoria
- empresas mentoria
- voluntariado corporativo
- relatórios esg
- mentoria para jovens
- impacto social mentoria

---

## 🎨 DICAS DE SELEÇÃO DE IMAGENS

### ✅ Boas Práticas
- Pessoas diversas (diferentes etnias, gêneros, idades)
- Expressões naturais e positivas
- Boa iluminação
- Foco nítido
- Composição equilibrada
- Cores harmoniosas

### ❌ Evitar
- Imagens muito posadas ou artificiais
- Baixa qualidade ou desfocadas
- Marcas d'água visíveis
- Cores muito saturadas
- Composição confusa
- Pessoas olhando diretamente para câmera (prefira interações naturais)

---

## 📝 CHECKLIST FINAL

### Antes de Usar a Imagem
- [ ] Tamanho correto (800x600px)
- [ ] Peso otimizado (< 150KB)
- [ ] Formato JPG
- [ ] Nome correto do arquivo
- [ ] Qualidade visual boa
- [ ] Representa bem o conceito
- [ ] Diversidade representada
- [ ] Licença verificada (Unsplash é livre)

### Após Adicionar
- [ ] Imagem carrega corretamente
- [ ] Aparece nítida em diferentes dispositivos
- [ ] Tempo de carregamento aceitável
- [ ] Alt text descritivo adicionado (futuro)

---

## 🚀 PRÓXIMOS PASSOS

### Imediato
1. Buscar e baixar as 5 imagens no Unsplash
2. Otimizar usando Squoosh.app
3. Salvar na pasta correta
4. Testar a página

### Curto Prazo
1. Adicionar alt text descritivo em todas as imagens
2. Implementar lazy loading
3. Criar versões WebP para melhor compressão

### Médio Prazo
1. Criar landing pages específicas (/para-ongs, /para-empresas)
2. Adicionar mais structured data
3. Implementar breadcrumbs
4. Criar blog com conteúdo relevante

---

## 📞 SUPORTE

Se tiver dúvidas:
1. Consulte `docs/NEW_IMAGES_NEEDED.md` para detalhes técnicos
2. Consulte `docs/SEO_IMPROVEMENTS.md` para melhorias de SEO
3. Consulte `docs/HOW_IT_WORKS_UPDATE.md` para contexto geral

---

## 🎯 RESULTADO ESPERADO

Após implementar as imagens:
- ✅ Página visualmente completa
- ✅ Carregamento rápido
- ✅ Boa experiência em mobile
- ✅ SEO otimizado
- ✅ Mensagem clara para cada público (ONGs e Empresas)
