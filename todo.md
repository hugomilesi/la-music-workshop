# Mudanças

# Area do usuário
- Crie um cadastro de usuários. No cadastro, o usuário deve escolher de qual unidade ele pertence(Campo Grande, Barra, Recreio)
- O cadastro de usuário deve ter confirmação de email e recuperação de conta. Utilize a chave de email smtp para emails.
- Oficinas: As oficinas vao ser automaticamente filtradas pela unidade que o usuário pertence, por exemplo: se estiver preenchido no seu login que ele é de campo grande, apenas as oficinas de campo grande estarão disponíveis para ele e vice-versa.

# Alterações ainda pendentes

## Geral
- Para eventos gratuiutos, nao precisa ter status pendente, se a pessoa se inscreveu, ela esta automaticamente inscrita.
- Deve ser possível definir a idade Máxima e minima por oficina no cadastro de uma nova oficina.

## Funcionamento dos convidados
- **Campo de Convidados dinamico**: O campo de 'desejo trazer um amigo' deve ser vinculado na criação do evento, se ao criar o evento for permitido trazer um amigo, o formulario de inscrição vai aparecer trazer um amigo, se o evento criado nao for permitido convidados, o campo de cadastro de convidados nao vai existir.
- Se o aluno for levar convidado, o convidado tambem deve ser cadastrado no site, podendo escolher a oficina que deseja participar.



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


* O CRUD completo das oficinas ainda nao funiona, alterar a foto de uma oficina, por exemplo ainda nao funciona, eu altero ela nao muda.