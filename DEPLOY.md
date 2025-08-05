# Deploy Instructions for Vercel

## Environment Variables

Configure the following environment variables in your Vercel dashboard:

### Supabase Configuration
```
VITE_SUPABASE_URL=https://xfqgcfeoswlkcgdtikco.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTUzNjMsImV4cCI6MjA2NjEzMTM2M30.eu-4s7H7nFjGqN4rDPMqNHIrjFys2V9u4zPotH8W3Y0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcWdjZmVvc3dsa2NnZHRpa2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1NTM2MywiZXhwIjoyMDY2MTMxMzYzfQ.zSlz36DiKkMjAyiaJYPeIUpispPd2emykGxD07bP3WI
```

### Evolution API Configuration
```
VITE_EVOLUTION_API_URL=https://evola.latecnology.com.br/
VITE_EVOLUTION_API_KEY=61E65C47B0D4-44D1-919D-C6137E824D77
VITE_EVOLUTION_INSTANCE=Hugo Teste
```

## Build Configuration

The project is configured with the following settings in `vercel.json`:

- **Framework**: Vite
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install --no-frozen-lockfile`

## Deployment Steps

1. **Push your changes** to the repository
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically use the configuration from `vercel.json`

## Troubleshooting

### pnpm-lock.yaml Issues
If you encounter `ERR_PNPM_OUTDATED_LOCKFILE` errors:

1. Run `pnpm install --no-frozen-lockfile` locally
2. Commit the updated `pnpm-lock.yaml`
3. Redeploy

### Build Failures
If the build fails:

1. Check that all environment variables are correctly set
2. Verify that the Supabase project is accessible
3. Check the build logs for specific error messages

### Edge Functions
Make sure the following Edge Functions are deployed in Supabase:

- `send-email` - For email sending functionality

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test email sending
- [ ] Test workshop enrollment
- [ ] Test admin dashboard
- [ ] Verify all API endpoints are working
- [ ] Check that environment variables are loaded correctly

## Support

If you encounter issues during deployment, check:

1. Vercel deployment logs
2. Supabase project status
3. Edge Functions logs
4. Browser console for client-side errors