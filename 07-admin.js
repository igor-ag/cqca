/**
 * CQC Adestramento - Módulo Administrativo
 * Dashboard, relatórios, gestão de clientes, agendamentos e configurações
 */

const Admin = {
  /**
   * Inicializar módulo admin
   */
  init: () => {
    Admin.bindEvents();
  },
  
  /**
   * Bind de eventos
   */
  bindEvents: () => {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        Admin.switchTab(tab);
      });
    });
    
    // Formulário de preços
    document.getElementById('adminConfigForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Admin.savePrices();
    });
    
    // Adicionar conteúdo
    document.getElementById('addContentBtn')?.addEventListener('click', Admin.addContent);
    
    // Novo agendamento
    document.getElementById('newAppointmentBtn')?.addEventListener('click', () => {
      Admin.openAppointmentModal();
    });
    
    // Ações em botões dinâmicos
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="edit-content"]')) {
        Admin.editContent(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="delete-content"]')) {
        Admin.deleteContent(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="mark-paid"]')) {
        Admin.markAsPaid(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="add-invoice"]')) {
        Admin.addInvoice(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="edit-appointment"]')) {
        Admin.openAppointmentModal(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="delete-appointment"]')) {
        Admin.deleteAppointment(e.target.dataset.id);
      }
    });
    
    // Campos do formulário de agendamento
    ['adminAptClient', 'adminAptService', 'adminAptStart', 'adminAptEnd', 'adminAptDuration', 'adminAptFrequency'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', Admin.calculateAppointmentTotal);
    });
    
    // Fechar modal ao clicar fora
    document.querySelector('#appointmentModal .modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        Admin.closeAppointmentModal();
      }
    });
  },
  
  /**
   * Trocar aba
   */
  switchTab: (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });
    
    // Carregar dados da aba
    switch(tabName) {
      case 'appointments': Admin.renderAppointments(); break;
      case 'clients': Admin.renderClients(); break;
      case 'payments': Admin.renderPayments(); break;
      case 'reports': Admin.renderReports(); break;
      case 'settings': Admin.renderSettings(); break;
      case 'content': Admin.renderContent(); break;
    }
  },
  
  /**
   * Renderizar estatísticas
   */
  renderStats: () => {
    const users = Utils.get('users', []).filter(u => u.role !== 'admin');
    const appointments = Utils.get('appointments', []);
    const pets = Utils.get('pets', []);
    
    // Clientes
    document.getElementById('adminClients').textContent = users.length;
    
    // Agendamentos
    document.getElementById('adminAppointments').textContent = appointments.length;
    
    // Faturamento
    const revenue = appointments
      .filter(a => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + a.totalPrice, 0);
    document.getElementById('adminRevenue').textContent = Utils.formatCurrency(revenue);
    
    // Pets cadastrados (substitui ocupação)
    document.getElementById('adminPets').textContent = pets.length;
  },
  
  // ============================================
  // AGENDAMENTOS
  // ============================================
  
  /**
   * Renderizar agendamentos
   */
  renderAppointments: () => {
    const container = document.getElementById('adminAppointmentsTable');
    const clientFilter = document.getElementById('adminFilterClient');
    if (!container) return;
    
    // Popular filtro de clientes
    if (clientFilter && clientFilter.options.length <= 1) {
      const users = Utils.get('users', []).filter(u => u.role !== 'admin');
      clientFilter.innerHTML = '<option value="">Todos</option>' + 
        users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    }
    
    // Filtros
    const clientFilterVal = document.getElementById('adminFilterClient')?.value || '';
    const serviceFilterVal = document.getElementById('adminFilterService')?.value || '';
    const statusFilterVal = document.getElementById('adminFilterStatus')?.value || '';
    
    let appointments = Utils.get('appointments', []);
    const users = Utils.get('users', []);
    const pets = Utils.get('pets', []);
    
    // Aplicar filtros
    if (clientFilterVal) {
      appointments = appointments.filter(a => a.userId === clientFilterVal);
    }
    if (serviceFilterVal) {
      appointments = appointments.filter(a => a.service === serviceFilterVal);
    }
    if (statusFilterVal) {
      appointments = appointments.filter(a => {
        if (statusFilterVal === 'confirmed') return a.status === 'confirmed';
        if (statusFilterVal === 'pending') return a.status === 'confirmed' && a.paymentStatus === 'pending';
        if (statusFilterVal === 'completed') return a.status === 'completed';
        if (statusFilterVal === 'cancelled') return a.status === 'cancelled';
        return true;
      });
    }
    
    // Ordenar por data
    appointments.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    
    if (appointments.length === 0) {
      container.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">Nenhum agendamento encontrado.</td></tr>';
      return;
    }
    
    container.innerHTML = appointments.map(apt => {
      const user = users.find(u => u.id === apt.userId);
      const pet = pets.find(p => p.id === apt.petId);
      const paymentClass = apt.paymentStatus === 'paid' ? 'paid' : 'pending';
      const statusClass = apt.status === 'cancelled' ? 'cancelled' : (apt.status === 'completed' ? 'paid' : paymentClass);
      
      return `
        <tr>
          <td>${user?.name || 'N/A'}</td>
          <td>${pet?.name || 'N/A'}</td>
          <td>${Appointments.getServiceName(apt.service)}</td>
          <td>
            ${Utils.formatDate(apt.startDate)}
            ${apt.endDate && apt.endDate !== apt.startDate ? `<br><small class="text-muted">até ${Utils.formatDate(apt.endDate)}</small>` : ''}
          </td>
          <td><strong>${Utils.formatCurrency(apt.totalPrice)}</strong></td>
          <td><span class="status-badge status-${paymentClass}">${apt.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}</span></td>
          <td><span class="status-badge status-${statusClass}">${Appointments.getStatusLabel(apt)}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" data-action="edit-appointment" data-id="${apt.id}">✏️</button>
            <button class="btn btn-sm btn-secondary" style="color:var(--color-danger);margin-left:0.25rem" data-action="delete-appointment" data-id="${apt.id}">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
    
    // Re-bind filters
    document.getElementById('adminFilterClient')?.addEventListener('change', Admin.renderAppointments);
    document.getElementById('adminFilterService')?.addEventListener('change', Admin.renderAppointments);
    document.getElementById('adminFilterStatus')?.addEventListener('change', Admin.renderAppointments);
  },
  
  /**
   * Abrir modal de agendamento
   */
  openAppointmentModal: (aptId = null) => {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const users = Utils.get('users', []).filter(u => u.role !== 'admin');
    const pets = Utils.get('pets', []);
    
    // Popular clientes
    const clientSelect = document.getElementById('adminAptClient');
    clientSelect.innerHTML = '<option value="">Selecione o cliente...</option>' + 
      users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    
    // Popular pets (inicialmente vazio, atualiza ao selecionar cliente)
    const petSelect = document.getElementById('adminAptPet');
    petSelect.innerHTML = '<option value="">Selecione o cliente primeiro...</option>';
    
    // Ao selecionar cliente, atualizar pets
    clientSelect.onchange = () => {
      const userId = clientSelect.value;
      const userPets = pets.filter(p => p.userId === userId);
      petSelect.innerHTML = '<option value="">Selecione o pet...</option>' + 
        userPets.map(p => `<option value="${p.id}">${p.name} (${p.breed})</option>`).join('');
    };
    
    // Se for edição, carregar dados
    if (aptId) {
      document.getElementById('appointmentModalTitle').textContent = 'Editar Agendamento';
      document.getElementById('adminAptId').value = aptId;
      
      const apt = Appointments.getAppointmentById(aptId);
      if (apt) {
        clientSelect.value = apt.userId;
        clientSelect.onchange(); // Trigger para carregar pets
        setTimeout(() => {
          petSelect.value = apt.petId;
        }, 100);
        document.getElementById('adminAptService').value = apt.service;
        document.getElementById('adminAptStart').value = apt.startDate;
        document.getElementById('adminAptEnd').value = apt.endDate || '';
        document.getElementById('adminAptDuration').value = apt.serviceDetails?.duration || '50';
        document.getElementById('adminAptPayment').value = apt.paymentStatus;
        document.getElementById('adminAptStatus').value = apt.status;
        document.getElementById('adminAptNotes').value = apt.notes || '';
      }
    } else {
      document.getElementById('appointmentModalTitle').textContent = 'Novo Agendamento';
      document.getElementById('adminAptId').value = '';
      document.getElementById('adminAppointmentForm').reset();
    }
    
    // Mostrar/esconder campos
    Admin.toggleAppointmentFields();
    Admin.calculateAppointmentTotal();
  },
  
  /**
   * Fechar modal de agendamento
   */
  closeAppointmentModal: () => {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },
  
  /**
   * Mostrar/esconder campos do formulário
   */
  toggleAppointmentFields: () => {
    const service = document.getElementById('adminAptService')?.value;
    const endField = document.getElementById('adminAptEndField');
    const durationField = document.getElementById('adminAptDurationField');
    const frequencyField = document.getElementById('adminAptFrequencyField');
    
    if (endField) endField.classList.toggle('hidden', !['hospedagem', 'daycare'].includes(service));
    if (durationField) durationField.classList.toggle('hidden', service !== 'passeio');
    if (frequencyField) frequencyField.classList.toggle('hidden', service !== 'passeio');
  },
  
  /**
   * Calcular total do agendamento
   */
  calculateAppointmentTotal: () => {
    Admin.toggleAppointmentFields();
    
    const service = document.getElementById('adminAptService')?.value;
    const start = document.getElementById('adminAptStart')?.value;
    const end = document.getElementById('adminAptEnd')?.value;
    const duration = document.getElementById('adminAptDuration')?.value;
    const frequency = document.getElementById('adminAptFrequency')?.value;
    const totalEl = document.getElementById('adminAptTotal');
    const breakdownEl = document.getElementById('adminAptBreakdown');
    
    if (!totalEl) return;
    
    let total = 0;
    let breakdown = [];
    
    if (['hospedagem', 'daycare'].includes(service) && start && end) {
      const calc = Appointments.calculateStay(service, start, end);
      total = calc.total;
      breakdown = calc.breakdown;
    } else if (service === 'passeio' && frequency) {
      total = Appointments.calculateMonthlyWalks(frequency);
      breakdown = [{ label: `Passeio mensal (${frequency}x/semana)`, value: total }];
    } else if (service === 'passeio') {
      total = Appointments.getUnitPrice('passeio', { duration });
      breakdown = [{ label: `Passeio (${duration}min)`, value: total }];
    } else if (service) {
      total = Appointments.getUnitPrice(service);
      breakdown = [{ label: Appointments.getServiceName(service), value: total }];
    }
    
    totalEl.textContent = Utils.formatCurrency(total);
    
    if (breakdownEl) {
      if (breakdown.length > 0 && typeof breakdown[0] === 'object') {
        breakdownEl.innerHTML = breakdown.slice(0, 5).map(b => 
          `<div>${b.date || b.label}: ${Utils.formatCurrency(b.price || b.value)} ${b.tags?.length ? '(' + b.tags.join(', ') + ')' : ''}</div>`
        ).join('') + (breakdown.length > 5 ? `<div>... e mais ${breakdown.length - 5} dias</div>` : '');
      } else {
        breakdownEl.innerHTML = '';
      }
    }
    
    return total;
  },
  
  /**
   * Salvar agendamento
   */
  saveAppointment: () => {
    const aptId = document.getElementById('adminAptId')?.value;
    const userId = document.getElementById('adminAptClient')?.value;
    const petId = document.getElementById('adminAptPet')?.value;
    const service = document.getElementById('adminAptService')?.value;
    const start = document.getElementById('adminAptStart')?.value;
    const end = document.getElementById('adminAptEnd')?.value;
    const duration = document.getElementById('adminAptDuration')?.value;
    const frequency = document.getElementById('adminAptFrequency')?.value;
    const paymentStatus = document.getElementById('adminAptPayment')?.value;
    const status = document.getElementById('adminAptStatus')?.value;
    const notes = document.getElementById('adminAptNotes')?.value;
    
    // Validações
    if (!userId || !petId || !service || !start) {
      Utils.toast('Preencha os campos obrigatórios', 'error');
      return;
    }
    
    // Calcular valor
    const total = Admin.calculateAppointmentTotal();
    
    // Montar objeto
    const aptData = {
      id: aptId || Utils.generateId('apt_'),
      userId,
      petId,
      service,
      serviceDetails: { duration: duration || '50' },
      startDate: start,
      endDate: end || start,
      totalPrice: total,
      paymentStatus,
      status,
      notes,
      createdAt: aptId ? Appointments.getAppointmentById(aptId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Salvar
    const appointments = Utils.get('appointments', []);
    
    if (aptId) {
      const index = appointments.findIndex(a => a.id === aptId);
      if (index !== -1) {
        appointments[index] = aptData;
      }
    } else {
      appointments.push(aptData);
    }
    
    Utils.save('appointments', appointments);
    
    Utils.toast(aptId ? 'Agendamento atualizado!' : 'Agendamento criado!', 'success');
    Admin.closeAppointmentModal();
    Admin.renderAppointments();
    Admin.renderStats();
  },
  
  /**
   * Deletar agendamento
   */
  deleteAppointment: (aptId) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    const appointments = Utils.get('appointments', []);
    const filtered = appointments.filter(a => a.id !== aptId);
    
    if (filtered.length === appointments.length) {
      Utils.toast('Agendamento não encontrado', 'error');
      return;
    }
    
    Utils.save('appointments', filtered);
    Utils.toast('Agendamento excluído', 'success');
    Admin.renderAppointments();
    Admin.renderStats();
  },
  
  // ============================================
  // CLIENTES
  // ============================================
  
  /**
   * Renderizar clientes
   */
  renderClients: () => {
    const container = document.getElementById('adminClientsTable');
    if (!container) return;
    
    const users = Utils.get('users', []).filter(u => u.role !== 'admin');
    const pets = Utils.get('pets', []);
    const appointments = Utils.get('appointments', []);
    
    if (users.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum cliente cadastrado.</td></tr>';
      return;
    }
    
    container.innerHTML = users.map(user => {
      const userPets = pets.filter(p => p.userId === user.id).length;
      const userApts = appointments.filter(a => a.userId === user.id).length;
      
      return `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.profile?.phone || 'N/A'}</td>
          <td>${userPets}</td>
          <td>${userApts}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="Admin.editUser('${user.id}')">Editar</button>
          </td>
        </tr>
      `;
    }).join('');
  },
  
  /**
   * Editar usuário
   */
  editUser: (userId) => {
    const user = Auth.getUserById(userId);
    if (!user) return;
    
    Utils.toast(`Editar usuário: ${user.name} (funcionalidade simplificada)`, 'info');
  },
  
  // ============================================
  // PAGAMENTOS
  // ============================================
  
  /**
   * Renderizar pagamentos
   */
  renderPayments: () => {
    const container = document.getElementById('adminPaymentsTable');
    if (!container) return;
    
    const appointments = Utils.get('appointments', []);
    const users = Utils.get('users', []);
    
    if (appointments.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum agendamento.</td></tr>';
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
          <td>${Utils.formatCurrency(apt.totalPrice)}</td>
          <td><span class="status-badge status-${statusClass}">${apt.paymentStatus}</span></td>
          <td>
            ${apt.paymentStatus !== 'paid' ? 
              `<button class="btn btn-sm btn-primary" data-action="mark-paid" data-id="${apt.id}">Marcar pago</button>` : ''}
            <button class="btn btn-sm btn-secondary" data-action="add-invoice" data-id="${apt.id}" style="margin-left:0.5rem">📄 Nota</button>
          </td>
        </tr>
      `;
    }).join('');
  },
  
  /**
   * Marcar como pago
   */
  markAsPaid: (aptId) => {
    Appointments.markAsPaid(aptId);
    Admin.renderPayments();
    Admin.renderReports();
    Admin.renderAppointments();
  },
  
  /**
   * Adicionar nota fiscal
   */
  addInvoice: (aptId) => {
    Utils.toast('Nota fiscal anexada (simulação)', 'success');
  },
  
  // ============================================
  // RELATÓRIOS
  // ============================================
  
  /**
   * Renderizar relatórios
   */
  renderReports: () => {
    // Faturamento por serviço
    const revenueContainer = document.getElementById('revenueByService');
    if (revenueContainer) {
      const appointments = Utils.get('appointments', []);
      const services = ['adestramento', 'passeio', 'hospedagem', 'daycare', 'pet-sitter'];
      
      revenueContainer.innerHTML = services.map(service => {
        const total = appointments
          .filter(a => a.service === service && a.paymentStatus === 'paid')
          .reduce((sum, a) => sum + a.totalPrice, 0);
        
        return `
          <div style="display:flex;justify-content:space-between;margin:0.5rem 0;padding:0.5rem;background:var(--color-bg-hover);border-radius:var(--radius-sm)">
            <span>${Appointments.getServiceName(service)}</span>
            <strong>${Utils.formatCurrency(total)}</strong>
          </div>
        `;
      }).join('');
    }
    
    // Alertas de vacinas
    const alertsContainer = document.getElementById('vaccineAlerts');
    if (alertsContainer) {
      const alerts = Pets.getVaccineAlerts(30);
      
      if (alerts.length === 0) {
        alertsContainer.innerHTML = '<p class="text-muted" style="font-size:0.875rem">Nenhum alerta de vacina.</p>';
      } else {
        alertsContainer.innerHTML = alerts.map(alert => `
          <div style="padding:0.5rem;background:#fefcbf;color:#744210;border-radius:var(--radius-sm);margin-bottom:0.5rem;font-size:0.875rem">
            🐕 <strong>${alert.petName}</strong>: ${alert.vaccineName} vence em ${alert.daysRemaining} dia${alert.daysRemaining > 1 ? 's' : ''}
          </div>
        `).join('');
      }
    }
    
    // Clientes mais frequentes
    const topContainer = document.getElementById('topClients');
    if (topContainer) {
      const appointments = Utils.get('appointments', []);
      const users = Utils.get('users', []);
      
      const userCounts = {};
      appointments.forEach(apt => {
        userCounts[apt.userId] = (userCounts[apt.userId] || 0) + 1;
      });
      
      const sorted = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      if (sorted.length === 0) {
        topContainer.innerHTML = '<p class="text-muted">Nenhum agendamento registrado.</p>';
      } else {
        topContainer.innerHTML = sorted.map(([userId, count]) => {
          const user = users.find(u => u.id === userId);
          return `
            <div style="display:flex;justify-content:space-between;margin:0.5rem 0;padding:0.5rem;background:var(--color-bg-hover);border-radius:var(--radius-sm)">
              <span>${user?.name || 'N/A'}</span>
              <strong>${count} agendamentos</strong>
            </div>
          `;
        }).join('');
      }
    }
    
    // Inadimplências
    const defaultersContainer = document.getElementById('defaulters');
    if (defaultersContainer) {
      const appointments = Utils.get('appointments', []);
      const users = Utils.get('users', []);
      
      const defaulters = {};
      appointments.forEach(apt => {
        if (apt.paymentStatus === 'pending' && apt.status !== 'cancelled') {
          defaulters[apt.userId] = (defaulters[apt.userId] || 0) + apt.totalPrice;
        }
      });
      
      const sorted = Object.entries(defaulters)
        .sort((a, b) => b[1] - a[1]);
      
      if (sorted.length === 0) {
        defaultersContainer.innerHTML = '<p style="color:var(--color-accent)">✅ Nenhuma inadimplência!</p>';
      } else {
        defaultersContainer.innerHTML = sorted.map(([userId, amount]) => {
          const user = users.find(u => u.id === userId);
          return `
            <div style="display:flex;justify-content:space-between;margin:0.5rem 0;padding:0.5rem;background:#fed7d7;color:#822727;border-radius:var(--radius-sm)">
              <span>${user?.name || 'N/A'}</span>
              <strong>${Utils.formatCurrency(amount)}</strong>
            </div>
          `;
        }).join('');
      }
    }
  },
  
  // ============================================
  // CONFIGURAÇÕES
  // ============================================
  
  /**
   * Renderizar configurações
   */
  renderSettings: () => {
    const container = document.getElementById('pricesGrid');
    if (!container) return;
    
    const config = Utils.get('adminConfig', {});
    const prices = config.prices || {};
    
    const priceFields = [
      { key: 'adestramento', label: 'Adestramento (aula)' },
      { key: 'petSitter', label: 'Pet Sitter (visita)' },
      { key: 'passeio30', label: 'Passeio 30min' },
      { key: 'passeio50', label: 'Passeio 50min' },
      { key: 'passeioMensal2x', label: 'Passeio Mensal 2x/semana' },
      { key: 'passeioMensal3x', label: 'Passeio Mensal 3x/semana' },
      { key: 'passeioMensal4x', label: 'Passeio Mensal 4x/semana' },
      { key: 'passeioMensal5x', label: 'Passeio Mensal 5x/semana' },
      { key: 'hospedagemWeekday', label: 'Hospedagem Dia de Semana' },
      { key: 'hospedagemWeekend', label: 'Hospedagem Fim de Semana' },
      { key: 'hospedagemHoliday', label: 'Hospedagem Feriado' },
      { key: 'hospedagemHighSeason', label: 'Hospedagem Alta Temporada' },
      { key: 'daycareWeekday', label: 'Daycare Dia de Semana' },
      { key: 'daycareWeekend', label: 'Daycare Fim de Semana' },
      { key: 'daycareHoliday', label: 'Daycare Feriado' },
      { key: 'daycareHighSeason', label: 'Daycare Alta Temporada' }
    ];
    
    container.innerHTML = priceFields.map(field => `
      <div class="form-group">
        <label class="form-label" for="price_${field.key}">${field.label}</label>
        <input type="number" class="form-control" id="price_${field.key}" 
               value="${prices[field.key] || 0}" step="0.01" min="0">
      </div>
    `).join('');
  },
  
  /**
   * Salvar preços
   */
  savePrices: () => {
    const config = Utils.get('adminConfig', {});
    const prices = {};
    
    const priceFields = [
      'adestramento', 'petSitter', 'passeio30', 'passeio50',
      'passeioMensal2x', 'passeioMensal3x', 'passeioMensal4x', 'passeioMensal5x',
      'hospedagemWeekday', 'hospedagemWeekend', 'hospedagemHoliday', 'hospedagemHighSeason',
      'daycareWeekday', 'daycareWeekend', 'daycareHoliday', 'daycareHighSeason'
    ];
    
    priceFields.forEach(key => {
      const value = parseFloat(document.getElementById(`price_${key}`)?.value) || 0;
      prices[key] = value;
    });
    
    config.prices = prices;
    Utils.save('adminConfig', config);
    
    Utils.toast('Preços atualizados com sucesso!', 'success');
  },
  
  // ============================================
  // CONTEÚDO
  // ============================================
  
  /**
   * Renderizar conteúdo educacional
   */
  renderContent: () => {
    const container = document.getElementById('contentList');
    if (!container) return;
    
    const contents = Utils.get('educationalContent', []);
    
    if (contents.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum conteúdo cadastrado.</p>';
      return;
    }
    
    container.innerHTML = contents.map(c => `
      <div class="card" style="margin-bottom:0.5rem">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <strong>${c.title}</strong><br>
            <small class="text-muted">${c.excerpt}</small><br>
            <small class="text-muted">${c.type === 'video' ? '🎥 Vídeo' : '📄 Artigo'} • ${Utils.formatDate(c.createdAt)}</small>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-sm btn-secondary" data-action="edit-content" data-id="${c.id}">✏️</button>
            <button class="btn btn-sm btn-secondary" style="color:var(--color-danger)" data-action="delete-content" data-id="${c.id}">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  /**
   * Adicionar conteúdo
   */
  addContent: () => {
    const contents = Utils.get('educationalContent', []);
    const newContent = {
      id: Utils.generateId('edu_'),
      title: 'Novo conteúdo',
      excerpt: 'Descrição breve do conteúdo...',
      content: 'Conteúdo completo aqui...',
      type: 'article',
      createdAt: new Date().toISOString()
    };
    
    contents.unshift(newContent);
    Utils.save('educationalContent', contents);
    
    Admin.renderContent();
    Utils.toast('Conteúdo criado! Edite para personalizar.', 'success');
  },
  
  /**
   * Editar conteúdo
   */
  editContent: (id) => {
    const contents = Utils.get('educationalContent', []);
    const content = contents.find(c => c.id === id);
    
    if (!content) return;
    
    const newTitle = prompt('Título:', content.title);
    if (newTitle === null) return;
    
    const newExcerpt = prompt('Descrição breve:', content.excerpt);
    if (newExcerpt === null) return;
    
    const newContent = prompt('Conteúdo completo:', content.content);
    if (newContent === null) return;
    
    content.title = newTitle;
    content.excerpt = newExcerpt;
    content.content = newContent;
    
    Utils.save('educationalContent', contents);
    Admin.renderContent();
    Utils.toast('Conteúdo atualizado!', 'success');
  },
  
  /**
   * Deletar conteúdo
   */
  deleteContent: (id) => {
    if (!confirm('Excluir este conteúdo?')) return;
    
    let contents = Utils.get('educationalContent', []);
    contents = contents.filter(c => c.id !== id);
    Utils.save('educationalContent', contents);
    
    Admin.renderContent();
    Utils.toast('Conteúdo excluído', 'success');
  },
  
  /**
   * Carregar dados admin
   */
  load: () => {
    Admin.renderStats();
    Admin.switchTab('appointments');
  }
};

// Exportar para escopo global
window.Admin = Admin;