import React, { useState } from 'react';
import { Car, Users, Settings, BarChart, LogOut, CreditCard, Tags, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import VehicleManagement from './VehicleManagement';
import PricingManagement from './PricingManagement';
import CouponManagement from './CouponManagement';
import SpecialClientsManagement from './SpecialClientsManagement';
import UserManagement from './UserManagement';
import PaymentManagement from './PaymentManagement';
import Reports from './Reports';
import EmployeeReport from './EmployeeReport';
import TemplateManagement from './TemplateManagement';
import PricingCalculator from './PricingCalculator';

type ActiveTab = 'vehicles' | 'pricing' | 'coupons' | 'clients' | 'users' | 'payments' | 'reports' | 'employees' | 'templates' | 'calculator';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('vehicles');
  const { state, logout, hasPermission } = useApp();

  const tabs = [
    { id: 'vehicles', label: 'Veículos', icon: Car, permission: 'vehicles' },
    { id: 'calculator', label: 'Calculadora', icon: Calculator, permission: 'view' },
    { id: 'pricing', label: 'Tabelas', icon: Tags, permission: 'all' },
    { id: 'coupons', label: 'Cupons', icon: CreditCard, permission: 'coupons' },
    { id: 'clients', label: 'Clientes Especiais', icon: Users, permission: 'all' },
    { id: 'users', label: 'Usuários', icon: Users, permission: 'all' },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard, permission: 'all' },
    { id: 'reports', label: 'Relatórios', icon: BarChart, permission: 'reports' },
    { id: 'employees', label: 'Funcionários', icon: Users, permission: 'employees' },
    { id: 'templates', label: 'Modelos', icon: Settings, permission: 'all' },
  ] as const;

  const availableTabs = tabs.filter(tab => hasPermission(tab.permission));

  const renderContent = () => {
    switch (activeTab) {
      case 'vehicles':
        return <VehicleManagement />;
      case 'pricing':
        return <PricingManagement />;
      case 'coupons':
        return <CouponManagement />;
      case 'clients':
        return <SpecialClientsManagement />;
      case 'users':
        return <UserManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'reports':
        return <Reports />;
      case 'employees':
        return <EmployeeReport />;
      case 'templates':
        return <TemplateManagement />;
      case 'calculator':
        return <PricingCalculator />;
      default:
        return <VehicleManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Estacionamento Brasil</h1>
              <p className="text-sm text-gray-600">Sistema de Gerenciamento</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{state.currentUser?.name}</p>
              <p className="text-xs text-gray-600 capitalize">{state.currentUser?.role}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="bg-white w-64 min-h-screen shadow-sm border-r border-gray-200">
          <div className="p-4">
            <ul className="space-y-2">
              {availableTabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}