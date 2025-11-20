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
  update( draw = true ) {
    if ( draw ) {
      ctx.beginPath();
      ctx.fillStyle = "#FFF";
      ctx.arc( this.x, this.y, this.r, 0, Math.PI * 2, false );
      ctx.fill();
      ctx.closePath();
    }
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
const __CONFIG__ = { player_v: 5, closestTankBulletV: 5, secondClosestTankBulletV: 4 };

function movement() {
  player.vy = keys[ "w" ] ? -__CONFIG__.player_v : keys[ "s" ] ? __CONFIG__.player_v : 0;
  player.vx = keys[ "a" ] ? -__CONFIG__.player_v : keys[ "d" ] ? __CONFIG__.player_v : 0;

  player.x = Math.max( 23, Math.min( canvas.width - 20, player.x ) ); // clamp kar ra
  player.y = Math.max( 23, Math.min( canvas.height - 20, player.y ) );
}

function distance( a, b ) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

function shootFromTank( player, tanks ) {
  const closestTwo = [ ...tanks ]
    .map( t => ( { tank: t, dist: distance( player, t ) } ) )
    .sort( ( a, b ) => a.dist - b.dist )
    .slice( 0, 2 );

  const speeds = [ __CONFIG__.closestTankBulletV, __CONFIG__.secondClosestTankBulletV ];

  closestTwo.forEach( ( obj, index ) => {
    const t = obj.tank;
    const angle = Math.atan2( player.y - t.y, player.x - t.x );
    const speed = speeds[ index ];

    bullets.push(
      new Circle(
        t.x,
        t.y,
        5,
        Math.cos( angle ) * speed,
        Math.sin( angle ) * speed
      )
    );
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
  tanks.forEach( t => t.update() );

  for ( let i = bullets.length - 1; i >= 0; i-- ) {
    const b = bullets[ i ];
    b.update();

    if (
      b.x < -20 ||
      b.x > canvas.width + 20 ||
      b.y < -20 ||
      b.y > canvas.height + 20
    ) {
      bullets.splice( i, 1 );
      continue;
    }

    if ( bulletHitsPlayer( b, player ) ) {
      bullets.splice( i, 1 );
      playerHealth -= 10;

      if ( playerHealth <= 0 ) {
        gameOver = true;
        playerHealth = 0;
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
