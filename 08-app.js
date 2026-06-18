/**
 * CQC Adestramento - Aplicação Principal
 * Roteamento e coordenação de módulos
 */

const App = {
  init: () => {
    Auth.init();
    Pets.init();
    Appointments.init();
    Admin.init();
    
    App.setupRouting();
    App.setupUI();
    
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    
    console.log('%c🐾 CQC Adestramento App', 'font-size:16px;font-weight:bold;color:#2d4a3e');
    console.log('Aplicação inicializada com sucesso!');
  },
  
  setupRouting: () => {
    const handleRoute = () => {
      const hash = window.location.hash.slice(1) || 'home';
      const hashWithoutParams = hash.split('?')[0];
      
      const allowedPages = [
        'home', 'servicos', 'valores', 'blog', 'post', 'regras', 'contato', 'cadastro',
        'auth', 'admin'
      ];
      
      const targetPage = allowedPages.includes(hashWithoutParams) ? hashWithoutParams : 'home';
      
      // Proteger admin
      if (targetPage === 'admin') {
        if (!Auth.isAdminUser()) {
          window.location.hash = '#auth';
          Utils.toast('Acesso restrito ao administrador', 'error');
          return;
        }
      }
      
      // Mostrar página
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const target = document.querySelector(`.page[data-page="${targetPage}"]`);
      if (target) target.classList.add('active');
      
      // Atualizar navegação
      document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.toggle('active', link.dataset.route === targetPage);
      });
      
      // Carregar dados específicos
      App.loadPageData(targetPage, hash);
      
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
  
  setupUI: () => {
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
  },
  
  loadPageData: (page, hash) => {
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
      
      case 'blog':
        App.renderBlog();
        break;
      
      case 'post':
        const postId = new URLSearchParams(hash.split('?')[1]).get('id');
        if (postId) App.renderBlogPost(postId);
        break;
      
      case 'admin':
        Admin.load();
        break;
    }
  },
  
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
  
  renderBlog: () => {
    const container = document.getElementById('blogGrid');
    if (!container) return;
    
    const posts = Utils.get('blogPosts', []);
    
    if (posts.length === 0) {
      container.innerHTML = '<p class="text-center text-muted" style="grid-column:1/-1;padding:3rem">Nenhum post publicado ainda.</p>';
      return;
    }
    
    container.innerHTML = posts.map(post => `
      <article class="blog-card" onclick="window.location.hash='#post?id=${post.id}'">
        <div class="blog-card-image">
          <span style="position:relative;z-index:1">${post.icon || '📝'}</span>
        </div>
        <div class="blog-card-body">
          <div class="blog-card-meta">
            <span>${post.category || 'Geral'}</span>
            <span>•</span>
            <span>${Utils.formatDate(post.createdAt)}</span>
          </div>
          <h3>${post.title}</h3>
          <p>${Utils.truncate(post.excerpt, 120)}</p>
          <span class="blog-card-link">Ler mais →</span>
        </div>
      </article>
    `).join('');
  },
  
  renderBlogPost: (postId) => {
    const container = document.getElementById('blogPost');
    if (!container) return;
    
    const posts = Utils.get('blogPosts', []);
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      container.innerHTML = '<p class="text-center text-muted">Post não encontrado.</p>';
      return;
    }
    
    // Converter markdown básico para HTML
    let content = post.content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    content = '<p>' + content + '</p>';
    
    container.innerHTML = `
      <header class="blog-post-header">
        <div class="blog-card-meta">
          <span>${post.category || 'Geral'}</span>
          <span>•</span>
          <span>${Utils.formatDate(post.createdAt)}</span>
        </div>
        <h1>${post.title}</h1>
        <p class="lead">${post.excerpt}</p>
      </header>
      <div class="blog-post-content">
        ${content}
      </div>
    `;
  },
  
  getServicesData: () => {
    return [
      {
        id: 'adestramento',
        icon: '🎾',
        title: 'Adestramento',
        description: 'Método positivo e individualizado para corrigir comportamentos e fortalecer o vínculo tutor-pet.',
        includes: ['Avaliação comportamental', 'Plano customizado', 'Material de apoio', 'Relatório de progresso'],
        duration: '50 minutos por aula',
        cta: 'Consultar disponibilidade'
      },
      {
        id: 'pet-sitter',
        icon: '🏠',
        title: 'Pet Sitter',
        description: 'Cuidado domiciliar para quando você precisa ausentar-se. Visita programada com alimentação e brincadeiras.',
        includes: ['Alimentação conforme rotina', 'Limpeza de necessidades', 'Brincadeiras', 'Envio de fotos/vídeos'],
        duration: '50 minutos por visita',
        cta: 'Saber mais'
      },
      {
        id: 'passeios',
        icon: '🚶',
        title: 'Passeios',
        description: 'Passeios individuais ou em pequenos grupos compatíveis, respeitando o ritmo do seu cão.',
        includes: ['Condução segura', 'Exercícios para comportamento', 'Limpeza de patas', 'Relatório do passeio'],
        duration: '30min ou 50min | Planos mensais',
        cta: 'Ver planos'
      },
      {
        id: 'hospedagem',
        icon: '🌙',
        title: 'Hospedagem & Daycare',
        description: 'Ambiente residencial seguro e acolhedor, com atenção 24h e atividades supervisionadas.',
        includes: ['Acomodação personalizada', '2-3 passeios diários', 'Alimentação conforme instruções', 'Fotos e vídeos diários'],
        duration: 'Diária ou pacotes',
        cta: 'Simular estadia'
      }
    ];
  }
};

window.App = App;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}