import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import { X, Plus, UserPlus } from 'lucide-react';

export interface Guest {
  id?: string;
  name: string;
  age?: number;
  phone?: string;
  workshopId?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

interface GuestFormProps {
  guests: Guest[];
  onGuestsChange: (guests: Guest[]) => void;
  maxGuests?: number;
  studentGuardianData?: {
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  };
  availableWorkshops?: Array<{
    id: string;
    nome: string;
    instrumento: string;
    vagas_disponiveis: number;
  }>;
}

export function GuestForm({ guests, onGuestsChange, maxGuests = 3, studentGuardianData, availableWorkshops = [] }: GuestFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [currentGuest, setCurrentGuest] = useState<Guest>({
    name: '',
    age: undefined,
    phone: '',
    workshopId: '',
    guardianName: studentGuardianData?.guardianName || '',
    guardianPhone: studentGuardianData?.guardianPhone || '',
    guardianEmail: studentGuardianData?.guardianEmail || ''
  });

  // Atualizar dados do responsável quando os dados do aluno mudarem
  React.useEffect(() => {
    if (studentGuardianData) {
      setCurrentGuest(prev => ({
        ...prev,
        guardianName: studentGuardianData.guardianName || prev.guardianName,
        guardianPhone: studentGuardianData.guardianPhone || prev.guardianPhone,
        guardianEmail: studentGuardianData.guardianEmail || prev.guardianEmail
      }));
    }
  }, [studentGuardianData]);

  const handleAddGuest = () => {
    if (!currentGuest.name || !currentGuest.age || !currentGuest.phone || !currentGuest.workshopId) {
      alert('Por favor, preencha nome, idade, telefone e selecione uma oficina para o convidado.');
      return;
    }

    const newGuest: Guest = {
      id: Date.now().toString(),
      name: currentGuest.name,
      age: currentGuest.age,
      phone: currentGuest.phone,
      workshopId: currentGuest.workshopId,
      guardianName: studentGuardianData?.guardianName || '',
      guardianPhone: studentGuardianData?.guardianPhone || '',
      guardianEmail: studentGuardianData?.guardianEmail || ''
    };

    onGuestsChange([...guests, newGuest]);
    setCurrentGuest({
      name: '',
      age: undefined,
      phone: '',
      workshopId: '',
      guardianName: studentGuardianData?.guardianName || '',
      guardianPhone: studentGuardianData?.guardianPhone || '',
      guardianEmail: studentGuardianData?.guardianEmail || ''
    });
    setShowForm(false);
  };

  const handleRemoveGuest = (guestId: string) => {
    onGuestsChange(guests.filter(guest => guest.id !== guestId));
  };

  const canAddMore = guests.length < maxGuests;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Convidados ({guests.length}/{maxGuests})
        </h3>
        {canAddMore && !showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Adicionar Convidado
          </Button>
        )}
      </div>

      {/* Lista de convidados */}
      {guests.length > 0 && (
        <div className="space-y-3">
          {guests.map((guest) => (
            <Card key={guest.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div>
                      <p className="text-white font-medium">{guest.name}</p>
                      <p className="text-white/60 text-sm">{guest.age} anos</p>
                      {guest.phone && <p className="text-white/60 text-sm">Tel: {guest.phone}</p>}
                    </div>
                    {guest.workshopId && (
                      <div className="text-xs text-white/50">
                        <p>Oficina: {availableWorkshops.find(w => w.id === guest.workshopId)?.nome || 'Oficina selecionada'}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveGuest(guest.id)}
                  icon={<X className="w-4 h-4" />}
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  Remover
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para adicionar convidado */}
      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Adicionar Convidado</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              icon={<X className="w-4 h-4" />}
            >
              Cancelar
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Nome do Convidado *</label>
                <input
                  type="text"
                  value={currentGuest.name || ''}
                  onChange={(e) => setCurrentGuest(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome completo do convidado"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Idade *</label>
                <input
                  type="number"
                  value={currentGuest.age || ''}
                  onChange={(e) => setCurrentGuest(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Idade"
                  min="5"
                  max="18"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Telefone do Convidado *</label>
                <input
                  type="tel"
                  value={currentGuest.phone || ''}
                  onChange={(e) => setCurrentGuest(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Oficina *</label>
                <select
                  value={currentGuest.workshopId || ''}
                  onChange={(e) => setCurrentGuest(prev => ({ ...prev, workshopId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-gray-800">Selecione uma oficina</option>
                  {availableWorkshops.map((workshop) => (
                    <option key={workshop.id} value={workshop.id} className="bg-gray-800">
                      {workshop.nome} - {workshop.instrumento} ({workshop.vagas_disponiveis} vagas)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {studentGuardianData?.guardianName && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  💡 Os dados do responsável serão automaticamente os mesmos do aluno principal: {studentGuardianData.guardianName}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAddGuest}
              disabled={!currentGuest.name || !currentGuest.age || !currentGuest.phone || !currentGuest.workshopId}
              className="flex-1"
            >
              Adicionar Convidado
            </Button>
          </div>
        </Card>
      )}

      {guests.length === 0 && !showForm && (
        <div className="text-center py-8 text-white/60">
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum convidado adicionado</p>
          <p className="text-sm">Clique em "Adicionar Convidado" para incluir amigos</p>
        </div>
      )}

      {!canAddMore && (
        <div className="text-center py-4">
          <p className="text-white/60 text-sm">
            Limite máximo de {maxGuests} convidados atingido
          </p>
        </div>
      )}
    </div>
  );
}