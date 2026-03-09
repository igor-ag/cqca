/**
 * CQC Adestramento - Módulo de Agendamentos
 * CRUD completo, calculadora de preços, filtros e histórico
 */

const Appointments = {
  // Estado atual
  currentAppointmentId: null,
  
  /**
   * Inicializar módulo de agendamentos
   */
  init: () => {
    Appointments.bindEvents();
    Appointments.loadSeedData();
  },
  
  /**
   * Carregar dados de teste se vazio
   */
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
  
  /**
   * Bind de eventos
   */
  bindEvents: () => {
    // Filtros da página de agendamentos
    document.getElementById('filterService')?.addEventListener('change', Appointments.renderTable);
    document.getElementById('filterStatus')?.addEventListener('change', Appointments.renderTable);
    document.getElementById('filterPeriod')?.addEventListener('change', Appointments.renderTable);
    
    // Botão de pagamento
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="pay"]')) {
        const aptId = e.target.dataset.id;
        Appointments.markAsPaid(aptId);
      }
      if (e.target.matches('[data-action="cancel"]')) {
        const aptId = e.target.dataset.id;
        Appointments.cancel(aptId);
      }
      if (e.target.matches('[data-action="download-invoice"]')) {
        const aptId = e.target.dataset.id;
        Appointments.downloadInvoice(aptId);
      }
    });
  },
  
  /**
   * Obter nome amigável do serviço
   */
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
  
  /**
   * Obter label de status
   */
  getStatusLabel: (apt) => {
    if (apt.status === 'cancelled') return 'Cancelado';
    if (apt.status === 'completed') return 'Concluído';
    return apt.paymentStatus === 'paid' ? 'Pago' : 'Pendente';
  },
  
  /**
   * Obter classe de status
   */
  getStatusClass: (apt) => {
    if (apt.status === 'cancelled') return 'cancelled';
    if (apt.status === 'completed') return 'paid';
    return apt.paymentStatus === 'paid' ? 'paid' : 'pending';
  },
  
  /**
   * Obter agendamentos do usuário atual
   */
  getUserAppointments: () => {
    if (!Auth.currentUser) return [];
    const appointments = Utils.get('appointments', []);
    return appointments.filter(a => a.userId === Auth.currentUser.id);
  },
  
  /**
   * Obter agendamento por ID
   */
  getAppointmentById: (aptId) => {
    const appointments = Utils.get('appointments', []);
    return appointments.find(a => a.id === aptId) || null;
  },
  
  /**
   * Filtrar agendamentos
   */
  filterAppointments: (appointments) => {
    const serviceFilter = document.getElementById('filterService')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const periodFilter = document.getElementById('filterPeriod')?.value || 'all';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments.filter(apt => {
      // Filtro por serviço
      if (serviceFilter && apt.service !== serviceFilter) return false;
      
      // Filtro por status
      if (statusFilter) {
        if (statusFilter === 'confirmed' && apt.status !== 'confirmed') return false;
        if (statusFilter === 'pending' && (apt.status !== 'confirmed' || apt.paymentStatus !== 'pending')) return false;
        if (statusFilter === 'completed' && apt.status !== 'completed') return false;
        if (statusFilter === 'cancelled' && apt.status !== 'cancelled') return false;
      }
      
      // Filtro por período
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
  
  /**
   * Renderizar tabela de agendamentos
   */
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
  
  /**
   * Marcar como pago
   */
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
  
  /**
   * Cancelar agendamento
   */
  cancel: (aptId) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }
    
    const appointments = Utils.get('appointments', []);
    const index = appointments.findIndex(a => a.id === aptId);
    
    if (index === -1) {
      Utils.toast('Agendamento não encontrado', 'error');
      return;
    }
    
    // Verificar política de cancelamento
    const apt = appointments[index];
    const today = new Date();
    const startDate = new Date(apt.startDate);
    const diffHours = (startDate - today) / (1000 * 60 * 60);
    const config = Utils.get('adminConfig', {});
    const isHighSeason = Utils.isHighSeason(startDate);
    
    let cancellationFee = 0;
    if (isHighSeason) {
      const policy = config.cancellationPolicy?.highSeason || { days: 10, fee: 0.5 };
      if (diffHours < policy.days * 24) {
        cancellationFee = apt.totalPrice * policy.fee;
      }
    } else {
      const policy = config.cancellationPolicy?.normal || { hours: 48, fee: 0.3 };
      if (diffHours < policy.hours) {
        cancellationFee = apt.totalPrice * policy.fee;
      }
    }
    
    if (cancellationFee > 0) {
      if (!confirm(`Atenção: Cancelamento fora do prazo pode acarretar taxa de ${Utils.formatCurrency(cancellationFee)}. Deseja continuar?`)) {
        return;
      }
    }
    
    appointments[index].status = 'cancelled';
    appointments[index].cancelledAt = new Date().toISOString();
    appointments[index].cancellationFee = cancellationFee;
    Utils.save('appointments', appointments);
    
    Utils.toast('Agendamento cancelado', 'success');
    Appointments.renderTable();
    Appointments.renderDashboard();
  },
  
  /**
   * Renderizar dashboard de agendamentos
   */
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
  
  /**
   * Renderizar financeiro
   */
  renderFinancial: () => {
    const appointments = Appointments.getUserAppointments();
    const pending = appointments.filter(a => a.paymentStatus === 'pending' && a.status !== 'cancelled');
    const paid = appointments.filter(a => a.paymentStatus === 'paid');
    
    // Total em aberto
    const totalPending = pending.reduce((sum, a) => sum + a.totalPrice, 0);
    const totalElement = document.getElementById('finTotalPending');
    if (totalElement) {
      totalElement.textContent = Utils.formatCurrency(totalPending);
    }
    
    // Pendências
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
    
    // Histórico
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
              <button class="btn btn-sm btn-secondary" data-action="download-invoice" data-id="${apt.id}">
                📄 Baixar
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  },
  
  /**
   * Baixar nota fiscal
   */
  downloadInvoice: (aptId) => {
    const apt = Appointments.getAppointmentById(aptId);
    if (!apt) {
      Utils.toast('Agendamento não encontrado', 'error');
      return;
    }
    
    const pets = Utils.get('pets', []);
    const pet = pets.find(p => p.id === apt.petId);
    const user = Auth.currentUser;
    
    let text = `NOTA FISCAL DE SERVIÇO\n`;
    text += `================================\n\n`;
    text += `CQC Adestramento\n`;
    text += `Rua Guiratinga, 1249 - Chácara Inglesa, São Paulo/SP\n`;
    text += `CNPJ: 00.000.000/0001-00\n\n`;
    text += `Cliente: ${user?.name || 'N/A'}\n`;
    text += `CPF: ${user?.profile?.cpf || 'N/A'}\n`;
    text += `E-mail: ${user?.email || 'N/A'}\n\n`;
    text += `Serviço: ${Appointments.getServiceName(apt.service)}\n`;
    text += `Pet: ${pet?.name || 'N/A'}\n`;
    text += `Data: ${Utils.formatDate(apt.startDate)}\n`;
    if (apt.endDate && apt.endDate !== apt.startDate) {
      text += `Período: até ${Utils.formatDate(apt.endDate)}\n`;
    }
    text += `Valor Total: ${Utils.formatCurrency(apt.totalPrice)}\n`;
    text += `Status: PAGO\n`;
    text += `Data do Pagamento: ${apt.paidAt ? Utils.formatDateTime(apt.paidAt) : 'N/A'}\n\n`;
    text += `Esta é uma nota fiscal de demonstração.\n`;
    text += `Para fins de teste da aplicação.\n\n`;
    text += `Obrigado por confiar na CQC Adestramento! 🐾\n`;
    
    const filename = `nota-fiscal-${aptId}.txt`;
    Utils.downloadFile(text, filename);
    Utils.toast('Nota fiscal baixada', 'success');
  },
  
  /**
   * Calcular preço de hospedagem/daycare
   */
  calculateStay: (serviceType, startDate, endDate) => {
    const config = Utils.get('adminConfig', {});
    const prices = config.prices || {};
    let total = 0;
    const breakdown = [];
    
    Utils.forEachDay(startDate, endDate, (date) => {
      let dailyPrice;
      const isHoliday = Utils.isHoliday(date);
      const isHighSeason = Utils.isHighSeason(date);
      const isWeekend = Utils.isWeekend(date);
      
      if (serviceType === 'hospedagem') {
        if (isHighSeason) dailyPrice = prices.hospedagemHighSeason || 120;
        else if (isHoliday) dailyPrice = prices.hospedagemHoliday || 100;
        else if (isWeekend) dailyPrice = prices.hospedagemWeekend || 90;
        else dailyPrice = prices.hospedagemWeekday || 80;
      } else { // daycare
        if (isHighSeason) dailyPrice = prices.daycareHighSeason || 100;
        else if (isHoliday) dailyPrice = prices.daycareHoliday || 90;
        else if (isWeekend) dailyPrice = prices.daycareWeekend || 90;
        else dailyPrice = prices.daycareWeekday || 70;
      }
      
      total += dailyPrice;
      breakdown.push({
        date: date.toISOString().split('T')[0],
        price: dailyPrice,
        tags: [
          isHoliday ? 'Feriado' : null,
          isWeekend ? 'Fim de semana' : null,
          isHighSeason ? 'Alta temporada' : null
        ].filter(Boolean)
      });
    });
    
    return { total, breakdown };
  },
  
  /**
   * Calcular preço de passeio mensal
   */
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
  
  /**
   * Obter preço unitário
   */
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
  
  /**
   * Atualizar calculadora
   */
  updateCalculator: () => {
    const service = document.getElementById('calcService')?.value;
    const start = document.getElementById('calcStart')?.value;
    const end = document.getElementById('calcEnd')?.value;
    const freq = document.getElementById('calcFrequency')?.value;
    const dur = document.getElementById('calcDuration')?.value;
    const resultEl = document.getElementById('calcResult');
    
    if (!resultEl) return;
    
    let total = 0;
    
    if (['hospedagem', 'daycare'].includes(service) && start && end) {
      const calc = Appointments.calculateStay(service, start, end);
      total = calc.total;
    } else if (service === 'passeio-mensal' && freq) {
      total = Appointments.calculateMonthlyWalks(freq);
    } else if (service === 'passeio') {
      total = Appointments.getUnitPrice('passeio', { duration: dur });
    } else if (service) {
      total = Appointments.getUnitPrice(service);
    }
    
    resultEl.textContent = Utils.formatCurrency(total);
  }
};

// Exportar para escopo global
window.Appointments = Appointments;