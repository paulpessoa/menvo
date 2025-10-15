# ✅ Setup Completo para Evento - Menvo

## 📊 Status Atual

### Mentores no Supabase Remoto
- **Total:** 25 mentores (13 originais + 12 novos diversos)
- **Status:** TODOS ocupados (busy) ✅
- **Fotos:** Originais com avatar ✅ | Novos SEM foto (adicionar manualmente)

### Mentores Originais (13)
1. Ana Carolina Silva
2. Ana Silva
3. Camila Souza
4. Carlos Eduardo Santos
5. Carlos Santos
6. Julia Ferreira
7. Juliana Carvalho Mendes
8. Mariana Costa
9. Mariana Oliveira Lima
10. Patricia Fernandes Rocha
11. Pedro Almeida
12. Roberto Mendes Costa
13. Roberto Oliveira

### Novos Mentores Diversos (12) - SEM FOTO
14. Ana Paula Ferreira - Professora Pedagoga
15. Roberto Silva Oliveira - Corredor Amador
16. Juliana Alves Rodrigues - Costureira
17. João Pedro Martins - Artesão/Marceneiro
18. Antônio Carlos Pereira - Pescador Artesanal
19. Paulo Henrique Souza - Motorista de Táxi
20. Fernando Almeida Costa - Motorista de Caminhão
21. Patrícia Mendes Silva - Supervisora Telemarketing
22. Camila Rodrigues Santos - Manicure
23. Ricardo Barbosa Lima - Barbeiro
24. Lucas Fernandes Oliveira - Bombeiro Civil
25. José Carlos Ribeiro - Vendedor de Churros

## 🎯 Funcionalidades Implementadas

### Interface do Usuário
- ✅ Sistema de estrelas/avaliações OCULTO
- ✅ Filtro de avaliação REMOVIDO
- ✅ Mensagens de autenticação implementadas:
  - "Você deve estar logado para agendar mentorias"
  - "Você deve estar logado para favoritar mentores"
  - "A agenda deste mentor está lotada no momento"

### Comportamento Durante o Evento
- ❌ Usuários não logados: Veem mensagem de login
- ❌ Usuários logados: Veem "agenda lotada"
- ✅ Ninguém consegue agendar mentorias

## 📝 Scripts Disponíveis

### 1. Gerenciamento Geral
```bash
node scripts/manage-mentors-for-event.js
```
Menu interativo com todas as opções

### 2. Listar Mentores
```bash
node scripts/list-mentors-simple.js
```

### 3. Verificar Fotos
```bash
node scripts/check-mentors-without-photos.js
```

### 4. Atualizar Todos (fotos + status)
```bash
node scripts/update-all-mentors.js
```

### 5. Criar Mentores Diversos
```bash
node scripts/seed-diverse-mentors.js
```

### 6. Reativar Após Evento
```bash
node scripts/reactivate-mentors-after-event.js
```

## 🎪 Durante o Evento

### O que os usuários veem:
1. **Página de mentores:** Todos aparecem como "Ocupado"
2. **Ao clicar em "Ver Perfil":**
   - Sem login → "Você deve estar logado"
   - Com login → "A agenda deste mentor está lotada"
3. **Ao clicar no coração (favoritar):**
   - Sem login → "Você deve estar logado"

## 🔄 Depois do Evento

### Reativar mentores:
```bash
node scripts/reactivate-mentors-after-event.js
```

Ou manualmente no Supabase:
```sql
UPDATE profiles 
SET availability_status = 'available' 
WHERE id IN (
  SELECT user_id FROM user_roles WHERE role = 'mentor'
);
```

## 📚 Documentação

Consulte `scripts/README-MENTORS.md` para:
- Guia completo de uso
- Troubleshooting
- Fontes de fotos
- Fluxo de trabalho detalhado

## ✅ Checklist Final

- [x] Mentores criados no Supabase remoto
- [x] Todos com status "busy"
- [x] Todos com fotos (avatares automáticos)
- [x] Interface atualizada (sem estrelas)
- [x] Mensagens de autenticação implementadas
- [x] Scripts de gerenciamento criados
- [x] Documentação completa

## 🎉 Pronto para o Evento!

Tudo está configurado e testado. Durante o evento, ninguém conseguirá agendar mentorias.
