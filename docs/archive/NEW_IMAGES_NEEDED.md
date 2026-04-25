# Guia de Imagens para How It Works

## 📐 Especificações Técnicas

### Dimensões e Formato

- **Tamanho de exibição**: 400x300px (proporção 4:3)
- **Tamanho real recomendado**: 800x600px (2x para telas Retina)
- **Formato**: JPG (melhor compressão para fotos)
- **Peso máximo**: 150KB por imagem
- **Qualidade**: 80-85% (balanço entre qualidade e performance)

### Otimização

```bash
# Usando ImageMagick para otimizar
convert input.jpg -resize 800x600 -quality 85 output.jpg

# Ou usando online: https://tinypng.com/
```

## 🎨 Estilo Visual

### Paleta de Cores

- Seguir a identidade visual da plataforma
- Tons quentes e acolhedores
- Evitar cores muito saturadas

### Composição

- Foco central claro
- Espaço negativo adequado
- Pessoas diversas e inclusivas
- Ambiente profissional mas acolhedor

## 📸 Imagens Necessárias

### Seção ONGs

#### 1. ngo-register.jpg (800x600px)

**Palavras-chave para busca no Unsplash:**

- "nonprofit organization meeting"
- "social work team"
- "community organization"
- "volunteer registration"
- "ngo team working"

**Descrição**: Pessoas de uma organização social trabalhando juntas, ambiente colaborativo e inclusivo.

**Sugestões de busca:**

- https://unsplash.com/s/photos/nonprofit-organization
- https://unsplash.com/s/photos/social-work
- https://unsplash.com/s/photos/community-meeting

#### 2. ngo-connect.jpg (800x600px)

**Palavras-chave para busca no Unsplash:**

- "youth mentoring"
- "young people learning"
- "mentor and student"
- "career guidance youth"
- "diverse students"

**Descrição**: Jovens em ambiente de aprendizado, conexão entre gerações, desenvolvimento pessoal.

**Sugestões de busca:**

- https://unsplash.com/s/photos/youth-mentoring
- https://unsplash.com/s/photos/students-learning
- https://unsplash.com/s/photos/career-guidance

### Seção Empresas

#### 3. company-volunteer.jpg (800x600px)

**Palavras-chave para busca no Unsplash:**

- "corporate volunteering"
- "business professionals helping"
- "corporate social responsibility"
- "team volunteering"
- "workplace mentoring"

**Descrição**: Profissionais em ambiente corporativo engajados em ações sociais, voluntariado corporativo.

**Sugestões de busca:**

- https://unsplash.com/s/photos/corporate-volunteering
- https://unsplash.com/s/photos/business-mentoring
- https://unsplash.com/s/photos/corporate-social-responsibility

#### 4. company-esg.jpg (800x600px)

**Palavras-chave para busca no Unsplash:**

- "business analytics dashboard"
- "sustainability report"
- "data visualization business"
- "esg metrics"
- "corporate reporting"

**Descrição**: Gráficos, métricas, relatórios de impacto social e sustentabilidade.

**Sugestões de busca:**

- https://unsplash.com/s/photos/business-analytics
- https://unsplash.com/s/photos/data-visualization
- https://unsplash.com/s/photos/sustainability-report

#### 5. company-benefits.jpg (800x600px)

**Palavras-chave para busca no Unsplash:**

- "employee recognition"
- "team celebration"
- "workplace achievement"
- "professional development"
- "corporate culture"

**Descrição**: Reconhecimento de colaboradores, celebração de conquistas, desenvolvimento profissional.

**Sugestões de busca:**

- https://unsplash.com/s/photos/employee-recognition
- https://unsplash.com/s/photos/team-celebration
- https://unsplash.com/s/photos/professional-development

## 🔍 Dicas para Busca no Unsplash

1. **Use filtros de orientação**: Landscape (horizontal) para melhor encaixe
2. **Verifique a licença**: Todas as fotos do Unsplash são gratuitas para uso comercial
3. **Dê crédito ao fotógrafo**: Embora não seja obrigatório, é uma boa prática
4. **Baixe em alta resolução**: Escolha "Large" ou "Original" para melhor qualidade

## 📦 Processo de Download e Otimização

### 1. Download do Unsplash

```
1. Acesse o link da busca
2. Escolha a imagem ideal
3. Clique em "Download free"
4. Selecione tamanho "Large" (1920px)
```

### 2. Redimensionar e Otimizar

```
Opção 1 - Online (mais fácil):
- Acesse: https://squoosh.app/
- Faça upload da imagem
- Redimensione para 800x600px
- Ajuste qualidade para 85%
- Baixe o resultado

Opção 2 - Photoshop/GIMP:
- Abra a imagem
- Image > Image Size > 800x600px
- File > Export > Save for Web
- Quality: 85%, Progressive
```

### 3. Renomear e Salvar

```
Salvar em: public/images/how-it-works/
Nomes: ngo-register.jpg, ngo-connect.jpg, etc.
```

## Alternativas Temporárias

Enquanto as imagens personalizadas não estiverem disponíveis, você pode:

1. **Usar imagens existentes como placeholder**:
   - ngo-register.jpg → usar register-mentee.jpg
   - ngo-connect.jpg → usar grow-together.jpg
   - company-volunteer.jpg → usar register-mentor.jpg
   - company-esg.jpg → usar conduct.jpg
   - company-benefits.jpg → usar availability_status.jpg

2. **Usar serviços de ilustrações gratuitas**:
   - [Undraw](https://undraw.co/)
   - [Storyset](https://storyset.com/)
   - [Freepik](https://www.freepik.com/)

3. **Gerar com IA**:
   - DALL-E
   - Midjourney
   - Stable Diffusion

## Estilo Visual Recomendado

- **Paleta de cores**: Seguir a identidade visual da plataforma
- **Estilo**: Ilustrações modernas, inclusivas e acolhedoras
- **Formato**: JPG ou PNG
- **Otimização**: Comprimir para web (máximo 200KB por imagem)
