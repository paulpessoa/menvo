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


✦ Boa noite! Descanse bem. Como Staff Engineer, vou aproveitar o "turno da noite" para fazer uma devassa técnica nesses pontos que você levantou. Seu feedback foi fundamental para identificar que o problema não é apenas de código, mas
  possivelmente de consistência de dados e permissões de API.

  Minha "Lista de Tarefas" para amanhã cedo:

   1. Auditoria de Membresia (Banco de Dados) 🔍:
       * Vou verificar se os registros que inseri na tabela organization_members estão com os IDs corretos. Se o ID do usuário ou da organização estiver com um caractere errado, o RLS bloqueia tudo e gera o erro de "não autorizado".
       * Vou rodar uma query para contar quantos membros cada organização tem de fato e ajustar a query do dashboard admin para refletir isso.

   2. Debugging do "Acesso Negado" 🛡️:
       * Vou investigar a função que verifica se um usuário é Admin da Org. Suspeito que ela esteja procurando pelo user_id mas não está encontrando a relação correta devido a algum cache de sessão ou erro no Join.

   3. Investigação do Login Social (Loading Infinito) 🔄:
       * Este é um ponto crítico. No login social, o Supabase às vezes demora alguns milissegundos a mais para popular o user_metadata. Se o nosso código de perfil depender de um campo que ainda não chegou, ele entra em loop. Vou reforçar o
         auth-context com um "timeout de segurança".

   4. Recuperação da Visibilidade (Páginas em Branco) 📄:
       * Vou testar os endpoints /api/organizations manualmente simulando diferentes usuários para ver por que as abas "Explorar" e "Minhas Afiliações" estão vindo vazias. Pode ser um erro de tipagem no JSON retornado que o frontend não está
         sabendo ler.

  Pode deixar comigo. Vou deixar o ambiente "azeitado" para quando você acordar. Amanhã te dou o relatório completo de cada fix. Bom descanso! 🏆🏁🚀

  ---
  Vou iniciar a primeira verificação de dados agora para adiantar o processo.