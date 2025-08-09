import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Save } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useStore } from '../store/useStore';
import { useToast } from '../contexts/ToastContext';
import type { DatabaseUser } from '../store/useStore';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: DatabaseUser | null;
}

export default function UserEditModal({ isOpen, onClose, user }: UserEditModalProps) {
  const { updateUser } = useStore();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    user_type: 'student' as 'admin' | 'student'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preencher formulário quando usuário for selecionado
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        nome_completo: user.nome_completo || '',
        email: user.email || '',
        telefone: user.telefone || '',
        data_nascimento: user.data_nascimento ? user.data_nascimento.split('T')[0] : '',
        user_type: (user.user_type as 'admin' | 'student') || 'student'
      });
      setErrors({});
    }
  }, [user, isOpen]);

  // Reset form quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nome_completo: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        user_type: 'student'
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefone && !/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(formData.telefone)) {
      newErrors.telefone = 'Telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUser(user.id, {
        nome_completo: formData.nome_completo,
        email: formData.email,
        telefone: formData.telefone,
        data_nascimento: formData.data_nascimento || null,
        user_type: formData.user_type
      });

      showToast({ type: 'success', title: 'Usuário atualizado com sucesso!' });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      showToast({ type: 'error', title: 'Erro ao atualizar usuário. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Editar Usuário</h2>
                <p className="text-white/60 text-sm">Atualize as informações do usuário</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              icon={<X className="w-4 h-4" />}
              className="text-white/60 hover:text-white"
            >
              Fechar
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.nome_completo ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Digite o nome completo"
              />
              {errors.nome_completo && (
                <p className="text-red-400 text-sm mt-1">{errors.nome_completo}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.email ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Digite o email"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.telefone ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="(11) 99999-9999"
              />
              {errors.telefone && (
                <p className="text-red-400 text-sm mt-1">{errors.telefone}</p>
              )}
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Tipo de Usuário */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Tipo de Usuário *
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => handleInputChange('user_type', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="student" className="bg-gray-800">Estudante</option>
                <option value="admin" className="bg-gray-800">Administrador</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                icon={<Save className="w-4 h-4" />}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}