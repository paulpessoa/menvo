# 🏢 Roteiro de Testes: Módulo de Organizações

Este documento serve como guia para validação manual dos fluxos de Governança de Organizações do MENVO.

## 1. Fluxo do Super Admin (Você)
- [ ] Acessar `/dashboard/admin/organizations`.
- [ ] Verificar se a contagem de membros nas organizações "Estágio Recife" e "Babalu" está correta.
- [ ] Clicar nos "três pontinhos" e selecionar **"Gerenciar membros"**. Você deve ser levado ao dashboard daquela organização específica.

## 2. Fluxo do Admin da Organização (Dono da ONG)
- [ ] Logar com `paulmspessoa@gmail.com`.
- [ ] Acessar `/organizations` e clicar na aba **"Minhas Afiliações"**.
- [ ] Verificar se as organizações "Estágio Recife" e "Babalu" aparecem com o selo **Administrador**.
- [ ] Clicar no ícone de **Engrenagem** para gerenciar a organização.
- [ ] **Ação**: Convidar um novo e-mail.
- [ ] **Ação**: Alterar o papel de um membro existente (ex: promover Mentee para Moderador).
- [ ] **Ação**: Remover um membro ou cancelar um convite pendente.

## 3. Fluxo do Membro (Mentor/Mentee)
- [ ] Logar com `mccartney.shalom@gmail.com`.
- [ ] Acessar o Dashboard principal.
- [ ] Verificar se o card **"Minhas Organizações"** aparece na barra lateral indicando a participação na "Estágio Recife".
- [ ] Verificar se a data de validade da membresia está visível (se houver).
- [ ] **Ação**: Clicar no botão de **Sair da Organização** (ícone de LogOut vermelho ao passar o mouse). Confirmar e verificar se a organização some da lista.

## 4. Auditoria e Segurança
- [ ] Verificar se ao tentar acessar o dashboard de uma organização que você NÃO pertence, o sistema redireciona para a página pública (RLS Check).
- [ ] (Apenas no Banco) Verificar se a tabela `organization_activity_log` registrou as entradas e saídas realizadas nos testes acima.

---
**Nota:** Caso encontre qualquer erro de "Internal Server Error" ou tela branca, por favor, me envie o Log da Vercel ou do Console do Navegador.
