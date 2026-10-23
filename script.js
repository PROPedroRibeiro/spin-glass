/////////////////////////////////
/* CANVAS INFO         */
const canvasSim = document.getElementById('simCanvas');
const ctx = canvasSim.getContext('2d');

/////////////////////////////////
/* ID ATTRIBUTION        */
let estadosSelect = document.getElementById('estadosSelect');

/////////////////////////////////
/* VAR DECLARATION       */
let animationId;
let BALLS = [];
let ARROWS = [];
let r = 25; 
const e = -1.6e-19; 
const spinModule = 1.5 * r; 

// Physics Constants from the paper
const DELTA_V_KB = 555; 
const TAU_0 = 1e-11; 
const T = 150; 

let currentTau = Infinity; 
let currentQ = 1.0; 

// Data extracted from the T_cutoff graph 
const T_CUTOFF_CURVES = {
    0.7: [{ T: 100, Tc: 104 }, { T: 125, Tc: 93 }, { T: 150, Tc: 90 }, { T: 175, Tc: 87 }, { T: 200, Tc: 84 }, { T: 250, Tc: 81 }],
    0.8: [{ T: 75,  Tc: 80 },  { T: 100, Tc: 74 }, { T: 125, Tc: 68 }, { T: 150, Tc: 64 }, { T: 200, Tc: 60 }, { T: 250, Tc: 57 }],
    0.9: [{ T: 50,  Tc: 46 },  { T: 100, Tc: 40 }, { T: 150, Tc: 34 }, { T: 200, Tc: 31 }, { T: 250, Tc: 29 }]
};

/////////////////////////////////
/* CLASSES AND FUNCTIONS    */

// Standard Linear Interpolation algorithm
function calculateTCutoff(q, currentT) {
    if (q >= 1.0) return 0; 

    const curve = T_CUTOFF_CURVES[q];
    if (!curve) return 0; 

    if (currentT <= curve[0].T) return curve[0].Tc;
    if (currentT >= curve[curve.length - 1].T) return curve[curve.length - 1].Tc;

    for (let i = 0; i < curve.length - 1; i++) {
        let p1 = curve[i];
        let p2 = curve[i + 1];

        if (currentT >= p1.T && currentT <= p2.T) {
            let slope = (p2.Tc - p1.Tc) / (p2.T - p1.T);
            return p1.Tc + slope * (currentT - p1.T);
        }
    }
    return 0;
}

function resizeCanvas(canvas = canvasSim) {
    canvas.width = canvasSim.clientWidth;
    canvas.height = canvasSim.clientHeight;
    
    let dynamicRadius = Math.min(canvas.width, canvas.height) * 0.05; 
    r = Math.max(12, Math.min(dynamicRadius, 35));
    let spinModule = 1.5 * r;

    BALLS.forEach(ball => {
        ball.r = r;
    });
    ARROWS.forEach(arrow => {
        arrow.length = spinModule;
    });
}

function rand(min, max){
    return Math.random() * (max - min) + min;
}

function generateParticle(){
    let bom = false;
    let ballX, ballY;
    let attempts = 0; 
    
    while(!bom && attempts < 150){
        bom = true;
        ballX = rand(spinModule, canvasSim.width - spinModule);
        ballY = rand(spinModule, canvasSim.height - spinModule);
        
        BALLS.forEach(ball => {
            if(Math.hypot(ballX - ball.pos.x, ballY - ball.pos.y) < 2.2 * r){
                bom = false;
            }
        });
        attempts++;
    }
    
    let spinAngle = Math.random() < 0.5 ? 180 : 0;
    let newBall = new Ball("p", ballX, ballY, r, 1, e, 0, spinAngle);
    BALLS.push(newBall);
    
    ARROWS.push(new Arrow(newBall.pos, spinModule, spinAngle, "green"));
}

function randAngle(angDegrees) {
    let change = 10 * currentQ - 5; 
    let newAngle = Math.random() < 0.5 ? angDegrees + change : angDegrees - change;

    if (currentTau !== Infinity && currentTau !== 0) {
        let rawProbability = (1e-10 / currentTau) * 0.08; 
        let visualFlipProbability = Math.min(rawProbability, 0.15);
        if (Math.random() < visualFlipProbability) {
            newAngle += 180; 
        }
    }

    return newAngle;
}

function updatePhysics(numBolas) {
    let q = 1.0;
    let T_star = 0; 
    
    if (numBolas == 5)  { q = 1.3; T_star = 0.05; } 
    if (numBolas == 10) { q = 1.1; T_star = 0.1; }
    if (numBolas == 15) { q = 1.0; T_star = 0; }
    if (numBolas == 20) { q = 0.9; T_star = 1.0; }
    if (numBolas == 25) { q = 0.8; T_star = 2.8; }
    if (numBolas == 30) { q = 0.7; T_star = 20.0; }

    currentQ = q;
    let T_cutoff = calculateTCutoff(q, T);
    let tau = 0;
    let eqText = "";

    if (q === 1.0) {
        tau = TAU_0 * Math.exp(DELTA_V_KB / T);
        eqText = "$$\\tau = \\tau_0 \\exp\\left(\\frac{\\Delta V}{k_B T}\\right)$$";
    } else if (q < 1.0) {
        if (T <= T_cutoff) {
            tau = Infinity; 
        } else {
            let base = (T + T_star) / (T - T_cutoff);
            let exponent = (3 - q) / (2 * (1 - q));
            tau = TAU_0 * Math.pow(base, exponent);
        }
        eqText = "$$\\tau = \\tau_0 \\left( \\frac{T + T^*}{T - T_{cut-off}} \\right)^{\\frac{3-q}{2(1-q)}}$$";
    } else if (q > 1.0) {
        let base = (T - T_star) / (T + T_cutoff);
        if (base <= 0) {
            tau = 0; 
        } else {
            let exponent = (3 - q) / (2 * (1 - q));
            tau = TAU_0 * Math.pow(base, exponent);
        }
        eqText = "$$\\tau = \\tau_0 \\left( \\frac{T - T^*}{T + T_{cut-off}} \\right)^{\\frac{3-q}{2(1-q)}}$$";
    }

    currentTau = tau;

    let tauDisplay = "";
    if (tau === Infinity) {
        tauDisplay = "∞";
    } else if (tau === 0) {
        tauDisplay = "0 s";
    } else {
        let [baseStr, exponentStr] = tau.toExponential(2).split('e');
        tauDisplay = `${baseStr} &times; 10<sup>${parseInt(exponentStr)}</sup> s`;
    }

    document.getElementById('qLabel').innerText = q.toFixed(2);
    document.getElementById('tauLabel').innerHTML = tauDisplay; 
    document.getElementById('tCutoffLabel').innerText = T_cutoff.toFixed(1) + " K";

    let eqDiv = document.getElementById('equationDisplay');
    eqDiv.innerHTML = eqText;
    if (window.MathJax) {
        MathJax.typesetPromise([eqDiv]);
    }
}

/////////////////////////////////
/* EVENT LISTENERS       */
window.addEventListener('resize', resizeCanvas);

if(BALLS.length === 0){
    estadosSelect.value = 0;
}

estadosSelect.addEventListener('change', function() {
    document.getElementById("opt0").disabled = true;
    let numBolas = parseInt(estadosSelect.value);
    
    if(numBolas > BALLS.length){
        let toAdd = numBolas - BALLS.length;
        for(let i = 0; i < toAdd; i++){
            generateParticle();
        }
    } else if(numBolas < BALLS.length){
        BALLS.splice(numBolas);
        ARROWS.splice(numBolas);
    }
    
    updatePhysics(numBolas);
});

/////////////////////////////////
/* ACCORDION TOGGLE      */

let infoToggleBtn = document.getElementById('infoToggleBtn');
let infoBox = document.getElementById('infoBox');
let accordionIcon = document.getElementById('accordionIcon');

infoToggleBtn.addEventListener('click', function() {
    this.classList.toggle('active');
    
    if (infoBox.style.maxHeight) {
        infoBox.style.maxHeight = null;
        accordionIcon.innerText = "+";
    } else {
        infoBox.style.maxHeight = infoBox.scrollHeight + "px";
        accordionIcon.innerText = "-";
    }
});

/////////////////////////////////
/* METHODS AND OBJECTS CALLING */ 
resizeCanvas();

function animate() {
    if (canvasSim.width !== canvasSim.clientWidth || canvasSim.height !== canvasSim.clientHeight) {
        resizeCanvas();
    }

    ctx.clearRect(0, 0, canvasSim.width, canvasSim.height);

    BALLS.forEach((p, index) => { 
        p.drawBall(canvasSim, "#4a90e2",false);
        if (ARROWS[index]) {
            ARROWS[index].pos.x = p.pos.x;
            ARROWS[index].pos.y = p.pos.y;
        }
    });

    ARROWS.forEach(a => {
        a.angle = randAngle(a.angle);
        a.draw(ctx);
    });
    
    animationId = requestAnimationFrame(animate);
}

animate();

/////////////////////////////////
/* LANGUAGE TRANSLATION      */

const translations = {
    en: {
        langBtn: "Language: English",
        mainTitle: "Relaxation Time of Magnetic Nanoparticles",
        opt0: "Select a State",
        opt1: "q = 1.3 (Super-diffusive)",
        opt2: "q = 1.1 (Super-diffusive)",
        opt3: "q = 1.0 (Néel-Brown)",
        opt4: "q = 0.9 (Sub-diffusive)",
        opt5: "q = 0.8 (Sub-diffusive)",
        opt6: "q = 0.7 (Spin-Glass)",
        eqHeading: "Equation being used:",
        eqPlaceholder: "Select a State",
        tLabel: "T = 150 K",
        infoBtnText: "Simulation Info",
        infoTitle: "About the Simulation",
        info1: "<strong>Particles:</strong> Magnetic nanoparticles (MNPs) with dipolar interactions.",
        info2: "<strong>Arrows:</strong> Magnetic dipole moments.",
        info3: "<strong>Jitter:</strong> Stochastic thermal fluctuations \\(h(t)\\).",
        info4: "<strong>180&deg; Flips:</strong> Spontaneous Néel relaxation over the energy barrier \\(\\Delta V\\).",
        glossaryTitle: "Variables",
        info5: "<strong>\\(q\\):</strong> Entropic index (interaction strength).",
        info6: "<strong>\\(\\tau\\):</strong> Relaxation time (average wait between flips).",
        info7: "<strong>\\(T\\):</strong> Environmental temperature (fixed at 150 K).",
        info8: "<strong>\\(T_{cut-off}\\):</strong> Critical freezing threshold."
    },
    pt: {
        langBtn: "Idioma: Português",
        mainTitle: "Tempo de Relaxação de Nanopartículas Magnéticas",
        opt0: "Selecione um Estado",
        opt1: "q = 1.3 (Super-difusivo)",
        opt2: "q = 1.1 (Super-difusivo)",
        opt3: "q = 1.0 (Néel-Brown)",
        opt4: "q = 0.9 (Sub-difusivo)",
        opt5: "q = 0.8 (Sub-difusivo)",
        opt6: "q = 0.7 (Vidro de Spin)",
        eqHeading: "Equação utilizada:",
        eqPlaceholder: "Selecione um Estado",
        tLabel: "T = 150 K",
        infoBtnText: "Info da Simulação",
        infoTitle: "Sobre a Simulação",
        info1: "<strong>Partículas:</strong> Nanopartículas magnéticas (MNPs) com interações dipolares.",
        info2: "<strong>Setas:</strong> Momentos de dipolo magnético.",
        info3: "<strong>Vibração:</strong> Flutuações térmicas estocásticas \\(h(t)\\).",
        info4: "<strong>Giros de 180&deg;:</strong> Relaxação de Néel espontânea sobre a barreira de energia \\(\\Delta V\\).",
        glossaryTitle: "Variáveis",
        info5: "<strong>\\(q\\):</strong> Índice entrópico (força de interação).",
        info6: "<strong>\\(\\tau\\):</strong> Tempo de relaxação (espera média entre os giros).",
        info7: "<strong>\\(T\\):</strong> Temperatura ambiente (fixada em 150 K).",
        info8: "<strong>\\(T_{cut-off}\\):</strong> Limite de temperatura crítica."
    }
};

let currentLang = 'pt';
const langToggleBtn = document.getElementById('langToggleBtn');

langToggleBtn.addEventListener('click', function() {
    currentLang = currentLang === 'en' ? 'pt' : 'en';
    langToggleBtn.innerText = translations[currentLang].langBtn;
    
    document.getElementById('tLabel').innerText = translations[currentLang].tLabel;
    document.getElementById('glossaryTitle').innerText = translations[currentLang].glossaryTitle;
    
    document.getElementById('info5').innerHTML = translations[currentLang].info5;
    document.getElementById('info6').innerHTML = translations[currentLang].info6;
    document.getElementById('info7').innerHTML = translations[currentLang].info7;
    document.getElementById('info8').innerHTML = translations[currentLang].info8;
    document.getElementById('mainTitle').innerText = translations[currentLang].mainTitle;
    document.getElementById('opt0').innerText = translations[currentLang].opt0;
    document.getElementById('opt1').innerText = translations[currentLang].opt1;
    document.getElementById('opt2').innerText = translations[currentLang].opt2;
    document.getElementById('opt3').innerText = translations[currentLang].opt3;
    document.getElementById('opt4').innerText = translations[currentLang].opt4;
    document.getElementById('opt5').innerText = translations[currentLang].opt5;
    document.getElementById('opt6').innerText = translations[currentLang].opt6;
    document.getElementById('eqHeading').innerText = translations[currentLang].eqHeading;
    document.getElementById('infoTitle').innerText = translations[currentLang].infoTitle;
    
    let placeholderEl = document.getElementById('eqPlaceholder');
    if (placeholderEl) {
        placeholderEl.innerText = translations[currentLang].eqPlaceholder;
    }

    document.getElementById('infoToggleText').innerText = translations[currentLang].infoBtnText;

    document.getElementById('info1').innerHTML = translations[currentLang].info1;
    document.getElementById('info2').innerHTML = translations[currentLang].info2;
    document.getElementById('info3').innerHTML = translations[currentLang].info3;
    document.getElementById('info4').innerHTML = translations[currentLang].info4;

    if (window.MathJax) {
        MathJax.typesetPromise([document.getElementById('infoBox')]);
    }
});