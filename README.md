# La Music Week - Sistema de Inscrições

Sistema de inscrições para oficinas da La Music Week, desenvolvido com React, TypeScript, Vite e Supabase.

## 🚀 Deploy no Vercel

### Pré-requisitos
1. Conta no Vercel
2. Projeto Supabase configurado
3. Conta no Resend para envio de emails

### Configuração das Variáveis de Ambiente

No painel do Vercel, configure as seguintes variáveis de ambiente:

```
VITE_SUPABASE_URL=https://xfqgcfeoswlkcgdtikco.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI
VITE_EVOLUTION_API_URL=https://evola.latecnology.com.br/
VITE_EVOLUTION_API_KEY=61E65C47B0D4-44D1-919D-C6137E824D77
VITE_EVOLUTION_INSTANCE=Hugo Teste
```

### Configurações de Build

- **Framework Preset**: Vite
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install --no-frozen-lockfile`
- **Output Directory**: `dist`

### Funcionalidades

- ✅ Sistema de autenticação com Supabase
- ✅ Cadastro e login de usuários
- ✅ Gestão de oficinas por unidade
- ✅ Sistema de inscrições
- ✅ Dashboard administrativo
- ✅ Envio de emails via Edge Function
- ✅ Integração com Evolution API

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```
