# Alguns problemas
- O problema é que os dados da oficina as vezes carregam, as vezes não, fica carregando infinitamente.
- Existem muitas telas que ficam carregando sem motivo com a mensagem: Verificando permissões...
- Oficinas disponiveis tambem demora muito a carregar, a vezes nem carrega
- A sessao de perfil tambem nao carrega, fica apenas 'Carregando perfil...'



# Problemas
- Desative a autenticação por email, eu ja desativei diretamente na supabase, mas acho que precisa ser desativado no projeto tambem. Dexe o codigo simples, esperando apenaso o usuario e senha correto, sem esperar por confirmação nem nada.
- Outra coisa que acontece é que eu coloco minha senha na area de login, eu nao sou redicerionado, mas eu loguei mesmo assim, isso causa estranheza. 
- Remova as mensagens de onvirmação de email, pois neste momento nao sera necessário.
- A autenticação deve ser apenas usuario e senha.


# Regras da oficina

**Assegure-se de que:**
* Um aluno nao pode se inscrever mais de uma vez na mesma oficina.
* Um aluno pode escolher mais de uma oficina, desde que sejam diferentes.
* As oficinas devem aparecer para o aluno com base na sua unidade de cadastro(campo grande, barra ou recreio). As oficinas tambem vao ter unidades, entao se um aluno for de campo grande, apenas oficinas com a tag de campoo grande aparecerão para ele e vice-versa.
* O carrossel deve mostrar todas as oficinas, independentemente da unidade do aluno, é apenas um mostruário.
* O aluno pode modificar sua unidade de cadastro em qualquer momento. Se ele modificar a unidade e ja estiver inscrito em uma oficina, o sisteme deve alertá-lo que as inscrições feitas serão deletadas e etc.
* Ao clicar no botao inscrever-se, o aluno deve ser redirecionado para o formulario de inscrição para a oficina escolhida.

- Limpe um pouco o console, esta imprimindo muitas mensagens e atualizando o frontend toda hora.




# Verificação de Responsividade do PWA
- Muitos componentes novos foram adicionados, certifique-se de que tudo está funcionando corretamente em diferentes tamanhos de tela.
- Teste em dispositivos móveis, tablets e desktops.
- Verifique se as funcionalidades, como o carrossel de oficinas e o formulário de inscrição, estão funcionando corretamente em todos os dispositivos.


# Alterações
* Formulario de cadastro de oficina: 
  * Campo Unidade: Deve ser preenchido automaticamente com a unidade definida na oficina, sem possibilidade de edição.
* Ainda há alguns dados mockados nos cards das oficinas, como numero de vagas, palavras quie nem era para existir mais no sistema como percussão, teoria, outros, etc.
* Nao existe unidade principal, a oficina que estiver como unidade principal deve ser trocada para alguma unidade aleatoria(campo grande, barra, recreio)
*  


# Problemas
- Trocar os icones da logo pelo drive que o luciano colocou

* 