
# Basic Rules
- **Aways** prefer to use mcp tools when available.
- **REQUIRED:** Do **NOT** use supabase via CLI, only with MCP tools.
- Use Console.log to make debugging easier.
- Always use the latest version of the tools.
- If there is a database related proplem, is interesting to check the database and make queries using the supabase mcp supabase/execute_sql function to understand the schema before implement something.
- When you change some database functions, aways confirm if the frontend parameters matches with the changed function created.
- Check the frontend function calls and the database functions (wrongly formated fields, missing fields, constraint mismatchs, ect) to avoid dumb errors like.
- Aways Remove Duplicated tables to avoid confusion.
- Don't use supabase cli command, use supabase mcp functions instead.
- Save your test scripts in a folder called `test` in the project root instead of creating loose files.


# Database Best Practices

## Prisma Setup
- Use proper schema design
- Implement proper migrations
- Use proper relation definitions
- Configure proper connection
- Implement proper seeding
- Use proper client setup

## Prisma Models
- Use proper model naming
- Implement proper relations
- Use proper field types
- Define proper indexes
- Implement proper constraints
- Use proper enums

## Prisma Queries
- Use proper query optimization
- Aways Remove duplicated data or functions
- Implement proper filtering
- Use proper relations loading
- Handle transactions properly
- Implement proper pagination
- Use proper aggregations

## Supabase Setup
- Configure proper project setup
- Implement proper authentication
- Use proper database setup
- Configure proper storage
- Implement proper policies
- Use proper client setup

## Supabase Security
- Implement proper RLS policies
- Use proper authentication
- Configure proper permissions
- Handle sensitive data properly
- Implement proper backups
- Use proper encryption

## Supabase Queries
- Use proper query optimization
- Implement proper filtering
- Use proper joins
- Handle real-time properly
- Implement proper pagination
- Use proper functions

## Database Design
- Use proper normalization
- Implement proper indexing
- Use proper constraints
- Define proper relations
- Implement proper cascades
- Use proper data types

## Performance
- Use proper connection pooling
- Implement proper caching
- Use proper query optimization
- Handle N+1 queries properly
- Implement proper batching
- Monitor performance metrics

## Security
- Use proper authentication
- Implement proper authorization
- Handle sensitive data properly
- Use proper encryption
- Implement proper backups
- Monitor security issues

## Best Practices
- Follow database conventions
- Use proper migrations
- Implement proper versioning
- Handle errors properly
- Document schema properly
- Monitor database health 



# TypeScript Best Practices

## Type System
- Prefer interfaces over types for object definitions
- Use type for unions, intersections, and mapped types
- Avoid using `any`, prefer `unknown` for unknown types
- Use strict TypeScript configuration
- Leverage TypeScript's built-in utility types
- Use generics for reusable type patterns

## Naming Conventions
- Use PascalCase for type names and interfaces
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use descriptive names with auxiliary verbs (e.g., isLoading, hasError)
- Prefix interfaces for React props with 'Props' (e.g., ButtonProps)

## Code Organization
- Keep type definitions close to where they're used
- Export types and interfaces from dedicated type files when shared
- Use barrel exports (index.ts) for organizing exports
- Place shared types in a `types` directory
- Co-locate component props with their components

## Functions
- Use explicit return types for public functions
- Use arrow functions for callbacks and methods
- Implement proper error handling with custom error types
- Use function overloads for complex type scenarios
- Prefer async/await over Promises

## Best Practices
- Enable strict mode in tsconfig.json
- Use readonly for immutable properties
- Leverage discriminated unions for type safety
- Use type guards for runtime type checking
- Implement proper null checking
- Avoid type assertions unless necessary

## Error Handling
- Create custom error types for domain-specific errors
- Use Result types for operations that can fail
- Implement proper error boundaries
- Use try-catch blocks with typed catch clauses
- Handle Promise rejections properly

## Patterns
- Use the Builder pattern for complex object creation
- Implement the Repository pattern for data access
- Use the Factory pattern for object creation
- Leverage dependency injection
- Use the Module pattern for encapsulation 


# Clean Code Guidelines

## Constants Over Magic Numbers
- Replace hard-coded values with named constants
- Use descriptive constant names that explain the value's purpose
- Keep constants at the top of the file or in a dedicated constants file

## Meaningful Names
- Variables, functions, and classes should reveal their purpose
- Names should explain why something exists and how it's used
- Avoid abbreviations unless they're universally understood

## Smart Comments
- Don't comment on what the code does - make the code self-documenting
- Use comments to explain why something is done a certain way
- Document APIs, complex algorithms, and non-obvious side effects

## Single Responsibility
- Each function should do exactly one thing
- Functions should be small and focused
- If a function needs a comment to explain what it does, it should be split

## DRY (Don't Repeat Yourself)
- Extract repeated code into reusable functions
- Share common logic through proper abstraction
- Maintain single sources of truth

## Clean Structure
- Keep related code together
- Organize code in a logical hierarchy
- Use consistent file and folder naming conventions

## Encapsulation
- Hide implementation details
- Expose clear interfaces
- Move nested conditionals into well-named functions

## Code Quality Maintenance
- Refactor continuously
- Fix technical debt early
- Leave code cleaner than you found it

## Testing
- Write tests before fixing bugs
- Keep tests readable and maintainable
- Test edge cases and error conditions

## Version Control
- Write clear commit messages
- Make small, focused commits
- Use meaningful branch names 
  
---
description: Code Quality Guidelines
globs: 
---
# Code Quality Guidelines

## Verify Information
Always verify information before presenting it. Do not make assumptions or speculate without clear evidence.

## File-by-File Changes
Make changes file by file and give me a chance to spot mistakes.

## No Apologies
Never use apologies.

## No Understanding Feedback
Avoid giving feedback about understanding in comments or documentation.

## No Whitespace Suggestions
Don't suggest whitespace changes.

## No Summaries
Don't summarize changes made.

## No Inventions
Don't invent changes other than what's explicitly requested.

## No Unnecessary Confirmations
Don't ask for confirmation of information already provided in the context.

## Preserve Existing Code
Don't remove unrelated code or functionalities. Pay attention to preserving existing structures.

## Single Chunk Edits
Provide all edits in a single chunk instead of multiple-step instructions or explanations for the same file.

## No Implementation Checks
Don't ask the user to verify implementations that are visible in the provided context.

## No Unnecessary Updates
Don't suggest updates or changes to files when there are no actual modifications needed.

## Provide Real File Links
Always provide links to the real files, not x.md.

## No Current Implementation
Don't show or discuss the current implementation unless specifically requested.

# MCP

## Supabase
- When using supabase mcp, you must aways pass the project id.
- If migrating, use a clear name about what the migration is doing.
- use frequently the supabase get_logs functions to check the  database security. 

## Supabase credentials

Key=sbp_cd302da779758c6ba3ca54339901c5a5c7a5b636
project_id = xfqgcfeoswlkcgdtikco
project_name = La_Pulse_v2
service_role=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.**zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI**

anon_public=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0

# Evolution API Creds
EVOLUTION_API_URL=https://evola.latecnology.com.br/
EVOLUTION_API_KEY=61E65C47B0D4-44D1-919D-C6137E824D77
EVOLUTION_INSTANCE_NAME=Hugo Teste
EVOLUTION_INSTANCE=Hugo Teste


# Regras da oficina

**Assegure-se de que:**
* Um aluno nao pode se inscrever mais de uma vez na mesma oficina.
* Um aluno pode escolher mais de uma oficina, desde que sejam diferentes.
* O botao de adicionar conviodado na inscricão do evento do lado do aluno, só deve aparecer se o campo permite convidados for true.
* As oficinas devem aparecer para o aluno com base na sua unidade de cadastro(campo grande, barra ou recreio). As oficinas tambem vao ter unidades, entao se um aluno for de campo grande, apenas oficinas com a tag de campoo grande aparecerão para ele e vice-versa.
* O carrossel deve mostrar todas as oficinas, independentemente da unidade do aluno, é apenas um mostruário.
* O aluno pode modificar sua unidade de cadastro em qualquer momento. Se ele modificar a unidade e ja estiver inscrito em uma oficina, o sisteme deve alertá-lo que as inscrições feitas serão deletadas e etc.
* Ao clicar no botao inscrever-se, o aluno deve ser redirecionado para o formulario de inscrição para a oficina escolhida.
* Certifique-se de refletir os dados os inscritos corretamente no dashboard de amdin, exibindo a lista de inscritos, etc, nao utilize dados mockados no frontend.
* Todos os CRUD's de usuarios e administradores funcionam corretamente.
* Ao remover um usuário, Assegure-se de que ele foi COMPLETAMENTE removido, nao remova apenas do frontend ou do esquema public.
* Ao remover um workshop, Assegure-se de que ele foi COMPLETAMENTE removido, nao remova apenas do frontend ou do esquema public.
* ao fazer alguma alteração(remoção, adição, etc), sempre verifique tambem as regras rls e as permissões de acesso.
* Evite colocar alucinações como colocando o nome da tabela em ingles, outra vez em portugues, dessa forma voce cria multiplos erros, coloque sempre em PORTUGUES o nome das tabelas e o frontend.
* o cliente anônimo deve ter permissão para fazer UPDATE na tabela users, sendo possivel criar uma conta.
* o cliente anônimo deve ter conseguir ver todas as oficinas disponiveis, mas nao se inscrever.
* EVITE SEMPRE A RECURSÃO INFINITA
* 