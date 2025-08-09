import React, { useState, useEffect } from 'react';
import { useStore, Workshop } from '../store/useStore';
import { Trash2, Edit, Plus, X, Save } from 'lucide-react';
import SuccessMessage from './SuccessMessage';


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
  unit_id?: string;
  idade_minima?: number;
  idade_maxima?: number;
  permite_convidados?: boolean;
  // Campos adicionais do Workshop
  title?: string;
  description?: string;
  instructor?: string;
  duration?: string;
  level?: 'iniciante' | 'intermediario' | 'avancado';
  category?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  price?: number;
  rating?: number;
  image?: string;
  schedule?: string[];
  unidade?: string;
}

const WorkshopManagement: React.FC = () => {
  const { workshops, loading, createWorkshop, updateWorkshop, deleteWorkshop, fetchWorkshops } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [successMessage, setSuccessMessage] = useState({ show: false, text: '' });
  const [formData, setFormData] = useState<WorkshopFormData>({
    nome: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    capacidade: 0,
    preco: 0,
    instrumento: '',
    nivel: 'iniciante',
    vagas_disponiveis: 0,
    status: 'ativa',
    unit_id: '1',
    idade_minima: 0,
    idade_maxima: 100
  });

  useEffect(() => {
    console.log('🔄 WorkshopManagement: useEffect executado, chamando fetchWorkshops');
    fetchWorkshops();
  }, []); // Removendo fetchWorkshops das dependências para evitar loop infinito

  // Debug logs
  useEffect(() => {
    console.log('📊 WorkshopManagement: Estado atual:', {
      workshopsCount: workshops.length,
      loading: loading.workshops,
      workshops: workshops
    });
  }, [workshops, loading.workshops]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacidade' || name === 'preco' || name === 'vagas_disponiveis' || name === 'idade_minima' || name === 'idade_maxima' 
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const workshopData = {
        // Campos obrigatórios do Workshop
        title: formData.nome,
        description: formData.descricao,
        instructor: 'Instrutor',
        duration: '2 horas',
        level: formData.nivel,
        category: formData.instrumento,
        maxParticipants: formData.capacidade,
        currentParticipants: 0,
        price: formData.preco,
        rating: 4.5,
        image: '',
        schedule: [new Date(formData.data_inicio).toLocaleString('pt-BR')],
        unidade: 'Unidade Principal',
        // Campos do banco de dados
        nome: formData.nome,
        descricao: formData.descricao,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        data_fim: new Date(formData.data_fim).toISOString(),
        local: formData.local,
        capacidade: formData.capacidade,
        preco: formData.preco,
        instrumento: formData.instrumento,
        nivel: formData.nivel,
        vagas_disponiveis: formData.vagas_disponiveis,
        status: formData.status,
        unit_id: formData.unit_id,
        idade_minima: formData.idade_minima,
        idade_maxima: formData.idade_maxima,
        permite_convidados: formData.permite_convidados
      };

      if (editingWorkshop) {
        await updateWorkshop(editingWorkshop.id, workshopData);
        setSuccessMessage({ show: true, text: 'Workshop atualizado com sucesso!' });
      } else {
        await createWorkshop(workshopData);
        setSuccessMessage({ show: true, text: 'Workshop criado com sucesso!' });
      }
      resetForm();
      // fetchWorkshops removido - o store já atualiza automaticamente
    } catch (error) {
      console.error('Erro ao salvar workshop:', error);
      setSuccessMessage({ show: true, text: 'Erro ao salvar workshop. Tente novamente.' });
    }
  };

  const handleEdit = (workshop: Workshop) => {
    console.log('Editando workshop:', workshop);
    setEditingWorkshop(workshop);
    setFormData({
      nome: workshop.title || workshop.nome || '',
      descricao: workshop.description || workshop.descricao || '',
      data_inicio: workshop.data_inicio || new Date().toISOString().split('T')[0],
      data_fim: workshop.data_fim || new Date().toISOString().split('T')[0],
      local: workshop.local || workshop.unidade || '',
      capacidade: workshop.capacidade || workshop.maxParticipants || 0,
      preco: workshop.preco || workshop.price || 0,
      instrumento: workshop.instrumento || workshop.category || '',
      nivel: (workshop.nivel || workshop.level || 'iniciante') as 'iniciante' | 'intermediario' | 'avancado',
      vagas_disponiveis: workshop.vagas_disponiveis || Math.max(0, (workshop.maxParticipants || 0) - (workshop.currentParticipants || 0)) || 0,
      status: (workshop.status || 'ativa') as 'ativa' | 'cancelada' | 'finalizada',
      unit_id: workshop.unit_id || '1',
      idade_minima: workshop.idade_minima || 0,
      idade_maxima: workshop.idade_maxima || 100
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este workshop?')) {
      try {
        await deleteWorkshop(id);
        setSuccessMessage({ show: true, text: 'Workshop excluído com sucesso!' });
        // fetchWorkshops removido - o store já atualiza automaticamente
      } catch (error) {
        console.error('Erro ao excluir workshop:', error);
        setSuccessMessage({ show: true, text: 'Erro ao excluir workshop. Tente novamente.' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      data_inicio: '',
      data_fim: '',
      local: '',
      capacidade: 0,
      preco: 0,
      instrumento: '',
      nivel: 'iniciante',
      vagas_disponiveis: 0,
      status: 'ativa',
      unit_id: '1',
      idade_minima: 0,
      idade_maxima: 100
    });
    setEditingWorkshop(null);
    setIsFormOpen(false);
  };

  if (loading.workshops) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SuccessMessage
        isVisible={successMessage.show}
        message={successMessage.text}
        onClose={() => setSuccessMessage({ show: false, text: '' })}
      />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Workshops</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus size={20} />
          Novo Workshop
        </button>
      </div>

      {/* Lista de Workshops */}
      <div className="grid gap-4">
        {workshops.map((workshop) => (
          <div key={workshop.id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{workshop.title}</h3>
                <p className="text-gray-600 mb-2">{workshop.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Instrumento:</span> {workshop.category}
                  </div>
                  <div>
                    <span className="font-medium">Nível:</span> {workshop.level}
                  </div>
                  <div>
                    <span className="font-medium">Preço:</span> R$ {workshop.price}
                  </div>
                  <div>
                    <span className="font-medium">Vagas:</span> {workshop.maxParticipants - workshop.currentParticipants}/{workshop.maxParticipants}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(workshop)}
                  className="text-blue-600 hover:text-blue-800 p-2"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(workshop.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal do Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingWorkshop ? 'Editar Workshop' : 'Novo Workshop'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Workshop
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrumento
                  </label>
                  <select
                    name="instrumento"
                    value={formData.instrumento}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione um instrumento</option>
                    <option value="violao">Violão</option>
                    <option value="piano">Piano</option>
                    <option value="bateria">Bateria</option>
                    <option value="canto">Canto</option>
                    <option value="guitarra">Guitarra</option>
                    <option value="baixo">Baixo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nível
                  </label>
                  <select
                    name="nivel"
                    value={formData.nivel}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                  </label>
                  <select
                    name="unit_id"
                    value={formData.unit_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="1">Campo Grande</option>
                    <option value="2">Barra</option>
                    <option value="3">Recreio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    name="data_inicio"
                    value={formData.data_inicio}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    name="data_fim"
                    value={formData.data_fim}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidade
                  </label>
                  <input
                    type="number"
                    name="capacidade"
                    value={formData.capacidade}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    name="preco"
                    value={formData.preco}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vagas Disponíveis
                  </label>
                  <input
                    type="number"
                    name="vagas_disponiveis"
                    value={formData.vagas_disponiveis}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ativa">Ativa</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="finalizada">Finalizada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idade Mínima
                  </label>
                  <input
                    type="number"
                    name="idade_minima"
                    value={formData.idade_minima}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idade Máxima
                  </label>
                  <input
                    type="number"
                    name="idade_maxima"
                    value={formData.idade_maxima}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local
                </label>
                <input
                  type="text"
                  name="local"
                  value={formData.local}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                  <Save size={18} />
                  {editingWorkshop ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopManagement;