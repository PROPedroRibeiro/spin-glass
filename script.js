/////////////////////////////////
/*         CANVAS INFO         */

const canvasSim = document.getElementById('simCanvas');
const ctx = canvasSim.getContext('2d');

/////////////////////////////////
/*       ID ATTRIBUTION        */

let btnNewParticle = document.getElementById('btnNewParticle');
let particlesLabel = document.getElementById('particlesLabel');

/////////////////////////////////
/*       VAR DECLARATION       */

let animationId;
let BALLS = [];
let ARROWS = []
let r = 15;
const e = -1.6e-19; //charge of electron
const spinModule = 20; //length of spin arrow


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

function generateParticle(){
    let spinAngle = Math.random() * 2 * Math.PI;
    let ballX = rand(r/2,canvasSim.width - r/2);
    let ballY = rand(r/2,canvasSim.height - r/2);
    BALLS.forEach(ball => {
        while(Math.hypot(ballX - ball.pos.x, ballY - ball.pos.y) < r){
            ballX = rand(r/2,canvasSim.width - r/2);
            ballY = rand(r/2,canvasSim.height - r/2);
        }
    });
    new Ball("p",ballX,ballY,r,1,e,0, Math.random()<0.5 ? -0.5 : 0.5);
    new Arrow(BALLS[BALLS.length-1].pos,spinModule,BALLS[BALLS.length-1].spinAngle * 180 / Math.PI,"green");

}

function randAngle(ang){
    let newAng;
    if(Math.random() < 0.5){
        return newAng = ang + Math.PI/18; //10 degrees
    }
    else{
        return newAng = ang - Math.PI/18; //-10 degrees
    }
}

btnNewElectron.onclick = function(){
    console.log(BALLS);
    generateParticle();    
}

window.addEventListener('resize', resizeCanvas);

/////////////////////////////////
/* METHODS AND OBJECTS CALLING */ 


resizeCanvas();



function animate() {
    ctx.clearRect(0, 0, canvasSim.width, canvasSim.height);
    BALLS.forEach(p => { //iterating for each particle
        p.drawBall(canvasSim,"gray");
        // if(p.spin === 0.5){
        //         p.drawBall(canvasSim,"blue",false); 
        // }
        // else if(p.spin === -0.5){
        //     p.drawBall(canvasSim,"red",false);
        // }
    })
    ARROWS.forEach(a => {
        a.angle = randAngle(a.angle * Math.PI / 180) * 180 / Math.PI;
        a.draw(ctx);
    })
    particlesLabel.innerText = BALLS.length;
    animationId = requestAnimationFrame(animate);
}

animate();
  


// ADICIONAR SETAS EM CADA PARTICULA PARA MOSTRAR SPIN
// ADICIONAR TEMPO DE RELAXAMENTO E TEMPERATURA DE CORTE
// ADICIONAR EQUAÇÕES USADAS