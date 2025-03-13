'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaGoogle, FaUsers, FaCalendarAlt, FaFileInvoiceDollar, FaUserCog, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Componente de cartão para funcionalidades
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <motion.div 
    className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
    whileHover={{ y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Lista de funcionalidades
  const features = [
    {
      icon: <FaUsers className="w-6 h-6" />,
      title: "Gestão de Integrantes",
      description: "Cadastro completo dos membros da equipe, com informações de contato e histórico de participação."
    },
    {
      icon: <FaCalendarAlt className="w-6 h-6" />,
      title: "Eventos",
      description: "Organização e controle de todos os eventos da equipe, com datas, participantes e responsáveis."
    },
    {
      icon: <FaFileInvoiceDollar className="w-6 h-6" />,
      title: "Cobranças",
      description: "Gerenciamento de mensalidades e outras contribuições financeiras, com histórico e status de pagamento."
    },
    {
      icon: <FaUserCog className="w-6 h-6" />,
      title: "Área Administrativa",
      description: "Painel exclusivo para coordenadores com ferramentas de gestão avançadas e relatórios."
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Logo do sistema - substitua pelo logo real depois */}
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">SC</div>
            <h1 className="text-xl font-bold text-gray-800">Sistema Coringas</h1>
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Seção principal hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <motion.div 
          className="md:w-1/2 mb-10 md:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Plataforma de Gestão da <br />
            <span className="text-blue-600">Equipe Coringas</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Um sistema integrado para gerenciar todos os aspectos da sua equipe, 
            desde membros até eventos e finanças.
          </p>
          <div className="flex space-x-4">
            <Link href="/register" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              Começar agora <FaArrowRight className="ml-2" />
            </Link>
            <a href="#features" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Saiba mais
            </a>
          </div>
        </motion.div>
        <motion.div 
          className="md:w-1/2 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Imagem ilustrativa do sistema - substitua por uma imagem real depois */}
          <div className="w-full max-w-md h-80 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-20 h-20 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                  <FaUsers className="w-8 h-8" />
                </div>
                <p className="text-xl font-semibold">Dashboard Interativo</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Seção de funcionalidades */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Funcionalidades do Sistema</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conheça os principais módulos e ferramentas disponíveis para gerenciar sua equipe de forma eficiente.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Novas funcionalidades estão sempre sendo desenvolvidas.
              Tem sugestões? Entre em contato com a coordenação da equipe!
            </p>
            <Link href="/register" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              Cadastre-se agora e comece a usar <FaChevronRight className="ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Seção de processo de registro */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Como Acessar o Sistema</h2>
            <p className="text-gray-600">
              Entenda o processo de registro e acesso à plataforma.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">1</span>
              Registro com Conta Google
            </h3>
            <p className="text-gray-600 mb-4">
              O cadastro é realizado com sua conta Google, garantindo maior segurança e facilidade.
              Apenas forneça o acesso quando solicitado e seus dados básicos serão importados automaticamente.
            </p>
            <div className="flex justify-center mt-6">
              <Link 
                href="/register" 
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <FaGoogle className="mr-2 text-red-500" /> Continuar com Google
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">2</span>
              Aprovação pelo Administrador
            </h3>
            <p className="text-gray-600 mb-4">
              Após o registro, um administrador do sistema precisará aprovar seu acesso.
              Você receberá uma notificação quando seu acesso for liberado.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700">
              <p className="text-sm">
                Esta etapa de aprovação garante a segurança do sistema e confirma que apenas membros autorizados tenham acesso às informações da equipe.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">3</span>
              Acesso ao Sistema
            </h3>
            <p className="text-gray-600 mb-4">
              Após a aprovação, você terá acesso completo ao sistema e suas funcionalidades, 
              de acordo com seu perfil de usuário.
            </p>
            <div className="flex space-x-4 justify-center mt-6">
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entrar no Sistema
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Novo Cadastro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Sistema Coringas</h2>
              <p className="text-gray-400">Plataforma de gestão para a equipe</p>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Sistema Coringas. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
