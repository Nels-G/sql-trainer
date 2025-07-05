// Page de connexion
document.addEventListener('DOMContentLoaded', function() {
    // Simuler un chargement
    const loadingScreen = document.getElementById('loadingScreen');
    const loginForm = document.getElementById('loginForm');
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        loginForm.style.display = 'block';
    }, 2000);
    
    // Gestion de la connexion
    const loginFormElement = document.getElementById('loginFormElement');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Vérification des identifiants
            if (username === 'Admin' && password === 'Nels123') {
                // Stocker l'état de connexion dans localStorage
                localStorage.setItem('sqlTrainerLoggedIn', 'true');
                localStorage.setItem('sqlTrainerUsername', username);
                
                // Rediriger vers le tableau de bord
                window.location.href = 'pages/dashboard.html';
            } else {
                alert('Identifiants incorrects. Utilisez Admin / Nels123');
            }
        });
    }
    
    // Si on est sur le tableau de bord, vérifier la connexion
    if (window.location.pathname.includes('dashboard.html')) {
        checkLoginStatus();
        initializeDashboard();
    }
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('sqlTrainerLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        window.location.href = 'index.html';
    } else {
        const username = localStorage.getItem('sqlTrainerUsername');
        if (username && document.getElementById('currentUsername')) {
            document.getElementById('currentUsername').textContent = username;
        }
    }
}

function initializeDashboard() {
    // Gestion de la déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('sqlTrainerLoggedIn');
            localStorage.removeItem('sqlTrainerUsername');
            window.location.href = 'index.html';
        });
    }
    
    // Initialisation des bases de données
    initDatabases();
    
    // Gestion des onglets
    setupTabs();
    
    // Gestion des modals
    setupModals();
    
    // Gestion de l'éditeur SQL
    setupSqlEditor();
}

function initDatabases() {
    // Charger les bases de données depuis localStorage
    let databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    
    const databaseList = document.getElementById('databaseList');
    if (databaseList) {
        databaseList.innerHTML = '';
        
        if (databases.length === 0) {
            databaseList.innerHTML = '<li class="empty">Aucune base de données</li>';
        } else {
            databases.forEach(db => {
                const li = document.createElement('li');
                li.textContent = db.name;
                li.addEventListener('click', function() {
                    // Enlever la classe active de tous les éléments
                    document.querySelectorAll('#databaseList li').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Ajouter la classe active à l'élément cliqué
                    li.classList.add('active');
                    
                    // Charger les tables de cette base de données
                    loadTables(db.name);
                });
                
                databaseList.appendChild(li);
            });
        }
    }
}

function loadTables(dbName) {
    const databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    const db = databases.find(d => d.name === dbName);
    
    const tablesList = document.getElementById('tablesList');
    if (tablesList) {
        tablesList.innerHTML = '';
        
        if (!db || !db.tables || db.tables.length === 0) {
            tablesList.innerHTML = '<p class="empty-tables">Aucune table dans cette base de données.</p>';
        } else {
            db.tables.forEach(table => {
                const tableItem = document.createElement('div');
                tableItem.className = 'table-item';
                
                tableItem.innerHTML = `
                    <div class="table-header">
                        <span class="table-name">${table.name}</span>
                        <div class="table-actions">
                            <button class="btn-view-data" data-table="${table.name}">
                                <i class="fas fa-eye"></i> Voir données
                            </button>
                            <button class="btn-delete-table" data-table="${table.name}">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                    <div class="columns-list">
                        ${table.columns.map(col => `
                            <div class="column-item">
                                <span class="column-name">${col.name}</span>
                                <span class="column-type">${col.type}</span>
                                ${col.size ? `<span class="column-size">(${col.size})</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
                
                tablesList.appendChild(tableItem);
            });
            
            // Ajouter les événements aux boutons
            document.querySelectorAll('.btn-view-data').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tableName = this.getAttribute('data-table');
                    viewTableData(dbName, tableName);
                });
            });
            
            document.querySelectorAll('.btn-delete-table').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tableName = this.getAttribute('data-table');
                    if (confirm(`Voulez-vous vraiment supprimer la table ${tableName} ?`)) {
                        deleteTable(dbName, tableName);
                    }
                });
            });
        }
    }
}

function viewTableData(dbName, tableName) {
    // Ouvrir l'onglet SQL et afficher une requête SELECT
    document.querySelector('.tab[data-tab="sql-query"]').click();
    
    const sqlQueryInput = document.getElementById('sqlQueryInput');
    if (sqlQueryInput) {
        sqlQueryInput.value = `SELECT * FROM ${tableName};`;
        
        // Exécuter automatiquement la requête
        setTimeout(() => {
            document.getElementById('executeQueryBtn').click();
        }, 100);
    }
}

function deleteTable(dbName, tableName) {
    let databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    const dbIndex = databases.findIndex(d => d.name === dbName);
    
    if (dbIndex !== -1) {
        databases[dbIndex].tables = databases[dbIndex].tables.filter(t => t.name !== tableName);
        localStorage.setItem('sqlTrainerDatabases', JSON.stringify(databases));
        
        // Recharger les tables
        loadTables(dbName);
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Désactiver tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activer l'onglet cliqué
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function setupModals() {
    // Modal de création de base de données
    const createDbBtn = document.getElementById('createDbBtn');
    const createDbModal = document.getElementById('createDatabaseModal');
    const closeDbModal = createDbModal.querySelector('.close-modal');
    const confirmCreateDb = document.getElementById('confirmCreateDb');
    
    if (createDbBtn) {
        createDbBtn.addEventListener('click', function() {
            createDbModal.style.display = 'flex';
        });
    }
    
    closeDbModal.addEventListener('click', function() {
        createDbModal.style.display = 'none';
    });
    
    confirmCreateDb.addEventListener('click', function() {
        const dbName = document.getElementById('newDbName').value.trim();
        
        if (dbName) {
            createDatabase(dbName);
            createDbModal.style.display = 'none';
            document.getElementById('newDbName').value = '';
        } else {
            alert('Veuillez entrer un nom pour la base de données');
        }
    });
    
    // Modal de création de table
    const createTableBtn = document.getElementById('createTableBtn');
    const createTableModal = document.getElementById('createTableModal');
    const closeTableModal = createTableModal.querySelector('.close-modal');
    const confirmCreateTable = document.getElementById('confirmCreateTable');
    const addColumnBtn = document.getElementById('addColumnBtn');
    const columnsContainer = document.getElementById('columnsContainer');
    
    if (createTableBtn) {
        createTableBtn.addEventListener('click', function() {
            // Vérifier qu'une base de données est sélectionnée
            const selectedDb = document.querySelector('#databaseList li.active');
            
            if (!selectedDb) {
                alert('Veuillez d\'abord sélectionner une base de données');
                return;
            }
            
            createTableModal.style.display = 'flex';
        });
    }
    
    closeTableModal.addEventListener('click', function() {
        createTableModal.style.display = 'none';
    });
    
    // Ajouter une colonne
    addColumnBtn.addEventListener('click', function() {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        columnItem.innerHTML = `
            <input type="text" placeholder="nom" class="column-name">
            <select class="column-type">
                <option value="INT">INT</option>
                <option value="VARCHAR">VARCHAR</option>
                <option value="TEXT">TEXT</option>
                <option value="DATE">DATE</option>
                <option value="BOOLEAN">BOOLEAN</option>
            </select>
            <input type="number" placeholder="Taille" class="column-size" value="255">
            <button class="remove-column-btn"><i class="fas fa-times"></i></button>
        `;
        
        columnsContainer.appendChild(columnItem);
        
        // Ajouter l'événement pour supprimer la colonne
        columnItem.querySelector('.remove-column-btn').addEventListener('click', function() {
            columnItem.remove();
        });
    });
    
    // Confirmer la création de la table
    confirmCreateTable.addEventListener('click', function() {
        const tableName = document.getElementById('newTableName').value.trim();
        const selectedDb = document.querySelector('#databaseList li.active');
        
        if (!tableName) {
            alert('Veuillez entrer un nom pour la table');
            return;
        }
        
        if (!selectedDb) {
            alert('Aucune base de données sélectionnée');
            return;
        }
        
        const dbName = selectedDb.textContent;
        
        // Récupérer les colonnes
        const columnItems = columnsContainer.querySelectorAll('.column-item');
        const columns = [];
        
        columnItems.forEach(item => {
            const name = item.querySelector('.column-name').value.trim();
            const type = item.querySelector('.column-type').value;
            const size = item.querySelector('.column-size').value;
            
            if (name) {
                columns.push({
                    name,
                    type,
                    size: type === 'VARCHAR' ? size : null
                });
            }
        });
        
        if (columns.length === 0) {
            alert('Veuillez ajouter au moins une colonne');
            return;
        }
        
        createTable(dbName, tableName, columns);
        
        // Réinitialiser le modal
        createTableModal.style.display = 'none';
        document.getElementById('newTableName').value = '';
        columnsContainer.innerHTML = `
            <div class="column-item">
                <input type="text" placeholder="nom" class="column-name">
                <select class="column-type">
                    <option value="INT">INT</option>
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="TEXT">TEXT</option>
                    <option value="DATE">DATE</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                </select>
                <input type="number" placeholder="Taille" class="column-size" value="255">
                <button class="remove-column-btn"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        // Ajouter l'événement pour supprimer la colonne
        columnsContainer.querySelector('.remove-column-btn').addEventListener('click', function() {
            columnsContainer.querySelector('.column-item').remove();
        });
    });
    
    // Fermer les modals en cliquant à l'extérieur
    window.addEventListener('click', function(e) {
        if (e.target === createDbModal) {
            createDbModal.style.display = 'none';
        }
        
        if (e.target === createTableModal) {
            createTableModal.style.display = 'none';
        }
    });
}

function createDatabase(dbName) {
    let databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    
    // Vérifier si la base de données existe déjà
    if (databases.some(db => db.name === dbName)) {
        alert('Une base de données avec ce nom existe déjà');
        return;
    }
    
    databases.push({
        name: dbName,
        tables: []
    });
    
    localStorage.setItem('sqlTrainerDatabases', JSON.stringify(databases));
    
    // Mettre à jour la liste des bases de données
    initDatabases();
}

function createTable(dbName, tableName, columns) {
    let databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    const dbIndex = databases.findIndex(db => db.name === dbName);
    
    if (dbIndex === -1) {
        alert('Base de données non trouvée');
        return;
    }
    
    // Vérifier si la table existe déjà
    if (databases[dbIndex].tables.some(t => t.name === tableName)) {
        alert('Une table avec ce nom existe déjà dans cette base de données');
        return;
    }
    
    // Ajouter la table
    databases[dbIndex].tables.push({
        name: tableName,
        columns,
        data: [] // Pour stocker les données de la table
    });
    
    localStorage.setItem('sqlTrainerDatabases', JSON.stringify(databases));
    
    // Mettre à jour la liste des tables
    loadTables(dbName);
}

function setupSqlEditor() {
    const executeQueryBtn = document.getElementById('executeQueryBtn');
    const clearQueryBtn = document.getElementById('clearQueryBtn');
    const sqlQueryInput = document.getElementById('sqlQueryInput');
    const queryResultsContainer = document.getElementById('queryResultsContainer');
    
    if (executeQueryBtn) {
        executeQueryBtn.addEventListener('click', function() {
            const query = sqlQueryInput.value.trim();
            
            if (!query) {
                alert('Veuillez entrer une requête SQL');
                return;
            }
            
            executeQuery(query);
        });
    }
    
    if (clearQueryBtn) {
        clearQueryBtn.addEventListener('click', function() {
            sqlQueryInput.value = '';
            queryResultsContainer.innerHTML = '<p class="empty-results">Aucune requête exécutée.</p>';
        });
    }
}

function executeQuery(query) {
    const queryResultsContainer = document.getElementById('queryResultsContainer');
    queryResultsContainer.innerHTML = '<p>Exécution de la requête...</p>';
    
    // Simuler un délai d'exécution
    setTimeout(() => {
        try {
            // Analyser la requête
            const queryUpper = query.toUpperCase();
            
            // Vérifier quelle base de données est sélectionnée
            const selectedDb = document.querySelector('#databaseList li.active');
            
            if (!selectedDb && !queryUpper.includes('CREATE DATABASE')) {
                throw new Error('Aucune base de données sélectionnée');
            }
            
            const dbName = selectedDb ? selectedDb.textContent : null;
            
            if (queryUpper.startsWith('SELECT')) {
                handleSelectQuery(query, dbName, queryResultsContainer);
            } else if (queryUpper.startsWith('INSERT')) {
                handleInsertQuery(query, dbName, queryResultsContainer);
            } else if (queryUpper.startsWith('UPDATE')) {
                handleUpdateQuery(query, dbName, queryResultsContainer);
            } else if (queryUpper.startsWith('DELETE')) {
                handleDeleteQuery(query, dbName, queryResultsContainer);
            } else if (queryUpper.startsWith('CREATE TABLE')) {
                handleCreateTableQuery(query, dbName, queryResultsContainer);
            } else if (queryUpper.startsWith('CREATE DATABASE')) {
                handleCreateDatabaseQuery(query, queryResultsContainer);
            } else if (queryUpper.startsWith('DROP TABLE')) {
                handleDropTableQuery(query, dbName, queryResultsContainer);
            } else if (queryUpper.startsWith('DROP DATABASE')) {
                handleDropDatabaseQuery(query, queryResultsContainer);
            } else {
                throw new Error('Type de requête non pris en charge');
            }
        } catch (error) {
            queryResultsContainer.innerHTML = `
                <div class="error-message">
                    <strong>Erreur :</strong> ${error.message}
                </div>
            `;
        }
    }, 500);
}

function handleSelectQuery(query, dbName, container) {
    // Extraire le nom de la table (simplifié)
    const tableMatch = query.match(/FROM\s+([^\s;]+)/i);
    if (!tableMatch) {
        throw new Error('Syntaxe SELECT incorrecte. Format attendu: SELECT * FROM table');
    }
    
    const tableName = tableMatch[1];
    
    // Récupérer les données de la table
    const databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    const db = databases.find(d => d.name === dbName);
    
    if (!db) {
        throw new Error(`Base de données '${dbName}' non trouvée`);
    }
    
    const table = db.tables.find(t => t.name === tableName);
    
    if (!table) {
        throw new Error(`Table '${tableName}' non trouvée dans la base de données '${dbName}'`);
    }
    
    // Afficher les résultats
    if (table.data.length === 0) {
        container.innerHTML = `
            <div class="success-message">
                Requête exécutée avec succès. 0 ligne(s) retournée(s).
            </div>
            <p>Aucune donnée dans la table ${tableName}.</p>
        `;
    } else {
        // Créer un tableau HTML avec les résultats
        let html = `
            <div class="success-message">
                Requête exécutée avec succès. ${table.data.length} ligne(s) retournée(s).
            </div>
            <table class="query-table">
                <thead>
                    <tr>
                        ${table.columns.map(col => `<th>${col.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        table.data.forEach(row => {
            html += '<tr>';
            table.columns.forEach(col => {
                html += `<td>${row[col.name] !== undefined ? row[col.name] : 'NULL'}</td>`;
            });
            html += '</tr>';
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
}

function handleInsertQuery(query, dbName, container) {
    // Extraire le nom de la table et les valeurs (simplifié)
    const tableMatch = query.match(/INTO\s+([^\s(]+)/i);
    const valuesMatch = query.match(/VALUES\s*\(([^)]+)\)/i);
    
    if (!tableMatch || !valuesMatch) {
        throw new Error('Syntaxe INSERT incorrecte. Format attendu: INSERT INTO table (col1, col2) VALUES (val1, val2)');
    }
    
    const tableName = tableMatch[1];
    const valuesStr = valuesMatch[1];
    const values = valuesStr.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
    
    // Récupérer la table
    const databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    const dbIndex = databases.findIndex(d => d.name === dbName);
    
    if (dbIndex === -1) {
        throw new Error(`Base de données '${dbName}' non trouvée`);
    }
    
    const tableIndex = databases[dbIndex].tables.findIndex(t => t.name === tableName);
    
    if (tableIndex === -1) {
        throw new Error(`Table '${tableName}' non trouvée dans la base de données '${dbName}'`);
    }
    
    const table = databases[dbIndex].tables[tableIndex];
    
    // Vérifier le nombre de colonnes
    if (values.length !== table.columns.length) {
        throw new Error(`Nombre incorrect de valeurs. La table ${tableName} a ${table.columns.length} colonnes`);
    }
    
    // Créer la nouvelle ligne
    const newRow = {};
    table.columns.forEach((col, index) => {
        newRow[col.name] = values[index];
    });
    
    // Ajouter la nouvelle ligne
    databases[dbIndex].tables[tableIndex].data.push(newRow);
    localStorage.setItem('sqlTrainerDatabases', JSON.stringify(databases));
    
    container.innerHTML = `
        <div class="success-message">
            Requête exécutée avec succès. 1 ligne(s) insérée(s).
        </div>
    `;
}

function handleUpdateQuery(query, dbName, container) {
    // Extraire le nom de la table, les SET et les WHERE (simplifié)
    const tableMatch = query.match(/UPDATE\s+([^\s]+)/i);
    const setMatch = query.match(/SET\s+([^WHERE]+)/i);
    
    if (!tableMatch || !setMatch) {
        throw new Error('Syntaxe UPDATE incorrecte. Format attendu: UPDATE table SET col1=val1 WHERE condition');
    }
    
    const tableName = tableMatch[1];
    const setStr = setMatch[1];
    const setParts = setStr.split(',').map(part => part.trim());
    
    // Récupérer la table
    const databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    const dbIndex = databases.findIndex(d => d.name === dbName);
    
    if (dbIndex === -1) {
        throw new Error(`Base de données '${dbName}' non trouvée`);
    }
    
    const tableIndex = databases[dbIndex].tables.findIndex(t => t.name === tableName);
    
    if (tableIndex === -1) {
        throw new Error(`Table '${tableName}' non trouvée dans la base de données '${dbName}'`);
    }
    
    const table = databases[dbIndex].tables[tableIndex];
    
    // Analyser les parties SET
    const updates = {};
    setParts.forEach(part => {
        const [col, val] = part.split('=').map(s => s.trim());
        updates[col] = val.replace(/^['"]|['"]$/g, '');
    });
    
    // Vérifier que les colonnes existent
    Object.keys(updates).forEach(col => {
        if (!table.columns.some(c => c.name === col)) {
            throw new Error(`Colonne '${col}' non trouvée dans la table '${tableName}'`);
        }
    });
    
    // Appliquer les modifications (simplifié - met à jour toutes les lignes)
    let affectedRows = 0;
    databases[dbIndex].tables[tableIndex].data.forEach(row => {
        Object.keys(updates).forEach(col => {
            row[col] = updates[col];
        });
        affectedRows++;
    });
    
    localStorage.setItem('sqlTrainerDatabases', JSON.stringify(databases));
    
    container.innerHTML = `
        <div class="success-message">
            Requête exécutée avec succès. ${affectedRows} ligne(s) mise(s) à jour.
        </div>
    `;
}

function handleDeleteQuery(query, dbName, container) {
    // Extraire le nom de la table (simplifié - supprime toutes les lignes)
    const tableMatch = query.match(/FROM\s+([^\s;]+)/i);
    
    if (!tableMatch) {
        throw new Error('Syntaxe DELETE incorrecte. Format attendu: DELETE FROM table');
    }
    
    const tableName = tableMatch[1];
    
    // Récupérer la table
    const databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    const dbIndex = databases.findIndex(d => d.name === dbName);
    
    if (dbIndex === -1) {
        throw new Error(`Base de données '${dbName}' non trouvée`);
    }
    
    const tableIndex = databases[dbIndex].tables.findIndex(t => t.name === tableName);
    
    if (tableIndex === -1) {
        throw new Error(`Table '${tableName}' non trouvée dans la base de données '${dbName}'`);
    }
    
    const rowCount = databases[dbIndex].tables[tableIndex].data.length;
    
    // Supprimer toutes les données
    databases[dbIndex].tables[tableIndex].data = [];
    localStorage.setItem('sqlTrainerDatabases', JSON.stringify(databases));
    
    container.innerHTML = `
        <div class="success-message">
            Requête exécutée avec succès. ${rowCount} ligne(s) supprimée(s).
        </div>
    `;
}

function handleCreateTableQuery(query, dbName, container) {
    // Extraire le nom de la table et les colonnes (simplifié)
    const tableMatch = query.match(/TABLE\s+([^\s(]+)/i);
    const columnsMatch = query.match(/\(([^)]+)\)/i);
    
    if (!tableMatch || !columnsMatch) {
        throw new Error('Syntaxe CREATE TABLE incorrecte. Format attendu: CREATE TABLE table (col1 TYPE, col2 TYPE)');
    }
    
    const tableName = tableMatch[1];
    const columnsStr = columnsMatch[1];
    const columnDefs = columnsStr.split(',').map(def => def.trim());
    
    // Analyser les définitions de colonnes
    const columns = [];
    columnDefs.forEach(def => {
        const parts = def.split(/\s+/);
        if (parts.length < 2) {
            throw new Error(`Définition de colonne incorrecte: ${def}`);
        }
        
        const name = parts[0];
        const type = parts[1].toUpperCase();
        let size = null;
        
        if (type === 'VARCHAR' && parts[2] && parts[2].startsWith('(')) {
            size = parts[2].replace(/[()]/g, '');
        }
        
        columns.push({
            name,
            type,
            size
        });
    });
    
    // Créer la table
    createTable(dbName, tableName, columns);
    
    container.innerHTML = `
        <div class="success-message">
            Table '${tableName}' créée avec succès dans la base de données '${dbName}'.
        </div>
    `;
}

function handleCreateDatabaseQuery(query, container) {
    const dbMatch = query.match(/DATABASE\s+([^\s;]+)/i);
    
    if (!dbMatch) {
        throw new Error('Syntaxe CREATE DATABASE incorrecte. Format attendu: CREATE DATABASE dbname');
    }
    
    const dbName = dbMatch[1];
    createDatabase(dbName);
    
    container.innerHTML = `
        <div class="success-message">
            Base de données '${dbName}' créée avec succès.
        </div>
    `;
}

function handleDropTableQuery(query, dbName, container) {
    const tableMatch = query.match(/TABLE\s+([^\s;]+)/i);
    
    if (!tableMatch) {
        throw new Error('Syntaxe DROP TABLE incorrecte. Format attendu: DROP TABLE tablename');
    }
    
    const tableName = tableMatch[1];
    deleteTable(dbName, tableName);
    
    container.innerHTML = `
        <div class="success-message">
            Table '${tableName}' supprimée avec succès.
        </div>
    `;
}

function handleDropDatabaseQuery(query, container) {
    const dbMatch = query.match(/DATABASE\s+([^\s;]+)/i);
    
    if (!dbMatch) {
        throw new Error('Syntaxe DROP DATABASE incorrecte. Format attendu: DROP DATABASE dbname');
    }
    
    const dbName = dbMatch[1];
    
    let databases = JSON.parse(localStorage.getItem('sqlTrainerDatabases')) || [];
    databases = databases.filter(db => db.name !== dbName);
    
    localStorage.setItem('sqlTrainerDatabases', JSON.stringify(databases));
    initDatabases();
    
    container.innerHTML = `
        <div class="success-message">
            Base de données '${dbName}' supprimée avec succès.
        </div>
    `;
}