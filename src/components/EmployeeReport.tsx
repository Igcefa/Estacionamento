import React, { useState, useMemo } from 'react';
import { Users, Clock, Calendar, Download, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface UserSession {
  id: string;
  user_id: string;
  login_time: Date;
  logout_time?: Date;
  ip_address?: string;
  user_agent?: string;
}

export default function EmployeeReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState('all');
  const { state } = useApp();

  // Mock data for demonstration - in real app this would come from user_sessions table
  const mockSessions: UserSession[] = useMemo(() => {
    const sessions: UserSession[] = [];
    const today = new Date(selectedDate);
    
    state.users.forEach(user => {
      // Generate some mock sessions for demonstration
      const loginTime = new Date(today);
      loginTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      
      const logoutTime = new Date(loginTime);
      logoutTime.setHours(loginTime.getHours() + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      
      sessions.push({
        id: `session-${user.id}-${today.getTime()}`,
        user_id: user.id,
        login_time: loginTime,
        logout_time: Math.random() > 0.3 ? logoutTime : undefined, // 70% chance of logout
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    });
    
    return sessions;
  }, [selectedDate, state.users]);

  const filteredSessions = useMemo(() => {
    let sessions = mockSessions.filter(session => {
      const sessionDate = session.login_time.toISOString().split('T')[0];
      return sessionDate === selectedDate;
    });

    if (selectedUser !== 'all') {
      sessions = sessions.filter(session => session.user_id === selectedUser);
    }

    return sessions;
  }, [mockSessions, selectedDate, selectedUser]);

  const getUserName = (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };

  const getUserRole = (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    const roleLabels = {
      administrator: 'Administrador',
      manager: 'Gerente',
      operator: 'Operador'
    };
    return user ? roleLabels[user.role] || user.role : '';
  };

  const calculateWorkingHours = (loginTime: Date, logoutTime?: Date) => {
    if (!logoutTime) return 'Em andamento';
    
    const diffMs = logoutTime.getTime() - loginTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
  };

  const exportReport = () => {
    const report = `RELATÓRIO DE FUNCIONÁRIOS
==================
Data: ${new Date(selectedDate).toLocaleDateString('pt-BR')}
Usuário: ${selectedUser === 'all' ? 'Todos' : getUserName(selectedUser)}

SESSÕES DE TRABALHO
${filteredSessions.map(session => {
  const user = state.users.find(u => u.id === session.user_id);
  return `
${user?.name} (${getUserRole(session.user_id)})
  Entrada: ${session.login_time.toLocaleString('pt-BR')}
  Saída: ${session.logout_time ? session.logout_time.toLocaleString('pt-BR') : 'Em andamento'}
  Tempo: ${calculateWorkingHours(session.login_time, session.logout_time)}
  IP: ${session.ip_address || 'N/A'}
`;
}).join('\n')}

Total de sessões: ${filteredSessions.length}
Gerado em: ${new Date().toLocaleString('pt-BR')}
==================`;

    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `relatorio_funcionarios_${selectedDate}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Relatório de Funcionários</h2>
          <button
            onClick={exportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funcionário
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os funcionários</option>
              {state.users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({getUserRole(user.id)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Sessões</p>
              <p className="text-2xl font-bold text-gray-800">{filteredSessions.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Funcionários Ativos</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredSessions.filter(s => !s.logout_time).length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Média de Horas</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredSessions.length > 0 
                  ? Math.round(filteredSessions
                      .filter(s => s.logout_time)
                      .reduce((acc, s) => {
                        const hours = (s.logout_time!.getTime() - s.login_time.getTime()) / (1000 * 60 * 60);
                        return acc + hours;
                      }, 0) / filteredSessions.filter(s => s.logout_time).length * 10) / 10
                  : 0
                }h
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Sessões de Trabalho ({filteredSessions.length})
        </h3>
        
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma sessão encontrada para a data selecionada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Funcionário</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cargo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Entrada</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Saída</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tempo Trabalhado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions
                  .sort((a, b) => b.login_time.getTime() - a.login_time.getTime())
                  .map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {getUserName(session.user_id)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {getUserRole(session.user_id)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {session.login_time.toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {session.logout_time 
                          ? session.logout_time.toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {calculateWorkingHours(session.login_time, session.logout_time)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          session.logout_time 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {session.logout_time ? 'Finalizada' : 'Ativa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                        {session.ip_address || 'N/A'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}