/**
 * CQC Adestramento - Módulo de Agendamentos
 * Com cálculo de diárias por horas (24h + 4h cortesia)
 */

const Appointments = {
  currentAppointmentId: null,
  
  init: () => {
    Appointments.bindEvents();
    Appointments.loadSeedData();
  },
  
  loadSeedData: () => {
    if (!Utils.get('appointments')) {
      const today = new Date();
      const future1 = new Date(today);
      future1.setDate(future1.getDate() + 1);
      const future2 = new Date(today);
      future2.setDate(future2.getDate() + 3);
      const future3 = new Date(today);
      future3.setDate(future3.getDate() + 7);
      const past = new Date(today);
      past.setDate(past.getDate() - 5);
      
      Utils.save('appointments', [
        {
          id: 'apt_001',
          userId: 'user_001',
          petId: 'pet_001',
          service: 'passeio',
          serviceDetails: { duration: '50min' },
          startDate: future1.toISOString().split('T')[0],
          endDate: future1.toISOString().split('T')[0],
          totalPrice: 50,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
          notes: 'Passeio no parque'
        },
        {
          id: 'apt_002',
          userId: 'user_001',
          petId: 'pet_001',
          service: 'hospedagem',
          startDate: future2.toISOString().split('T')[0],
          endDate: future3.toISOString().split('T')[0],
          totalPrice: 240,
          status: 'confirmed',
          paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
          notes: 'Viagem de fim de semana'
        },
        {
          id: 'apt_003',
          userId: 'user_002',
          petId: 'pet_003',
          service: 'adestramento',
          startDate: past.toISOString().split('T')[0],
          endDate: past.toISOString().split('T')[0],
          totalPrice: 150,
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
          notes: 'Aula de obediência básica'
        }
      ]);
    }
  },
  
  bindEvents: () => {
    document.getElementById('filterService')?.addEventListener('change', Appointments.renderTable);
    document.getElementById('filterStatus')?.addEventListener('change', Appointments.renderTable);
    document.getElementById('filterPeriod')?.addEventListener('change', Appointments.renderTable);
    
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="pay"]')) {
        Appointments.markAsPaid(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="cancel"]')) {
        Appointments.cancel(e.target.dataset.id);
      }
      if (e.target.matches('[data-action="download-invoice"]')) {
        Appointments.downloadInvoice(e.target.dataset.id);
      }
    });
  },
  
  getServiceName: (service) => {
    const map = {
      'adestramento': 'Adestramento',
      'pet-sitter': 'Pet Sitter',
      'passeio': 'Passeio',
      'hospedagem': 'Hospedagem',
      'daycare': 'Daycare'
    };
    return map[service] || service;
  },
  
  getStatusLabel: (apt) => {
    if (apt.status === 'cancelled') return 'Cancelado';
    if (apt.status === 'completed') return 'Concluído';
    return apt.paymentStatus === 'paid' ? 'Pago' : 'Pendente';
  },
  
  getStatusClass: (apt) => {
    if (apt.status === 'cancelled') return 'cancelled';
    if (apt.status === 'completed') return 'paid';
    return apt.paymentStatus === 'paid' ? 'paid' : 'pending';
  },
  
  getUserAppointments: () => {
    if (!Auth.currentUser) return [];
    const appointments = Utils.get('appointments', []);
    return appointments.filter(a => a.userId === Auth.currentUser.id);
  },
  
  getAppointmentById: (aptId) => {
    const appointments = Utils.get('appointments', []);
    return appointments.find(a => a.id === aptId) || null;
  },
  
  filterAppointments: (appointments) => {
    const serviceFilter = document.getElementById('filterService')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const periodFilter = document.getElementById('filterPeriod')?.value || 'all';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments.filter(apt => {
      if (serviceFilter && apt.service !== serviceFilter) return false;
      
      if (statusFilter) {
        if (statusFilter === 'confirmed' && apt.status !== 'confirmed') return false;
        if (statusFilter === 'pending' && (apt.status !== 'confirmed' || apt.paymentStatus !== 'pending')) return false;
        if (statusFilter === 'completed' && apt.status !== 'completed') return false;
        if (statusFilter === 'cancelled' && apt.status !== 'cancelled') return false;
      }
      
      if (periodFilter !== 'all') {
        const aptDate = new Date(apt.startDate);
        aptDate.setHours(0, 0, 0, 0);
        
        if (periodFilter === 'past' && aptDate >= today) return false;
        if (periodFilter === 'future' && aptDate < today) return false;
        if (periodFilter === 'this-month') {
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          if (aptDate.getMonth() !== currentMonth || aptDate.getFullYear() !== currentYear) return false;
        }
      }
      
      return true;
    });
  },
  
  renderTable: () => {
    const container = document.getElementById('appointmentsTable');
    if (!container) return;
    
    const appointments = Appointments.getUserAppointments();
    const filtered = Appointments.filterAppointments(appointments);
    const pets = Utils.get('pets', []);
    
    if (filtered.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">Nenhum agendamento encontrado.</td></tr>';
      return;
    }
    
    container.innerHTML = filtered.map(apt => {
      const pet = pets.find(p => p.id === apt.petId);
      const statusClass = Appointments.getStatusClass(apt);
      const statusLabel = Appointments.getStatusLabel(apt);
      
      return `
        <tr>
          <td>
            ${Utils.formatDate(apt.startDate)}
            ${apt.endDate && apt.endDate !== apt.startDate ? `<br><small class="text-muted">até ${Utils.formatDate(apt.endDate)}</small>` : ''}
          </td>
          <td>${Appointments.getServiceName(apt.service)}</td>
          <td>${pet ? pet.name : '-'}</td>
          <td><strong>${Utils.formatCurrency(apt.totalPrice)}</strong></td>
          <td><span class="status-badge status-${statusClass}">${statusLabel}</span></td>
          <td>
            ${apt.paymentStatus !== 'paid' && apt.status === 'confirmed' ? 
              `<button class="btn btn-sm btn-primary" data-action="pay" data-id="${apt.id}">Pagar</button>` : ''}
            ${apt.status === 'confirmed' ? 
              `<button class="btn btn-sm btn-secondary" data-action="cancel" data-id="${apt.id}" style="margin-left:0.5rem">Cancelar</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  },
  
  markAsPaid: (aptId) => {
    const appointments = Utils.get('appointments', []);
    const index = appointments.findIndex(a => a.id === aptId);
    
    if (index === -1) {
      Utils.toast('Agendamento não encontrado', 'error');
      return;
    }
    
    appointments[index].paymentStatus = 'paid';
    appointments[index].paidAt = new Date().toISOString();
    Utils.save('appointments', appointments);
    
    Utils.toast('Pagamento registrado com sucesso!', 'success');
    Appointments.renderTable();
    Appointments.renderDashboard();
    Appointments.renderFinancial();
  },
  
  cancel: (aptId) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    const appointments = Utils.get('appointments', []);
    const index = appointments.findIndex(a => a.id === aptId);
    
    if (index === -1) {
      Utils.toast('Agendamento não encontrado', 'error');
      return;
    }
    
    appointments[index].status = 'cancelled';
    appointments[index].cancelledAt = new Date().toISOString();
    Utils.save('appointments', appointments);
    
    Utils.toast('Agendamento cancelado', 'success');
    Appointments.renderTable();
    Appointments.renderDashboard();
  },
  
  renderDashboard: () => {
    const container = document.getElementById('dashAppointments');
    if (!container) return;
    
    const appointments = Appointments.getUserAppointments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = appointments
      .filter(a => {
        const aptDate = new Date(a.startDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today && a.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 3);
    
    if (upcoming.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum agendamento futuro.</p>';
      return;
    }
    
    container.innerHTML = upcoming.map(apt => {
      const statusClass = Appointments.getStatusClass(apt);
      const statusLabel = Appointments.getStatusLabel(apt);
      const pets = Utils.get('pets', []);
      const pet = pets.find(p => p.id === apt.petId);
      
      return `
        <div class="appointment-card ${statusClass}">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem">
            <strong>${Appointments.getServiceName(apt.service)}</strong>
            <span class="status-badge status-${statusClass}">${statusLabel}</span>
          </div>
          <p style="margin:0;font-size:0.875rem">
            📅 ${Utils.formatDate(apt.startDate)}${apt.endDate && apt.endDate !== apt.startDate ? ` a ${Utils.formatDate(apt.endDate)}` : ''}
            ${pet ? `<br>🐕 ${pet.name}` : ''}
          </p>
          <p style="margin:0.5rem 0 0;font-weight:600">${Utils.formatCurrency(apt.totalPrice)}</p>
        </div>
      `;
    }).join('');
  },
  
  renderFinancial: () => {
    const appointments = Appointments.getUserAppointments();
    const pending = appointments.filter(a => a.paymentStatus === 'pending' && a.status !== 'cancelled');
    const paid = appointments.filter(a => a.paymentStatus === 'paid');
    
    const totalPending = pending.reduce((sum, a) => sum + a.totalPrice, 0);
    const totalElement = document.getElementById('finTotalPending');
    if (totalElement) {
      totalElement.textContent = Utils.formatCurrency(totalPending);
    }
    
    const pendingContainer = document.getElementById('finPendingList');
    if (pendingContainer) {
      if (pending.length === 0) {
        pendingContainer.innerHTML = '<p style="color:var(--color-accent)">✅ Nenhuma pendência!</p>';
      } else {
        pendingContainer.innerHTML = pending.map(apt => `
          <div class="appointment-card pending" style="margin-bottom:0.5rem">
            <strong>${Appointments.getServiceName(apt.service)}</strong> • ${Utils.formatDate(apt.startDate)}<br>
            <span style="font-weight:600">${Utils.formatCurrency(apt.totalPrice)}</span>
            <button class="btn btn-sm btn-primary btn-block" style="margin-top:0.5rem" data-action="pay" data-id="${apt.id}">Pagar agora</button>
          </div>
        `).join('');
      }
    }
    
    const historyContainer = document.getElementById('financialTable');
    if (historyContainer) {
      if (paid.length === 0) {
        historyContainer.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum pagamento registrado.</td></tr>';
      } else {
        historyContainer.innerHTML = paid.slice(0, 10).map(apt => `
          <tr>
            <td>${Utils.formatDate(apt.startDate)}</td>
            <td>${Appointments.getServiceName(apt.service)}</td>
            <td>${Utils.formatCurrency(apt.totalPrice)}</td>
            <td>
              ${apt.invoice ? `
                ${apt.invoice.fileUrl ? `
                  <a href="${apt.invoice.fileUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary">
                    📄 ${apt.invoice.number || 'Ver Nota'}
                  </a>
                ` : `
                  <button class="btn btn-sm btn-secondary" data-action="download-invoice" data-id="${apt.id}">
                    📄 ${apt.invoice.number || 'Baixar'}
                  </button>
                `}
              ` : '<span class="text-muted" style="font-size:0.875rem">Aguardando emissão</span>'}
            </td>
          </tr>
        `).join('');
      }
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
  
  /**
   * CÁLCULO DE DIÁRIAS COM HORAS (24h + 4h cortesia)
   */
 calculateStay: (serviceType, startDate, endDate) => {
  const config = Utils.get('adminConfig', {});
  const prices = config.prices || {};
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
…},
  
  calculateMonthlyWalks: (frequency) => {
    const config = Utils.get('adminConfig', {});
    const prices = config.prices || {};
    const map = {
      '2': prices.passeioMensal2x || 200,
      '3': prices.passeioMensal3x || 350,
      '4': prices.passeioMensal4x || 500,
      '5': prices.passeioMensal5x || 600
    };
    return map[frequency] || 0;
  },
  
  getUnitPrice: (service, details = {}) => {
    const config = Utils.get('adminConfig', {});
    const prices = config.prices || {};
    
    switch(service) {
      case 'adestramento': return prices.adestramento || 150;
      case 'pet-sitter': return prices.petSitter || 50;
      case 'passeio':
        return details.duration === '30' ? (prices.passeio30 || 30) : (prices.passeio50 || 50);
      default: return 0;
    }
  },
  
  updateCalculator: () => {
    // Esta função é usada apenas no modal admin
    // A calculadora pública está no inline script do index.html
  }
};

window.Appointments = Appointments;