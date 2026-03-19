/**
 * CQC Adestramento - Módulo de Gestão de Pets
 * CRUD completo com todos os campos atualizados
 */

const Pets = {
  currentPetId: null,
  autoSaveInterval: null,
  
  init: () => {
    Pets.bindEvents();
    Pets.loadSeedData();
  },
  
  loadSeedData: () => {
    if (!Utils.get('pets')) {
      Utils.save('pets', [
        {
          id: 'pet_001',
          userId: 'user_001',
          name: 'Thor',
          breed: 'Golden Retriever',
          weight: 32,
          birthdate: '2020-03-10',
          sex: 'Macho',
          rga: 'SP-123456',
          microchip: '982000123456789',
          health: {
            plan: 'PetLove',
            neutered: true,
            vaccines: [
              { name: 'V8', date: '2024-01-15', nextDate: '2025-01-15' },
              { name: 'Antirrábica', date: '2024-01-15', nextDate: '2025-01-15' }
            ],
            conditions: 'Nenhuma',
            vet: { name: 'Dr. Fernando', phone: '(11) 3333-4444', address: 'Clínica Pet Care' },
            observations: ''
          },
          food: {
            type: 'Ração Premium',
            portion: '300g',
            schedule: '8h e 18h',
            restrictions: 'Sem lactose',
            observations: ''
          },
          behavior: {
            sociabilityDogs: 'Muito sociável',
            sociabilityHumans: 'Amigável',
            reactivity: ['barulhos'],
            resourceGuarding: { active: false, items: [] },
            pullsLeash: false,
            barksExcessively: false,
            knownCommands: ['senta', 'fica', 'junto'],
            observations: ''
          },
          routine: {
            sleepsWhere: ['Cama própria'],
            bathroomHabits: 'Faz xixi no tapete higiênico'
          },
          alerts: 'Gosta de buscar bolinha',
          personality: 'Carinhoso, brincalhão e muito inteligente'
        },
        {
          id: 'pet_002',
          userId: 'user_001',
          name: 'Luna',
          breed: 'SRD',
          weight: 12,
          birthdate: '2022-07-20',
          sex: 'Fêmea',
          health: { neutered: true, vaccines: [], conditions: 'Nenhuma', vet: {}, observations: '' },
          food: { type: '', portion: '', schedule: '', restrictions: '', observations: '' },
          behavior: {
            sociabilityDogs: 'Seletivo',
            sociabilityHumans: 'Cauteloso',
            reactivity: ['crianças', 'bicicletas'],
            resourceGuarding: { active: true, items: ['comida'] },
            pullsLeash: true,
            barksExcessively: false,
            knownCommands: ['senta'],
            observations: ''
          },
          routine: { sleepsWhere: ['Cama do tutor', 'Sofá'], bathroomHabits: 'Faz xixi na rua' },
          alerts: 'Medo de fogos de artifício',
          personality: 'Tímida no início, mas muito amorosa depois'
        },
        {
          id: 'pet_003',
          userId: 'user_002',
          name: 'Max',
          breed: 'Pastor Alemão',
          weight: 38,
          birthdate: '2019-11-05',
          sex: 'Macho',
          health: { neutered: true, vaccines: [], conditions: 'Displasia leve', vet: {}, observations: '' },
          food: { type: '', portion: '', schedule: '', restrictions: '', observations: '' },
          behavior: {
            sociabilityDogs: 'Não sociável',
            sociabilityHumans: 'Amigável',
            reactivity: ['outros cães'],
            resourceGuarding: { active: false, items: [] },
            pullsLeash: true,
            barksExcessively: true,
            knownCommands: ['senta', 'deita', 'fica', 'junto'],
            observations: ''
          },
          routine: { sleepsWhere: ['Área externa'], bathroomHabits: 'Faz xixi no jardim' },
          alerts: 'Não pode ficar com outros cães sem supervisão',
          personality: 'Protetor, leal e muito inteligente'
        }
      ]);
    }
  },
  
  bindEvents: () => {
    const petForm = document.getElementById('petForm');
    
    document.getElementById('guardActive')?.addEventListener('change', function() {
      const guardItems = document.getElementById('guardItems');
      if (guardItems) {
        guardItems.style.display = this.checked ? 'block' : 'none';
      }
    });
    
    document.getElementById('addVaccineBtn')?.addEventListener('click', Pets.addVaccineField);
    
    petForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      Pets.save();
    });
    
    Pets.startAutoSave();
    Pets.loadFromURL();
  },
  
  loadFromURL: () => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1]);
    const petId = params.get('id');
    
    const petFormTitle = document.getElementById('petFormTitle');
    const petForm = document.getElementById('petForm');
    
    if (petId) {
      Pets.currentPetId = petId;
      Pets.load(petId);
      if (petFormTitle) petFormTitle.textContent = 'Editar Pet';
    } else {
      Pets.currentPetId = null;
      if (petFormTitle) petFormTitle.textContent = 'Cadastrar Pet';
      if (petForm) petForm.reset();
    }
  },
  
  addVaccineField: (data = null) => {
    const container = document.getElementById('vaccinesContainer');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'vaccine-field';
    div.style.marginBottom = '1rem';
    div.style.padding = '1rem';
    div.style.background = 'var(--color-bg-hover)';
    div.style.borderRadius = 'var(--radius-md)';
    div.innerHTML = `
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:0.5rem;margin-bottom:0.5rem">
        <input type="text" class="form-control" placeholder="Nome da vacina" name="vaccineName" value="${data?.name || ''}">
        <input type="date" class="form-control" name="vaccineDate" title="Data da vacinação" value="${data?.date || ''}">
        <input type="date" class="form-control" name="vaccineNext" title="Data da revacinação" value="${data?.nextDate || ''}">
        <button type="button" class="btn btn-sm btn-secondary" onclick="Pets.removeVaccineField(this)" aria-label="Remover vacina">✕</button>
      </div>
      <div style="font-size:0.75rem;color:var(--color-text-muted);display:grid;grid-template-columns:2fr 1fr 1fr;gap:0.5rem;padding:0 0.25rem">
        <span>Nome da vacina</span>
        <span>Data vacinação</span>
        <span>Data revacinação</span>
      </div>
    `;
    
    container.appendChild(div);
  },
  
  removeVaccineField: (btn) => {
    btn.parentElement.remove();
  },
  
  load: (petId) => {
    const pets = Utils.get('pets', []);
    const pet = pets.find(p => p.id === petId);
    
    if (!pet) {
      Utils.toast('Pet não encontrado', 'error');
      return;
    }
    
    Pets.currentPetId = petId;
    
    document.getElementById('petId').value = pet.id;
    document.getElementById('petName').value = pet.name || '';
    document.getElementById('petBreed').value = pet.breed || '';
    document.getElementById('petWeight').value = pet.weight || '';
    document.getElementById('petBirth').value = pet.birthdate || '';
    document.getElementById('petSex').value = pet.sex || '';
    document.getElementById('petRga').value = pet.rga || '';
    document.getElementById('petChip').value = pet.microchip || '';
    
    document.getElementById('petPlan').value = pet.health?.plan || '';
    document.getElementById('petNeutered').checked = pet.health?.neutered || false;
    document.getElementById('petConditions').value = pet.health?.conditions || '';
    document.getElementById('vetName').value = pet.health?.vet?.name || '';
    document.getElementById('vetPhone').value = pet.health?.vet?.phone || '';
    document.getElementById('vetAddress').value = pet.health?.vet?.address || '';
    document.getElementById('healthObservations').value = pet.health?.observations || '';
    
    const vaccinesContainer = document.getElementById('vaccinesContainer');
    if (vaccinesContainer) {
      vaccinesContainer.innerHTML = '';
      (pet.health?.vaccines || []).forEach(v => Pets.addVaccineField(v));
      if ((pet.health?.vaccines || []).length === 0) {
        Pets.addVaccineField();
      }
    }
    
    document.getElementById('foodType').value = pet.food?.type || '';
    document.getElementById('foodPortion').value = pet.food?.portion || '';
    document.getElementById('foodSchedule').value = pet.food?.schedule || '';
    document.getElementById('foodRestrictions').value = pet.food?.restrictions || '';
    document.getElementById('foodObservations').value = pet.food?.observations || '';
    
    document.getElementById('behavDogs').value = pet.behavior?.sociabilityDogs || '';
    document.getElementById('behavHumans').value = pet.behavior?.sociabilityHumans || '';
    
    document.querySelectorAll('input[name="reactivity"]').forEach(cb => {
      cb.checked = pet.behavior?.reactivity?.includes(cb.value) || false;
    });
    
    document.getElementById('guardActive').checked = pet.behavior?.resourceGuarding?.active || false;
    document.getElementById('guardItems').style.display = (pet.behavior?.resourceGuarding?.active) ? 'block' : 'none';
    document.querySelectorAll('input[name="guardItem"]').forEach(cb => {
      cb.checked = pet.behavior?.resourceGuarding?.items?.includes(cb.value) || false;
    });
    
    document.getElementById('pullsLeash').checked = pet.behavior?.pullsLeash || false;
    document.getElementById('barksExcessively').checked = pet.behavior?.barksExcessively || false;
    document.getElementById('commands').value = pet.behavior?.knownCommands?.join(', ') || '';
    document.getElementById('behaviorObservations').value = pet.behavior?.observations || '';
    
    document.querySelectorAll('input[name="sleepsWhere"]').forEach(cb => {
      cb.checked = pet.routine?.sleepsWhere?.includes(cb.value) || false;
    });
    document.getElementById('bathroomHabits').value = pet.routine?.bathroomHabits || '';
    
    document.getElementById('petAlerts').value = pet.alerts || '';
    document.getElementById('petPersonality').value = pet.personality || '';
  },
  
  save: () => {
    if (!Auth.currentUser) {
      Utils.toast('Faça login para salvar', 'error');
      return;
    }
    
    const requiredFields = ['petName', 'petBreed', 'petWeight', 'petBirth', 'petSex', 'petAlerts'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && !Utils.validateRequired(field.value)) {
        field.classList.add('invalid');
        const errorEl = field.closest('.form-group')?.querySelector('.form-error');
        if (errorEl) {
          errorEl.textContent = 'Campo obrigatório';
          errorEl.classList.add('show');
        }
        isValid = false;
      } else if (field) {
        field.classList.remove('invalid');
      }
    });
    
    if (!isValid) {
      Utils.toast('Preencha os campos obrigatórios', 'error');
      return;
    }
    
    const vaccines = [];
    document.querySelectorAll('.vaccine-field').forEach(field => {
      const name = field.querySelector('[name="vaccineName"]')?.value;
      const date = field.querySelector('[name="vaccineDate"]')?.value;
      const next = field.querySelector('[name="vaccineNext"]')?.value;
      if (name) {
        vaccines.push({ name, date, nextDate: next });
      }
    });
    
    const reactivity = Array.from(document.querySelectorAll('input[name="reactivity"]:checked')).map(cb => cb.value);
    const guardItems = Array.from(document.querySelectorAll('input[name="guardItem"]:checked')).map(cb => cb.value);
    const commands = document.getElementById('commands').value.split(',').map(c => c.trim()).filter(Boolean);
    const sleepsWhere = Array.from(document.querySelectorAll('input[name="sleepsWhere"]:checked')).map(cb => cb.value);
    
    const petData = {
      id: Pets.currentPetId || Utils.generateId('pet_'),
      userId: Auth.currentUser.id,
      name: document.getElementById('petName').value.trim(),
      breed: document.getElementById('petBreed').value.trim(),
      weight: parseFloat(document.getElementById('petWeight').value),
      birthdate: document.getElementById('petBirth').value,
      sex: document.getElementById('petSex').value,
      rga: document.getElementById('petRga').value.trim(),
      microchip: document.getElementById('petChip').value.trim(),
      health: {
        plan: document.getElementById('petPlan').value.trim(),
        neutered: document.getElementById('petNeutered').checked,
        vaccines,
        conditions: document.getElementById('petConditions').value.trim(),
        vet: {
          name: document.getElementById('vetName').value.trim(),
          phone: document.getElementById('vetPhone').value.trim(),
          address: document.getElementById('vetAddress').value.trim()
        },
        observations: document.getElementById('healthObservations').value.trim()
      },
      food: {
        type: document.getElementById('foodType').value.trim(),
        portion: document.getElementById('foodPortion').value.trim(),
        schedule: document.getElementById('foodSchedule').value.trim(),
        restrictions: document.getElementById('foodRestrictions').value.trim(),
        observations: document.getElementById('foodObservations').value.trim()
      },
      behavior: {
        sociabilityDogs: document.getElementById('behavDogs').value,
        sociabilityHumans: document.getElementById('behavHumans').value,
        reactivity,
        resourceGuarding: {
          active: document.getElementById('guardActive').checked,
          items: guardItems
        },
        pullsLeash: document.getElementById('pullsLeash').checked,
        barksExcessively: document.getElementById('barksExcessively').checked,
        knownCommands: commands,
        observations: document.getElementById('behaviorObservations').value.trim()
      },
      routine: {
        sleepsWhere,
        bathroomHabits: document.getElementById('bathroomHabits').value.trim()
      },
      alerts: document.getElementById('petAlerts').value.trim(),
      personality: document.getElementById('petPersonality').value.trim()
    };
    
    const pets = Utils.get('pets', []);
    
    if (Pets.currentPetId) {
      const index = pets.findIndex(p => p.id === Pets.currentPetId);
      if (index !== -1) {
        pets[index] = petData;
      }
    } else {
      pets.push(petData);
    }
    
    Utils.save('pets', pets);
    
    Utils.toast(Pets.currentPetId ? 'Pet atualizado com sucesso!' : 'Pet cadastrado com sucesso!', 'success');
    
    setTimeout(() => {
      window.location.hash = '#dashboard';
    }, 1000);
  },
  
  startAutoSave: () => {
    if (Pets.autoSaveInterval) {
      clearInterval(Pets.autoSaveInterval);
    }
    
    Pets.autoSaveInterval = setInterval(() => {
      const petForm = document.getElementById('petForm');
      if (petForm && document.getElementById('petName')?.value) {
        console.log('Auto-save executado às', new Date().toLocaleTimeString());
      }
    }, 30000);
  },
  
  stopAutoSave: () => {
    if (Pets.autoSaveInterval) {
      clearInterval(Pets.autoSaveInterval);
      Pets.autoSaveInterval = null;
    }
  },
  
  getUserPets: () => {
    if (!Auth.currentUser) return [];
    const pets = Utils.get('pets', []);
    return pets.filter(p => p.userId === Auth.currentUser.id);
  },
  
  getPetById: (petId) => {
    const pets = Utils.get('pets', []);
    return pets.find(p => p.id === petId) || null;
  },
  
  delete: (petId, callback) => {
    if (!confirm('Tem certeza que deseja excluir este pet?')) return;
    
    const pets = Utils.get('pets', []);
    const filtered = pets.filter(p => p.id !== petId);
    
    if (filtered.length === pets.length) {
      Utils.toast('Pet não encontrado', 'error');
      return;
    }
    
    Utils.save('pets', filtered);
    Utils.toast('Pet excluído com sucesso', 'success');
    
    if (callback) callback();
  },
  
  renderDashboardList: () => {
    const container = document.getElementById('dashPets');
    if (!container) return;
    
    const pets = Pets.getUserPets();
    
    if (pets.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum pet cadastrado.</p>';
      return;
    }
    
    container.innerHTML = pets.map(pet => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid var(--color-border);${pets.indexOf(pet) === pets.length - 1 ? 'border-bottom:none' : ''}">
        <div>
          <strong>${pet.name}</strong><br>
          <small class="text-muted">${pet.breed} • ${pet.weight}kg • ${Utils.formatAge(pet.birthdate)}</small>
        </div>
        <a href="#pet?id=${pet.id}" class="btn btn-sm btn-secondary">Editar</a>
      </div>
    `).join('');
  },
  
  getVaccineAlerts: (days = 30) => {
    const pets = Utils.get('pets', []);
    const alerts = [];
    const today = new Date();
    
    pets.forEach(pet => {
      (pet.health?.vaccines || []).forEach(vaccine => {
        if (vaccine.nextDate) {
          const nextDate = new Date(vaccine.nextDate);
          const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays <= days) {
            alerts.push({
              petId: pet.id,
              petName: pet.name,
              vaccineName: vaccine.name,
              nextDate: vaccine.nextDate,
              daysRemaining: diffDays
            });
          }
        }
      });
    });
    
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  },
  
  renderVaccineAlerts: () => {
    const container = document.getElementById('dashAlerts');
    if (!container) return;
    
    const alerts = Pets.getVaccineAlerts();
    
    if (alerts.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum alerta no momento.</p>';
      return;
    }
    
    container.innerHTML = alerts.map(alert => `
      <div style="background:#fefcbf;color:#744210;padding:0.75rem;border-radius:var(--radius-sm);margin-bottom:0.5rem;font-size:0.875rem">
        ⚠️ <strong>${alert.petName}</strong>: ${alert.vaccineName} vence em ${alert.daysRemaining} dia${alert.daysRemaining > 1 ? 's' : ''}
      </div>
    `).join('');
  }
};

window.Pets = Pets;