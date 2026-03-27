import './style.css';
import { Game } from './game/Game.js';
import { initAudio, playSound } from './utils/audio.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const W = (canvas.width = Math.min(400, innerWidth - 20));
const H = (canvas.height = Math.min(640, innerHeight - 20));

// Audio init
initAudio();

const game = new Game(canvas, ctx, W, H);

// Button bindings
document.getElementById('start-btn').addEventListener('click', () => game.start());
document.getElementById('restart-btn').addEventListener('click', () => game.start());

window.startGame = () => game.start();
window.game = game;

export { game, canvas, ctx, W, H };
