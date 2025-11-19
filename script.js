/////////////////////////////////
/*         CANVAS INFO         */

const canvasSim = document.getElementById('simCanvas');
const ctx = canvasSim.getContext('2d');

/////////////////////////////////
/*       ID ATTRIBUTION        */

let btnNewElectron = document.getElementById('btnNewElectron');
let particlesLabel = document.getElementById('particlesLabel');

/////////////////////////////////
/*       VAR DECLARATION       */

let animationId;
let BALLS = [];
let r = 15;
const e = -1.6e-19; //charge of electron


/////////////////////////////////
/*    CLASSES AND FUNCTIONS    */

function resizeCanvas(canvas=canvasSim){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Optional: Re-init or adjust positions on resize
}

function rand(min, max){
    return Math.random() * (max-min) + min;
}

btnNewElectron.onclick = function(){
    console.log(BALLS);
    new Ball("electron",rand(r/2,canvasSim.width-r/2),rand(canvasSim.height-r/2,r/2),r,1,e,0, Math.random()<0.5 ? -0.5 : 0.5);

}

window.addEventListener('resize', resizeCanvas);

/////////////////////////////////
/* METHODS AND OBJECTS CALLING */ 


resizeCanvas();



function animate() {
    ctx.clearRect(0, 0, canvasSim.width, canvasSim.height);
    BALLS.forEach(electron => { //iterating for each electron
                    if(electron.spin === 0.5){
                            electron.drawBall(canvasSim,"blue",false); 
                        }
                        else if(electron.spin === -0.5){
                            electron.drawBall(canvasSim,"red",false);
                        }
    })
    particlesLabel.innerText = BALLS.length;
    animationId = requestAnimationFrame(animate);
}

animate();
  


// ADICIONAR SETAS EM CADA ELETRON PARA MOSTRAR SPIN
// ADICIONAR TEMPO DE RELAXAMENTO E TEMPERATURA DE CORTE
// ADICIONAR EQUAÇÕES USADAS