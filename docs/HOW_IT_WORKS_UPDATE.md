# Atualização da Página How It Works

## Resumo das Mudanças

### 1. Novas Abas Adicionadas

A página `how-it-works` agora possui 4 abas ao invés de 2:

- ✅ **Para Mentorados** (já existia)
- ✅ **Para Mentores** (já existia)
- 🆕 **Para ONGs** (nova)
- 🆕 **Para Empresas** (nova)

### 2. Seção ONGs

**Objetivo**: Mostrar como ONGs podem usar a plataforma gratuitamente para conectar jovens com mentores.

**Conteúdo**:
- **Passo 1**: Cadastro gratuito para ONGs
  - Cadastro 100% gratuito
  - Acesso ilimitado
  - Suporte dedicado

- **Passo 2**: Conectar jovens com mentores
  - Cadastrar múltiplos jovens
  - Acompanhar progresso
  - Receber relatórios de impacto

### 3. Seção Empresas

**Objetivo**: Apresentar o modelo de negócio B2B, mostrando como empresas podem usar a plataforma para voluntariado corporativo.

**Conteúdo**:
- **Passo 1**: Voluntariado Corporativo
  - Engajar colaboradores em ações sociais
  - Desenvolver lideranças
  - Fortalecer cultura organizacional

- **Passo 2**: Relatórios ESG
  - Relatórios mensais de impacto
  - Métricas para ESG
  - Certificados de voluntariado

- **Passo 3**: Políticas de Incentivo
  - Banco de horas para mentoria
  - Reconocimento e gamificação
  - Desenvolvimento de soft skills

### 4. Nova Página de FAQs

Criada página dedicada em `/faq` com 10 perguntas frequentes:

1. A mentoria é realmente gratuita?
2. Qual a duração das sessões?
3. Com que frequência posso me encontrar com um mentor?
4. O que acontece se eu precisar cancelar?
5. Como me torno um mentor verificado?
6. Minhas informações estão seguras?
7. Como funciona para ONGs?
8. Empresas podem participar?
9. Como funciona o acesso de recrutadores? (em desenvolvimento)
10. Posso ser mentor e mentorado ao mesmo tempo?

### 5. Traduções

Todas as novas seções foram traduzidas para:
- ✅ Português (pt-BR)
- ✅ Espanhol (es)
- ✅ Inglês (en)

## Modelo de Negócio Implementado

### Gratuito para Usuários Individuais
- Mentorados: acesso gratuito
- Mentores: voluntários
- ONGs: cadastro e uso gratuito

### Sustentabilidade Financeira (B2B)
- **Empresas**: Pagam por:
  - Programas de voluntariado corporativo
  - Relatórios ESG personalizados
  - Ferramentas de gestão de colaboradores mentores
  - Certificações e reconhecimentos

- **Recrutadores**: (em desenvolvimento)
  - Acesso a talentos qualificados
  - Filtros avançados de busca
  - Métricas de desempenho

### Parceiros Potenciais
- ONGs e projetos sociais
- Empresas privadas
- Organizações governamentais
- SEBRAE
- Eventos com mentores
- Mentores individuais

## Arquivos Modificados

1. `app/how-it-works/page.tsx` - Adicionadas novas abas e conteúdo
2. `app/faq/page.tsx` - Nova página criada
3. `i18n/translations/pt-BR.json` - Traduções em português
4. `i18n/translations/es.json` - Traduções em espanhol
5. `i18n/translations/en.json` - Traduções em inglês

## Próximos Passos

### Imagens
- [ ] Adicionar imagens para seção ONGs (ngo-register.jpg, ngo-connect.jpg)
- [ ] Adicionar imagens para seção Empresas (company-volunteer.jpg, company-esg.jpg, company-benefits.jpg)
- Ver detalhes em `docs/NEW_IMAGES_NEEDED.md`

### Funcionalidades
- [ ] Implementar página de cadastro específica para ONGs
- [ ] Implementar página de cadastro específica para Empresas
- [ ] Desenvolver dashboard para ONGs gerenciarem jovens
- [ ] Desenvolver dashboard para Empresas gerenciarem colaboradores mentores
- [ ] Implementar sistema de relatórios ESG
- [ ] Desenvolver funcionalidade de acesso para recrutadores

### Marketing
- [ ] Criar materiais de divulgação para ONGs
- [ ] Criar pitch deck para empresas
- [ ] Desenvolver casos de uso e estudos de caso
- [ ] Criar página de parceiros corporativos

## Navegação

Para acessar as novas páginas:
- How It Works: `/how-it-works`
- FAQs: `/faq`

## Observações Importantes

1. **Mentorias são gratuitas para todos os usuários individuais**
2. **Empresas pagam por serviços adicionais (ESG, gestão, certificações)**
3. **ONGs têm acesso 100% gratuito**
4. **Recrutadores terão acesso pago (em desenvolvimento)**
5. **O modelo B2B garante a sustentabilidade financeira da plataforma**
