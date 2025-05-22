// Funções para integração com Google Drive
function initGoogleDriveAPI() {
    // Carrega a API do Google Drive
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
        gapi.load('client:auth2', initGoogleClient);
    };
    document.body.appendChild(script);
}

function initGoogleClient() {
    // Inicializa o cliente do Google Drive
    gapi.client.init({
        apiKey: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Chave de API fictícia
        clientId: 'xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com', // ID de cliente fictício
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
    }).then(() => {
        // Atualiza o botão de autenticação
        updateGoogleAuthButton();
        
        // Adiciona listener para mudanças no estado de autenticação
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateGoogleAuthButton);
    }).catch(error => {
        console.error('Erro ao inicializar cliente Google:', error);
        alert('Não foi possível conectar ao Google Drive. Por favor, tente novamente mais tarde.');
    });
}

function updateGoogleAuthButton() {
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    const authButton = document.getElementById('google-auth');
    
    if (authButton) {
        if (isSignedIn) {
            authButton.textContent = 'Desconectar do Google Drive';
            authButton.onclick = handleGoogleSignOut;
        } else {
            authButton.textContent = 'Conectar ao Google Drive';
            authButton.onclick = handleGoogleSignIn;
        }
    }
}

function handleGoogleSignIn() {
    gapi.auth2.getAuthInstance().signIn();
}

function handleGoogleSignOut() {
    gapi.auth2.getAuthInstance().signOut();
}

function backupToGoogleDrive() {
    // Verifica se o usuário está autenticado
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        alert('Por favor, conecte-se ao Google Drive primeiro.');
        return;
    }
    
    // Prepara os dados para backup
    const data = JSON.stringify(userData);
    const fileName = `controle-financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Cria o arquivo no Google Drive
    const file = new Blob([data], {type: 'application/json'});
    
    const metadata = {
        name: fileName,
        mimeType: 'application/json'
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', file);
    
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
        }),
        body: form
    })
    .then(response => response.json())
    .then(data => {
        alert(`Backup realizado com sucesso no Google Drive! Nome do arquivo: ${fileName}`);
    })
    .catch(error => {
        console.error('Erro ao fazer backup para o Google Drive:', error);
        alert('Não foi possível fazer o backup para o Google Drive. Por favor, tente novamente.');
    });
}

function restoreFromGoogleDrive() {
    // Verifica se o usuário está autenticado
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        alert('Por favor, conecte-se ao Google Drive primeiro.');
        return;
    }
    
    // Lista os arquivos de backup disponíveis
    gapi.client.drive.files.list({
        q: "name contains 'controle-financeiro-backup' and mimeType='application/json'",
        fields: 'files(id, name, createdTime)',
        orderBy: 'createdTime desc'
    }).then(response => {
        const files = response.result.files;
        
        if (files && files.length > 0) {
            // Cria um modal para seleção do arquivo
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Selecione um backup para restaurar</h3>
                    <div class="backup-files-list">
                        ${files.map((file, index) => `
                            <div class="backup-file-item" data-id="${file.id}">
                                <span>${file.name}</span>
                                <span>${new Date(file.createdTime).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button id="cancel-restore">Cancelar</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Adiciona eventos aos itens da lista
            document.querySelectorAll('.backup-file-item').forEach(item => {
                item.addEventListener('click', () => {
                    const fileId = item.getAttribute('data-id');
                    
                    if (confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
                        downloadFileFromGoogleDrive(fileId);
                        document.body.removeChild(modal);
                    }
                });
            });
            
            // Adiciona evento ao botão de cancelar
            document.getElementById('cancel-restore').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        } else {
            alert('Nenhum arquivo de backup encontrado no Google Drive.');
        }
    }).catch(error => {
        console.error('Erro ao listar arquivos do Google Drive:', error);
        alert('Não foi possível listar os arquivos de backup. Por favor, tente novamente.');
    });
}

function downloadFileFromGoogleDrive(fileId) {
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: new Headers({
            'Authorization': 'Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
        })
    })
    .then(response => response.json())
    .then(data => {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Formato de arquivo inválido.');
            }
            
            // Restaura os dados
            userData = data;
            saveData();
            
            // Reinicia a aplicação
            showUserSelection();
            
            alert('Backup restaurado com sucesso!');
        } catch (error) {
            alert('Erro ao restaurar backup: ' + error.message);
        }
    })
    .catch(error => {
        console.error('Erro ao baixar arquivo do Google Drive:', error);
        alert('Não foi possível baixar o arquivo de backup. Por favor, tente novamente.');
    });
}

// Funções para integração com OneDrive
function initOneDriveAPI() {
    // Carrega a API do OneDrive
    const script = document.createElement('script');
    script.src = 'https://js.live.net/v7.2/OneDrive.js';
    script.onload = () => {
        // Inicializa o cliente do OneDrive
        window.oneDriveInitialized = true;
    };
    document.body.appendChild(script);
}

function backupToOneDrive() {
    if (!window.oneDriveInitialized) {
        alert('A API do OneDrive ainda não foi inicializada. Por favor, tente novamente em alguns instantes.');
        return;
    }
    
    // Prepara os dados para backup
    const data = JSON.stringify(userData);
    const fileName = `controle-financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Cria um arquivo temporário
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Abre o seletor de arquivos do OneDrive
    OneDrive.save({
        file: url,
        fileName: fileName,
        onComplete: () => {
            alert(`Backup realizado com sucesso no OneDrive! Nome do arquivo: ${fileName}`);
            URL.revokeObjectURL(url);
        },
        onError: error => {
            console.error('Erro ao fazer backup para o OneDrive:', error);
            alert('Não foi possível fazer o backup para o OneDrive. Por favor, tente novamente.');
            URL.revokeObjectURL(url);
        }
    });
}

function restoreFromOneDrive() {
    if (!window.oneDriveInitialized) {
        alert('A API do OneDrive ainda não foi inicializada. Por favor, tente novamente em alguns instantes.');
        return;
    }
    
    // Abre o seletor de arquivos do OneDrive
    OneDrive.open({
        filter: '.json',
        success: file => {
            // Baixa o conteúdo do arquivo
            fetch(file.value[0].link)
                .then(response => response.json())
                .then(data => {
                    try {
                        if (!data || typeof data !== 'object') {
                            throw new Error('Formato de arquivo inválido.');
                        }
                        
                        // Confirmar restauração
                        if (confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
                            userData = data;
                            saveData();
                            
                            // Reiniciar aplicação
                            showUserSelection();
                            
                            alert('Backup restaurado com sucesso!');
                        }
                    } catch (error) {
                        alert('Erro ao restaurar backup: ' + error.message);
                    }
                })
                .catch(error => {
                    console.error('Erro ao ler arquivo do OneDrive:', error);
                    alert('Não foi possível ler o arquivo de backup. Por favor, tente novamente.');
                });
        },
        cancel: () => {
            // Usuário cancelou a operação
        },
        error: error => {
            console.error('Erro ao abrir arquivo do OneDrive:', error);
            alert('Não foi possível abrir o arquivo de backup. Por favor, tente novamente.');
        }
    });
}

// Inicializa as APIs de nuvem quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa as APIs de nuvem
    initGoogleDriveAPI();
    initOneDriveAPI();
    
    // Adiciona os botões de backup em nuvem ao menu
    const backupOptions = document.getElementById('backup-options');
    
    if (backupOptions) {
        backupOptions.innerHTML = `
            <button id="google-auth" class="btn btn-outline">Conectar ao Google Drive</button>
            <button id="google-backup" class="btn btn-outline">Backup para Google Drive</button>
            <button id="google-restore" class="btn btn-outline">Restaurar do Google Drive</button>
            <hr>
            <button id="onedrive-backup" class="btn btn-outline">Backup para OneDrive</button>
            <button id="onedrive-restore" class="btn btn-outline">Restaurar do OneDrive</button>
            <hr>
            <button id="download-backup" class="btn btn-outline">Download de Backup</button>
            <button id="restore-backup" class="btn btn-outline">Restaurar de Arquivo</button>
        `;
        
        // Adiciona eventos aos botões
        document.getElementById('google-backup').addEventListener('click', backupToGoogleDrive);
        document.getElementById('google-restore').addEventListener('click', restoreFromGoogleDrive);
        document.getElementById('onedrive-backup').addEventListener('click', backupToOneDrive);
        document.getElementById('onedrive-restore').addEventListener('click', restoreFromOneDrive);
    }
});

// Adiciona estilos para o modal de seleção de backup
const style = document.createElement('style');
style.textContent = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .backup-files-list {
        margin: 20px 0;
        max-height: 300px;
        overflow-y: auto;
    }
    
    .backup-file-item {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        cursor: pointer;
    }
    
    .backup-file-item:hover {
        background-color: #f5f5f5;
    }
    
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }
`;
document.head.appendChild(style);
