document.addEventListener('DOMContentLoaded', function () {
    const shareBlock = document.querySelector('.share-block');

    if (!shareBlock) return;

    const shareTitle = shareBlock.querySelector('.share-title');

    if (!shareTitle) return;

    shareTitle.addEventListener('click', function (e) {
        e.stopPropagation();
        shareBlock.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
        if (!shareBlock.contains(e.target)) {
            shareBlock.classList.remove('active');
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // Quiz Data Storage
    let quizData = {
        workType: '',
        height: '',
        capacity: '',
        conditions: [],
        date: '',
        duration: ''
    };

    let currentStepNum = 1;

    function nextStep() {
        document.getElementById('step' + currentStepNum).classList.remove('active');
        currentStepNum++;
        document.getElementById('step' + currentStepNum).classList.add('active');
        updateProgress();
    }

    function updateProgress() {
        const progress = (currentStepNum / 6) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        document.getElementById('currentStep').textContent = currentStepNum;
    }

    function selectOption(category, value) {
        // Remove previous selection
        const categoryCards = document.querySelectorAll(`#step${currentStepNum} .option-card`);
        categoryCards.forEach(card => card.classList.remove('selected'));
        
        // Add selection to clicked card
        event.currentTarget.classList.add('selected');
        
        // Store data
        quizData[category] = value;
        
        // Enable next button
        const nextBtn = document.getElementById('nextBtn' + currentStepNum);
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-50');
        }

        // Special handling for "other" option
        if (category === 'workType' && value === 'other') {
            document.getElementById('otherWork').focus();
        }
    }

    function toggleMultiOption(category, value) {
        const card = event.currentTarget;
        
        if (!quizData[category]) {
            quizData[category] = [];
        }
        
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            quizData[category] = quizData[category].filter(item => item !== value);
        } else {
            card.classList.add('selected');
            quizData[category].push(value);
        }
        
        // Enable next button if at least one option is selected
        const nextBtn = document.getElementById('nextBtn' + currentStepNum);
        if (nextBtn) {
            nextBtn.disabled = quizData[category].length === 0;
            if (quizData[category].length > 0) {
                nextBtn.classList.remove('opacity-50');
            }
        }
    }

    function updateDateSelection() {
        quizData.date = document.getElementById('workDate').value;
        checkStep6Completion();
    }

    function checkStep6Completion() {
        const nextBtn = document.getElementById('nextBtn6');
        if (quizData.date && quizData.duration) {
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-50');
        }
    }

    function calculatePrice() {
        let basePrice = 8000; // Base price per shift
        
        // Height multiplier
        const heightMultipliers = {
            '15': 1.0,
            '22': 1.3,
            '28': 1.6,
            '35': 2.0,
            '40': 2.5
        };
        
        // Capacity multiplier
        const capacityMultipliers = {
            '120': 1.0,
            '250': 1.2,
            '350': 1.5
        };
        
        // Duration multiplier
        const durationMultipliers = {
            'hours': 0.7,
            'shift': 1.0,
            'days': 0.9,
            'week': 0.8,
            'unsure': 1.0
        };
        
        // Conditions multiplier
        let conditionsMultiplier = 1.0;
        if (quizData.conditions.includes('urban')) conditionsMultiplier += 0.1;
        if (quizData.conditions.includes('obstacles')) conditionsMultiplier += 0.15;
        if (quizData.conditions.includes('offroad')) conditionsMultiplier += 0.2;
        if (quizData.conditions.includes('indoor')) conditionsMultiplier += 0.05;
        
        const finalPrice = Math.round(basePrice * 
            (heightMultipliers[quizData.height] || 1) * 
            (capacityMultipliers[quizData.capacity] || 1) * 
            (durationMultipliers[quizData.duration] || 1) * 
            conditionsMultiplier);
        
        return finalPrice;
    }

    function getRecommendedEquipment() {
        let equipment = "автовышка";
        
        if (parseInt(quizData.height) <= 15) equipment = "автогидроподъемник коленчатый";
        else if (parseInt(quizData.height) <= 28) equipment = "автовышка телескопическая";
        else equipment = "автовышка большой высоты";
        
        if (quizData.conditions.includes('offroad')) equipment += " на шасси повышенной проходимости";
        if (quizData.conditions.includes('obstacles')) equipment += " с шарнирно-сочлененной стрелой";
        
        return equipment;
    }

    function showResults() {
        const price = calculatePrice();
        const equipment = getRecommendedEquipment();
        
        const resultsText = `
            На основе ваших ответов, вам подойдет <strong>${equipment}</strong> с высотой подъема <strong>${quizData.height} метров</strong> и грузоподъемностью <strong>${quizData.capacity} кг</strong>.
            <br><br>
            <div class="text-center">
                <div class="bg-white p-4 rounded-lg border-2 border-green-400 inline-block">
                    <div class="text-sm text-gray-600">Предварительная стоимость аренды:</div>
                    <div class="text-3xl font-bold text-green-600">от ${price.toLocaleString('ru-RU')} ₽</div>
                    <div class="text-sm text-gray-600">за смену</div>
                </div>
            </div>
        `;
        
        document.getElementById('resultsText').innerHTML = resultsText;
        document.getElementById('step6').classList.remove('active');
        document.getElementById('results').classList.add('active');
        
        // Update progress to 100%
        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('currentStep').textContent = '6';
    }

    // ===== ЧЕЛОВЕЧЕСКОЕ ПРЕОБРАЗОВАНИЕ ОТВЕТОВ =====
    const LABELS = {
    workType:   'Тип работ',
    height:     'Высота',
    capacity:   'Грузоподъёмность',
    conditions: 'Условия',
    date:       'Дата',
    duration:   'Длительность',
    };

    const DICT = {
    workType: {
        facade: 'Фасадные работы',
        roof:   'Кровля',
        inside: 'Внутренние',
        other:  'Другое',
    },
    duration: {
        hours: 'Почасово',
        shift: '1 смена',
        days:  'Несколько дней',
        week:  'Неделя',
        unsure:'Не знаю',
    },
    conditions: {
        urban:     'Плотная застройка',
        obstacles: 'Есть препятствия',
        offroad:   'Бездорожье',
        indoor:    'В помещении',
    }
    };

    function formatValue(key, val) {
    if (DICT[key]) {
        if (Array.isArray(val)) {
        return val.map(v => DICT[key][v] || v).join(', ');
        }
        return DICT[key][val] || val || 'не указано';
    }
    if (key === 'height' && val !== '') return String(val).trim() + ' м';
    if (key === 'capacity' && val !== '') return String(val).trim() + ' кг';
    if (Array.isArray(val)) return val.join(', ');
    return (val === '' || val == null) ? 'не указано' : val;
    }

    /**
     * Возвращает строку для текстового письма
     */
    function prettifyAnswersText(data) {
    const order = ['workType','height','capacity','conditions','date','duration'];
    const lines = [];
    order.forEach(key => {
        if (key in data) {
        lines.push(`${LABELS[key]}: ${formatValue(key, data[key])}`);
        }
    });
    return lines.join('\n');
    }

    /**
     * Возвращает HTML-версию для HTML-письма
     */
    function prettifyAnswersHtml(data) {
    const order = ['workType','height','capacity','conditions','date','duration'];
    const parts = order.map(key => {
        if (!(key in data)) return '';
        const val = formatValue(key, data[key]);
        return `<div><strong>${LABELS[key]}:</strong> ${escapeHtml(String(val))}</div>`;
    }).filter(Boolean);
    return parts.join('');
    }

    // Простейший эскейп для HTML
    function escapeHtml(s){
    return s
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }
    // ===== /ЧЕЛОВЕЧЕСКОЕ ПРЕОБРАЗОВАНИЕ ОТВЕТОВ =====

    const API_URL = window.QUIZ_API;

    async function submitForm(event) {
        event.preventDefault();

        const answersRaw = JSON.stringify(quizData);
        const answersHuman = prettifyAnswersText(quizData);

        const formData = {
            phone: (document.getElementById('userPhone')?.value || '').trim(),
            answers: answersRaw,
            answersHuman: answersHuman,
            source: 'quiz',
            pageUrl: location.href,
            quizsubmit: 1 // submitVar для FormIt
        };

        try {
            const resp = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
            body: new URLSearchParams(formData).toString()
            });

            // читаем как текст, чтобы не падать на не-JSON ответе
            const text = await resp.text();
            let data = null;
            try { data = JSON.parse(text); } catch (_) { /* не JSON — не страшно */ }

            // определяем успех «по-взрослому»
            const isJsonOk = data && (data.success === true || data.success === 1 || data.success === '1');
            const isOk = resp.ok && (isJsonOk || data === null); 
            // если JSON отсутствует, но код 200 — считаем успехом (FormIt иногда «молчит»)

            if (isOk) {
            // показать «спасибо»
            const results = document.getElementById('results');
            const thankYou = document.getElementById('thankYou');
            if (results) results.classList.remove('active');
            if (thankYou) thankYou.classList.add('active');

            if (typeof reportHeight === 'function') reportHeight();
            return;
            }

            // если дошли сюда — FormIt вернул ошибку валидации
            let msg = 'Не удалось отправить заявку.';
            if (data && data.errors) {
            const errs = Object.keys(data.errors).map(k => `${k}: ${data.errors[k]}`).join('\n');
            if (errs) msg += '\n' + errs;
            }
            alert(msg);
            console.error('FormIt error response:', {status: resp.status, text, data});
        } catch (e) {
            alert('Ошибка сети. Попробуйте позже.');
            console.error(e);
        }
    }

    const userPhone = document.getElementById('userPhone');

    if (userPhone) {
        userPhone.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            let formattedValue = '';

            if (value.length > 0) {
                if (value.charAt(0) !== '7') {
                    value = '7' + value;
                }

                formattedValue = '+7';

                if (value.length > 1) {
                    formattedValue += ' (' + value.substring(1, 4);
                }

                if (value.length >= 5) {
                    formattedValue += ') ' + value.substring(4, 7);
                }

                if (value.length >= 8) {
                    formattedValue += '-' + value.substring(7, 9);
                }

                if (value.length >= 10) {
                    formattedValue += '-' + value.substring(9, 11);
                }
            }

            e.target.value = formattedValue;
        });
    }

    // Set minimum date to today
    const workDate = document.getElementById('workDate');

    if (workDate) {
        workDate.min = new Date().toISOString().split('T')[0];
    }

    window.nextStep = nextStep;
    window.selectOption = selectOption;
    window.toggleMultiOption = toggleMultiOption;
    window.updateDateSelection = updateDateSelection;
    window.showResults = showResults;
    window.submitForm = submitForm;

    function reportHeight() {
    if (typeof window.__quizPostHeight === 'function') {
        window.__quizPostHeight();
    } else {
        // Прямая отправка, если вдруг нет функции
        const h = document.documentElement.scrollHeight;
        parent.postMessage({type:'quizHeight', value:h}, '*');
    }
    }

    // Примеры мест, где надо вызвать reportHeight():
    // - после nextStep
    const _nextStepOrig = nextStep;
    nextStep = function(e) {
    _nextStepOrig(e);
    reportHeight();
    };
    window.nextStep = nextStep;

    // - после showResults:
    const _showResultsOrig = showResults;
    showResults = function() {
    _showResultsOrig();
    reportHeight();
    };
    window.showResults = showResults;

    // - после submitForm:
    const _submitFormOrig = submitForm;
    submitForm = function(e) {
    _submitFormOrig(e);
    setTimeout(reportHeight, 50);
    };
    window.submitForm = submitForm;
});
// accordion
(function () {
    const catalogAccordions = document.querySelectorAll('.catalog_accordion_parent');

    catalogAccordions.forEach(function (acc) {
        acc.addEventListener('click', function () {
            const accordion = this.querySelector('.catalog_accordion');
            const panel = this.querySelector('.catalog_accordion-panel');

            if (accordion) {
                accordion.classList.toggle('active');
            }

            if (!panel) return;

            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + 'px';
            }
        });
    });
})();