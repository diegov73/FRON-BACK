// Función de seguridad
function verificarSesion() {
    // 1. Buscamos la cookie llamada 'jwt_token'
    const cookieExiste = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt_token='));

    // 2. Si NO existe, lo mandamos afuera
    if (!cookieExiste) {
        alert("Debes iniciar sesión para ver esta página.");
        window.location.href = 'landSite.html'; // Cambia esto por tu 'landSite' (ej: login.html)
    }
}

// EJECUTAR INMEDIATAMENTE
verificarSesion();
document.addEventListener("DOMContentLoaded", () => {

    // --- CONEXIÓN CON API ---
    const API_URL_LOAD = 'http://localhost:4000/loadData';
    const API_URL_UPDATE = 'http://localhost:4000/api/actualizarJuego';

    // Elementos DOM
    const canvas = document.getElementById("roulette");
    const ctx = canvas.getContext("2d");
    const spinBtn = document.getElementById("spin-btn");
    const resultNumberDiv = document.getElementById("resultNumber");
    const resultMoneyDiv = document.getElementById("resultMoney");
    const numberTable = document.getElementById("tablaRuleta");
    const clearBtn = document.getElementById("clear-btn");
    const totalBetDisplay = document.getElementById("total-amount");
    const betListDisplay = document.getElementById("numbers-list");
    const chipSelector = document.getElementById("chip-selector");
    
    const displayCuenta = document.getElementById("cuenta");
    const displaySaldo = document.getElementById("saldo");

    // Variables de Estado
    let currentChipValue = 1;
    let totalBalance = 0; // Se carga desde la API
    let betsPlaced = {};
    let totalBetAmount = 0;
    let spinning = false;

    // --- CARGAR SALDO INICIAL ---
    async function initUserData() {
        try {
            const res = await fetch(API_URL_LOAD, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                totalBalance = data.usuario.balance;
                if(displayCuenta) displayCuenta.textContent = data.usuario.username;
                updateUI();
            } else {
                if(displayCuenta) displayCuenta.textContent = "Sin sesión";
            }
        } catch (e) { console.error("Error carga:", e); }
    }
    initUserData();

    // --- LÓGICA GRÁFICA DE LA RULETA (CANVAS) ---
    const radius = canvas.width / 2;
    const centerX = radius;
    const centerY = radius;
    const europeanOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

    // Generar datos para dibujo
    const numbers = europeanOrder.map(n => {
        let color = (n === 0) ? 'green' : (redNumbers.has(n) ? 'red' : 'black');
        return { 
            num: n, 
            color: color, 
            props: {
                color: color,
                odd: (n !== 0 && n % 2 !== 0),
                high: (n > 18),
                dozen: (n === 0) ? null : (n <= 12 ? 1 : n <= 24 ? 2 : 3),
                column: (n === 0) ? null : (n % 3 === 1 ? 1 : n % 3 === 2 ? 2 : 3)
            }
        };
    });
    // Ajuste manual de columnas
    for(let i=3; i<=36; i+=3) numbers.find(x=>x.num===i).props.column = 3;

    const numCount = numbers.length;
    const anglePerNum = (2 * Math.PI) / numCount;
    let startAngle = 0;
    let currentRotation = 0;

    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < numCount; i++) {
            const angle = startAngle + i * anglePerNum;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + anglePerNum);
            ctx.fillStyle = numbers[i].color;
            ctx.fill(); ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + anglePerNum / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "white";
            ctx.font = "bold 18px Arial";
            ctx.fillText(numbers[i].num, radius - 10, 10);
            ctx.restore();
        }
    }

    function drawPointer() {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius * 0.8);
        ctx.lineTo(centerX - 10, centerY - radius * 0.95);
        ctx.lineTo(centerX + 10, centerY - radius * 0.95);
        ctx.closePath();
        ctx.fillStyle = "white"; ctx.fill(); 
        ctx.strokeStyle = "black"; ctx.lineWidth = 2; ctx.stroke();
    }

    function animate() {
        if (spinning) {
            startAngle += currentRotation;
            currentRotation *= 0.985;
            if (currentRotation < 0.001) {
                currentRotation = 0;
                spinning = false;
                getWinningNumber();
            }
        }
        drawWheel();
        drawPointer();
        requestAnimationFrame(animate);
    }

    // --- GENERACIÓN DEL TABLERO (ARREGLADO PARA TU CSS GRID) ---
    function generateBoard() {
        if (!numberTable) return;
        numberTable.innerHTML = ''; // Limpiar

        // 1. EL CERO (Ocupa 3 filas a la izquierda)
        const zero = document.createElement('div');
        zero.className = 'cell num-green';
        zero.textContent = '0';
        zero.dataset.bet = 'Num0';
        // Estilos inline para override grid
        zero.style.gridRow = '1 / span 3';
        zero.style.gridColumn = '1 / 2';
        numberTable.appendChild(zero);

        // 2. LOS NÚMEROS (1-36)
        // OJO: Tu CSS Grid es de 5 filas x 14 columnas.
        // Los números deben llenarse en orden vertical (3,6,9...) para coincidir con la ruleta
        // O en orden normal (1,2,3) pero posicionados correctamente en la grilla.
        
        // Vamos a usar posición directa para asegurar que se vea bien
        // Filas: 1 (arriba/3,6,9), 2 (medio/2,5,8), 3 (abajo/1,4,7)
        // Columnas: Empiezan en la 2 (la 1 es el cero)
        
        for (let i = 1; i <= 36; i++) {
            const cell = document.createElement('div');
            const isRed = redNumbers.has(i);
            cell.className = `cell ${isRed ? 'num-red' : 'num-black'}`;
            cell.textContent = i;
            cell.dataset.bet = `Num${i}`;
            
            // Calculamos posición en Grid
            // Columna: (i-1) / 3 (entero) + 2
            const col = Math.floor((i - 1) / 3) + 2;
            
            // Fila: Invertida porque el 1 está abajo
            // i%3 == 1 -> Fila 3 (Abajo)
            // i%3 == 2 -> Fila 2 (Medio)
            // i%3 == 0 -> Fila 1 (Arriba)
            let row;
            if (i % 3 === 0) row = 1;
            else if (i % 3 === 2) row = 2;
            else row = 3;

            cell.style.gridColumn = `${col} / span 1`;
            cell.style.gridRow = `${row} / span 1`;
            
            numberTable.appendChild(cell);
        }

        // 3. COLUMNAS (2 to 1) - Derecha
        ['col3', 'col2', 'col1'].forEach((colKey, index) => {
            const cell = document.createElement('div');
            cell.className = 'cell bet-column';
            cell.textContent = '2 a 1';
            cell.dataset.bet = colKey;
            cell.style.gridColumn = '14 / 15'; // Última columna
            cell.style.gridRow = `${index + 1} / span 1`;
            numberTable.appendChild(cell);
        });

        // 4. DOCENAS (Abajo) - Fila 4
        const dozens = [
            { txt: '1st 12', key: '1st12', colStart: 2, span: 4 },
            { txt: '2nd 12', key: '2nd12', colStart: 6, span: 4 },
            { txt: '3rd 12', key: '3rd12', colStart: 10, span: 4 }
        ];
        dozens.forEach(d => {
            const cell = document.createElement('div');
            cell.className = 'cell bet-dozen';
            cell.textContent = d.txt;
            cell.dataset.bet = d.key;
            cell.style.gridRow = '4 / 5';
            cell.style.gridColumn = `${d.colStart} / span ${d.span}`;
            numberTable.appendChild(cell);
        });

        // 5. APUESTAS SIMPLES (Abajo del todo) - Fila 5
        const simples = [
            { txt: '1-18', key: 'low', colStart: 2 },
            { txt: 'PAR', key: 'even', colStart: 4 },
            { txt: 'ROJO', key: 'red', colStart: 6, bg: '#c53030' },
            { txt: 'NEGRO', key: 'black', colStart: 8, bg: '#2d3748' },
            { txt: 'IMPAR', key: 'odd', colStart: 10 },
            { txt: '19-36', key: 'high', colStart: 12 }
        ];
        simples.forEach(s => {
            const cell = document.createElement('div');
            cell.className = 'cell bet-simple';
            cell.textContent = s.txt;
            cell.dataset.bet = s.key;
            cell.style.gridRow = '5 / 6';
            cell.style.gridColumn = `${s.colStart} / span 2`;
            if(s.bg) cell.style.backgroundColor = s.bg;
            numberTable.appendChild(cell);
        });

        // Asignar eventos de clic a todas las celdas creadas
        attachBetEvents();
    }
    generateBoard();

    // --- INTERACCIÓN Y APUESTAS ---
    
    // Fichas
    chipSelector.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if(chip) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            currentChipValue = parseInt(chip.dataset.value);
        }
    });

    function attachBetEvents() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', () => {
                if(spinning) return alert("Espera que termine el giro.");
                
                // VALIDACIÓN DE SALDO REAL
                if(totalBalance < currentChipValue) return alert("Saldo insuficiente.");

                const betType = cell.dataset.bet;
                
                // Lógica
                totalBalance -= currentChipValue;
                totalBetAmount += currentChipValue;
                betsPlaced[betType] = (betsPlaced[betType] || 0) + currentChipValue;

                updateUI();
            });
        });
    }

    // Botones
    if(clearBtn) clearBtn.addEventListener("click", () => {
        if(spinning) return;
        totalBalance += totalBetAmount; // Devolver dinero
        totalBetAmount = 0;
        betsPlaced = {};
        updateUI();
    });

    if(spinBtn) spinBtn.addEventListener("click", () => {
        if(spinning) return;
        if(totalBetAmount === 0) return alert("¡Haz una apuesta!");
        
        spinning = true;
        currentRotation = 0.15 + Math.random() * 0.15;
        if(resultNumberDiv) resultNumberDiv.textContent = "Girando...";
        if(resultMoneyDiv) resultMoneyDiv.textContent = "";
    });

    // --- CÁLCULO DE GANADORES ---
    function getWinningNumber() {
        const pointerAngle = (3 * Math.PI) / 2;
        const normalizedStartAngle = (startAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        let effectiveAngle = (pointerAngle - normalizedStartAngle + 2 * Math.PI) % (2 * Math.PI);
        let index = Math.floor(effectiveAngle / anglePerNum);
        
        const winner = numbers[index]; 
        resultNumberDiv.textContent = `Ganador: ${winner.num} (${winner.color})`;
        calculateWinnings(winner);
    }

    function calculateWinnings(winner) {
        let payout = 0;
        const n = winner.num;
        const p = winner.props;

        for (const bet in betsPlaced) {
            const amount = betsPlaced[bet];
            // Pleno
            if (bet === `Num${n}`) payout += amount * 36;
            
            // Externas
            if (n !== 0) {
                if (bet==='red' && p.color==='red') payout += amount*2;
                if (bet==='black' && p.color==='black') payout += amount*2;
                if (bet==='even' && !p.odd) payout += amount*2;
                if (bet==='odd' && p.odd) payout += amount*2;
                if (bet==='low' && !p.high) payout += amount*2;
                if (bet==='high' && p.high) payout += amount*2;
                
                // Docenas
                if (bet==='1st12' && p.dozen===1) payout += amount*3;
                if (bet==='2nd12' && p.dozen===2) payout += amount*3;
                if (bet==='3rd12' && p.dozen===3) payout += amount*3;
                
                // Columnas
                if (bet==='col1' && p.column===1) payout += amount*3;
                if (bet==='col2' && p.column===2) payout += amount*3;
                if (bet==='col3' && p.column===3) payout += amount*3;
            }
        }

        const netGain = payout - totalBetAmount;
        totalBalance += payout; // Actualizar visualmente

        if (netGain >= 0) {
            resultMoneyDiv.textContent = `¡Ganaste $${netGain}!`;
            resultMoneyDiv.style.color = 'green';
        } else {
            resultMoneyDiv.textContent = `Perdiste $${Math.abs(netGain)}`;
            resultMoneyDiv.style.color = 'red';
        }

        // GUARDAR EN SERVIDOR
        saveGameResultOnServer(netGain, winner);

        // Limpiar
        totalBetAmount = 0;
        betsPlaced = {};
        updateUI();
    }

    async function saveGameResultOnServer(netGain, winner) {
        try {
            const detalles = {
                numeroGanador: winner.num,
                colorGanador: winner.color,
                tipoApuesta: Object.keys(betsPlaced).join(', '),
                totalApostado: totalBetAmount
            };

            const res = await fetch(API_URL_UPDATE, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gananciaNeta: netGain, detalles })
            });
            const data = await res.json();
            if(data.nuevoSaldo !== undefined) {
                totalBalance = data.nuevoSaldo;
                updateUI();
            }
        } catch(e) { console.error("Error guardando:", e); }
    }

    function updateUI() {
        if(displaySaldo) displaySaldo.textContent = `${totalBalance} $`;
        if(totalBetDisplay) totalBetDisplay.textContent = totalBetAmount;
        // (Opcional) Actualizar lista de apuestas visual
    }

    updateUI();
    animate();
});