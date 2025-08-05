-- Migração 002: Criar políticas RLS (Row Level Security)
-- Data: 2024-01-15
-- Descrição: Implementa políticas de segurança para filtros por unidade

-- 1. Políticas para tabela unidades
-- Permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver unidades" ON public.unidades
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserção/atualização apenas para administradores
CREATE POLICY "Apenas admins podem modificar unidades" ON public.unidades
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- 2. Políticas para tabela users
-- Usuários podem ver apenas usuários da mesma unidade
CREATE POLICY "Usuários veem apenas da mesma unidade" ON public.users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Usuário pode ver seu próprio perfil
            user_id = auth.uid() OR
            -- Admins podem ver todos
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type = 'admin'
            ) OR
            -- Usuários da mesma unidade
            unit_id IN (
                SELECT unit_id FROM public.users 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.users
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type = 'admin'
            )
        )
    );

-- Permitir inserção para novos usuários (cadastro)
CREATE POLICY "Permitir cadastro de novos usuários" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Políticas para tabela workshops
-- Usuários veem apenas workshops da sua unidade
CREATE POLICY "Usuários veem workshops da sua unidade" ON public.workshops
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Admins podem ver todos
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type = 'admin'
            ) OR
            -- Usuários veem apenas da sua unidade
            unit_id IN (
                SELECT unit_id FROM public.users 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Apenas admins e instrutores podem modificar workshops
CREATE POLICY "Admins e instrutores podem modificar workshops" ON public.workshops
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.user_id = auth.uid() 
            AND u.user_type IN ('admin', 'instrutor')
        )
    );

-- 4. Políticas para tabela inscricoes
-- Usuários veem apenas suas próprias inscrições
CREATE POLICY "Usuários veem próprias inscrições" ON public.inscricoes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Usuário pode ver suas próprias inscrições
            user_id = auth.uid() OR
            -- Usuário pode ver inscrições de seus convidados
            invited_by_user_id = auth.uid() OR
            -- Admins podem ver todas
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type = 'admin'
            ) OR
            -- Instrutores podem ver inscrições dos workshops que ministram
            EXISTS (
                SELECT 1 FROM public.workshops w
                INNER JOIN public.users u ON u.user_id = auth.uid()
                WHERE w.id = workshop_id 
                AND w.instrutor_id = u.id
            )
        )
    );

-- Usuários podem inserir inscrições
CREATE POLICY "Usuários podem se inscrever" ON public.inscricoes
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            invited_by_user_id = auth.uid()
        )
    );

-- Usuários podem atualizar suas próprias inscrições
CREATE POLICY "Usuários podem atualizar próprias inscrições" ON public.inscricoes
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            invited_by_user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type IN ('admin', 'instrutor')
            )
        )
    );

-- 5. Políticas para outras tabelas existentes
-- Eventos: usuários veem apenas eventos da sua unidade
CREATE POLICY "Usuários veem eventos da sua unidade" ON public.eventos
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type = 'admin'
            ) OR
            organizador_id IN (
                SELECT id FROM public.users 
                WHERE unit_id IN (
                    SELECT unit_id FROM public.users 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Pagamentos: usuários veem apenas seus próprios pagamentos
CREATE POLICY "Usuários veem próprios pagamentos" ON public.pagamentos
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.inscricoes i
                WHERE i.id = inscricao_id 
                AND (i.user_id = auth.uid() OR i.invited_by_user_id = auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type = 'admin'
            )
        )
    );

-- Mensagens: usuários veem apenas suas mensagens
CREATE POLICY "Usuários veem próprias mensagens" ON public.mensagens
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            remetente_id IN (
                SELECT id FROM public.users WHERE user_id = auth.uid()
            ) OR
            destinatario_id IN (
                SELECT id FROM public.users WHERE user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = auth.uid() 
                AND u.user_type = 'admin'
            )
        )
    );

-- 6. Conceder permissões básicas para roles anon e authenticated
GRANT SELECT ON public.unidades TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.workshops TO anon, authenticated;
GRANT ALL ON public.inscricoes TO authenticated;
GRANT SELECT ON public.eventos TO anon, authenticated;
GRANT SELECT ON public.pagamentos TO authenticated;
GRANT ALL ON public.mensagens TO authenticated;
GRANT SELECT ON public.lembretes_automaticos TO authenticated;
GRANT SELECT ON public.envios_lembretes TO authenticated;