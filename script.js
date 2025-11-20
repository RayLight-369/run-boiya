const canvas = document.querySelector( "canvas" );
const ctx = canvas.getContext( "2d" );

canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

const keys = {};
let gameOver = false;

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
    ctx.arc( this.x, this.y, this.r, 0, Math.PI * 2, false );
    ctx.fill();
    ctx.closePath();

    this.x += this.vx;
    this.y += this.vy;
  }
}

const tank1 = new Circle( canvas.width - 30, 30, 20 );
const tank2 = new Circle( canvas.width - 30, canvas.height / 2, 20 );
const tank3 = new Circle( canvas.width - 30, canvas.height - 30, 20 );
const tank4 = new Circle( canvas.width / 2, canvas.height - 30, 20 );
const tank5 = new Circle( canvas.width / 2, 30, 20 );
const tank6 = new Circle( 30, canvas.height / 2, 20 );
const tank7 = new Circle( 30, canvas.height - 30, 20 );
const tank8 = new Circle( 30, 30, 20 );

const player = new Circle( canvas.width / 2, canvas.height / 2, 10 );
let playerHealth = 100;

const bullets = [];
const tanks = [ tank1, tank2, tank3, tank4, tank5, tank6, tank7, tank8 ];

const __CONFIG__ = {
  v: 6.5
};

function movement() {
  if ( keys[ "w" ] && player.y > 23 ) player.vy = -__CONFIG__.v;
  else if ( keys[ "s" ] && player.y < canvas.height - 20 ) player.vy = __CONFIG__.v;
  else player.vy = 0;

  if ( keys[ "a" ] && player.x > 23 ) player.vx = -__CONFIG__.v;
  else if ( keys[ "d" ] && player.x < canvas.width - 20 ) player.vx = __CONFIG__.v;
  else player.vx = 0;
}

function distance( a, b ) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt( dx * dx + dy * dy );
}

function shootFromTank( player, tanks ) {
  const distances = tanks.map( t => ( {
    tank: t,
    dist: distance( player, t )
  } ) );

  distances.sort( ( a, b ) => a.dist - b.dist );

  const closestTwo = distances.slice( 0, 2 );

  const speed1 = 6;
  const speed2 = 5;

  closestTwo.forEach( ( obj, index ) => {
    const tank = obj.tank;
    const angle = Math.atan2( player.y - tank.y, player.x - tank.x );
    const speed = index === 0 ? speed1 : speed2;
    const vx = Math.cos( angle ) * speed;
    const vy = Math.sin( angle ) * speed;
    bullets.push( new Circle( tank.x, tank.y, 5, vx, vy ) );
  } );
}

function bulletHitsPlayer( bullet, player ) {
  const dx = bullet.x - player.x;
  const dy = bullet.y - player.y;
  return Math.sqrt( dx * dx + dy * dy ) < bullet.r + player.r;
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

function drawGameOver() {
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText( "Game Over!", canvas.width / 2 - 100, canvas.height / 2 - 20 );

  ctx.font = "25px Arial";
  ctx.fillText( "Play Again? (Y / N)", canvas.width / 2 - 110, canvas.height / 2 + 20 );
}

function restartGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  playerHealth = 100;
  bullets.length = 0;
  gameOver = false;
  update();
}

setInterval( () => {
  if ( !gameOver ) shootFromTank( player, tanks );
}, 250 );

function update() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  drawHealthBar();
  movement();
  player.update();
  tanks.forEach( tank => tank.update() );

  bullets.forEach( ( bullet, i ) => {
    bullet.update();

    if ( bulletHitsPlayer( bullet, player ) ) {
      bullets.splice( i, 1 );
      playerHealth -= 10;

      if ( playerHealth <= 0 ) {
        playerHealth = 0;
        gameOver = true;
      }
    }
  } );

  if ( !gameOver ) requestAnimationFrame( update );
  else drawGameOver();
}

update();

// key handler
document.onkeydown = e => {
  keys[ e.key ] = true;

  if ( gameOver ) {
    if ( e.key.toLowerCase() === "y" ) restartGame();
    if ( e.key.toLowerCase() === "n" ) alert( "Thanks for playing!" );
  }
};

document.onkeyup = e => ( keys[ e.key ] = false );
