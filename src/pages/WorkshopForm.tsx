import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useStore } from '@/store/useStore';
import { useUserProfile } from '../hooks/useUserProfile';

interface WorkshopFormData {
  nome: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  capacidade: number;
  preco: number;
  instrumento: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  vagas_disponiveis: number;
  status: 'ativa' | 'cancelada' | 'finalizada';
  // Campos adicionais para o formulário
  total_vagas: number;
  gratuito: boolean;
  professor: string;
  idade_minima: number;
  idade_maxima: number;
  imagem: string;
  unidade: string;
  permite_convidados: boolean;
}

export default function WorkshopForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { workshops, createWorkshop, updateWorkshop } = useStore();
  const { profile } = useUserProfile();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<WorkshopFormData>({
    nome: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    capacidade: 10,
    preco: 0,
    instrumento: '',
    nivel: 'iniciante',
    vagas_disponiveis: 10,
    status: 'ativa',
    // Campos adicionais
    total_vagas: 10,
    gratuito: false,
    professor: '',
    idade_minima: 6,
    idade_maxima: 18,
    imagem: '',
    unidade: '',
    permite_convidados: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id) {
      const workshop = workshops.find(w => w.id === id);
      if (workshop) {
        setFormData({
          nome: workshop.nome || '',
          descricao: workshop.descricao || '',
          data_inicio: workshop.data_inicio ? new Date(workshop.data_inicio).toISOString().slice(0, 16) : '',
          data_fim: workshop.data_fim ? new Date(workshop.data_fim).toISOString().slice(0, 16) : '',
          local: workshop.local || '',
          capacidade: workshop.capacidade || 10,
          preco: workshop.preco || 0,
          instrumento: workshop.instrumento || '',
          nivel: workshop.nivel || 'iniciante',
          vagas_disponiveis: workshop.vagas_disponiveis || 0,
          status: workshop.status || 'ativa',
          // Campos adicionais
          total_vagas: workshop.capacidade || 10,
          gratuito: (workshop.preco || 0) === 0,
          professor: workshop.instrumento || '', // Temporariamente usando instrumento como professor
          idade_minima: workshop.idade_minima || 6,
          idade_maxima: workshop.idade_maxima || 18,
          imagem: '', // Valor padrão
          unidade: workshop.unit_id || '', // Usar o unit_id do workshop
          permite_convidados: workshop.permite_convidados || false
        });
      }
    } else if (profile?.unit_id && !isEditing) {
      // Preencher automaticamente a unidade do usuário logado para novos workshops
      setFormData(prev => ({
        ...prev,
        unidade: profile.unit_id // Usar o ID da unidade diretamente
      }));
    }
  }, [isEditing, id, workshops, profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    if (!formData.data_inicio) newErrors.data_inicio = 'Data de início é obrigatória';
    if (formData.total_vagas <= 0) newErrors.total_vagas = 'Total de vagas deve ser maior que zero';
    if (!formData.gratuito && formData.preco < 0) newErrors.preco = 'Preço não pode ser negativo';
    if (!formData.local.trim()) newErrors.local = 'Local é obrigatório';
    if (!formData.professor.trim()) newErrors.professor = 'Professor é obrigatório';
    if (formData.idade_minima < 0) newErrors.idade_minima = 'Idade mínima não pode ser negativa';
    if (formData.idade_maxima < formData.idade_minima) newErrors.idade_maxima = 'Idade máxima deve ser maior que a mínima';
    if (!formData.unidade.trim()) newErrors.unidade = 'Unidade é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mapeamento completo de todas as unidades
  const UNIDADES_MAP = {
    "f47ac10b-58cc-4372-a567-0e02b2c3d479": "Unidade Centro",
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8": "Unidade Norte", 
    "6ba7b811-9dad-11d1-80b4-00c04fd430c8": "Unidade Sul",
    "19df29a0-83ba-4b1e-a2f7-cb3ac8d25b4f": "Campo Grande",
    "8f424adf-64ca-43e9-909c-8dfd6783ac15": "Barra",
    "a4e3815c-8a34-4ef1-9773-cdeabdce1003": "Recreio"
  };

  // Função para obter o nome da unidade a partir do ID
  const getUnitNameFromId = (unitId: string): string => {
    return UNIDADES_MAP[unitId as keyof typeof UNIDADES_MAP] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Verificar se a unidade foi selecionada
      if (!formData.unidade) {
        throw new Error('Por favor, selecione uma unidade');
      }
      
      const workshopData = {
        nome: formData.nome,
        descricao: formData.descricao,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        data_fim: new Date(formData.data_inicio).toISOString(), // Usando a mesma data por enquanto
        local: formData.local,
        capacidade: formData.total_vagas,
        preco: formData.gratuito ? 0 : formData.preco,
        instrumento: formData.instrumento || 'Geral',
        nivel: formData.nivel || 'iniciante' as const,
        vagas_disponiveis: isEditing ? (workshops.find(w => w.id === id)?.vagas_disponiveis || formData.total_vagas) : formData.total_vagas,
        status: formData.status as 'ativa' | 'cancelada' | 'finalizada',
        unit_id: formData.unidade, // Usar o ID da unidade diretamente
        idade_minima: formData.idade_minima,
        idade_maxima: formData.idade_maxima
      };
      
      if (isEditing && id) {
        await updateWorkshop(id, workshopData);
        alert('Workshop atualizado com sucesso!');
      } else {
        await createWorkshop(workshopData);
        alert('Workshop criado com sucesso!');
      }
      
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Erro ao salvar workshop:', error);
      alert('Erro ao salvar workshop. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof WorkshopFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
              <h1 className="text-xl font-bold text-white font-inter">
                {isEditing ? 'Editar Workshop' : 'Novo Workshop'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome e Professor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nome do Workshop *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nome ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Ex: Workshop de Violão Básico"
                  />
                  {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Professor *
                  </label>
                  <input
                    type="text"
                    value={formData.professor}
                    onChange={(e) => handleInputChange('professor', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.professor ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Ex: João Silva"
                  />
                  {errors.professor && <p className="text-red-400 text-sm mt-1">{errors.professor}</p>}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.descricao ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Descreva o workshop, objetivos e conteúdo..."
                />
                {errors.descricao && <p className="text-red-400 text-sm mt-1">{errors.descricao}</p>}
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Imagem da Oficina
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        handleInputChange('imagem', event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.imagem && (
                  <div className="mt-2">
                    <img
                      src={formData.imagem}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Instrumento e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Instrumento *
                  </label>
                  <input
                    type="text"
                    value={formData.instrumento}
                    onChange={(e) => handleInputChange('instrumento', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.instrumento ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Ex: Violão, Piano, Bateria"
                  />
                  {errors.instrumento && <p className="text-red-400 text-sm mt-1">{errors.instrumento}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="ativa" className="bg-gray-800 text-white">Ativa</option>
                    <option value="cancelada" className="bg-gray-800 text-white">Cancelada</option>
                    <option value="finalizada" className="bg-gray-800 text-white">Finalizada</option>
                  </select>
                </div>
              </div>

              {/* Idades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Idade Mínima *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.idade_minima}
                    onChange={(e) => handleInputChange('idade_minima', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.idade_minima ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="6"
                  />
                  {errors.idade_minima && <p className="text-red-400 text-sm mt-1">{errors.idade_minima}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Idade Máxima *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.idade_maxima}
                    onChange={(e) => handleInputChange('idade_maxima', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.idade_maxima ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="18"
                  />
                  {errors.idade_maxima && <p className="text-red-400 text-sm mt-1">{errors.idade_maxima}</p>}
                </div>
              </div>

              {/* Data e Local */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.data_inicio ? 'border-red-500' : 'border-white/20'
                    }`}
                    style={{
                      colorScheme: 'dark'
                    }}
                  />
                  {errors.data_inicio && <p className="text-red-400 text-sm mt-1">{errors.data_inicio}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Local *
                  </label>
                  <input
                    type="text"
                    value={formData.local}
                    onChange={(e) => handleInputChange('local', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.local ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Sala 1"
                  />
                  {errors.local && <p className="text-red-400 text-sm mt-1">{errors.local}</p>}
                </div>
              </div>

              {/* Total de Vagas e Unidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Total de Vagas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_vagas}
                    onChange={(e) => handleInputChange('total_vagas', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.total_vagas ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="10"
                  />
                  {errors.total_vagas && <p className="text-red-400 text-sm mt-1">{errors.total_vagas}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Unidade *
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => handleInputChange('unidade', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.unidade ? 'border-red-500' : 'border-white/20'
                    }`}
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="" className="bg-gray-800 text-white">Selecione uma unidade</option>
                    {Object.entries(UNIDADES_MAP).map(([id, nome]) => (
                      <option key={id} value={id} className="bg-gray-800 text-white">{nome}</option>
                    ))}
                  </select>
                  {errors.unidade && <p className="text-red-400 text-sm mt-1">{errors.unidade}</p>}
                </div>
              </div>

              {/* Preço e Configurações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tipo de Preço *
                  </label>
                  <select
                    value={formData.gratuito ? 'gratuito' : 'pago'}
                    onChange={(e) => {
                      const isGratuito = e.target.value === 'gratuito';
                      handleInputChange('gratuito', isGratuito);
                      if (isGratuito) {
                        handleInputChange('preco', 0);
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="gratuito" className="bg-gray-800 text-white">Gratuito</option>
                    <option value="pago" className="bg-gray-800 text-white">Pago</option>
                  </select>
                  
                  {!formData.gratuito && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Preço (R$) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.preco}
                        onChange={(e) => handleInputChange('preco', parseFloat(e.target.value) || 0)}
                        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.preco ? 'border-red-500' : 'border-white/20'
                        }`}
                        placeholder="150.00"
                      />
                      {errors.preco && <p className="text-red-400 text-sm mt-1">{errors.preco}</p>}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Configurações de Convidados
                  </label>
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="checkbox"
                      id="permite_convidados"
                      checked={formData.permite_convidados}
                      onChange={(e) => handleInputChange('permite_convidados', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor="permite_convidados" className="text-white text-sm">
                      Permitir que alunos tragam convidados
                    </label>
                  </div>
                  <p className="text-white/60 text-xs mt-2">
                    Se marcado, o formulário de inscrição incluirá a opção de trazer convidados
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/dashboard')}
                  icon={<X className="w-4 h-4" />}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  icon={<Save className="w-4 h-4" />}
                >
                  {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'} Workshop
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}