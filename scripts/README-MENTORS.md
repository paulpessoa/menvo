# 🎯 Scripts de Gerenciamento de Mentores

Este diretório contém scripts para gerenciar mentores na plataforma, especialmente úteis para preparação de eventos.

## 📋 Scripts Disponíveis

### 1. `manage-mentors-for-event.js`

Script interativo para gerenciar mentores existentes.

**Funcionalidades:**
- ✅ Listar todos os mentores
- 🔍 Encontrar mentores sem foto
- 📸 Atualizar foto de um mentor específico
- ⏸️ Definir todos os mentores como ocupados

**Como usar:**

```bash
node scripts/manage-mentors-for-event.js
```

O script apresentará um menu interativo:

```
==================================================
🎯 GERENCIADOR DE MENTORES PARA EVENTO
==================================================

1. Listar todos os mentores
2. Encontrar mentores sem foto
3. Atualizar foto de um mentor
4. Definir todos os mentores como ocupados
5. Sair
```

**Exemplos de uso:**

1. **Listar mentores:**
   - Escolha opção 1
   - Verá lista completa com ID, nome, foto, status e tópicos

2. **Adicionar foto a um mentor:**
   - Escolha opção 3
   - Digite o ID do mentor (copie da listagem)
   - Cole a URL da foto
   - Exemplo de URL: `https://ui-avatars.com/api/?name=Maria+Silva&size=200`

3. **Preparar para evento (todos ocupados):**
   - Escolha opção 4
   - Confirme com 's'
   - Todos os mentores ficarão com status "busy"

### 2. `seed-diverse-mentors.js`

Script para criar 14 mentores mockados com perfis diversos.

**Perfis incluídos:**
- 👩‍🏫 Professora Pedagoga
- 📚 Concurseiro Aprovado
- 🏛️ Funcionária Pública
- 🏃 Corredor Amador
- 🧵 Costureira
- 🪵 Artesão/Marceneiro
- 🎣 Pescador Artesanal
- 🚕 Motorista de Táxi
- 🚛 Motorista de Caminhão
- 📞 Supervisora de Telemarketing
- 💅 Manicure/Nail Designer
- ✂️ Barbeiro
- 🚒 Bombeiro Civil
- 🍩 Vendedor de Churros

**Como usar:**

```bash
node scripts/seed-diverse-mentors.js
```

O script irá:
1. Criar usuários de autenticação
2. Atualizar perfis com dados completos
3. Gerar horários aleatórios de disponibilidade
4. Definir todos como "busy" (ocupados)
5. Adicionar avatares automáticos

**Saída esperada:**

```
🌱 Iniciando seed de mentores diversos...

📊 Total de mentores a criar: 14

✅ Ana Paula Ferreira criado com sucesso!
✅ Carlos Eduardo Santos criado com sucesso!
...

==================================================
📊 RESUMO DO SEED
==================================================
✅ Sucesso: 14
❌ Erros: 0
📈 Total: 14
==================================================
```

## ⚙️ Configuração

### Variáveis de Ambiente

Certifique-se de ter as seguintes variáveis em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**Importante:** 
- Para operações de leitura, a `ANON_KEY` é suficiente
- Para criar/atualizar usuários, você precisa da `SERVICE_ROLE_KEY`

### Permissões Necessárias

Os scripts precisam de acesso a:
- ✅ `profiles` (leitura e escrita)
- ✅ `mentors_view` (leitura)
- ✅ `mentor_availability` (escrita)
- ✅ `auth.users` (criação - apenas com service role key)

## 🔧 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"

**Solução:** Verifique se o arquivo `.env.local` existe e contém as variáveis necessárias.

```bash
# Verificar se o arquivo existe
ls -la .env.local

# Verificar conteúdo (sem expor valores)
grep SUPABASE .env.local
```

### Erro: "Permission denied" ao criar mentores

**Problema:** Usando ANON_KEY ao invés de SERVICE_ROLE_KEY

**Solução:** Adicione a `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`

### Erro: "Email already exists"

**Problema:** Tentando criar mentor com email já cadastrado

**Solução:** 
1. Use o script de gerenciamento para listar mentores existentes
2. Ou modifique os emails no array `diverseMentors` em `seed-diverse-mentors.js`

### Mentores não aparecem na interface

**Possíveis causas:**
1. Campo `mentor_verified` não está `true`
2. Campo `active_roles` não contém `'mentor'`
3. View `mentors_view` não está atualizada

**Solução:**

```sql
-- Verificar mentores
SELECT id, full_name, active_roles, mentor_verified 
FROM profiles 
WHERE 'mentor' = ANY(active_roles);

-- Corrigir se necessário
UPDATE profiles 
SET mentor_verified = true 
WHERE 'mentor' = ANY(active_roles);
```

## 📸 Fontes de Fotos

### UI Avatars (Automático)

Usado automaticamente pelo script de seed:

```
https://ui-avatars.com/api/?name=Nome+Completo&size=200&background=random
```

### Unsplash (Manual)

Para fotos reais de alta qualidade:

1. Acesse [Unsplash](https://unsplash.com)
2. Busque por "portrait" ou "professional"
3. Copie o link direto da imagem
4. Use no script de gerenciamento

Exemplo:
```
https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400
```

### Placeholder Services

Outras opções:
- [Pravatar](https://pravatar.cc/200)
- [RoboHash](https://robohash.org/seu-nome.png)
- [DiceBear](https://avatars.dicebear.com/api/human/seu-nome.svg)

## 🎯 Fluxo de Trabalho para Eventos

### Antes do Evento

1. **Criar mentores diversos:**
   ```bash
   node scripts/seed-diverse-mentors.js
   ```

2. **Verificar mentores sem foto:**
   ```bash
   node scripts/manage-mentors-for-event.js
   # Escolha opção 2
   ```

3. **Adicionar fotos faltantes:**
   ```bash
   # Use opção 3 do menu
   # Para cada mentor sem foto
   ```

4. **Definir todos como ocupados:**
   ```bash
   # Use opção 4 do menu
   # Confirme a operação
   ```

### Durante o Evento

- Mentores aparecem como "Ocupado"
- Usuários não logados veem mensagem de login
- Usuários logados veem "agenda lotada"

### Depois do Evento

1. **Reativar mentores:**
   ```sql
   UPDATE profiles 
   SET availability_status = 'available' 
   WHERE 'mentor' = ANY(active_roles);
   ```

2. **Ou via Supabase Dashboard:**
   - Acesse a tabela `profiles`
   - Filtre por `active_roles` contém `mentor`
   - Atualize `availability_status` para `available`

## 📊 Monitoramento

### Verificar status dos mentores

```bash
# Via script
node scripts/manage-mentors-for-event.js
# Escolha opção 1

# Via Supabase SQL Editor
SELECT 
  full_name,
  availability_status,
  avatar_url IS NOT NULL as has_photo,
  array_length(mentorship_topics, 1) as topics_count
FROM profiles
WHERE 'mentor' = ANY(active_roles)
ORDER BY full_name;
```

### Estatísticas

```sql
-- Total de mentores por status
SELECT 
  availability_status,
  COUNT(*) as total
FROM profiles
WHERE 'mentor' = ANY(active_roles)
GROUP BY availability_status;

-- Mentores sem foto
SELECT COUNT(*) as sem_foto
FROM profiles
WHERE 'mentor' = ANY(active_roles)
  AND (avatar_url IS NULL OR avatar_url = '');
```

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do console
2. Confirme as variáveis de ambiente
3. Teste a conexão com Supabase
4. Verifique as permissões RLS (Row Level Security)

Para mais ajuda, consulte:
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação do Projeto](../README.md)
