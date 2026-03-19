/**
 * CQC Adestramento - Módulo Administrativo
 * Com tab Pets, conteúdo com vídeo, e modais corrigidos
 */

const Admin = {
  init: () => {
    Admin.bindEvents();
  },
  
  bindEvents: () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      Admin.switchTab(tab);
    });
  });
  
  document.getElementById('adminConfigForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    Admin.savePrices();
  });
  
  // ✅ ESTA LINHA É IMPORTANTE - Botão "+ Novo" conteúdo
 document.getElementById('addContentBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  Admin.openContentModal(null);
});
  
  document.getElementById('newAppointmentBtn')?.addEventListener('click', () => {
    Admin.openAppointmentModal();
  });
  
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action="edit-content"]')) {
      Admin.openContentModal(e.target.dataset.id);
    }
    if (e.target.matches('[data-action="delete-content"]')) {
      Admin.deleteContent(e.target.dataset.id);
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
    if (e.target.matches('[data-action="edit-appointment"]')) {
      Admin.openAppointmentModal(e.target.dataset.id);
    }
    if (e.target.matches('[data-action="delete-appointment"]')) {
      Admin.deleteAppointment(e.target.dataset.id);
    }
    if (e.target.matches('[data-action="view-client"]')) {
      Admin.openClientModal(e.target.dataset.id);
    }
    if (e.target.matches('[data-action="view-pet"]')) {
      Admin.viewPet(e.target.dataset.id);
    }
  });
  
  ['adminAptClient', 'adminAptService', 'adminAptStart', 'adminAptEnd', 'adminAptDuration', 'adminAptFrequency'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', Admin.calculateAppointmentTotal);
  });
  
  document.getElementById('adminClientCpf')?.addEventListener('input', function() {
    this.value = Utils.maskCPF(this.value);
  });
  
  document.getElementById('adminClientPhone')?.addEventListener('input', function() {
    this.value = Utils.maskPhone(this.value);
  });
  
  document.getElementById('adminT2Phone')?.addEventListener('input', function() {
    this.value = Utils.maskPhone(this.value);
  });
  
  // Fechar modais ao clicar fora
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        Admin.closeAppointmentModal();
        Admin.closeClientModal();
        Admin.closeInvoiceModal();
        Admin.closeContentModal();
      }
    });
  });
  
  // Fechar com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      Admin.closeAppointmentModal();
      Admin.closeClientModal();
      Admin.closeInvoiceModal();
      Admin.closeContentModal();
    }
  });
},
  
  switchTab: (tabName) => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });
    
    switch(tabName) {
      case 'appointments': Admin.renderAppointments(); break;
      case 'pets': Admin.renderPets(); break;
      case 'clients': Admin.renderClients(); break;
      case 'payments': Admin.renderPayments(); break;
      case 'reports': Admin.renderReports(); break;
      case 'settings': Admin.renderSettings(); break;
      case 'content': Admin.renderContent(); break;
    }
  },
  
  renderStats: () => {
    const users = Utils.get('users', []).filter(u => u.role !== 'admin');
    const appointments = Utils.get('appointments', []);
    const pets = Utils.get('pets', []);
    
    document.getElementById('adminClients').textContent = users.length;
    document.getElementById('adminAppointments').textContent = appointments.length;
    
    const revenue = appointments.filter(a => a.paymentStatus === 'paid').reduce((sum, a) => sum + a.totalPrice, 0);
    document.getElementById('adminRevenue').textContent = Utils.formatCurrency(revenue);
    
    document.getElementById('adminPets').textContent = pets.length;
  },
  
  renderAppointments: () => {
    const container = document.getElementById('adminAppointmentsTable');
    const clientFilter = document.getElementById('adminFilterClient');
    if (!container) return;
    
    if (clientFilter && clientFilter.options.length <= 1) {
      const users = Utils.get('users', []).filter(u => u.role !== 'admin');
      clientFilter.innerHTML = '<option value="">Todos</option>' + users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    }
    
    const clientFilterVal = document.getElementById('adminFilterClient')?.value || '';
    const serviceFilterVal = document.getElementById('adminFilterService')?.value || '';
    const statusFilterVal = document.getElementById('adminFilterStatus')?.value || '';
    
    let appointments = Utils.get('appointments', []);
    const users = Utils.get('users', []);
    const pets = Utils.get('pets', []);
    
    if (clientFilterVal) appointments = appointments.filter(a => a.userId === clientFilterVal);
    if (serviceFilterVal) appointments = appointments.filter(a => a.service === serviceFilterVal);
    if (statusFilterVal) {
      appointments = appointments.filter(a => {
        if (statusFilterVal === 'confirmed') return a.status === 'confirmed';
        if (statusFilterVal === 'pending') return a.status === 'confirmed' && a.paymentStatus === 'pending';
        if (statusFilterVal === 'completed') return a.status === 'completed';
        if (statusFilterVal === 'cancelled') return a.status === 'cancelled';
        return true;
      });
    }
    
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
          <td>${Utils.formatDate(apt.startDate)}${apt.endDate && apt.endDate !== apt.startDate ? `<br><small class="text-muted">até ${Utils.formatDate(apt.endDate)}</small>` : ''}</td>
          <td><strong>${Utils.formatCurrency(apt.totalPrice)}</strong></td>
          <td><span class="status-badge status-${paymentClass}">${apt.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}</span></td>
          <td><span class="status-badge status-${statusClass}">${Appointments.getStatusLabel(apt)}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" data-action="edit-appointment" data-id="${apt.id}" title="Editar">✏️</button>
            <button class="btn btn-sm btn-secondary" data-action="add-invoice" data-id="${apt.id}" title="Nota Fiscal" style="margin-left:0.25rem">📄</button>
            <button class="btn btn-sm btn-secondary" style="color:var(--color-danger);margin-left:0.25rem" data-action="delete-appointment" data-id="${apt.id}" title="Excluir">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
    
    document.getElementById('adminFilterClient')?.addEventListener('change', Admin.renderAppointments);
    document.getElementById('adminFilterService')?.addEventListener('change', Admin.renderAppointments);
    document.getElementById('adminFilterStatus')?.addEventListener('change', Admin.renderAppointments);
  },
  
  renderPets: () => {
    const container = document.getElementById('adminPetsTable');
    if (!container) return;
    
    const pets = Utils.get('pets', []);
    const users = Utils.get('users', []);
    
    if (pets.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum pet cadastrado.</td></tr>';
      return;
    }
    
    container.innerHTML = pets.map(pet => {
      const user = users.find(u => u.id === pet.userId);
      return `
        <tr>
          <td><strong>${pet.name}</strong></td>
          <td>${pet.breed}</td>
          <td>${pet.birthdate ? Utils.formatAge(pet.birthdate) : 'N/A'}</td>
          <td>${pet.weight}kg</td>
          <td>${user?.name || 'N/A'}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="Admin.viewPet('${pet.id}')">👁️ Ver</button>
          </td>
        </tr>
      `;
    }).join('');
  },
  
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
            <button class="btn btn-sm btn-primary" data-action="view-client" data-id="${user.id}">👁️ Ver/Edit</button>
          </td>
        </tr>
      `;
    }).join('');
  },
  
  openAppointmentModal: (aptId = null) => {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const users = Utils.get('users', []).filter(u => u.role !== 'admin');
    const pets = Utils.get('pets', []);
    
    const clientSelect = document.getElementById('adminAptClient');
    clientSelect.innerHTML = '<option value="">Selecione o cliente...</option>' + users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    
    const petSelect = document.getElementById('adminAptPet');
    petSelect.innerHTML = '<option value="">Selecione o cliente primeiro...</option>';
    
    clientSelect.onchange = () => {
      const userId = clientSelect.value;
      const userPets = pets.filter(p => p.userId === userId);
      petSelect.innerHTML = '<option value="">Selecione o pet...</option>' + userPets.map(p => `<option value="${p.id}">${p.name} (${p.breed})</option>`).join('');
    };
    
    if (aptId) {
      document.getElementById('appointmentModalTitle').textContent = 'Editar Agendamento';
      document.getElementById('adminAptId').value = aptId;
      
      const apt = Appointments.getAppointmentById(aptId);
      if (apt) {
        clientSelect.value = apt.userId;
        clientSelect.onchange();
        setTimeout(() => { petSelect.value = apt.petId; }, 100);
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
    
    Admin.toggleAppointmentFields();
    Admin.calculateAppointmentTotal();
  },
  
  closeAppointmentModal: () => {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },
  
  toggleAppointmentFields: () => {
    const service = document.getElementById('adminAptService')?.value;
    const endField = document.getElementById('adminAptEndField');
    const durationField = document.getElementById('adminAptDurationField');
    const frequencyField = document.getElementById('adminAptFrequencyField');
    
    if (endField) endField.classList.toggle('hidden', !['hospedagem', 'daycare'].includes(service));
    if (durationField) durationField.classList.toggle('hidden', service !== 'passeio');
    if (frequencyField) frequencyField.classList.toggle('hidden', service !== 'passeio-mensal');
  },
  
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
        breakdownEl.innerHTML = breakdown.slice(0, 5).map(b => `<div>${b.date || b.label}: ${Utils.formatCurrency(b.price || b.value)} ${b.tags?.length ? '(' + b.tags.join(', ') + ')' : ''}</div>`).join('') + (breakdown.length > 5 ? `<div>... e mais ${breakdown.length - 5} dias</div>` : '');
      } else {
        breakdownEl.innerHTML = '';
      }
    }
    
    return total;
  },
  
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
    
    if (!userId || !petId || !service || !start) {
      Utils.toast('Preencha os campos obrigatórios', 'error');
      return;
    }
    
    const total = Admin.calculateAppointmentTotal();
    
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
    
    const appointments = Utils.get('appointments', []);
    
    if (aptId) {
      const index = appointments.findIndex(a => a.id === aptId);
      if (index !== -1) appointments[index] = aptData;
    } else {
      appointments.push(aptData);
    }
    
    Utils.save('appointments', appointments);
    
    Utils.toast(aptId ? 'Agendamento atualizado!' : 'Agendamento criado!', 'success');
    Admin.closeAppointmentModal();
    Admin.renderAppointments();
    Admin.renderStats();
  },
  
  deleteAppointment: (aptId) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    
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
  
  openClientModal: (userId) => {
    const modal = document.getElementById('clientModal');
    if (!modal) return;
    
    const user = Auth.getUserById(userId);
    if (!user) {
      Utils.toast('Cliente não encontrado', 'error');
      return;
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('adminClientId').value = user.id;
    document.getElementById('adminClientName').value = user.name || '';
    document.getElementById('adminClientEmail').value = user.email || '';
    document.getElementById('adminClientCpf').value = user.profile?.cpf || '';
    document.getElementById('adminClientPhone').value = user.profile?.phone || '';
    document.getElementById('adminClientAddress').value = user.profile?.address || '';
    document.getElementById('adminClientBirth').value = user.profile?.birthdate || '';
    document.getElementById('adminClientProfession').value = user.profile?.profession || '';
    document.getElementById('adminClientEmergency').value = user.profile?.emergencyContact || '';
    document.getElementById('adminClientNotes').value = user.profile?.notes || '';
    document.getElementById('adminT2Name').value = user.profile?.tutor2?.name || '';
    document.getElementById('adminT2Phone').value = user.profile?.tutor2?.phone || '';
    document.getElementById('adminT2Relation').value = user.profile?.tutor2?.relation || '';
    
    Admin.renderClientPets(userId);
  },
  
  renderClientPets: (userId) => {
    const container = document.getElementById('adminClientPets');
    if (!container) return;
    
    const pets = Utils.get('pets', []).filter(p => p.userId === userId);
    
    if (pets.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding:1rem;background:var(--color-bg-hover);border-radius:var(--radius-md)">Nenhum pet cadastrado para este cliente.</p>';
      return;
    }
    
    container.innerHTML = pets.map(pet => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--color-bg-hover);border-radius:var(--radius-md);margin-bottom:0.5rem">
        <div>
          <strong>🐕 ${pet.name}</strong> (${pet.breed})<br>
          <small class="text-muted">${pet.sex} • ${pet.weight}kg • ${pet.birthdate ? Utils.formatAge(pet.birthdate) : 'Idade N/A'}</small>
        </div>
        <button class="btn btn-sm btn-secondary" data-action="view-pet" data-id="${pet.id}">👁️ Ver</button>
      </div>
    `).join('');
  },
  
  closeClientModal: () => {
    const modal = document.getElementById('clientModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },
  
  saveClient: () => {
    const userId = document.getElementById('adminClientId')?.value;
    if (!userId) return;
    
    const updates = {
      name: document.getElementById('adminClientName').value.trim(),
      email: document.getElementById('adminClientEmail').value.trim(),
      profile: {
        cpf: document.getElementById('adminClientCpf').value.trim(),
        phone: document.getElementById('adminClientPhone').value.trim(),
        address: document.getElementById('adminClientAddress').value.trim(),
        birthdate: document.getElementById('adminClientBirth').value,
        profession: document.getElementById('adminClientProfession').value.trim(),
        emergencyContact: document.getElementById('adminClientEmergency').value.trim(),
        notes: document.getElementById('adminClientNotes').value.trim(),
        tutor2: {
          name: document.getElementById('adminT2Name').value.trim(),
          phone: document.getElementById('adminT2Phone').value.trim(),
          relation: document.getElementById('adminT2Relation').value
        }
      }
    };
    
    if (Auth.updateUser(userId, updates)) {
      Utils.toast('Dados do cliente atualizados!', 'success');
      Admin.renderClients();
      Admin.renderAppointments();
    } else {
      Utils.toast('Erro ao atualizar cliente', 'error');
    }
  },
  
  viewPet: (petId) => {
    const pet = Pets.getPetById(petId);
    if (!pet) {
      Utils.toast('Pet não encontrado', 'error');
      return;
    }
    
    const modalContent = `
      <div class="modal">
        <div class="modal-header">
          <h3 style="margin:0">🐕 ${pet.name}</h3>
          <button class="modal-close" onclick="Utils.hideModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem">
            <div>
              <h4 style="margin-bottom:0.5rem">Identificação</h4>
              <p><strong>Raça:</strong> ${pet.breed || 'N/A'}</p>
              <p><strong>Peso:</strong> ${pet.weight || 'N/A'}kg</p>
              <p><strong>Nascimento:</strong> ${pet.birthdate ? Utils.formatDate(pet.birthdate) : 'N/A'}</p>
              <p><strong>Sexo:</strong> ${pet.sex || 'N/A'}</p>
              <p><strong>Microchip:</strong> ${pet.microchip || 'N/A'}</p>
            </div>
            <div>
              <h4 style="margin-bottom:0.5rem">Saúde</h4>
              <p><strong>Castrado:</strong> ${pet.health?.neutered ? 'Sim' : 'Não'}</p>
              <p><strong>Plano:</strong> ${pet.health?.plan || 'N/A'}</p>
              <p><strong>Condições:</strong> ${pet.health?.conditions || 'Nenhuma'}</p>
              <p><strong>Vacinas:</strong> ${pet.health?.vaccines?.length || 0}</p>
            </div>
          </div>
          <div style="margin-top:1rem">
            <h4 style="margin-bottom:0.5rem">⚠️ Pontos de Atenção</h4>
            <p style="background:#fefcbf;padding:0.75rem;border-radius:var(--radius-md)">${pet.alerts || 'Nenhum'}</p>
          </div>
          <div style="margin-top:1rem;text-align:center">
            <a href="#pet?id=${pet.id}" class="btn btn-primary" onclick="Utils.hideModal()">✏️ Editar Pet</a>
          </div>
        </div>
      </div>
    `;
    
    Utils.showModal(modalContent);
  },
  
  openInvoiceModal: (aptId) => {
    const modal = document.getElementById('invoiceModal');
    if (!modal) return;
    
    const apt = Appointments.getAppointmentById(aptId);
    if (!apt) {
      Utils.toast('Agendamento não encontrado', 'error');
      return;
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('invoiceAptId').value = aptId;
    document.getElementById('invoiceNumber').value = apt.invoice?.number || '';
    document.getElementById('invoiceDate').value = apt.invoice?.date || new Date().toISOString().split('T')[0];
    document.getElementById('invoiceObservations').value = apt.invoice?.observations || '';
    document.getElementById('invoiceFileUrl').value = apt.invoice?.fileUrl || '';
    
    const users = Utils.get('users', []);
    const pets = Utils.get('pets', []);
    const user = users.find(u => u.id === apt.userId);
    const pet = pets.find(p => p.id === apt.petId);
    
    document.getElementById('invoiceAppointmentSummary').innerHTML = `
      <p><strong>Cliente:</strong> ${user?.name || 'N/A'}</p>
      <p><strong>Pet:</strong> ${pet?.name || 'N/A'}</p>
      <p><strong>Serviço:</strong> ${Appointments.getServiceName(apt.service)}</p>
      <p><strong>Data:</strong> ${Utils.formatDate(apt.startDate)}${apt.endDate && apt.endDate !== apt.startDate ? ` a ${Utils.formatDate(apt.endDate)}` : ''}</p>
      <p><strong>Valor:</strong> ${Utils.formatCurrency(apt.totalPrice)}</p>
    `;
  },
  
  closeInvoiceModal: () => {
    const modal = document.getElementById('invoiceModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },
  
  saveInvoice: () => {
    const aptId = document.getElementById('invoiceAptId')?.value;
    if (!aptId) return;
    
    const invoiceData = {
      number: document.getElementById('invoiceNumber').value.trim() || `NF-${Date.now()}`,
      date: document.getElementById('invoiceDate').value,
      observations: document.getElementById('invoiceObservations').value.trim(),
      fileUrl: document.getElementById('invoiceFileUrl').value.trim(),
      issuedAt: new Date().toISOString()
    };
    
    const appointments = Utils.get('appointments', []);
    const index = appointments.findIndex(a => a.id === aptId);
    
    if (index !== -1) {
      appointments[index].invoice = invoiceData;
      Utils.save('appointments', appointments);
      
      Utils.toast('Nota fiscal emitida e disponível para o cliente!', 'success');
      Admin.closeInvoiceModal();
      Admin.renderPayments();
      Admin.renderAppointments();
    } else {
      Utils.toast('Erro ao emitir nota fiscal', 'error');
    }
  },
  
  downloadInvoice: (aptId) => {
    const apt = Appointments.getAppointmentById(aptId);
    if (!apt || !apt.invoice?.fileUrl) {
      Utils.toast('Nota fiscal não disponível', 'error');
      return;
    }
    
    window.open(apt.invoice.fileUrl, '_blank');
  },
  
  markAsPaid: (aptId) => {
    Appointments.markAsPaid(aptId);
    Admin.renderPayments();
    Admin.renderReports();
    Admin.renderAppointments();
  },
  
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
      const hasInvoice = apt.invoice ? '📄' : '';
      
      return `
        <tr>
          <td>${user?.name || 'N/A'}</td>
          <td>${Appointments.getServiceName(apt.service)}</td>
          <td>${Utils.formatDate(apt.startDate)}</td>
          <td>${Utils.formatCurrency(apt.totalPrice)}</td>
          <td><span class="status-badge status-${statusClass}">${apt.paymentStatus}</span> ${hasInvoice}</td>
          <td>
            ${apt.paymentStatus !== 'paid' ? `<button class="btn btn-sm btn-primary" data-action="mark-paid" data-id="${apt.id}">Marcar pago</button>` : ''}
            <button class="btn btn-sm btn-secondary" data-action="add-invoice" data-id="${apt.id}" style="margin-left:0.5rem">📄 Nota</button>
            ${apt.invoice ? `<button class="btn btn-sm btn-secondary" data-action="download-invoice" data-id="${apt.id}" style="margin-left:0.25rem">⬇️</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  },
  
  renderReports: () => {
    const revenueContainer = document.getElementById('revenueByService');
    if (revenueContainer) {
      const appointments = Utils.get('appointments', []);
      const services = ['adestramento', 'passeio', 'hospedagem', 'daycare', 'pet-sitter'];
      
      revenueContainer.innerHTML = services.map(service => {
        const total = appointments.filter(a => a.service === service && a.paymentStatus === 'paid').reduce((sum, a) => sum + a.totalPrice, 0);
        return `<div style="display:flex;justify-content:space-between;margin:0.5rem 0;padding:0.5rem;background:var(--color-bg-hover);border-radius:var(--radius-sm)"><span>${Appointments.getServiceName(service)}</span><strong>${Utils.formatCurrency(total)}</strong></div>`;
      }).join('');
    }
    
    const alertsContainer = document.getElementById('vaccineAlerts');
    if (alertsContainer) {
      const alerts = Pets.getVaccineAlerts(30);
      if (alerts.length === 0) {
        alertsContainer.innerHTML = '<p class="text-muted" style="font-size:0.875rem">Nenhum alerta de vacina.</p>';
      } else {
        alertsContainer.innerHTML = alerts.map(alert => `<div style="padding:0.5rem;background:#fefcbf;color:#744210;border-radius:var(--radius-sm);margin-bottom:0.5rem;font-size:0.875rem">🐕 <strong>${alert.petName}</strong>: ${alert.vaccineName} vence em ${alert.daysRemaining} dia${alert.daysRemaining > 1 ? 's' : ''}</div>`).join('');
      }
    }
    
    const topContainer = document.getElementById('topClients');
    if (topContainer) {
      const appointments = Utils.get('appointments', []);
      const users = Utils.get('users', []);
      const userCounts = {};
      appointments.forEach(apt => { userCounts[apt.userId] = (userCounts[apt.userId] || 0) + 1; });
      const sorted = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      
      if (sorted.length === 0) {
        topContainer.innerHTML = '<p class="text-muted">Nenhum agendamento registrado.</p>';
      } else {
        topContainer.innerHTML = sorted.map(([userId, count]) => {
          const user = users.find(u => u.id === userId);
          return `<div style="display:flex;justify-content:space-between;margin:0.5rem 0;padding:0.5rem;background:var(--color-bg-hover);border-radius:var(--radius-sm)"><span>${user?.name || 'N/A'}</span><strong>${count} agendamentos</strong></div>`;
        }).join('');
      }
    }
    
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
      const sorted = Object.entries(defaulters).sort((a, b) => b[1] - a[1]);
      
      if (sorted.length === 0) {
        defaultersContainer.innerHTML = '<p style="color:var(--color-accent)">✅ Nenhuma inadimplência!</p>';
      } else {
        defaultersContainer.innerHTML = sorted.map(([userId, amount]) => {
          const user = users.find(u => u.id === userId);
          return `<div style="display:flex;justify-content:space-between;margin:0.5rem 0;padding:0.5rem;background:#fed7d7;color:#822727;border-radius:var(--radius-sm)"><span>${user?.name || 'N/A'}</span><strong>${Utils.formatCurrency(amount)}</strong></div>`;
        }).join('');
      }
    }
  },
  
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
    
    container.innerHTML = priceFields.map(field => `<div class="form-group"><label class="form-label" for="price_${field.key}">${field.label}</label><input type="number" class="form-control" id="price_${field.key}" value="${prices[field.key] || 0}" step="0.01" min="0"></div>`).join('');
  },
  
  savePrices: () => {
    const config = Utils.get('adminConfig', {});
    const prices = {};
    
    const priceFields = ['adestramento', 'petSitter', 'passeio30', 'passeio50', 'passeioMensal2x', 'passeioMensal3x', 'passeioMensal4x', 'passeioMensal5x', 'hospedagemWeekday', 'hospedagemWeekend', 'hospedagemHoliday', 'hospedagemHighSeason', 'daycareWeekday', 'daycareWeekend', 'daycareHoliday', 'daycareHighSeason'];
    
    priceFields.forEach(key => {
      const value = parseFloat(document.getElementById(`price_${key}`)?.value) || 0;
      prices[key] = value;
    });
    
    config.prices = prices;
    Utils.save('adminConfig', config);
    Utils.toast('Preços atualizados com sucesso!', 'success');
  },
  
openContentModal: (contentId = null) => {
  console.log('Abrindo modal de conteúdo, ID:', contentId);
  
  const modal = document.getElementById('contentModal');
  if (!modal) {
    console.error('Modal contentModal não encontrado no HTML');
    Utils.toast('Erro: Modal não encontrado', 'error');
    return;
  }
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  const contents = Utils.get('educationalContent', []) || [];
  const content = contentId ? contents.find(c => c.id === contentId) : null;
  
  // Preencher campos com verificação de existência
  const setContent = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  };
  
  setContent('contentId', contentId || '');
  setContent('contentTitle', content?.title || '');
  setContent('contentExcerpt', content?.excerpt || '');
  setContent('contentVideoUrl', content?.videoUrl || '');
  setContent('contentText', content?.content || '');
  
  const typeSelect = document.getElementById('contentType');
  if (typeSelect) {
    typeSelect.value = content?.type || 'article';
    typeSelect.dispatchEvent(new Event('change'));
  }
  
  const videoField = document.getElementById('videoUrlField');
  if (videoField) {
    videoField.style.display = (content?.type?.startsWith('video-')) ? 'block' : 'none';
  }
  
  const titleEl = document.getElementById('contentModalTitle');
  if (titleEl) {
    titleEl.textContent = contentId ? 'Editar Conteúdo' : 'Novo Conteúdo';
  }
  
  console.log('Modal aberto com sucesso');
},

closeContentModal: () => {
    const modal = document.getElementById('contentModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },
  
saveContent: () => {
  console.log('Salvando conteúdo...');
  
  const contentIdEl = document.getElementById('contentId');
  const contentId = contentIdEl?.value?.trim() || null;
  
  console.log('contentId:', contentId);
  
  // Validar campos obrigatórios
  const title = document.getElementById('contentTitle')?.value?.trim();
  if (!title) {
    Utils.toast('Título é obrigatório', 'error');
    return;
  }
  
  const contents = Utils.get('educationalContent', []) || [];
  
  const contentData = {
    id: contentId || Utils.generateId('edu_'),
    title: title,
    excerpt: document.getElementById('contentExcerpt')?.value?.trim() || '',
    type: document.getElementById('contentType')?.value || 'article',
    videoUrl: document.getElementById('contentVideoUrl')?.value?.trim() || '',
    content: document.getElementById('contentText')?.value?.trim() || '',
    createdAt: contentId 
      ? (contents.find(c => c.id === contentId)?.createdAt || new Date().toISOString())
      : new Date().toISOString()
  };
  
  console.log('Dados a salvar:', contentData);
  
  if (contentId) {
    // Atualizar existente
    const index = contents.findIndex(c => c.id === contentId);
    if (index !== -1) {
      contents[index] = contentData;
      console.log('Conteúdo atualizado no índice', index);
      Utils.toast('Conteúdo atualizado!', 'success');
    } else {
      console.error('Conteúdo não encontrado para atualização');
      Utils.toast('Erro: Conteúdo não encontrado', 'error');
      return;
    }
  } else {
    // NOVO conteúdo
    contents.unshift(contentData);
    console.log('Novo conteúdo criado');
    Utils.toast('Conteúdo criado!', 'success');
  }
  
  // Salvar no storage
  const saved = Utils.save('educationalContent', contents);
  console.log('Salvo no storage:', saved);
  
  if (saved) {
    Admin.closeContentModal();
    Admin.renderContent();
  }
},
  
  deleteContent: (contentId) => {
    if (!confirm('Excluir este conteúdo?')) return;
    
    let contents = Utils.get('educationalContent', []);
    contents = contents.filter(c => c.id !== contentId);
    Utils.save('educationalContent', contents);
    
    Admin.renderContent();
    Utils.toast('Conteúdo excluído', 'success');
  },
  
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
            <small class="text-muted">${c.type.startsWith('video-') ? '🎥 Vídeo' : '📄 Artigo'} • ${Utils.formatDate(c.createdAt)}</small>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-sm btn-secondary" data-action="edit-content" data-id="${c.id}">✏️</button>
            <button class="btn btn-sm btn-secondary" style="color:var(--color-danger)" data-action="delete-content" data-id="${c.id}">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  load: () => {
    Admin.renderStats();
    Admin.switchTab('appointments');
  }
};

window.Admin = Admin;