(function(){
  'use strict';
// UTILS & CACHE
  let app = {
    touchClick : (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)) ? 'touchstart' : 'click',
    mouseRadius: 160,
    particles:[],
    canvas: document.getElementById('canvas'),
    shark: document.getElementById('shark'),
  }

// PARTICLES PRESET
  let preset = {
       count: 2500,
       size: 3,
       minSpeed: 50,
       maxSpeed: 150,
       startOrigin: {
         x: undefined,
         y: undefined
       }
     };

// PARTICLES
  class Particle{
    constructor(posX,posY,radius){
      this.position = {
        x: posX || 0,
        y: posY || 0
      }

      this.radius = radius || 1;
      this.direction = this.position;
      this.speed = 1;
      this.spotlightTimeStamp = undefined;

      //animation, collision & escape checkers
      this.moving = false;
      this.run = false;
      this.running = false;

    }

    stop(){
      this.moving = false;
      this.spotlightTimeStamp = undefined;
      this.direction = this.position;
    }

    move(posX,posY,speed){
      this.moving = true;
      this.spotlightTimeStamp = undefined;
      let deltaX = posX - this.position.x,
       deltaY = posY - this.position.y,
       distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

       this.direction = {
        x: posX,
        y: posY,
        distance: distance,
        sin: deltaY / distance,
        cos: deltaX / distance
      };

      this.startPoint = this.position;
      this.speed = speed || 1;

    }


    getPosition(movetime){

      let time = movetime / 1000;
      if (this.moving == true) {
        if (this.spotlightTimeStamp) {
          let deltaTime = time - this.spotlightTimeStamp,
            distance = (deltaTime * this.speed);

          let posy = this.direction.sin * distance,
            posx = this.direction.cos * distance;
          // update position
          this.position = {
            x: posx + this.startPoint.x,
            y: posy + this.startPoint.y
          };

          // particle reaches destination
          if (distance > this.direction.distance) {
            this.moving = false;
            this.spotlightTimeStamp = undefined;
            this.position = this.direction;

          }
          // particle impacts mouse
          if(this.checkCollision(this.position.x,this.position.y,app.mouseX,app.mouseY,app.mouseRadius) && !this.running){
            this.run = true;
            this.moving = false;
            this.spotlightTimeStamp = undefined;

          }

        } else {
          this.spotlightTimeStamp = time;
        }
        return this.position;
      } else {
        return false;
      }
    }

    getDestination(){
      // get random destination or escape from shark
      let cord = {};
      this.running = false;
      if(!this.run){
        cord.x = Math.random() * app.width,
        cord.y = Math.random() * app.height;
        cord.speed = Math.random() * (preset.maxSpeed / 2) + preset.minSpeed;
        }
      else{
        this.running = true;

        // particle from right
        if(app.mouseX - this.position.x > 0){
          cord.x = Math.random() * ((this.position.x - app.mouseRadius) - 1) + 1;
        }
        // particle from left
        else{
          cord.x = Math.random() * (app.width - (this.position.x - app.mouseRadius)) + (this.position.x - app.mouseRadius);
        }

        if(app.mouseY - this.position.y > 0){
          // particle from top
          cord.y = Math.random() * ((this.position.y - app.mouseRadius) - 1) + 1;
        }
        // particle from bottom
        else{
          cord.y = Math.random() * (app.height - (this.position.y - app.mouseRadius)) + (this.position.y - app.mouseRadius);
        }

        cord.speed = preset.maxSpeed ;
      }

      return cord;
    }

    checkCollision(a, b, x, y, r) {
      var dist_points = (a - x) * (a - x) + (b - y) * (b - y);
      r *= r;

      if (dist_points < r) {
        return true;
      }

      return false;
    }

  }
  function createParticle(count,size,originX,originY){
    for (let i = 0; i < count; i++){
        let x = originX || Math.random() * window.innerWidth,
            y = originY || Math.random() * window.innerHeight,
            particle = new Particle(x, y, size);

        app.particles.push(particle);
      }
  }
  function render(){
    app.ctx.globalCompositeOperation = 'destination-out';
      app.ctx.fillStyle = 'rgba(0,0,0,0.1)';

      app.ctx.fillRect(0, 0, app.width, app.height);

      app.ctx.globalCompositeOperation = 'source-over';
      app.ctx.fillStyle = "rgba(48,69,48,1)";

      if (app.particles) {
        for (let i = 0; i < app.particles.length; i++) {
          let fish = app.particles[i];
          app.ctx.beginPath();
          app.ctx.arc(fish.position.x, fish.position.y, fish.radius, 0, Math.PI * 2, false);
          app.ctx.closePath();
          app.ctx.fill();
        }
      }
  }
  function animate(time) {

      window.requestAnimationFrame(animate);
      if (app.width !== app.canvas.width) {
        app.canvas.width = app.width;
      }

      if (app.height !== app.canvas.height) {
        app.canvas.height = app.height;
      }

      if (app.particles) {
        for (let i = 0; i < app.particles.length; i++) {
          let fish = app.particles[i];

          if (!fish.getPosition(time)) {
            let cord = fish.getDestination();
            fish.move(cord.x, cord.y, cord.speed);
            fish.run = false;
          }
        }
      }

      render();
    }
  function resize(){
      app.width = app.canvas.width = window.innerWidth;
      app.height = app.canvas.height = window.innerHeight;

      if (app.particles) {

          for (let i = 0; i < app.particles.length; i++) {
            if (app.particles[i].position.x > app.width) {
              app.particles[i].stop();
              app.particles[i].position.x = app.width;
            }

            if (app.particles[i].position.y > app.height) {
              app.particles[i].stop();
              app.particles[i].position.y = app.height;
            }

          }
        }
    }

// CANVAS
  function initCanvas(){

    resize();

    app.ctx = app.canvas.getContext('2d');

    createParticle(preset.count,preset.size,preset.startOrigin.x,preset.startOrigin.y);
    animate();
  }

// SHARK MOVEMENT
  function moveShark(){
    app.shark.style.top = (app.mouseY - (app.shark.clientHeight / 2)) + 'px';
    app.shark.style.left = (app.mouseX - (app.shark.clientWidth / 2))+ 'px';
  }
  function onMouseMove(e){
    let bounds = app.canvas.getBoundingClientRect();
    app.mouseX = e.clientX - bounds.left;
    app.mouseY = e.clientY - bounds.top;
    moveShark();
  }
  function onTouchMove(e){
    let bounds = app.canvas.getBoundingClientRect();
    let touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        app.mouseX = touch.pageX - bounds.left;
        app.mouseY = touch.pageY - bounds.top;

    moveShark();
  }

// LISTENERS
  function initListener(){
    window.addEventListener('resize', resize, false);

    if(app.touchClick == 'click'){
      window.addEventListener('mousemove',onMouseMove);
    }else{
      window.addEventListener('mousemove',onTouchMove);
    }
  }

// INIT APP
  function init(){
    initCanvas();
    initListener();
  }

// DOM READY
  document.addEventListener("DOMContentLoaded", function(event) {
    init();
  });
})();
