document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const taskInput = document.getElementById('new-task');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksContainer = document.getElementById('tasks-container');
    const dayTabs = document.querySelectorAll('.day-tab');
    const themeToggle = document.getElementById('theme-toggle');
    const showStatsBtn = document.getElementById('show-stats-btn');
    const hideStatsBtn = document.getElementById('hide-stats-btn');
    const taskList = document.querySelector('.task-list');
    const statsContainer = document.querySelector('.stats-container');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    // Графики
    const completionChart = new Chart(
        document.getElementById('completion-chart'),
        { type: 'bar', data: { labels: [], datasets: [] } }
    );
    const priorityChart = new Chart(
        document.getElementById('priority-chart'),
        { type: 'pie', data: { labels: [], datasets: [] } }
    );
    const categoryChart = new Chart(
        document.getElementById('category-chart'),
        { type: 'doughnut', data: { labels: [], datasets: [] } }
    );

    // Состояние
    let currentDay = 'all';
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Инициализация
    renderTasks();
    updateStats();
    checkTheme();
    
    // События
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
    themeToggle.addEventListener('click', toggleTheme);
    showStatsBtn.addEventListener('click', showStats);
    hideStatsBtn.addEventListener('click', hideStats);
    menuToggle.addEventListener('click', toggleMobileMenu);
    
    // Обработчики для вкладок (десктоп и мобильные)
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDay = tab.dataset.day;
            renderTasks();
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Функции
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;
        
        const newTask = {
            id: Date.now(),
            text,
            day: currentDay === 'all' ? 'unsorted' : currentDay,
            category: document.getElementById('task-category').value,
            priority: document.getElementById('task-priority').value,
            deadline: document.getElementById('task-deadline').value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        document.getElementById('task-deadline').value = '';
    }

    function renderTasks() {
        tasksContainer.innerHTML = '';
        
        let filteredTasks = currentDay === 'all' 
            ? tasks 
            : tasks.filter(task => task.day === currentDay);
            
        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = '<p class="no-tasks">Нет задач на выбранный период. 🎉</p>';
            return;
        }
        
        // Сортируем по приоритету (высокий -> низкий) и дедлайну
        filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31');
        });
        
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('li');
            taskEl.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
            taskEl.dataset.id = task.id;
            
            taskEl.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <div class="task-meta">
                    ${task.category ? `<span class="task-category">${getCategoryIcon(task.category)} ${getCategoryName(task.category)}</span>` : ''}
                    ${task.priority ? `<span class="task-priority">${getPriorityIcon(task.priority)}</span>` : ''}
                    ${task.deadline ? `<span class="task-deadline">⏰ ${formatDeadline(task.deadline)}</span>` : ''}
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Обработчики событий
            const checkbox = taskEl.querySelector('.task-checkbox');
            const editBtn = taskEl.querySelector('.edit-btn');
            const deleteBtn = taskEl.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            tasksContainer.appendChild(taskEl);
        });
    }

    function toggleTaskComplete(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
        updateStats();
    }

    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        const newText = prompt('Редактировать задачу:', task.text);
        if (newText && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(id) {
        if (confirm('Удалить задачу?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function checkTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.textContent = '☀️';
        }
    }

    function showStats() {
        taskList.classList.add('hidden');
        statsContainer.classList.remove('hidden');
        updateStats();
    }

    function hideStats() {
        taskList.classList.remove('hidden');
        statsContainer.classList.add('hidden');
    }

    function toggleMobileMenu() {
        mobileMenu.classList.toggle('hidden');
    }

    function updateStats() {
        // График выполнения по дням
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const completedByDay = Array(7).fill(0);
        const totalByDay = Array(7).fill(0);
        
        tasks.forEach(task => {
            if (task.day !== 'unsorted') {
                const dayIndex = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].indexOf(task.day);
                if (dayIndex !== -1) {
                    totalByDay[dayIndex]++;
                    if (task.completed) completedByDay[dayIndex]++;
                }
            }
        });
        
        completionChart.data = {
            labels: days,
            datasets: [
                {
                    label: 'Выполнено',
                    data: completedByDay,
                    backgroundColor: '#2ecc71'
                },
                {
                    label: 'Всего задач',
                    data: totalByDay,
                    backgroundColor: '#3498db'
                }
            ]
        };
        completionChart.options = {
            responsive: true,
            maintainAspectRatio: false
        };
        completionChart.update();
        
        // График по приоритетам
        const priorityData = {
            high: 0,
            medium: 0,
            low: 0
        };
        
        tasks.forEach(task => {
            if (task.priority) priorityData[task.priority]++;
        });
        
        priorityChart.data = {
            labels: ['Высокий', 'Средний', 'Низкий'],
            datasets: [{
                data: [priorityData.high, priorityData.medium, priorityData.low],
                backgroundColor: ['#e74c3c', '#f39c12', '#2ecc71']
            }]
        };
        priorityChart.options = {
            responsive: true,
            maintainAspectRatio: false
        };
        priorityChart.update();
        
        // График по категориям
        const categoryData = {
            work: 0,
            study: 0,
            sport: 0,
            personal: 0,
            general: 0
        };
        
        tasks.forEach(task => {
            if (task.category) categoryData[task.category]++;
        });
        
        categoryChart.data = {
            labels: ['Работа', 'Учёба', 'Спорт', 'Личное', 'Общее'],
            datasets: [{
                data: [
                    categoryData.work,
                    categoryData.study,
                    categoryData.sport,
                    categoryData.personal,
                    categoryData.general
                ],
                backgroundColor: [
                    '#3498db',
                    '#9b59b6',
                    '#e74c3c',
                    '#2ecc71',
                    '#f39c12'
                ]
            }]
        };
        categoryChart.options = {
            responsive: true,
            maintainAspectRatio: false
        };
        categoryChart.update();
    }

    // Вспомогательные функции
    function getDayName(day) {
        const days = {
            'monday': 'Пн',
            'tuesday': 'Вт',
            'wednesday': 'Ср',
            'thursday': 'Чт',
            'friday': 'Пт',
            'saturday': 'Сб',
            'sunday': 'Вс',
            'unsorted': 'Без дня'
        };
        return days[day] || day;
    }

    function getCategoryName(category) {
        const categories = {
            'work': 'Работа',
            'study': 'Учёба',
            'sport': 'Спорт',
            'personal': 'Личное',
            'general': 'Общее'
        };
        return categories[category] || category;
    }

    function getCategoryIcon(category) {
        const icons = {
            'work': '💼',
            'study': '📚',
            'sport': '🏋️',
            'personal': '🏠',
            'general': '📌'
        };
        return icons[category] || '';
    }

    function getPriorityIcon(priority) {
        const icons = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
        };
        return icons[priority] || '';
    }

    function formatDeadline(deadline) {
        if (!deadline) return '';
        const date = new Date(deadline);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});