/**
 * CQC Adestramento - Módulo de Autenticação
 * Login, cadastro, sessão e proteção de rotas
 */

const Auth = {
  // Estado atual do usuário
  currentUser: null,
  isAdmin: false,
  
  /**
   * Inicializar módulo de autenticação
   */
  init: () => {
    // Carregar sessão salva
    const savedSession = Utils.get('session');
    if (savedSession) {
      Auth.currentUser = savedSession;
      Auth.isAdmin = savedSession.role === 'admin';
    }
    
    // Inicializar seed data se vazio
    if (!Utils.get('users')) {
      Auth.seedData();
    }
    
    // Atualizar UI
    Auth.updateUI();
    
    // Bind de eventos
    Auth.bindEvents();
  },
  
  /**
   * Dados de teste para demonstração
   */
  seedData: () => {
    // Usuários
    Utils.save('users', [
      {
        id: 'user_001',
        name: 'Maria Silva',
        email: 'maria@email.com',
        password: '123',
        role: 'client',
        createdAt: new Date().toISOString(),
        profile: {
          birthdate: '1990-05-15',
          profession: 'Designer',
          cpf: '123.456.789-00',
          address: 'Rua das Flores, 123 - São Paulo/SP',
          phone: '(11) 9 8888-7777',
          emergencyContact: 'João Silva - (11) 9 7777-6666',
          tutor2: { name: 'João Silva', phone: '(11) 9 7777-6666', relation: 'cônjuge' },
          notes: 'Prefere contato por WhatsApp'
        }
      },
      {
        id: 'user_002',
        name: 'Carlos Oliveira',
        email: 'carlos@email.com',
        password: '123',
        role: 'client',
        createdAt: new Date().toISOString(),
        profile: {
          birthdate: '1985-08-22',
          profession: 'Engenheiro',
          cpf: '987.654.321-00',
          address: 'Av. Paulista, 1000 - São Paulo/SP',
          phone: '(11) 9 9999-8888',
          emergencyContact: 'Ana Oliveira - (11) 9 6666-5555',
          notes: ''
        }
      },
      {
        id: 'admin_001',
        name: 'Administrador',
        email: 'admin@cqc.com',
        password: 'admin',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ]);
    
    // Configurações admin
    Utils.save('adminConfig', {
      prices: {
        adestramento: 150,
        petSitter: 50,
        passeio30: 30,
        passeio50: 50,
        passeioMensal2x: 200,
        passeioMensal3x: 350,
        passeioMensal4x: 500,
        passeioMensal5x: 600,
        hospedagemWeekday: 80,
        hospedagemWeekend: 90,
        hospedagemHoliday: 100,
        hospedagemHighSeason: 120,
        daycareWeekday: 70,
        daycareWeekend: 90,
        daycareHoliday: 90,
        daycareHighSeason: 100
      },
      highSeasonMonths: [7, 12, 1],
      cancellationPolicy: {
        normal: { hours: 48, fee: 0.3 },
        highSeason: { days: 10, fee: 0.5 }
      }
    });
    
    // Conteúdo educacional
    Utils.save('educationalContent', [
      {
        id: 'edu_001',
        title: 'Como preparar seu cão para hospedagem',
        excerpt: 'Dicas essenciais para deixar seu pet tranquilo durante a estadia.',
        content: 'Prepare seu cão para hospedagem com antecedência. Leve brinquedos familiares, mantenha a rotina de alimentação e informe todos os cuidados especiais. Visite o local antes se possível.',
        type: 'article',
        createdAt: new Date().toISOString()
      },
      {
        id: 'edu_002',
        title: 'Sinais de estresse em cães',
        excerpt: 'Aprenda a identificar quando seu cão está ansioso ou desconfortável.',
        content: 'Sinais comuns de estresse: bocejos excessivos, lambedura de lábios, orelhas para trás, rabo entre as pernas, ofego sem exercício, evitar contato visual. Consulte um profissional se observar esses sinais.',
        type: 'article',
        createdAt: new Date().toISOString()
      },
      {
        id: 'edu_003',
        title: 'Importância da socialização',
        excerpt: 'Por que socializar seu filhote é fundamental para um adulto equilibrado.',
        content: 'A socialização deve ocorrer principalmente entre 3 e 14 semanas de vida. Exponha seu filhote a diferentes pessoas, animais, sons e ambientes de forma positiva e gradual.',
        type: 'article',
        createdAt: new Date().toISOString()
      }
    ]);
    
    console.log('Seed data inicializado com sucesso');
  },
  
  /**
   * Bind de eventos do formulário de auth
   */
  bindEvents: () => {
    // Toggle login/cadastro
    const toggleLogin = document.getElementById('toggleLogin');
    const toggleRegister = document.getElementById('toggleRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    toggleLogin?.addEventListener('click', () => {
      toggleLogin.classList.add('active');
      toggleRegister.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });
    
    toggleRegister?.addEventListener('click', () => {
      toggleRegister.classList.add('active');
      toggleLogin.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });
    
    // Login form
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      Auth.login();
    });
    
    // Register form
    registerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      Auth.register();
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      if (confirm('Deseja realmente sair?')) {
        Auth.logout();
      }
    });
    
    // Admin toggle
    document.getElementById('adminToggle')?.addEventListener('click', () => {
      window.location.hash = '#admin';
    });
    
    // Admin logout
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
      Auth.logout();
    });
    
    // Validações em tempo real
    const regPassword = document.getElementById('regPassword');
    const regConfirm = document.getElementById('regConfirm');
    const loginEmail = document.getElementById('loginEmail');
    const regEmail = document.getElementById('regEmail');
    const pCpf = document.getElementById('pCpf');
    const pPhone = document.getElementById('pPhone');
    const t2Phone = document.getElementById('t2Phone');
    
    // Máscaras
    pCpf?.addEventListener('input', function() {
      this.value = Utils.maskCPF(this.value);
    });
    
    [pPhone, t2Phone].forEach(input => {
      input?.addEventListener('input', function() {
        this.value = Utils.maskPhone(this.value);
      });
    });
    
    // Validações
    Utils.setupValidation(loginEmail, Utils.validateEmail, 'E-mail inválido');
    Utils.setupValidation(regEmail, Utils.validateEmail, 'E-mail inválido');
    Utils.setupValidation(regPassword, Utils.validatePassword, 'Senha deve ter pelo menos 6 caracteres');
    Utils.setupValidation(regConfirm, (v) => v === regPassword?.value, 'As senhas não conferem');
    Utils.setupValidation(pCpf, Utils.validateCPF, 'CPF inválido');
  },
  
  /**
   * Atualizar UI baseada no estado de autenticação
   */
  updateUI: () => {
    const authLink = document.getElementById('authLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminToggle = document.getElementById('adminToggle');
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    
    if (Auth.currentUser) {
      authLink?.classList.add('hidden');
      dashboardLink?.classList.remove('hidden');
      logoutBtn?.classList.remove('hidden');
      
      if (Auth.isAdmin) {
        adminToggle?.classList.remove('hidden');
        document.body.classList.add('admin-mode');
        adminOnlyElements.forEach(el => el.classList.remove('hidden'));
      } else {
        adminToggle?.classList.add('hidden');
        document.body.classList.remove('admin-mode');
        adminOnlyElements.forEach(el => el.classList.add('hidden'));
      }
      
      // Atualizar nome no dashboard
      const dashWelcome = document.getElementById('dashWelcome');
      if (dashWelcome) {
        const firstName = Auth.currentUser.name.split(' ')[0];
        dashWelcome.textContent = `Olá, ${firstName}! 👋`;
      }
    } else {
      authLink?.classList.remove('hidden');
      dashboardLink?.classList.add('hidden');
      logoutBtn?.classList.add('hidden');
      adminToggle?.classList.add('hidden');
      document.body.classList.remove('admin-mode');
      adminOnlyElements.forEach(el => el.classList.add('hidden'));
    }
  },
  
  /**
   * Fazer login
   */
  login: () => {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
      Utils.toast('Preencha e-mail e senha', 'error');
      return;
    }
    
    const users = Utils.get('users', []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (user) {
      Auth.currentUser = user;
      Auth.isAdmin = user.role === 'admin';
      Utils.save('session', user);
      Auth.updateUI();
      Utils.toast('Login realizado com sucesso!', 'success');
      
      // Redirecionar
      setTimeout(() => {
        window.location.hash = user.role === 'admin' ? '#admin' : '#dashboard';
      }, 500);
    } else {
      Utils.toast('E-mail ou senha inválidos', 'error');
    }
  },
  
  /**
   * Fazer cadastro
   */
  register: () => {
    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirm = document.getElementById('regConfirm')?.value;
    const terms = document.getElementById('regTerms')?.checked;
    
    // Validações
    if (!name || !email || !password) {
      Utils.toast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    if (password.length < 6) {
      Utils.toast('Senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }
    
    if (password !== confirm) {
      Utils.toast('As senhas não conferem', 'error');
      return;
    }
    
    if (!terms) {
      Utils.toast('Você deve aceitar os termos', 'error');
      return;
    }
    
    const users = Utils.get('users', []);
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      Utils.toast('E-mail já cadastrado', 'error');
      return;
    }
    
    // Criar usuário
    const newUser = {
      id: Utils.generateId('user_'),
      name,
      email,
      password,
      role: 'client',
      createdAt: new Date().toISOString(),
      profile: {}
    };
    
    users.push(newUser);
    Utils.save('users', users);
    
    // Login automático
    Auth.currentUser = newUser;
    Auth.isAdmin = false;
    Utils.save('session', newUser);
    Auth.updateUI();
    
    Utils.toast('Cadastro realizado! Complete seu perfil.', 'success');
    
    setTimeout(() => {
      window.location.hash = '#perfil';
    }, 500);
  },
  
  /**
   * Fazer logout
   */
  logout: () => {
    Auth.currentUser = null;
    Auth.isAdmin = false;
    Utils.remove('session');
    Auth.updateUI();
    window.location.hash = '#home';
    Utils.toast('Você saiu da sua conta', 'success');
  },
  
  /**
   * Verificar se usuário está logado
   * @returns {boolean} - Usuário logado
   */
  isLoggedIn: () => {
    return Auth.currentUser !== null;
  },
  
  /**
   * Verificar se é admin
   * @returns {boolean} - É admin
   */
  isAdminUser: () => {
    return Auth.isAdmin;
  },
  
  /**
   * Obter usuário por ID
   * @param {string} userId - ID do usuário
   * @returns {object|null} - Usuário ou null
   */
  getUserById: (userId) => {
    const users = Utils.get('users', []);
    return users.find(u => u.id === userId) || null;
  },
  
  /**
   * Atualizar dados do usuário
   * @param {string} userId - ID do usuário
   * @param {object} updates - Dados a atualizar
   * @returns {boolean} - Sucesso
   */
  updateUser: (userId, updates) => {
    const users = Utils.get('users', []);
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      Utils.save('users', users);
      
      // Atualizar sessão se for o usuário atual
      if (Auth.currentUser?.id === userId) {
        Auth.currentUser = users[index];
        Utils.save('session', users[index]);
        Auth.updateUI();
      }
      
      return true;
    }
    return false;
  },
  
  /**
   * Exportar dados do usuário
   */
  exportUserData: () => {
    if (!Auth.currentUser) return;
    
    const user = Auth.currentUser;
    const pets = Utils.get('pets', []).filter(p => p.userId === user.id);
    const appointments = Utils.get('appointments', []).filter(a => a.userId === user.id);
    
    let text = `=== DADOS DO TUTOR ===\n`;
    text += `Nome: ${user.name}\n`;
    text += `E-mail: ${user.email}\n`;
    text += `CPF: ${user.profile?.cpf || 'Não informado'}\n`;
    text += `Telefone: ${user.profile?.phone || 'Não informado'}\n`;
    text += `Endereço: ${user.profile?.address || 'Não informado'}\n`;
    text += `Data de cadastro: ${Utils.formatDate(user.createdAt)}\n\n`;
    
    text += `=== PETS (${pets.length}) ===\n`;
    pets.forEach(pet => {
      text += `\n• ${pet.name} (${pet.breed})\n`;
      text += `  Nascimento: ${pet.birthdate} | Peso: ${pet.weight}kg | Sexo: ${pet.sex}\n`;
      text += `  Microchip: ${pet.microchip || 'N/A'} | RGA: ${pet.rga || 'N/A'}\n`;
      text += `  Saúde: Castrado: ${pet.health?.neutered ? 'Sim' : 'Não'}\n`;
      text += `  Plano de saúde: ${pet.health?.plan || 'N/A'}\n`;
      text += `  Condições: ${pet.health?.conditions || 'Nenhuma'}\n`;
      text += `  Comportamento: ${pet.behavior?.sociabilityDogs || 'N/A'} com cães, ${pet.behavior?.sociabilityHumans || 'N/A'} com humanos\n`;
      text += `  Alimentação: ${pet.food?.type || 'N/A'} - ${pet.food?.portion || 'N/A'} - ${pet.food?.schedule || 'N/A'}\n`;
      text += `  Observações: ${pet.alerts || 'Nenhuma'}\n`;
      text += `  Personalidade: ${pet.personality || 'N/A'}\n`;
    });
    
    text += `\n=== AGENDAMENTOS (${appointments.length}) ===\n`;
    appointments.forEach(apt => {
      text += `\n• ${App.getServiceName(apt.service)}\n`;
      text += `  Data: ${Utils.formatDate(apt.startDate)}${apt.endDate ? ` a ${Utils.formatDate(apt.endDate)}` : ''}\n`;
      text += `  Pet: ${pets.find(p => p.id === apt.petId)?.name || 'N/A'}\n`;
      text += `  Valor: ${Utils.formatCurrency(apt.totalPrice)}\n`;
      text += `  Status: ${apt.status} | Pagamento: ${apt.paymentStatus}\n`;
    });
    
    text += `\n=== EXPORTADO EM ${Utils.formatDateTime(new Date())} ===\n`;
    
    const filename = `dados-cqc-${user.name.split(' ')[0].toLowerCase()}-${Date.now()}.txt`;
    Utils.downloadFile(text, filename);
    Utils.toast('Dados exportados com sucesso!', 'success');
  }
};

// Exportar para escopo global
window.Auth = Auth;