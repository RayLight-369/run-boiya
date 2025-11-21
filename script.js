const canvas = document.querySelector( "canvas" );
const ctx = canvas.getContext( "2d" );

canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

const keys = {};
let gameOver = false;
let startTime = Date.now();
let survivalTime = 0;
let bestTime = Number( localStorage.getItem( "best_time" ) ) || 0;

class Circle {
  constructor ( x, y, r, vx = 0, vy = 0 ) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.vx = vx;
    this.vy = vy;
  }
  update() {
    ctx.beginPath();
    ctx.fillStyle = "#FFF";
    ctx.arc( this.x, this.y, this.r, 0, Math.PI * 2 );
    ctx.fill();
    ctx.closePath();
    this.x += this.vx;
    this.y += this.vy;
  }
}

const tanks = [
  new Circle( canvas.width - 30, 30, 20 ),
  new Circle( canvas.width - 30, canvas.height / 2, 20 ),
  new Circle( canvas.width - 30, canvas.height - 30, 20 ),
  new Circle( canvas.width / 2, canvas.height - 30, 20 ),
  new Circle( canvas.width / 2, 30, 20 ),
  new Circle( 30, canvas.height / 2, 20 ),
  new Circle( 30, canvas.height - 30, 20 ),
  new Circle( 30, 30, 20 ),
];

const player = new Circle( canvas.width / 2, canvas.height / 2, 10 );
let playerHealth = 100;
const bullets = [];

const __CONFIG__ = { player_v: 5.3, closestTankBulletV: 5, secondClosestTankBulletV: 4 };

let joystick = null;
let joystickKnob = null;
let joystickActive = false;
let joystickInput = { x: 0, y: 0 };

function isMobileLandscape() {
  const ua = navigator.userAgent;
  const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test( ua );
  const landscape = window.innerWidth > window.innerHeight;
  return isMobileDevice && landscape;
}

function createJoystick() {
  if ( !isMobileLandscape() ) return;
  joystick = document.createElement( "div" );
  joystick.style.position = "fixed";
  joystick.style.left = "50px";
  joystick.style.bottom = "50px";
  joystick.style.width = "100px";
  joystick.style.height = "100px";
  joystick.style.background = "rgba(255,255,255,0.2)";
  joystick.style.borderRadius = "50%";
  joystick.style.touchAction = "none";
  joystick.style.zIndex = "1000";
  document.body.appendChild( joystick );

  joystickKnob = document.createElement( "div" );
  joystickKnob.style.width = "50px";
  joystickKnob.style.height = "50px";
  joystickKnob.style.background = "rgba(255,255,255,0.7)";
  joystickKnob.style.borderRadius = "50%";
  joystickKnob.style.position = "absolute";
  joystickKnob.style.left = "25px";
  joystickKnob.style.top = "25px";
  joystick.appendChild( joystickKnob );

  joystick.addEventListener( "touchstart", e => { e.preventDefault(); joystickActive = true; } );
  joystick.addEventListener( "touchmove", e => {
    e.preventDefault();
    if ( !joystickActive ) return;
    const rect = joystick.getBoundingClientRect();
    const touch = e.touches[ 0 ];
    let dx = touch.clientX - ( rect.left + rect.width / 2 );
    let dy = touch.clientY - ( rect.top + rect.height / 2 );
    const maxLen = 40;
    const len = Math.sqrt( dx * dx + dy * dy );
    if ( len > maxLen ) { dx = ( dx / len ) * maxLen; dy = ( dy / len ) * maxLen; }
    joystickKnob.style.transform = `translate(${ dx }px, ${ dy }px)`;
    joystickInput.x = dx / maxLen;
    joystickInput.y = dy / maxLen;
  } );
  joystick.addEventListener( "touchend", e => {
    e.preventDefault();
    joystickActive = false;
    joystickKnob.style.transform = "translate(0px, 0px)";
    joystickInput.x = 0;
    joystickInput.y = 0;
  } );
}

function movement() {
  let targetX = ( keys[ "d" ] ? 1 : 0 ) - ( keys[ "a" ] ? 1 : 0 );
  let targetY = ( keys[ "s" ] ? 1 : 0 ) - ( keys[ "w" ] ? 1 : 0 );
  if ( joystick && joystickInput && isMobileLandscape() ) { targetX = joystickInput.x; targetY = joystickInput.y; }
  const len = Math.sqrt( targetX * targetX + targetY * targetY );
  if ( len > 0 ) { targetX /= len; targetY /= len; }
  const speed = __CONFIG__.player_v;
  const smoothing = 0.15;
  player.vx += ( targetX * speed - player.vx ) * smoothing;
  player.vy += ( targetY * speed - player.vy ) * smoothing;
  player.x = Math.max( 23, Math.min( canvas.width - 20, player.x ) );
  player.y = Math.max( 23, Math.min( canvas.height - 20, player.y ) );
}

function distance( a, b ) { const dx = b.x - a.x; const dy = b.y - a.y; return dx * dx + dy * dy; }

function shootFromTank( player, tanks ) {
  const closestTwo = [ ...tanks ].map( t => ( { tank: t, dist: distance( player, t ) } ) )
    .sort( ( a, b ) => a.dist - b.dist )
    .slice( 0, 2 );
  const speeds = [ __CONFIG__.closestTankBulletV, __CONFIG__.secondClosestTankBulletV ];
  closestTwo.forEach( ( obj, index ) => {
    const t = obj.tank;
    const angle = Math.atan2( player.y - t.y, player.x - t.x );
    const speed = speeds[ index ];
    bullets.push( new Circle( t.x, t.y, 5, Math.cos( angle ) * speed, Math.sin( angle ) * speed ) );
  } );
}

function bulletHitsPlayer( bullet, player ) {
  const dx = bullet.x - player.x;
  const dy = bullet.y - player.y;
  return dx * dx + dy * dy < ( bullet.r + player.r ) ** 2;
}

function drawHealthBar() {
  const maxWidth = 200;
  ctx.fillStyle = "red";
  ctx.fillRect( 20, 20, maxWidth, 15 );
  ctx.fillStyle = "lime";
  ctx.fillRect( 20, 20, ( playerHealth / 100 ) * maxWidth, 15 );
  ctx.strokeStyle = "white";
  ctx.strokeRect( 20, 20, maxWidth, 15 );
}

function drawTimer() {
  survivalTime = Math.floor( ( Date.now() - startTime ) / 1000 );
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText( "Time: " + survivalTime + "s", 20, 60 );
  ctx.fillStyle = "yellow";
  ctx.fillText( "Best: " + bestTime + "s", 20, 85 );
}

function drawGameOver() {
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText( "Game Over!", canvas.width / 2 - 100, canvas.height / 2 - 50 );
  ctx.font = "25px Arial";
  ctx.fillText( "You survived: " + survivalTime + "s", canvas.width / 2 - 110, canvas.height / 2 - 10 );
  ctx.fillText( "Best: " + bestTime + "s", canvas.width / 2 - 110, canvas.height / 2 + 25 );
  ctx.fillText( "Play Again? (Y / N)", canvas.width / 2 - 110, canvas.height / 2 + 70 );
}

function restartGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  playerHealth = 100;
  bullets.length = 0;
  gameOver = false;
  startTime = Date.now();
  survivalTime = 0;
  update();
}

setInterval( () => { if ( !gameOver ) shootFromTank( player, tanks ); }, 250 );

function update() {
  ctx.fillStyle = "rgba(58, 58, 58, 0.5)";
  ctx.fillRect( 0, 0, canvas.width, canvas.height );
  drawHealthBar();
  drawTimer();
  movement();
  player.update();
  tanks.forEach( t => t.update() );
  for ( let i = bullets.length - 1; i >= 0; i-- ) {
    const b = bullets[ i ];
    b.update();
    if ( b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20 ) {
      bullets.splice( i, 1 );
      continue;
    }
    if ( bulletHitsPlayer( b, player ) ) {
      bullets.splice( i, 1 );
      playerHealth -= 10;
      if ( playerHealth <= 0 ) {
        gameOver = true;
        playerHealth = 0;
        if ( survivalTime > bestTime ) { bestTime = survivalTime; localStorage.setItem( "best_time", bestTime ); }
      }
    }
  }
  if ( !gameOver ) requestAnimationFrame( update );
  else drawGameOver();
}

update();

document.onkeydown = e => {
  keys[ e.key ] = true;
  if ( gameOver ) {
    if ( e.key.toLowerCase() === "y" ) restartGame();
    if ( e.key.toLowerCase() === "n" ) alert( "Thanks for playing!" );
  }
};
document.onkeyup = e => ( keys[ e.key ] = false );

window.onresize = () => {
  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;
  if ( joystick ) joystick.remove();
  createJoystick();
};

createJoystick();
