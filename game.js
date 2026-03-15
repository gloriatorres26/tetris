let playerNameInput = document.getElementById("playerName");

let playerName = "";

let roomCode="";

const canvas = document.getElementById("game");

const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");

const music = document.getElementById("music");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

const lineSound = new Audio("lineclear.mp3");
lineSound.volume = 0.6;

const startBtn=document.getElementById("startBtn");

const startScreen=document.getElementById("startScreen");

let gameStarted=false;

let gamePaused = false;

// ===== QUIZ TIMER =====
let quizTimer;
let quizTimeLimit = 10;

let fallSpeed = 700; // velocidad normal

let speedIncreaseCount = 0; // cuántas veces aumentó velocidad
let maxSpeedIncreases = 3;  // máximo permitido

let speedPenalty = 22; // cuánto acelera cuando responde mal
let minSpeed = 400;     // velocidad mínima permitida

// ===== GAME TIMER (TIEMPO TOTAL DEL JUEGO) =====
let gameTimeLimit = 480; // 8 minutos
let gameTimer;
let gameTimeLeft;

let score=0;

let correctAnswers = 0;
let cleanRows = 0;


let firstTryScore = null;
let secondTryScore = null;
let currentTry = 1;

let lastPieceIndex = null;

let piecesForQuiz = 3;  // empieza cada 3 fichas
let pieceCounter = 0;   // contador de fichas

const COLS = 10;
const ROWS = 20;

let SIZE = 25;

// 🔥 Ajusta tamaño para móvil o PC
function resizeGame(){

let screenWidth = window.innerWidth;

if(screenWidth < 600){

SIZE = 18; // celular

}else{

SIZE = 25; // PC

}

canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;

}

// ejecutar al cargar
resizeGame();

// ejecutar si cambia tamaño pantalla
window.addEventListener("resize", resizeGame);

let board = Array.from({length:ROWS},()=>Array(COLS).fill(0));

const colors=[
null,
"cyan",
"yellow",
"purple",
"green",
"red",
"blue",
"orange"
];

const pieces=[

[[1,1,1,1]],

[[2,2],[2,2]],

[[0,3,0],[3,3,3]],

[[0,4,4],[4,4,0]],

[[5,5,0],[0,5,5]],

[[6,0,0],[6,6,6]],

[[0,0,7],[7,7,7]]

];

function drawSquare(x,y,color){

ctx.fillStyle=color;

ctx.fillRect(x*SIZE,y*SIZE,SIZE,SIZE);

ctx.strokeRect(x*SIZE,y*SIZE,SIZE,SIZE);

}

function drawGrid(){

for(let y=0; y<=ROWS; y++){
for(let x=0; x<=COLS; x++){

// brillo suave que cambia cada frame
let alpha = 0.15 + Math.random()*0.35;

ctx.beginPath();
ctx.arc(
x*SIZE,   // esquina horizontal
y*SIZE,   // esquina vertical
1.5,
0,
Math.PI*2
);

ctx.fillStyle = "rgba(255,255,255,"+alpha+")";
ctx.fill();

}
}

}

function drawBoard(){

ctx.clearRect(0,0,canvas.width,canvas.height);

drawGrid(); // ⭐ dibuja estrellas primero

board.forEach((row,y)=>{
row.forEach((value,x)=>{
if(value){
drawSquare(x,y,colors[value]);
}
})
})

}

let piece=randomPiece();

function randomPiece(){

let newIndex;

do{
    newIndex = Math.floor(Math.random()*pieces.length);
}while(newIndex === lastPieceIndex);

lastPieceIndex = newIndex;

let baseShape = pieces[newIndex];

// 🔥 CLONAR forma
let newShape = baseShape.map(row => [...row]);

// 🎨 COLOR RANDOM
let randomColor = Math.floor(Math.random()*7) + 1;

newShape = newShape.map(row =>
    row.map(val => val ? randomColor : 0)
);

return{
    shape:newShape,
    x:3,
    y:0
}

}

function merge(){

piece.shape.forEach((row,y)=>{

row.forEach((value,x)=>{

if(value){

board[y+piece.y][x+piece.x]=value;

}

})

})

pieceCounter++;

if(pieceCounter >= piecesForQuiz){
    pieceCounter = 0;
    showQuiz();
}

clearLines();

piece=randomPiece();

if(collide()){

gameOver();

}

}

// ===== BORRAR FILAS ESTILO TETRIS ===== 
function clearLines(){

for(let y = ROWS - 1; y >= 0; y--){

    if(board[y].every(value => value !== 0)){

        // 🔊 SONIDO
        lineSound.currentTime = 0;
        lineSound.play();

        // ✨ EFECTO VISUAL
        canvas.style.boxShadow = "0 0 25px cyan";
        setTimeout(() => {
            canvas.style.boxShadow = "none";
        }, 120);

        // eliminar fila llena
        board.splice(y,1);

        // agregar nueva fila vacía arriba
        board.unshift(Array(COLS).fill(0));

        score+=20;
cleanRows++;
updateStats();

scoreText.innerText = score;

updateRanking(); // ⭐ AGREGAR ESTA LINEA

        if(pieceCounter >= piecesForQuiz){
            pieceCounter = 0;
            showQuiz();
        }

        y++; // revisar misma fila otra vez
    }

}

}

function collide(){

return piece.shape.some((row,y)=>{

return row.some((value,x)=>{

return value && (

board[y+piece.y]?.[x+piece.x]!==0

)

})

})

}

function drawPiece(){

piece.shape.forEach((row,y)=>{

row.forEach((value,x)=>{

if(value){

drawSquare(

x+piece.x,

y+piece.y,

colors[value]

)

}

})

})

}

function update(){

if(gamePaused) return;
    
// evita salir por izquierda
if(piece.x<0){

piece.x=0;

}

// evita salir por derecha
if(piece.x+piece.shape[0].length>COLS){

piece.x=COLS-piece.shape[0].length;

}

piece.y++;

if(collide()){

piece.y--;

merge();

}

drawBoard();

drawPiece();


}

let gameLoop;

startBtn.onclick=()=>{

let name = playerNameInput.value.trim();
let room = document.getElementById("roomCode").value.trim();

// ✅ validar datos obligatorios
if(name==="" || room===""){
alert("⚠ Please write your Name AND Class Code");
return;
}

// ✅ efecto visual gamer inmediato
startBtn.classList.add("startAnim");
startBtn.style.transform="scale(1.1)";
startBtn.style.boxShadow="0 0 20px cyan";

// 🔥 reproducimos sonido Y esperamos que termine
playStartSound(()=>{

// 🔥 cuando termina el sonido recién inicia el juego

playerName = name;
roomCode = room;

activateRealtimeRanking();

// registrar jugador con 0 puntos desde el inicio
firebase.database()
.ref("rooms/"+roomCode+"/players/"+playerName)
.set({
   name: playerName,
   score: 0
});
// esperar al profesor
waitForTeacher();
});

document.addEventListener("keydown",e=>{

if(!gameStarted)return;


// IZQUIERDA

if(e.key==="ArrowLeft"){

piece.x--;

if(collide()){

piece.x++; // vuelve atrás si choca

}

}

// DERECHA

if(e.key==="ArrowRight"){

piece.x++;

if(collide()){

piece.x--; // vuelve atrás

}

}

// ABAJO

if(e.key==="ArrowDown"){

piece.y++;

if(collide()){

piece.y--;

merge(); // fija pieza

}

}


// ⭐ ROTAR con espacio

if(e.code==="Space"){

rotatePiece();

}

});

};

// ---------- QUIZ ----------

const quiz=document.getElementById("quiz");

const questionText=document.getElementById("question");

const answers=document.getElementById("answers");

let questions=[];

async function loadQuestions(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vSuZY8I3EBxrL3tML7ABICEOr2WxHuCi88co-0K0C_U7KBmqulqSHjuJnfSIrHayaVWsAEkKVmsK-mA/pub?output=csv";

let res=await fetch(url);

let text=await res.text();

let rows=text.split("\n").slice(1);

questions=rows.map(row=>{

let cols=row.split(",");

return{

q:cols[0],

a:[cols[1],cols[2],cols[3]],

correct:Number(cols[4])

};

});

}

loadQuestions();

setTimeout(()=>{
console.log("Preguntas cargadas:", questions);
},2000);

function showQuiz(){

// ✅ PROTECCIÓN 1: si no hay preguntas, no abrir quiz
if(!questions || questions.length === 0){
    console.log("⚠ No hay preguntas cargadas");
    return;
}

// pausa juego
clearInterval(gameLoop);

gamePaused = true;
    
quiz.classList.remove("hidden");
startQuizTimer();

// elegir pregunta aleatoria
let q = questions[Math.floor(Math.random()*questions.length)];

// ✅ PROTECCIÓN 2: evitar error si algo salió mal
if(!q || !q.q || !q.a){
    console.log("⚠ Pregunta inválida:", q);
    return;
}

questionText.innerText = q.q;
answers.innerHTML = "";

q.a.forEach((ans,i)=>{

let b = document.createElement("button");
b.innerText = ans;

b.onclick = ()=>{

answers.innerHTML="";

let result=document.createElement("div");
result.className="answerResult";

if(i===q.correct){

clearInterval(quizTimer);

correctSound.play();

updateRanking();

score += 50;
correctAnswers++;
updateStats();

scoreText.innerText = score;

updateRanking();

piecesForQuiz = 4;

result.innerText="✅ CORRECT ANSWER";

}else{

wrongSound.play();

// no restamos puntos
    
piecesForQuiz = 5;

// 🔥 acelerar caída suavemente
if(speedIncreaseCount < maxSpeedIncreases){

    fallSpeed -= speedPenalty;

    if(fallSpeed < minSpeed){
        fallSpeed = minSpeed;
    }

    speedIncreaseCount++;

    clearInterval(gameLoop);
    gameLoop = setInterval(update, fallSpeed);
}

result.innerText="❌ WRONG ANSWER";
}

answers.appendChild(result);

scoreText.innerText=score;

setTimeout(()=>{

quiz.classList.add("hidden");

gamePaused = false;   // ← AGREGAR

clearInterval(gameLoop);
gameLoop = setInterval(update, fallSpeed);

},1500);
    
};

answers.appendChild(b);

});
}

function hideQuiz(){

quiz.classList.add("hidden");

gamePaused = false;

clearInterval(gameLoop);
gameLoop = setInterval(update, fallSpeed);

}

function startQuizTimer(){

let timeLeft = quizTimeLimit;

// 🔽 NUEVO: obtener el texto del timer
let timerText = document.getElementById("quizTimerText");

if(timerText){
timerText.innerText = timeLeft;
}

quizTimer = setInterval(()=>{

timeLeft--;

// 🔽 NUEVO: actualizar contador visual
if(timerText){
timerText.innerText = timeLeft;
}

if(timeLeft <= 0){

clearInterval(quizTimer);

// ❌ no respondió → aumenta velocidad
if(speedIncreaseCount < maxSpeedIncreases){

    fallSpeed -= speedPenalty;

    if(fallSpeed < minSpeed){
        fallSpeed = minSpeed;
    }

    speedIncreaseCount++;

    clearInterval(gameLoop);
    gameLoop = setInterval(update, fallSpeed);
}

hideQuiz(); // usa tu función actual para cerrar quiz

}

},1000);

}

function playStartSound(callback){

let audio = new Audio("start.mp3");
audio.volume = 0.5;
audio.play();

audio.onended = function(){
    if(callback){
        callback();
    }
};

}

function showIntroAnimation(){

let intro = document.createElement("div");

intro.id = "introScreen";

intro.innerHTML = "READY<br>PLAYER ONE";

document.body.appendChild(intro);

// quitar después de 2.5 segundos
setTimeout(()=>{
intro.remove();
},2500);

}

function startGameTimer(){

firebase.database()
.ref("rooms/"+roomCode)
.once("value", snapshot => {

let data = snapshot.val();

if(!data) return;

// tiempo de inicio del juego
let start = data.startTime;

// si el profesor definió tiempo usar ese,
// si no usar tu gameTimeLimit original
let limit = data.gameTime ? data.gameTime : gameTimeLimit;

if(!start) return;

gameTimer = setInterval(()=>{

let now = Date.now();

let secondsPassed = Math.floor((now - start)/1000);

let remaining = limit - secondsPassed;

if(remaining < 0) remaining = 0;

document.getElementById("gameTimerDisplay").innerText = remaining;

if(remaining <= 0){

clearInterval(gameTimer);
endGameByTime();

}

},1000);

});

}

function endGameByTime(){

// cerrar quiz si estaba abierto
let quizBox = document.getElementById("quiz");
if(quizBox){
quizBox.classList.add("hidden");
}
    
clearInterval(gameLoop);
clearInterval(gameTimer);

gameStarted = false;

// detener música
music.pause();
music.currentTime = 0;

// 🔊 sonido GAME OVER cuando el tiempo termina
let overSound = new Audio("gameover.mp3");
overSound.volume = 0.6;
overSound.play().catch(()=>{});
    
let gameOverDiv = document.getElementById("gameOver");

gameOverDiv.innerHTML = "<h1 class='timeOver'>TIME OVER</h1>";

gameOverDiv.classList.remove("hidden");

// mostrar ranking después de 5 segundos

setTimeout(()=>{

document.getElementById("gameOver").classList.add("hidden");

document.getElementById("container").style.display="none";

document.getElementById("finalRoom").style.display="block";

startPixelConfetti();

showFinalRanking();

// 🎵 sonido victoria
document.getElementById("victorySound").play();
    
},5000);

}

function gameOver(){

let overSound = new Audio("gameover.mp3");
overSound.volume = 0.6;
overSound.play();

clearInterval(gameLoop);

// 🔥 guardar primer intento
if(firstTryScore === null){
   firstTryScore = score;
   updateTryTables();
}else{
   secondTryScore = score;
   updateTryTables();
}
    
document.getElementById("gameOver")
.classList.remove("hidden");

}

function rotatePiece(){

let rotated = piece.shape[0].map((_,i)=>

piece.shape.map(row=>row[i]).reverse()

);

let oldShape = piece.shape;

piece.shape = rotated;


// evita atravesar paredes

if(collide()){

piece.shape = oldShape;

// intentar mover a la derecha
piece.x++;

if(collide()){
piece.x -= 2;

if(collide()){
piece.x++;
piece.shape = oldShape;
}

}

}

}

// -------- RANKING FIREBASE --------

function updateRanking(){

if(!playerName || !roomCode) return;

players[playerName]={
name: playerName,
score: score
};

drawRanking();

// 🔥 Guardar en Firebase
firebase.database()
.ref("rooms/"+roomCode+"/players/"+playerName)
.set({
   name: playerName,
   score: score
});

}

let players={};

function drawRanking(){

   let list = document.getElementById("playersList");
   if(!list) return;

   list.innerHTML = "";

   Object.values(players)
   .sort((a,b)=> b.score - a.score)
   .forEach((player,index)=>{

      let li = document.createElement("li");
li.className = "player";

if(player.name === playerName){
li.classList.add("currentPlayer");
}

      li.innerHTML =
         "<span>"+(index+1)+". "+player.name+"</span>" +
         "<span>"+player.score+"</span>";

      list.appendChild(li);

   });

}

function saveTryScore(){

if(currentTry === 1){

firstTryScore = score;
document.getElementById("firstTryScore").innerText = firstTryScore;

currentTry = 2;

}else{

secondTryScore = score;
document.getElementById("secondTryScore").innerText = secondTryScore;

}

}

function updateTryTables(){

let firstTable = document.getElementById("firstTryScore");
let secondTable = document.getElementById("secondTryScore");

if(firstTable){
   firstTable.innerText = firstTryScore ?? "-";
}

if(secondTable){
   secondTable.innerText = secondTryScore ?? "-";
}

}

document.addEventListener("keydown", function(e){

if(e.key === "m"){

let newTime = prompt("Set game time (seconds):");

if(newTime){
gameTimeLimit = parseInt(newTime);
document.getElementById("gameTimerDisplay").innerText = gameTimeLimit;
}

}


});

// -------- REALTIME RANKING --------

function activateRealtimeRanking(){

   if(!roomCode || roomCode === "") return;

   firebase.database()
   .ref("rooms/"+roomCode+"/players")
   .on("value", function(snapshot){

      players = snapshot.val() || {};

firebase.database()
.ref("rooms/"+roomCode+"/firstTry")
.on("value", snapshot => {

const data = snapshot.val();

if(!data) return;

let html = "";

Object.values(data)
.sort((a,b)=> b.score-a.score)
.forEach(player => {

html += player.name + " — " + player.score + "<br>";

});

document.getElementById("firstTryScore").innerHTML = html;

});
       
      drawRanking();

   });

}

function playAgain(){

saveTryScore();

score = 0;
  
scoreText.innerText = score;


    
// resetear score en ranking también
firebase.database()
.ref("rooms/"+roomCode+"/players/"+playerName)
.set({
   name: playerName,
   score: 0
});

// guardar FIRST TRY solo si no existe
firebase.database()
.ref("rooms/"+roomCode+"/firstTry/"+playerName)
.once("value", function(snapshot){

   if(!snapshot.exists()){

      firebase.database()
      .ref("rooms/"+roomCode+"/firstTry/"+playerName)
      .set({
         name: playerName,
         score: firstTryScore
      });

   }

});
    
board = Array.from({length:ROWS},()=>Array(COLS).fill(0));

piece = randomPiece();

pieceCounter = 0;

fallSpeed = 700;
speedIncreaseCount = 0;

document.getElementById("gameOver").classList.add("hidden");

clearInterval(gameLoop);
gameLoop = setInterval(update, fallSpeed);

}

// ---------------------------
// FINAL RANKING
// ---------------------------

function showFinalRanking(){

firebase.database()
.ref("rooms/"+roomCode)
.once("value", snapshot => {

let data = snapshot.val();

if(!data) return;

let finalPlayers = [];

// jugadores normales
if(data.players){

Object.values(data.players).forEach(p=>{

finalPlayers.push({
name:p.name,
score:p.score
});

});

}

// jugadores firstTry
if(data.firstTry){

Object.values(data.firstTry).forEach(p=>{

let exists = finalPlayers.find(pl=>pl.name===p.name);

if(!exists){

finalPlayers.push({
name:p.name,
score:p.score
});

}else{

// ⭐ si existe comparar score y guardar el mayor
if(p.score > exists.score){
exists.score = p.score;
}

}

});

}

finalPlayers.sort((a,b)=>b.score-a.score);

drawFinalRanking(finalPlayers);

});

}

function drawFinalRanking(list){

let container = document.getElementById("finalRanking");

container.innerHTML = `
<table class="finalTable">
<tr>
<th>Rank</th>
<th>Player</th>
<th>Score</th>
</tr>
<tbody id="rankingBody"></tbody>
</table>
`;

let body = document.getElementById("rankingBody");

list.sort((a,b)=>b.score-a.score);

list.forEach((p,i)=>{

setTimeout(()=>{

let medal = i+1;

if(i===0) medal="🥇";
else if(i===1) medal="🥈";
else if(i===2) medal="🥉";

let row = document.createElement("tr");

row.className="rankingRow place"+(i+1);

row.innerHTML=`
<td>${medal}</td>
<td>${p.name}</td>
<td>${p.score}</td>
`;

body.appendChild(row);

}, i*1000);

});

}

function startGame(){

startScreen.style.display="none";

music.volume=.4;
music.play();

gameStarted = true;

gameLoop = setInterval(update,fallSpeed);

startGameTimer();

}

function goToFinalRanking(){

if(!roomCode){
alert("Open a room first");
return;
}

window.open("index.html?final="+roomCode, "_blank");

}

function waitForTeacher(){

firebase.database()
.ref("rooms/"+roomCode+"/status")
.on("value", function(snapshot){

let status = snapshot.val();

if(status === "playing"){

startGame();

}

});

}

function startPixelConfetti(){

let canvas = document.getElementById("confettiCanvas");

if(!canvas) return; // evita error si no existe

let ctx = canvas.getContext("2d");


// 🔧 Ajuste seguro para móvil y PC
function resizeConfettiCanvas(){

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

}

// ajustar al iniciar
resizeConfettiCanvas();

// ajustar si se rota el celular o cambia tamaño
window.addEventListener("resize", resizeConfettiCanvas);


let pixels = [];

for(let i=0;i<150;i++){

pixels.push({

x:Math.random()*canvas.width,
y:Math.random()*canvas.height,

size:6,

speed:1+Math.random()*3,

color:["#00ffff","#ff00ff","#ffff00","#00ff00","#ff3333"][Math.floor(Math.random()*5)]

});

}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

pixels.forEach(p=>{

ctx.fillStyle=p.color;

ctx.fillRect(p.x,p.y,p.size,p.size);

p.y+=p.speed;

if(p.y>canvas.height){

p.y=0;
p.x=Math.random()*canvas.width;

}

});

requestAnimationFrame(draw);

}

draw();

setTimeout(()=>{

let c = document.getElementById("confettiCanvas");
if(c) c.style.display="none";

},5000);

}

function updateStats(){

let correctBox = document.getElementById("correctAnswers");
let rowsBox = document.getElementById("cleanRows");

if(correctBox){
correctBox.innerText = correctAnswers;
}

if(rowsBox){
rowsBox.innerText = cleanRows;
}

}

// CONTROLES MOVIL

window.addEventListener("load", ()=>{

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const downBtn = document.getElementById("downBtn");
const rotateBtn = document.getElementById("rotateBtn");

if(leftBtn){

leftBtn.addEventListener("click", ()=>{

if(!gameStarted) return;

piece.x--;

if(collide()) piece.x++;

});

}

if(rightBtn){

rightBtn.addEventListener("click", ()=>{

if(!gameStarted) return;

piece.x++;

if(collide()) piece.x--;

});

}

if(downBtn){

downBtn.addEventListener("click", ()=>{

if(!gameStarted) return;

piece.y++;

if(collide()){

piece.y--;

merge();

}

});

}

if(rotateBtn){

rotateBtn.addEventListener("click", ()=>{

if(!gameStarted) return;

rotatePiece();

});

}

});

