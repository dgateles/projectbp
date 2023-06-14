const puppeteer = require('puppeteer');
const { ipcRenderer } = require('electron');

let executando = false;

async function inserirPonto(username, password, url, horarios) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.type('#login-numero-folha', username, { delay: 200 });
    await page.type('#login-senha', password, { delay: 200 });

    await Promise.all([
        page.waitForNavigation({
            waitUntil: 'networkidle2',
        }),
        page.click('#login-entrar'),
    ]);

    const diaDaSemana = getDiaDaSemana();
    const horarioAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let pontoRegistrado = false;

    for (const horario of horarios) {
        if (horario.id.startsWith(diaDaSemana) && horario.value === horarioAtual) {
            await page.goto('https://centraldofuncionario.com.br/50911/incluir-ponto', { waitUntil: 'networkidle2' });
            // await Promise.all([
            //     page.waitForNavigation({
            //         waitUntil: 'networkidle2',
            //     }),
            //     page.click('#menu-incluir-ponto'),
            // ]);
            await page.waitForSelector('#localizacao-incluir-ponto')
            await page.evaluate(() => {
                let childElement = document.querySelector('#localizacao-incluir-ponto');
                let parentElement = childElement.parentNode;
                parentElement.dispatchEvent(new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                }));
            });            

            try {
                await page.waitForSelector('#status-processamento-0', { timeout: 5000 });
                pontoRegistrado = true;
            } catch (err) {
                writeToConsole('Não foi possível identificar o registro do ponto. Verifique a página de registro de pontos para confirmar.');
            }

            await page.waitForTimeout(3500);
        }
    }

    await browser.close();
    return pontoRegistrado;
}

function writeToConsole(message) {
    const consoleDiv = document.getElementById('console');
    consoleDiv.innerHTML += message + '\n';
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}


function getDiaDaSemana() {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const hoje = new Date();
    const diaDaSemana = hoje.getDay();
    return dias[diaDaSemana];
}


document.getElementById('registrarPonto').addEventListener('click', () => {
    handleRegistrarPontoClick();
});

async function handleRegistrarPontoClick() {
    const registrarPontoButton = document.getElementById('registrarPonto');
    const cancelButton = document.getElementById('cancelar');

    registrarPontoButton.disabled = true; // Desabilita o botão "Registrar Ponto"
    cancelButton.style.display = 'inline'; // Exibe o botão "Cancelar"
    writeToConsole('Iniciando registro de ponto...');

    const inputs = document.querySelectorAll('input[type=time]');
    const horarios = Array.from(inputs).map((input) => ({ id: input.id, value: input.value }));

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const url = 'https://centraldofuncionario.com.br/50911/';

    await setData('username', username);
    await setData('password', password);
    await setData('horarios', horarios);

    executando = true;
    main(username, password, url, horarios);
}

async function main(username, password, url, horarios) {
    if (executando) {
        try {
            const pontoRegistrado = await inserirPonto(username, password, url, horarios);
            if (pontoRegistrado) {
                const horarioRegistro = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                writeToConsole(`Registro de ponto realizado com sucesso às ${horarioRegistro}!`);
            }
        } catch (error) {
            writeToConsole('Erro ao registrar ponto: ' + error.message);
        }
    }

    if (executando) {
        setTimeout(() => main(username, password, url, horarios), 25000);
    }
}

async function getData(key) {
    const value = await ipcRenderer.invoke('electron-store-get-data', key);
    return value;
}

async function setData(key, value) {
    await ipcRenderer.invoke('electron-store-set-data', key, value);
}


document.getElementById('cancelar').addEventListener('click', () => {
    writeToConsole('Registro de ponto cancelado.');
    const registrarPontoButton = document.getElementById('registrarPonto');
    const cancelButton = document.getElementById('cancelar');

    registrarPontoButton.disabled = false; // Habilita novamente o botão "Registrar Ponto"
    cancelButton.style.display = 'none'; // Oculta o botão "Cancelar"
    executando = false;
});

// document.getElementById('username').value = store.get('username', '');
// document.getElementById('password').value = store.get('password', '');

// const horariosSalvos = store.get('horarios', []);
// for (const horario of horariosSalvos) {
//     const input = document.getElementById(horario.id);
//     if (input) {
//         input.value = horario.value;
//     }
// }
(async () => {
    document.getElementById('username').value = (await getData('username')) || '';
    document.getElementById('password').value = (await getData('password')) || '';

    const horariosSalvos = (await getData('horarios')) || [];
    for (const horario of horariosSalvos) {
        const input = document.getElementById(horario.id);
        if (input) {
            input.value = horario.value;
        }
    }
})();

function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = 'none';
}

function atualizarHorarioAtual() {
    const horarioAtualSpan = document.getElementById('horarioAtual');
    const horarioAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    horarioAtualSpan.textContent = horarioAtual;
}

setInterval(atualizarHorarioAtual, 1000);
hideLoading();