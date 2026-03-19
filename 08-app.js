/**
 * CQC Adestramento - Aplicação Principal
 * Roteamento, inicialização e coordenação de módulos
 */

const App = {
  /**
   * Inicializar aplicação
   */
  init: () => {
    // Inicializar módulos
    Auth.init();
    Pets.init();
    Appointments.init();
    Admin.init();
    
    // Configurar roteamento
    App.setupRouting();
    
    // Configurar UI global
    App.setupUI();
    
    // Ano no footer
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
    
    console.log('%c🐾 CQC Adestramento App', 'font-size:16px;font-weight:bold;color:#48bb78');
    console.log('Aplicação inicializada com sucesso!');
  },
  
  /**
   * Configurar roteamento por hash
   */
  setupRouting: () => {
    const handleRoute = () => {
      const hash = window.location.hash.slice(1) || 'home';
      const hashWithoutParams = hash.split('?')[0];
      
      const allowedPages = [
        'home', 'servicos', 'valores', 'regras', 'conteudos', 'contato',
        'auth', 'dashboard', 'perfil', 'pet', 'agendamentos', 'financeiro', 'admin'
      ];
      
      const targetPage = allowedPages.includes(hashWithoutParams) ? hashWithoutParams : 'home';
      
      // Proteger páginas privadas
      if (['dashboard', 'perfil', 'pet', 'agendamentos', 'financeiro'].includes(targetPage)) {
        if (!Auth.isLoggedIn()) {
          window.location.hash = '#auth';
          Utils.toast('Faça login para acessar esta área', 'warning');
          return;
        }
      }
      
      // Proteger admin
      if (targetPage === 'admin') {
        if (!Auth.isAdminUser()) {
          window.location.hash = '#dashboard';
          Utils.toast('Acesso restrito ao administrador', 'error');
          return;
        }
      }
      
      // Mostrar página
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const target = document.querySelector(`.page[data-page="${targetPage}"]`);
      if (target) {
        target.classList.add('active');
      }
      
      // Atualizar navegação
      document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.toggle('active', link.dataset.route === targetPage);
      });
      
      // Carregar dados específicos da página
      App.loadPageData(targetPage);
      
      // Scroll para topo
      window.scrollTo(0, 0);
      
      // Fechar menu mobile
      document.getElementById('navMenu')?.classList.remove('active');
    };
    
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('load', handleRoute);
    
    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    menuToggle?.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      navMenu?.classList.toggle('active');
    });
    
    navMenu?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu?.classList.remove('active');
        menuToggle?.setAttribute('aria-expanded', 'false');
      });
    });
  },
  
  /**
   * Configurar UI global
   */
  setupUI: () => {
    // Accordion
    const accHeader = document.getElementById('accHeader');
    const accContent = document.getElementById('accContent');
    
    accHeader?.addEventListener('click', () => {
      accHeader.classList.toggle('active');
      accContent?.classList.toggle('show');
    });
    
    // Formulário de contato
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value;
      const msg = document.getElementById('contactMessage').value;
      const url = `https://wa.me/5511997811891?text=Olá!%20Meu%20nome%20é%20${encodeURIComponent(name)}.%20${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      Utils.toast('Redirecionando para WhatsApp...', 'success');
      e.target.reset();
    });
    
    // Formulário de perfil
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      App.saveProfile();
    });
    
    // Exportar dados
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
      Auth.exportUserData();
    });
    
    // Exportar PDF
    document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
      Utils.toast('Funcionalidade de PDF em desenvolvimento', 'info');
    });
    
    // Botão de editar conteúdo (admin)
    document.getElementById('editContentBtn')?.addEventListener('click', () => {
      window.location.hash = '#admin';
    });
  },
  
  /**
   * Carregar dados específicos da página
   */
  loadPageData: (page) => {
    console.log('Carregando página:', page);
    
    switch(page) {
      case 'home':
        App.renderHomeServices();
        break;
      
      case 'servicos':
        App.renderServices();
        break;
      
      case 'valores':
        App.renderPricing();
        break;
      
      case 'conteudos':
        App.renderContents();
        break;
      
      case 'dashboard':
        Appointments.renderDashboard();
        Pets.renderDashboardList();
        Pets.renderVaccineAlerts();
        break;
      
      case 'perfil':
        App.loadProfile();
        break;
      
      case 'pet':
        Pets.loadFromURL();
        break;
      
      case 'agendamentos':
        Appointments.renderTable();
        break;
      
      case 'financeiro':
        Appointments.renderFinancial();
        break;
      
      case 'admin':
        Admin.load();
        break;
    }
  },
  
  /**
   * Renderizar serviços na home
   */
  renderHomeServices: () => {
    const container = document.getElementById('homeServicesGrid');
    if (!container) return;
    
    const services = App.getServicesData();
    
    container.innerHTML = services.map(s => `
      <div class="card service-card">
        <div class="service-icon">${s.icon}</div>
        <h4>${s.title}</h4>
        <p>${s.description}</p>
        <a href="#valores" class="btn btn-sm btn-secondary" style="margin-top:1rem">${s.cta}</a>
      </div>
    `).join('');
  },
  
  /**
   * Renderizar página de serviços
   */
  renderServices: () => {
    const container = document.getElementById('servicesGrid');
    if (!container) return;
    
    const services = App.getServicesData();
    
    container.innerHTML = services.map(s => `
      <div class="card service-card">
        <div class="service-icon">${s.icon}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <ul class="service-includes">
          ${s.includes.map(i => `<li>✓ ${i}</li>`).join('')}
        </ul>
        <p style="font-size:0.875rem;color:var(--color-text-muted);margin:0.5rem 0">
          <strong>Duração:</strong> ${s.duration}
        </p>
        <a href="#valores" class="btn btn-secondary btn-block" style="margin-top:1rem">${s.cta}</a>
      </div>
    `).join('');
  },
  
  /**
   * Renderizar tabela de preços
   */
  renderPricing: () => {
    const container = document.querySelector('#pricingTable tbody');
    if (!container) return;
    
    const config = Utils.get('adminConfig', {});
    const prices = config.prices || {};
    
    container.innerHTML = `
      <tr>
        <td><strong>Adestramento</strong><br><small class="text-muted">Aula individual</small></td>
        <td class="price">${Utils.formatCurrency(prices.adestramento || 150)}</td>
      </tr>
      <tr>
        <td><strong>Pet Sitter</strong><br><small class="text-muted">Visita domiciliar</small></td>
        <td class="price">${Utils.formatCurrency(prices.petSitter || 50)}</td>
      </tr>
      <tr class="subheader">
        <td colspan="2">Passeios</td>
      </tr>
      <tr>
        <td>Passeio avulso 30 minutos</td>
        <td class="price">${Utils.formatCurrency(prices.passeio30 || 30)}</td>
      </tr>
      <tr>
        <td>Passeio avulso 50 minutos</td>
        <td class="price">${Utils.formatCurrency(prices.passeio50 || 50)}</td>
      </tr>
      <tr>
        <td>Plano mensal 2x por semana</td>
        <td class="price">${Utils.formatCurrency(prices.passeioMensal2x || 200)}/mês</td>
      </tr>
      <tr>
        <td>Plano mensal 3x por semana</td>
        <td class="price">${Utils.formatCurrency(prices.passeioMensal3x || 350)}/mês</td>
      </tr>
      <tr>
        <td>Plano mensal 4x por semana</td>
        <td class="price">${Utils.formatCurrency(prices.passeioMensal4x || 500)}/mês</td>
      </tr>
      <tr>
        <td>Plano mensal 5x por semana</td>
        <td class="price">${Utils.formatCurrency(prices.passeioMensal5x || 600)}/mês</td>
      </tr>
      <tr class="subheader">
        <td colspan="2">Hospedagem</td>
      </tr>
      <tr>
        <td>Diária - Dia de semana</td>
        <td class="price">${Utils.formatCurrency(prices.hospedagemWeekday || 80)}</td>
      </tr>
      <tr>
        <td>Diária - Fim de semana</td>
        <td class="price">${Utils.formatCurrency(prices.hospedagemWeekend || 90)}</td>
      </tr>
      <tr>
        <td>Diária - Feriado</td>
        <td class="price">${Utils.formatCurrency(prices.hospedagemHoliday || 100)}</td>
      </tr>
      <tr>
        <td>Diária - Alta temporada*</td>
        <td class="price">${Utils.formatCurrency(prices.hospedagemHighSeason || 120)}</td>
      </tr>
      <tr class="subheader">
        <td colspan="2">Daycare</td>
      </tr>
      <tr>
        <td>Diária - Dia de semana</td>
        <td class="price">${Utils.formatCurrency(prices.daycareWeekday || 70)}</td>
      </tr>
      <tr>
        <td>Diária - Fim de semana</td>
        <td class="price">${Utils.formatCurrency(prices.daycareWeekend || 90)}</td>
      </tr>
      <tr>
        <td>Diária - Feriado</td>
        <td class="price">${Utils.formatCurrency(prices.daycareHoliday || 90)}</td>
      </tr>
      <tr>
        <td>Diária - Alta temporada*</td>
        <td class="price">${Utils.formatCurrency(prices.daycareHighSeason || 100)}</td>
      </tr>
    `;
  },
  
  /**
   * Renderizar conteúdos educacionais
   */
  renderContents: () => {
    const container = document.getElementById('contentGrid');
    if (!container) return;
    
    const contents = Utils.get('educationalContent', []);
    
    if (contents.length === 0) {
      container.innerHTML = '<p class="text-center" style="grid-column:1/-1">Nenhum conteúdo disponível no momento.</p>';
      return;
    }
    
    container.innerHTML = contents.map(c => `
      <a href="#" class="content-card" onclick="App.viewContent('${c.id}'); return false;">
        <h4>${c.title}</h4>
        <p class="meta">${c.type === 'video' ? '🎥 Vídeo' : '📄 Artigo'} • ${Utils.formatDate(c.createdAt)}</p>
        <p>${Utils.truncate(c.excerpt, 100)}</p>
        <span style="color:var(--color-accent);font-weight:500">Ler mais →</span>
      </a>
    `).join('');
  },
  
  /**
   * Visualizar conteúdo
   */
  viewContent: (id) => {
    const contents = Utils.get('educationalContent', []);
    const content = contents.find(c => c.id === id);
    if (!content) return;
    
    const modalContent = `
      <div class="modal">
        <div class="modal-header">
          <h3 id="modalTitle" style="margin:0">${content.title}</h3>
          <button class="modal-close" onclick="Utils.hideModal()">&times;</button>
        </div>
        <div class="modal-body">
          <p class="text-muted" style="margin-bottom:1rem">
            ${content.type === 'video' ? '🎥 Vídeo educativo' : '📄 Artigo'} • Publicado em ${Utils.formatDate(content.createdAt)}
          </p>
          ${content.type === 'video' ? `
            <div style="background:var(--color-bg-hover);border-radius:var(--radius-md);padding:2rem;text-align:center;margin-bottom:1rem">
              <p style="font-size:2rem">▶️</p>
              <p>Player de vídeo (demonstração)</p>
            </div>
          ` : ''}
          <p style="white-space:pre-wrap">${content.content}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Utils.hideModal()">Fechar</button>
        </div>
      </div>
    `;
    
    Utils.showModal(modalContent);
  },
  
  /**
   * Carregar perfil
   */
  loadProfile: () => {
    if (!Auth.currentUser) return;
    
    const profile = Auth.currentUser.profile || {};
    
    document.getElementById('pName').value = profile.name || Auth.currentUser.name;
    document.getElementById('pBirth').value = profile.birthdate || '';
    document.getElementById('pProfession').value = profile.profession || '';
    document.getElementById('pCpf').value = profile.cpf || '';
    document.getElementById('pAddress').value = profile.address || '';
    document.getElementById('pEmail').value = profile.email || Auth.currentUser.email;
    document.getElementById('pPhone').value = profile.phone || '';
    document.getElementById('pEmergency').value = profile.emergencyContact || '';
    document.getElementById('pNotes').value = profile.notes || '';
    document.getElementById('t2Name').value = profile.tutor2?.name || '';
    document.getElementById('t2Phone').value = profile.tutor2?.phone || '';
    document.getElementById('t2Relation').value = profile.tutor2?.relation || '';
  },
  
  /**
   * Salvar perfil
   */
  saveProfile: () => {
    if (!Auth.currentUser) return;
    
    const updates = {
      profile: {
        name: document.getElementById('pName').value.trim(),
        birthdate: document.getElementById('pBirth').value,
        profession: document.getElementById('pProfession').value.trim(),
        cpf: document.getElementById('pCpf').value.trim(),
        address: document.getElementById('pAddress').value.trim(),
        email: document.getElementById('pEmail').value.trim(),
        phone: document.getElementById('pPhone').value.trim(),
        emergencyContact: document.getElementById('pEmergency').value.trim(),
        tutor2: {
          name: document.getElementById('t2Name').value.trim(),
          phone: document.getElementById('t2Phone').value.trim(),
          relation: document.getElementById('t2Relation').value
        },
        notes: document.getElementById('pNotes').value.trim()
      }
    };
    
    if (Auth.updateUser(Auth.currentUser.id, updates)) {
      Utils.toast('Perfil atualizado com sucesso!', 'success');
      setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 1000);
    } else {
      Utils.toast('Erro ao salvar. Tente novamente.', 'error');
    }
  },
  
  /**
   * Dados dos serviços
   */
  getServicesData: () => {
    return [
      {
        id: 'adestramento',
        icon: '🎾',
        title: 'Adestramento',
        description: 'Método positivo e individualizado para corrigir comportamentos indesejados e fortalecer o vínculo tutor-pet.',
        includes: ['Avaliação comportamental', 'Plano customizado', 'Material de apoio', 'Relatório de progresso'],
        duration: '50 minutos por aula',
        cta: 'Consultar disponibilidade'
      },
      {
        id: 'pet-sitter',
        icon: '🏠',
        title: 'Pet Sitter',
        description: 'Cuidado domiciliar para quando você precisa ausentar-se. Visita programada com alimentação, higiene e brincadeiras.',
        includes: ['Alimentação conforme rotina', 'Limpeza de necessidades', 'Brincadeiras', 'Envio de fotos/vídeos', 'Verificação de segurança'],
        duration: '50 minutos por visita',
        cta: 'Saber mais'
      },
      {
        id: 'passeios',
        icon: '🚶',
        title: 'Passeios',
        description: 'Passeios individuais ou em pequenos grupos compatíveis, respeitando o ritmo e as necessidades do seu cão.',
        includes: ['Condução segura e profissional', 'Exercícios para melhor comportamento', 'Limpeza de patas', 'Relatório do passeio'],
        duration: '30min ou 50min | Planos mensais',
        cta: 'Ver planos'
      },
      {
        id: 'hospedagem',
        icon: '🌙',
        title: 'Hospedagem & Daycare',
        description: 'Ambiente residencial seguro e acolhedor, com atenção 24h e atividades supervisionadas.',
        includes: ['Acomodação personalizada', '2-3 passeios diários', 'Alimentação conforme instruções', 'Fotos e vídeos diários', 'Administração de medicamentos'],
        duration: 'Diária ou pacotes',
        cta: 'Simular estadia'
      }
    ];
  },
  
  /**
   * Obter nome do serviço
   */
  getServiceName: (service) => {
    return Appointments.getServiceName(service);
  }
};

window.App = App;

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}