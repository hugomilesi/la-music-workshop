-- Inserir as unidades Campo Grande, Barra e Recreio se não existirem
INSERT INTO unidades (nome, endereco, responsavel, ativa) 
VALUES 
  ('Campo Grande', 'Campo Grande - Rio de Janeiro, RJ', 'Coordenação Campo Grande', true),
  ('Barra', 'Barra da Tijuca - Rio de Janeiro, RJ', 'Coordenação Barra', true),
  ('Recreio', 'Recreio dos Bandeirantes - Rio de Janeiro, RJ', 'Coordenação Recreio', true)
ON CONFLICT (nome) DO NOTHING;

-- Verificar se as unidades foram inseridas
SELECT id, nome, endereco, responsavel, ativa FROM unidades ORDER BY nome;