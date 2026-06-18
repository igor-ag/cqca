/**
 * CQC Adestramento - Módulo Administrativo
 * Gerencia Blog, Agendamentos e Clientes
 */

const Admin = {
  init: () => {
    Admin.bindEvents();
  },
  
  bindEvents: () => {
    // Tabs do admin
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        Admin.switchTab(tab);
      });
    });
    
    // Botão novo post
    document.getElementById('addBlogPostBtn')?.addEventListener('click', () => {
      Admin.openBlogPostModal();
    });
    
    // Delegação de eventos
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="edit-post"]')) {
        Admin.openBlogPostModal(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="delete-post"]')) {
        Admin.deleteBlogPost(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="edit-appointment"]')) {
        Admin.openAppointmentModal(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="delete-appointment"]')) {
        Admin.deleteAppointment(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="mark-paid"]')) {
        Admin.markAsPaid(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="add-invoice"]')) {
        Admin.openInvoiceModal(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="download-invoice"]')) {
        Admin.downloadInvoice(e.target.dataset.id);
      }
    });
    
    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          Admin.closeBlogPostModal();
          Admin.closeAppointmentModal();
          Admin.closeInvoiceModal();
        }
      });
    });
    
    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Admin.closeBlogPostModal();
        Admin.closeAppointmentModal();
        Admin.closeInvoiceModal();
      }
    });
  },
  
  switchTab: (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.style.borderBottomColor = isActive ? 'var(--color-primary)' : 'transparent';
      btn.style.color = isActive ? 'var(--color-text)' : 'var(--color-text-muted)';
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.style.display = pane.id === `tab-${tabName}` ? 'block' : 'none';
    });
    
    switch(tabName) {
      case 'blog': Admin.renderBlogPosts(); break;
      case 'appointments': Admin.renderAppointments(); break;
      case 'clients': break; // Link externo para Tally
    }
  },
  
  // ==================== BLOG ====================
  
  renderBlogPosts: () => {
    const container = document.getElementById('blogPostsList');
    if (!container) return;
    
    const posts = Utils.get('blogPosts', []);
    
    if (posts.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:3rem">Nenhum post criado ainda. Clique em "+ Novo Post" para começar.</p>';
      return;
    }
    
    container.innerHTML = posts.map(post => `
      <div class="card" style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
            <span style="font-size:1.5rem">${post.icon || '📝'}</span>
            <h4 style="margin:0">${post.title}</h4>
          </div>
          <p class="text-muted" style="margin:0;font-size:0.9rem">${post.excerpt}</p>
          <small class="text-muted">${post.category || 'Sem categoria'} • ${Utils.formatDate(post.createdAt)}</small>
        </div>
        <div style="display:flex;gap:0.5rem;margin-left:1rem">
          <button class="btn btn-sm btn-secondary" data-action="edit-post" data-id="${post.id}">✏️</button>
          <button class="btn btn-sm btn-secondary" style="color:var(--color-danger)" data-action="delete-post" data-id="${post.id}">🗑️</button>
        </div>
      </div>
    `).join('');
  },
  
  openBlogPostModal: (postId = null) => {
    const modal = document.getElementById('blogPostModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const posts = Utils.get('blogPosts', []);
    const post = postId ? posts.find(p => p.id === postId) : null;
    
    document.getElementById('blogPostId').value = postId || '';
    document.getElementById('blogPostTitle').value = post?.title || '';
    document.getElementById('blogPostExcerpt').value = post?.excerpt || '';
    document.getElementById('blogPostCategory').value = post?.category || '';
    document.getElementById('blogPostIcon').value = post?.icon || '📝';
    document.getElementById('blogPostContent').value = post?.content || '';
    
    document.getElementById('blogPostModalTitle').textContent = postId ? 'Editar Post' : 'Novo Post';
  },
  
  closeBlogPostModal: () => {
    const modal = document.getElementById('blogPostModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },
  
  saveBlogPost: () => {
    const postId = document.getElementById('blogPostId')?.value;
    
    const title = document.getElementById('blogPostTitle')?.value?.trim();
    const excerpt = document.getElementById('blogPostExcerpt')?.value?.trim();
    const category = document.getElementById('blogPostCategory')?.value?.trim();
    const icon = document.getElementById('blogPostIcon')?.value?.trim() || '📝';
    const content = document.getElementById('blogPostContent')?.value?.trim();
    
    if (!title || !excerpt || !content) {
      Utils.toast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    const posts = Utils.get('blogPosts', []);
    
    const postData = {
      id: postId || Utils.generateId('post_'),
      title,
      excerpt,
      category: category || 'Geral',
      icon,
      content,
      createdAt: postId ? posts.find(p => p.id === postId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (postId) {
      const index = posts.findIndex(p => p.id === postId);
      if (index !== -1) posts[index] = postData;
    } else {
      posts.unshift(postData);
    }
    
    Utils.save('blogPosts', posts);
    
    Utils.toast(postId ? 'Post atualizado!' : 'Post criado!', 'success');
    Admin.closeBlogPostModal();
    Admin.renderBlogPosts();
  },
  
  deleteBlogPost: (postId) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    
    let posts = Utils.get('blogPosts', []);
    posts = posts.filter(p => p.id !== postId);
    Utils.save('blogPosts', posts);
    
    Utils.toast('Post excluído', 'success');
    Admin.renderBlogPosts();
  },
  
  // ==================== AGENDAMENTOS ====================
  
  renderAppointments: () => {
    const container = document.getElementById('adminAppointmentsTable');
    if (!container) return;
    
    const appointments = Utils.get('appointments', []);
    const users = Utils.get('users', []);
    
    if (appointments.length === 0) {
      container.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:2rem">Nenhum agendamento.</td></tr>';
      return;
    }
    
    container.innerHTML = appointments.map(apt => {
      const user = users.find(u => u.id === apt.userId);
      const statusClass = apt.paymentStatus === 'paid' ? 'paid' : 'pending';
      
      return `
        <tr>
          <td>${user?.name || 'N/A'}</td>
          <td>${Appointments.getServiceName(apt.service)}</td>
          <td>${Utils.formatDate(apt.startDate)}</td>
          <td><span class="status-badge status-${statusClass}">${apt.paymentStatus}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" data-action="edit-appointment" data-id="${apt.id}">✏️</button>
            <button class="btn btn-sm btn-secondary" data-action="add-invoice" data-id="${apt.id}">📄</button>
          </td>
        </tr>
      `;
    }).join('');
  },
  
  openAppointmentModal: (aptId = null) => {
    Utils.toast('Funcionalidade em desenvolvimento', 'info');
  },
  
  closeAppointmentModal: () => {
    // Placeholder
  },
  
  deleteAppointment: (aptId) => {
    if (!confirm('Excluir este agendamento?')) return;
    
    let appointments = Utils.get('appointments', []);
    appointments = appointments.filter(a => a.id !== aptId);
    Utils.save('appointments', appointments);
    
    Utils.toast('Agendamento excluído', 'success');
    Admin.renderAppointments();
  },
  
  markAsPaid: (aptId) => {
    const appointments = Utils.get('appointments', []);
    const index = appointments.findIndex(a => a.id === aptId);
    
    if (index !== -1) {
      appointments[index].paymentStatus = 'paid';
      Utils.save('appointments', appointments);
      Utils.toast('Marcado como pago', 'success');
      Admin.renderAppointments();
    }
  },
  
  // ==================== NOTAS FISCAIS ====================
  
  openInvoiceModal: (aptId) => {
    Utils.toast('Funcionalidade em desenvolvimento', 'info');
  },
  
  closeInvoiceModal: () => {
    // Placeholder
  },
  
  downloadInvoice: (aptId) => {
    const apt = Appointments.getAppointmentById(aptId);
    if (!apt || !apt.invoice?.fileUrl) {
      Utils.toast('Nota fiscal não disponível', 'error');
      return;
    }
    window.open(apt.invoice.fileUrl, '_blank');
  },
  
  load: () => {
    Admin.switchTab('blog');
  }
};

window.Admin = Admin;