// --- Elementos do DOM ---
const shopBtn = document.getElementById('shop-btn');
const libraryBtn = document.getElementById('library-btn');
const shopSection = document.getElementById('shop-section');
const librarySection = document.getElementById('library-section');
const gameListContainer = document.getElementById('game-list');
const libraryListContainer = document.getElementById('library-list');
const searchBar = document.getElementById('search-bar');
const searchSidebar = document.getElementById('search-sidebar');
const tagFiltersContainer = document.getElementById('tag-filters');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const emptyLibraryMsg = document.getElementById('empty-library-msg');
const exportFavoritesBtn = document.getElementById('export-favorites-btn');
const importFavoritesBtn = document.getElementById('import-favorites-btn');
const importFavoritesInput = document.getElementById('import-favorites-input');

// --- Variáveis de Estado ---
let favoritedGames = []; // IDs dos jogos favoritos
let currentFilters = {
    query: '',
    tags: []
};

// --- Funções Auxiliares ---

/**
 * Carrega os favoritos do localStorage.
 */
function loadFavorites() {
    try {
        const storedFavorites = localStorage.getItem('minhaDevSteamFavorites');
        if (storedFavorites) {
            favoritedGames = JSON.parse(storedFavorites);
        }
    } catch (e) {
        console.error("Erro ao carregar favoritos do localStorage:", e);
        favoritedGames = []; // Reset se houver erro
    }
}

/**
 * Salva os favoritos no localStorage.
 */
function saveFavorites() {
    localStorage.setItem('minhaDevSteamFavorites', JSON.stringify(favoritedGames));
}

/**
 * Gera o HTML para um card de jogo.
 * @param {Object} game - Objeto do jogo.
 * @param {boolean} isLibrary - Se o card é para a biblioteca (muda o texto do botão de favoritar).
 * @returns {string} HTML do card.
 */
function createGameCardHTML(game, isLibrary = false) {
    const isFavorited = favoritedGames.includes(game.id);
    const favoriteBtnText = isFavorited ? 'Remover' : 'Favoritar';
    const favoriteBtnClass = isFavorited ? 'favorite-btn favorited' : 'favorite-btn';

    const tagsHtml = game.tags.map(tag => `<span>${tag}</span>`).join('');

    return `
        <div class="game-card" data-id="${game.id}">
            <img src="${game.imageUrl}" alt="Capa do Jogo ${game.title}">
            <div class="game-info">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <div class="game-tags">${tagsHtml}</div>
                <div class="game-card-actions">
                    <a href="${game.gameUrl}" target="_blank" class="action-btn">Abrir</a>
                    <button class="${favoriteBtnClass}" data-id="${game.id}" data-action="${isFavorited ? 'remove' : 'add'}">${favoriteBtnText}</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza a lista de jogos em um contêiner específico.
 * @param {Array} gamesToRender - Array de objetos de jogos para renderizar.
 * @param {HTMLElement} container - O elemento DOM onde os cards serão adicionados.
 * @param {boolean} isLibrary - Indica se é para a seção da biblioteca.
 */
function renderGameList(gamesToRender, container, isLibrary = false) {
    container.innerHTML = ''; // Limpa o contêiner antes de renderizar
    if (gamesToRender.length === 0) {
        container.innerHTML = `<p class="empty-message">${isLibrary ? 'Sua biblioteca está vazia. Favorite alguns jogos na Loja!' : 'Nenhum jogo encontrado com os filtros aplicados.'}</p>`;
        if (isLibrary) { // Esconde a mensagem padrão se houver uma específica
            emptyLibraryMsg.style.display = 'none';
        }
        return;
    }
    gamesToRender.forEach(game => {
        container.innerHTML += createGameCardHTML(game, isLibrary);
    });
    // Se for biblioteca e houver jogos, esconde a mensagem de biblioteca vazia
    if (isLibrary && gamesToRender.length > 0) {
        emptyLibraryMsg.style.display = 'none';
    } else if (isLibrary) {
        emptyLibraryMsg.style.display = 'block'; // Mostra se não houver jogos
    }
}

/**
 * Alterna um jogo como favorito/não favorito.
 * @param {string} gameId - ID do jogo.
 */
function toggleFavorite(gameId) {
    if (favoritedGames.includes(gameId)) {
        favoritedGames = favoritedGames.filter(id => id !== gameId);
    } else {
        favoritedGames.push(gameId);
    }
    saveFavorites();
    renderShopPage(); // Re-renderiza a loja para atualizar o estado do botão
    renderLibraryPage(); // Re-renderiza a biblioteca
}

/**
 * Filtra os jogos com base na query de pesquisa e nas tags selecionadas.
 * @returns {Array} Array de jogos filtrados.
 */
function filterGames() {
    let filtered = games.filter(game => {
        const matchesQuery = game.title.toLowerCase().includes(currentFilters.query.toLowerCase()) ||
                             game.description.toLowerCase().includes(currentFilters.query.toLowerCase()) ||
                             game.tags.some(tag => tag.toLowerCase().includes(currentFilters.query.toLowerCase()));

        const matchesTags = currentFilters.tags.every(selectedTag =>
            game.tags.map(tag => tag.toLowerCase()).includes(selectedTag.toLowerCase())
        );

        return matchesQuery && matchesTags;
    });
    return filtered;
}

/**
 * Renderiza os botões de tags na sidebar de pesquisa.
 */
function renderTagFilters() {
    tagFiltersContainer.innerHTML = '';
    const allTags = [...new Set(games.flatMap(game => game.tags))]; // Coleta todas as tags únicas

    allTags.forEach(tag => {
        const button = document.createElement('button');
        button.classList.add('tag-button');
        button.textContent = tag;
        button.setAttribute('data-tag', tag);
        if (currentFilters.tags.includes(tag)) {
            button.classList.add('selected');
        }
        button.addEventListener('click', () => {
            toggleTagFilter(tag);
        });
        tagFiltersContainer.appendChild(button);
    });
}

/**
 * Adiciona/remove uma tag dos filtros selecionados e re-renderiza a loja.
 * @param {string} tag - A tag a ser alternada.
 */
function toggleTagFilter(tag) {
    const index = currentFilters.tags.indexOf(tag);
    if (index > -1) {
        currentFilters.tags.splice(index, 1); // Remove a tag
    } else {
        currentFilters.tags.push(tag); // Adiciona a tag
    }
    renderShopPage();
}

/**
 * Limpa todos os filtros de pesquisa e tags.
 */
function clearAllFilters() {
    currentFilters.query = '';
    currentFilters.tags = [];
    searchBar.value = ''; // Limpa o campo de pesquisa
    renderShopPage();
}

// --- Renderização de Páginas ---

/**
 * Mostra a seção da Loja e renderiza os jogos.
 */
function renderShopPage() {
    shopSection.classList.add('active');
    librarySection.classList.remove('active');
    shopBtn.classList.add('active');
    libraryBtn.classList.remove('active');

    const filteredGames = filterGames();
    renderGameList(filteredGames, gameListContainer, false);
    renderTagFilters(); // Garante que as tags estejam atualizadas
}

/**
 * Mostra a seção da Biblioteca e renderiza os jogos favoritados.
 */
function renderLibraryPage() {
    shopSection.classList.remove('active');
    librarySection.classList.add('active');
    shopBtn.classList.remove('active');
    libraryBtn.classList.add('active');

    const favoritedGameObjects = games.filter(game => favoritedGames.includes(game.id));
    renderGameList(favoritedGameObjects, libraryListContainer, true);
}

// --- Funções de Exportar/Importar ---

/**
 * Exporta os jogos favoritos para um arquivo JSON.
 */
function exportFavorites() {
    const dataStr = JSON.stringify(favoritedGames, null, 2); // beautify JSON
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meus-favoritos-devsteam.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Libera o URL do objeto
}

/**
 * Inicia o processo de importação de favoritos de um arquivo JSON.
 */
function importFavorites() {
    importFavoritesInput.click(); // Dispara o clique no input de arquivo oculto
}

/**
 * Manipula a leitura do arquivo JSON importado.
 * @param {Event} event - O evento de 'change' do input de arquivo.
 */
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                // Opcional: validar se são realmente IDs de jogos existentes
                const validIds = importedData.filter(id => games.some(game => game.id === id));
                favoritedGames = [...new Set([...favoritedGames, ...validIds])]; // Adiciona novos favoritos sem duplicar
                saveFavorites();
                renderLibraryPage();
                renderShopPage(); // Para atualizar o estado dos botões na loja
                alert('Favoritos importados com sucesso!');
            } else {
                alert('O arquivo JSON não contém um formato de lista de favoritos válido.');
            }
        } catch (error) {
            console.error('Erro ao ler ou parsear o arquivo JSON:', error);
            alert('Erro ao importar favoritos. Verifique se o arquivo é um JSON válido.');
        } finally {
            event.target.value = ''; // Limpa o input para permitir importar o mesmo arquivo novamente, se necessário
        }
    };
    reader.readAsText(file);
}

// --- Inicialização e Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    renderShopPage(); // Inicia na página da Loja

    // Navegação
    shopBtn.addEventListener('click', renderShopPage);
    libraryBtn.addEventListener('click', renderLibraryPage);

    // Funcionalidade de Pesquisa
    searchBar.addEventListener('input', (event) => {
        currentFilters.query = event.target.value;
        renderShopPage();
    });

    searchBar.addEventListener('focus', () => {
        searchSidebar.classList.add('active'); // Mostra a sidebar ao focar
    });

    // Clica fora da sidebar para esconder, exceto se for a barra de pesquisa ou um filtro
    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = searchSidebar.contains(event.target);
        const isClickOnSearchBar = searchBar.contains(event.target);
        const isClickOnTagButton = event.target.classList.contains('tag-button');

        if (!isClickInsideSidebar && !isClickOnSearchBar && !isClickOnTagButton) {
            searchSidebar.classList.remove('active');
        }
    });

    clearFiltersBtn.addEventListener('click', clearAllFilters);

    // Delegação de eventos para botões de Favoritar/Abrir (tanto na loja quanto na biblioteca)
    // Isso é mais eficiente do que adicionar listeners a cada card individualmente
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('favorite-btn')) {
            const gameId = target.dataset.id;
            toggleFavorite(gameId);
        }
        // Botão "Abrir" já é um <a> com target="_blank", não precisa de JS extra
    });

    // Exportar/Importar Favoritos
    exportFavoritesBtn.addEventListener('click', exportFavorites);
    importFavoritesBtn.addEventListener('click', importFavorites);
    importFavoritesInput.addEventListener('change', handleFileImport);
});