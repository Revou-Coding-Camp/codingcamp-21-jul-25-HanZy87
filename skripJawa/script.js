document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.querySelector('.todo-form');
    const todoInput = document.querySelector('.todo-input');
    const todoDate = document.querySelector('.todo-date');
    const todoListContainer = document.querySelector('.todo-list-container');
    const filterContainer = document.querySelector('.filter-container');

    const errorMessage = document.getElementById('error-message');
    const statusDisplay = document.getElementById('status-display');
    const deleteAllBtn= document.getElementById('delete-all-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    let todos = [];
    let currentFilter = 'all';

    todoForm.addEventListener('submit', addTodo);
    todoListContainer.addEventListener('click', handleTodoActions);
    filterContainer.addEventListener('click', handleFilter);
    deleteAllBtn.addEventListener('click', showDeleteAllModal);
    confirmDeleteBtn.addEventListener('click', deleteAllTodos);
    cancelDeleteBtn.addEventListener('click', hideDeleteAllModal);
    
    loadTodosFromStorage();

    function showValidationError(message) {
        errorMessage.textContent = message;
        todoInput.classList.add('shake-error', 'border-red-500');
        setTimeout(() => {
            errorMessage.textContent = '';
            todoInput.classList.remove('shake-error', 'border-red-500');
        }, 1500);
    }

    function addTodo(e) {
        e.preventDefault();
        const todoText = todoInput.value.trim();
        if (todoText === '') {
            showValidationError('You can’t fight laziness with... nothing');
            return;
        }

        const newTodo = {
            id: Date.now(),
            text: todoText,
            date: todoDate.value,
            completed: false
        };
        
        todos.unshift (newTodo);
        saveAndRerender(true);
        todoInput.value = '';
        todoDate.value = '';
        todoInput.focus();
    }

    function handleTodoActions(e) {
        const button = e.target.closest('.action-btn');
        if (!button) return;

        const todoItem = button.closest('.todo-item');
        const todoId = Number(todoItem.dataset.id);

        if (button.dataset.action === 'delete') {
            todoItem.classList.add('fade-out-left');
            todoItem.addEventListener('animationend', () => {
                removeTodo(todoId);
            }, { once: true });
        }

        if (button.dataset.action === 'complete') {
            toggleTodoComplete(todoId);
        }
    }

    function removeTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveAndRerender();
    }

    function toggleTodoComplete(id) {
        todos=todos.map(todo => 
            todo.id === id ? {...todo, completed: !todo.completed} : todo
        );
        saveAndRerender();
    }

    function handleFilter(e) {
        const filterBtn = e.target.closest('.filter-btn');
        if (!filterBtn) return;

        currentFilter = filterBtn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active', 'bg-white', 'text-blue-500', 'shadow'));
        filterBtn.classList.add('active', 'bg-white', 'text-blue-500', 'shadow');
        renderTodos();
    }

    function renderTodos (isNewItem = false) {
        todoListContainer.innerHTML = '';
        const filteredTodos = getFilteredTodos();

        if (filteredTodos.length === 0 && todos.length === 0){
            todoListContainer.innerHTML = `
                <li class="text-center text-slate-500 p-8">
                    <i class="fas fa-clipboard-check text-4xl mb-4 text-green-400"></i>
                    <p class="font-semibold">Your list is clear... for now</p>
                    <p class="text-sm">You call this a war on laziness? Add a task first.</p>
                </li>`;
        }

        else if (filteredTodos.length === 0 && todos.length > 0){
            todoListContainer.innerHTML = `
                <li class="text-center text-slate-500 p-8">
                    <i class="fas fa-folder-open text-4xl mb-4 text-400"></i>
                    <p class="font-semibold">Not a single mission complete</p>
                    <p class="text-sm">Step up, Kiddos. Finish one.</p>
                </li>`;
        }
        
        else {
            filteredTodos.forEach((todo, index) => {
                const todoElement = createTodoElement(todo);
                if (isNewItem && index === 0 && currentFilter !== 'completed') {
                    todoElement.classList.add('fade-in-up');
                }
                todoListContainer.appendChild(todoElement);
            });
        }
    }

    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item flex items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 transition-all duration-300 ${todo.completed ? 'opacity-60 bg-slate-50' : ''}`;
        li.dataset.id = todo.id;

        const formattedDate = todo.date 
            ? new Date(todo.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : '';

        const isPastDue = todo.date && !todo.completed && new Date(todo.date) < new Date().setHours(0,0,0,0);

        const dateDisplayHTML = todo.date 
            ? `<span class="text-sm flex items-center ${isPastDue ? 'text-red-500 font-semibold' : 'text-slate-500'}">
                    <i class="fa-regular fa-calendar mr-1.5"></i>
                    ${formattedDate}
                </span>` 
            : `<span class="text-sm text-slate-400 italic">No due date</span>`;

        li.innerHTML = `
            <div class="flex-grow">
                <p class="text-slate-800 ${todo.completed ? 'line-through' : ''}">${todo.text}</p>
                ${dateDisplayHTML}
            </div>
            <div class="flex items-center gap-2 ml-4">
                <button data-action="complete" class="action-btn w-10 h-10 flex items-center justify-center rounded-full transition ${todo.completed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600'}">
                    <i class="fas fa-check"></i>
                </button>
                <button data-action="delete" class="action-btn w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-500">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        return li;
    }

    function getFilteredTodos() {
        switch (currentFilter) {
            case 'completed': return todos.filter(t => t.completed);
            case 'pending': return todos.filter(t => !t.completed);
            default: return todos;
        }
    }

    function updateStatus() {
        const pendingCount = todos.filter(t => !t.completed).length;
        const completedCount = todos.filter(t => t.completed).length;
        statusDisplay.innerHTML = `
            <span class="mr-2"><i class="fa-solid fa-list-ul mr-1 text-blue-500"></i>Pending: <strong class="text-slate-700">${pendingCount}</strong></span>
            <span class="ml-2"><i class="fa-solid fa-check-double mr-1 text-green-500"></i>Completed: <strong class="text-slate-700">${completedCount}</strong></span>
        `;
    }

    function saveAndRerender(isNew = false) {
        saveTodosToStorage();
        renderTodos(isNew);
        updateStatus();
    }

   
    function showDeleteAllModal() {
        if(todos.length === 0) return; // Jangan tampilkan modal jika tidak ada tugas
        confirmationModal.classList.remove('hidden');
    }

    function hideDeleteAllModal() {
        confirmationModal.classList.add('hidden');
    }

    function deleteAllTodos() {
        todos = [];
        saveAndRerender();
        hideDeleteAllModal();
    }

    
    function saveTodosToStorage() {
        localStorage.setItem('tailwindTodos', JSON.stringify(todos));
    }

    function loadTodosFromStorage() {
        const storedTodos = localStorage.getItem('tailwindTodos');
        if (storedTodos) {
            todos = JSON.parse(storedTodos);
        }
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active', 'bg-white', 'text-blue-500', 'shadow');
        saveAndRerender();
    }
});

