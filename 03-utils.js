/**
 * CQC Adestramento - Utilitários Gerais
 * Funções de storage, validações, máscaras, formatação e helpers
 */

const Utils = {
  // ============================================
  // STORAGE
  // ============================================
  storagePrefix: 'cqc_pet_',
  
  /**
   * Salvar dados no localStorage
   * @param {string} key - Chave do storage
   * @param {any} data - Dados a serem salvos
   * @returns {boolean} - Sucesso da operação
   */
  save: (key, data) => {
    try {
      localStorage.setItem(Utils.storagePrefix + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Erro ao salvar no storage:', e);
      Utils.toast('Erro ao salvar dados', 'error');
      return false;
    }
  },
  
  /**
   * Ler dados do localStorage
   * @param {string} key - Chave do storage
   * @param {any} defaultValue - Valor padrão se não existir
   * @returns {any} - Dados armazenados ou valor padrão
   */
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(Utils.storagePrefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Erro ao ler do storage:', e);
      return defaultValue;
    }
  },
  
  /**
   * Remover dados do localStorage
   * @param {string} key - Chave do storage
   */
  remove: (key) => {
    localStorage.removeItem(Utils.storagePrefix + key);
  },
  
  /**
   * Exportar todos os dados da aplicação
   * @returns {string} - JSON com todos os dados
   */
  exportAll: () => {
    const data = {};
    const keys = ['users', 'pets', 'appointments', 'adminConfig', 'educationalContent', 'session'];
    keys.forEach(key => {
      data[key] = Utils.get(key);
    });
    return JSON.stringify(data, null, 2);
  },
  
  /**
   * Importar dados para a aplicação
   * @param {string} jsonString - JSON com os dados
   * @returns {boolean} - Sucesso da operação
   */
  importAll: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null) {
          Utils.save(key, value);
        }
      });
      return true;
    } catch (e) {
      console.error('Erro ao importar dados:', e);
      return false;
    }
  },
  
  // ============================================
  // VALIDAÇÕES
  // ============================================
  
  /**
   * Validar CPF
   * @param {string} cpf - CPF a validar
   * @returns {boolean} - CPF válido
   */
  validateCPF: (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    
    return rest === parseInt(cpf.substring(10, 11));
  },
  
  /**
   * Validar e-mail
   * @param {string} email - E-mail a validar
   * @returns {boolean} - E-mail válido
   */
  validateEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  /**
   * Validar telefone
   * @param {string} phone - Telefone a validar
   * @returns {boolean} - Telefone válido
   */
  validatePhone: (phone) => {
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 11;
  },
  
  /**
   * Validar senha (mínimo 6 caracteres)
   * @param {string} password - Senha a validar
   * @returns {boolean} - Senha válida
   */
  validatePassword: (password) => {
    return password && password.length >= 6;
  },
  
  /**
   * Validar data
   * @param {string} date - Data a validar
   * @returns {boolean} - Data válida
   */
  validateDate: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },
  
  /**
   * Validar campo obrigatório
   * @param {any} value - Valor a validar
   * @returns {boolean} - Campo preenchido
   */
  validateRequired: (value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    return value !== null && value !== undefined;
  },
  
  // ============================================
  // MÁSCARAS
  // ============================================
  
  /**
   * Máscara de CPF
   * @param {string} value - Valor a formatar
   * @returns {string} - CPF formatado
   */
  maskCPF: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  },
  
  /**
   * Máscara de telefone
   * @param {string} value - Valor a formatar
   * @returns {string} - Telefone formatado
   */
  maskPhone: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  },
  
  /**
   * Máscara de CEP
   * @param {string} value - Valor a formatar
   * @returns {string} - CEP formatado
   */
  maskCEP: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  },
  
  /**
   * Máscara de moeda
   * @param {string} value - Valor a formatar
   * @returns {string} - Valor formatado como moeda
   */
  maskCurrency: (value) => {
    value = value.replace(/\D/g, '');
    value = (Number(value) / 100).toFixed(2);
    return value.replace('.', ',');
  },
  
  // ============================================
  // FORMATAÇÃO
  // ============================================
  
  /**
   * Formatador de moeda
   * @param {number} value - Valor a formatar
   * @returns {string} - Valor formatado
   */
  formatCurrency: (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },
  
  /**
   * Formatador de data
   * @param {string|Date} dateString - Data a formatar
   * @param {object} options - Opções de formatação
   * @returns {string} - Data formatada
   */
  formatDate: (dateString, options = {}) => {
    if (!dateString) return '';
    const defaultOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    const mergedOptions = { ...defaultOptions, ...options };
    return new Intl.DateTimeFormat('pt-BR', mergedOptions).format(new Date(dateString));
  },
  
  /**
   * Formatador de data e hora
   * @param {string|Date} dateString - Data a formatar
   * @returns {string} - Data e hora formatadas
   */
  formatDateTime: (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  },
  
  /**
   * Formatador de idade a partir da data de nascimento
   * @param {string} birthdate - Data de nascimento
   * @returns {string} - Idade formatada
   */
  formatAge: (birthdate) => {
    if (!birthdate) return '';
    const today = new Date();
    const birth = new Date(birthdate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} mês${months > 1 ? 'es' : ''}`;
    } else {
      return 'Recém-nascido';
    }
  },
  
  /**
   * Capitalizar primeira letra
   * @param {string} str - String a capitalizar
   * @returns {string} - String capitalizada
   */
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  /**
   * Truncar texto
   * @param {string} str - String a truncar
   * @param {number} maxLength - Tamanho máximo
   * @returns {string} - String truncada
   */
  truncate: (str, maxLength = 100) => {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
  },
  
  // ============================================
  // DATAS
  // ============================================
  
  /**
   * Verificar se é fim de semana
   * @param {string|Date} date - Data a verificar
   * @returns {boolean} - É fim de semana
   */
  isWeekend: (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  },
  
  /**
   * Verificar se é feriado (lista simplificada)
   * @param {string|Date} date - Data a verificar
   * @returns {boolean} - É feriado
   */
  isHoliday: (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    
    // Feriados nacionais fixos
    const holidays = [
      { month: 1, day: 1 },    // Confraternização Universal
      { month: 4, day: 21 },   // Tiradentes
      { month: 5, day: 1 },    // Dia do Trabalho
      { month: 9, day: 7 },    // Independência
      { month: 10, day: 12 },  // Nossa Senhora Aparecida
      { month: 11, day: 2 },   // Finados
      { month: 11, day: 15 },  // Proclamação da República
      { month: 11, day: 20 },  // Consciência Negra (SP)
      { month: 12, day: 25 }   // Natal
    ];
    
    return holidays.some(h => h.month === month && h.day === day);
  },
  
  /**
   * Verificar se é alta temporada
   * @param {string|Date} date - Data a verificar
   * @returns {boolean} - É alta temporada
   */
  isHighSeason: (date) => {
    const month = new Date(date).getMonth() + 1;
    return [7, 12, 1].includes(month); // Julho, Dezembro, Janeiro
  },
  
  /**
   * Calcular diferença em dias entre duas datas
   * @param {string|Date} start - Data inicial
   * @param {string|Date} end - Data final
   * @returns {number} - Número de dias
   */
  getDaysBetween: (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  },
  
  /**
   * Iterar por cada dia entre duas datas
   * @param {string|Date} start - Data inicial
   * @param {string|Date} end - Data final
   * @param {function} callback - Função a executar para cada dia
   */
  forEachDay: (start, end, callback) => {
    const currentDate = new Date(start);
    const endDate = new Date(end);
    while (currentDate <= endDate) {
      callback(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  },
  
  /**
   * Adicionar dias a uma data
   * @param {string|Date} date - Data base
   * @param {number} days - Dias a adicionar
   * @returns {Date} - Nova data
   */
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  /**
   * Obter início do mês
   * @param {string|Date} date - Data base
   * @returns {Date} - Primeiro dia do mês
   */
  getStartOfMonth: (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },
  
  /**
   * Obter fim do mês
   * @param {string|Date} date - Data base
   * @returns {Date} - Último dia do mês
   */
  getEndOfMonth: (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  },
  
  // ============================================
  // UTILITÁRIOS GERAIS
  // ============================================
  
  /**
   * Gerar ID único
   * @param {string} prefix - Prefixo do ID
   * @returns {string} - ID único
   */
  generateId: (prefix = '') => {
    return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Debounce para funções
   * @param {function} func - Função a executar
   * @param {number} wait - Tempo de espera em ms
   * @returns {function} - Função com debounce
   */
  debounce: (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  /**
   * Throttle para funções
   * @param {function} func - Função a executar
   * @param {number} limit - Limite de tempo em ms
   * @returns {function} - Função com throttle
   */
  throttle: (func, limit = 300) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  /**
   * Clonar objeto profundamente
   * @param {object} obj - Objeto a clonar
   * @returns {object} - Objeto clonado
   */
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },
  
  /**
   * Verificar se objeto está vazio
   * @param {object} obj - Objeto a verificar
   * @returns {boolean} - Objeto está vazio
   */
  isEmpty: (obj) => {
    return Object.keys(obj).length === 0;
  },
  
  /**
   * Obter valor seguro de objeto aninhado
   * @param {object} obj - Objeto base
   * @param {string} path - Caminho (ex: 'user.profile.name')
   * @param {any} defaultValue - Valor padrão
   * @returns {any} - Valor ou padrão
   */
  getNested: (obj, path, defaultValue = null) => {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : defaultValue, obj);
  },
  
  /**
   * Fazer download de arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filename - Nome do arquivo
   * @param {string} type - Tipo MIME
   */
  downloadFile: (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  /**
   * Copiar texto para clipboard
   * @param {string} text - Texto a copiar
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error('Erro ao copiar:', e);
      return false;
    }
  },
  
  /**
   * Scroll suave para elemento
   * @param {string|HTMLElement} selector - Seletor ou elemento
   */
  scrollTo: (selector) => {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },
  
  // ============================================
  // TOAST/NOTIFICAÇÕES
  // ============================================
  
  /**
   * Mostrar notificação toast
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo (success, error, warning, info)
   * @param {number} duration - Duração em ms
   */
  toast: (message, type = 'info', duration = 3000) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;margin-left:auto;font-size:1.2rem;" aria-label="Fechar">&times;</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  },
  
  // ============================================
  // MODAL
  // ============================================
  
  /**
   * Mostrar modal
   * @param {string} content - Conteúdo HTML do modal
   */
  showModal: (content) => {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    
    container.innerHTML = `
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        ${content}
      </div>
    `;
    
    // Fechar ao clicar fora
    const overlay = container.querySelector('.modal-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        Utils.hideModal();
      }
    });
    
    // Fechar com Escape
    const closeHandler = (e) => {
      if (e.key === 'Escape') {
        Utils.hideModal();
        document.removeEventListener('keydown', closeHandler);
      }
    };
    document.addEventListener('keydown', closeHandler);
    
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
  },
  
  /**
   * Esconder modal
   */
  hideModal: () => {
    const container = document.getElementById('modalContainer');
    if (container) {
      container.innerHTML = '';
      document.body.style.overflow = '';
    }
  },
  
  // ============================================
  // LOADING
  // ============================================
  
  /**
   * Mostrar overlay de loading
   */
  showLoading: () => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  },
  
  /**
   * Esconder overlay de loading
   */
  hideLoading: () => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  },
  
  // ============================================
  // FORMULÁRIOS
  // ============================================
  
  /**
   * Setup de validação em tempo real para input
   * @param {HTMLElement} input - Elemento input
   * @param {function} validator - Função validadora
   * @param {string} errorMessage - Mensagem de erro
   */
  setupValidation: (input, validator, errorMessage) => {
    if (!input) return;
    
    const formGroup = input.closest('.form-group');
    const errorEl = formGroup?.querySelector('.form-error');
    
    const validate = () => {
      const isValid = validator(input.value);
      input.classList.toggle('valid', isValid && input.value);
      input.classList.toggle('invalid', !isValid && input.value);
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.classList.toggle('show', !isValid && input.value);
      }
      return isValid;
    };
    
    input.addEventListener('input', Utils.debounce(validate, 300));
    input.addEventListener('blur', validate);
    
    return validate;
  },
  
  /**
   * Validar formulário completo
   * @param {HTMLFormElement} form - Formulário a validar
   * @returns {boolean} - Formulário válido
   */
  validateForm: (form) => {
    if (!form) return false;
    
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
      const formGroup = field.closest('.form-group');
      const errorEl = formGroup?.querySelector('.form-error');
      
      if (!Utils.validateRequired(field.value)) {
        field.classList.add('invalid');
        field.classList.remove('valid');
        if (errorEl) {
          errorEl.textContent = 'Campo obrigatório';
          errorEl.classList.add('show');
        }
        isValid = false;
      } else {
        field.classList.remove('invalid');
        field.classList.add('valid');
        if (errorEl) {
          errorEl.classList.remove('show');
        }
      }
    });
    
    return isValid;
  },
  
  /**
   * Resetar formulário
   * @param {HTMLFormElement} form - Formulário a resetar
   */
  resetForm: (form) => {
    if (!form) return;
    form.reset();
    form.querySelectorAll('.form-control').forEach(input => {
      input.classList.remove('valid', 'invalid');
    });
    form.querySelectorAll('.form-error').forEach(error => {
      error.classList.remove('show');
    });
  }
};

// Exportar para escopo global
window.Utils = Utils;