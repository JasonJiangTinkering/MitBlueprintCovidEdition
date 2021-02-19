// Background image animation
// =======================================================================
// Copyright (c) 2019-2019 Jack Johannesen. https://insertdomain.name
// liscensed under the mit liscense.
// See GitHub for details. https://github.com/K4rakara/PortfolioSrc/blob/master/LICENSE
// =======================================================================

// Initializations
// =======================================================================
const canv = document.querySelector('#background');
canv.width = canv.clientWidth;
canv.height = canv.clientHeight;
let ctx = canv.getContext('2d');
let width = canv.clientWidth;
let height = canv.clientHeight;
let domDimension = width;
let trails = [];
let trailHRad = 10;
let quantity = 32;
let length = 32;
if (window.devicePixelRatio > 1) { // Look better on retina displays and the like.
    canv.width = canv.clientWidth * 2;
    canv.height = canv.clientHeight * 2;
    ctx.scale(2, 2);
    quantity = 16;
    length = 16;
    trailHRad = 20;
}
if (width > height) {
    domDimension = width;
} else {
    domDimension = height;
}
let gMnRad = width / 8;
let gMxRad = width * 2;
let gCZ = ((gMnRad + gMxRad) / 2) * -2;
let gRot = 0;
let cx = width/2;
let cy = height/2;
let fov = width * 0.8;
let colors = [
    '#f71735',
    '#009ddc',
    '#f26430',
    '#c52184',
    '#29bf12'
];

// Functions
// =======================================================================
function update() {
    for (let i = 0; i < trails.length; i++) {
        trails[i].update();
    }
    //gRot = gRot + 0.025;
    draw();
    window.requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0,0,width,height);
    for (let i = 0; i < trails.length; i++) {
        trails[i].draw();
    }
}

function reconfigure() {
    canv.width = canv.clientWidth;
    canv.height = canv.clientHeight;
    width = canv.clientWidth;
    height = canv.clientHeight;
    if (window.devicePixelRatio > 1) { // Look better on retina displays and the like.
        canv.width = canv.clientWidth * 2;
        canv.height = canv.clientHeight * 2;
        ctx.scale(2, 2);
    }
    if (width > height) {
        domDimension = width;
    } else {
        domDimension = height;
    }
    gMnRad = width / 8;
    gMxRad = width * 2;
    gCZ = ((gMnRad + gMxRad) / 2) * -2;
    gRot = 0;
    cx = width/2;
    cy = height/2;
    fov = width * 0.8;
}

function generateTrails() {
    for (let i = 0; i < quantity; i++) {
        let theta = Math.random()*2*Math.PI;
        let phi = Math.acos((Math.random()*2)-1);
        let alt = (Math.random()*(gMxRad-gMnRad))/(gMxRad-gMnRad);
        let mass = Math.random()*0.9+0.1;
        trails.push(new trail(theta,phi,alt,mass));
    }
}

function contain(v,mn,mx) {
    let final = v;
    if (v > mx) {
        final = mx;
    } else if (v < mn) {
        final = mn;
    }
    return final;
}

function randomColor() {
    let index = Math.ceil(Math.random() * colors.length - 1);
    return colors[index];
}

// Classes
// =======================================================================
class trail {
    constructor( theta, phi, alt, mass) {
        this.x = (contain(gMnRad+(alt*(gMxRad-gMnRad)),gMnRad,gMxRad))*Math.sin(phi)*Math.cos(theta);
        this.y = (contain(gMnRad+(alt*(gMxRad-gMnRad)),gMnRad,gMxRad))*Math.sin(phi)*Math.sin(theta);
        this.z = ((contain(gMnRad+(alt*(gMxRad-gMnRad)),gMnRad,gMxRad))*Math.cos(phi))+gCZ;
        this.ps = fov/(fov-this.z);
        this.px = (this.x*this.ps)+cx;
        this.py = (this.y*this.ps)+cy;
        this.theta = theta;
        this.phi = phi;
        this.alt = alt;
        this.mass = mass;
        this.thetav = Math.random() * 0.02 - 0.01;
        this.phiv = Math.random() * 0.02 - 0.01;
        this.altv = Math.random() * 0.02 - 0.01;
        this.c = randomColor();
        this.history = [];
        for (let i = 0; i < length; i++) {
            let tmpObj = {
                x:this.x,
                y:this.y,
                z:this.z,
                px:this.px,
                py:this.py,
                theta:this.theta,
                phi:this.phi,
                alt:this.alt
            }
            this.history.push(tmpObj);
        }
    }
    update() {
        this.history.pop();
        let tmpObj = {
            x:this.x,
            y:this.y,
            z:this.z,
            px:this.px,
            py:this.py,
            theta:this.theta,
            phi:this.phi,
            alt:this.alt
        }
        this.history.unshift(tmpObj);
        if (this.alt > 0) {
            this.altv = contain(this.altv - (0.0001 * this.mass),-1,1);
        } else if (this.alt < 0) {
            this.altv = contain(this.altv + (0.00005 * this.mass),-1,1);
        }
        if ((this.alt * (gMxRad - gMnRad)) <= gMnRad) {
            this.altv = 0.0125;
        }
        this.theta = this.theta + this.thetav;
        this.phi = this.phi + this.phiv;
        this.alt = this.alt + this.altv;
    }
    draw() {
        this.x = (contain(gMnRad+(this.alt*(gMxRad-gMnRad)),gMnRad,gMxRad))*Math.sin(this.phi)*Math.cos(this.theta+gRot);
        this.y = (contain(gMnRad+(this.alt*(gMxRad-gMnRad)),gMnRad,gMxRad))*Math.sin(this.phi)*Math.sin(this.theta+gRot);
        this.z = ((contain(gMnRad+(this.alt*(gMxRad-gMnRad)),gMnRad,gMxRad))*Math.cos(this.phi))+gCZ;
        this.ps = fov/(fov-this.z);
        if (this.ps*trailHRad > 0) {
            this.px = (this.x*this.ps)+cx;
            this.py = (this.y*this.ps)+cy;
            ctx.globalAlpha = 1;
            ctx.fillStyle = this.c;
            ctx.beginPath();
            ctx.arc(this.px,this.py,this.ps*trailHRad,0,2*Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.lineWidth = trailHRad*this.ps;
            ctx.globalAlpha = 1-(1/length);
            ctx.strokeStyle = this.c;
            ctx.beginPath();
            ctx.moveTo(this.px,this.py);
            ctx.lineTo(this.history[0].px,this.history[0].py);
            ctx.closePath();
            ctx.stroke();
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineWidth = (trailHRad*this.history[i].ps - ((i*(trailHRad*this.history[i].ps))/length));
                ctx.globalAlpha = Math.abs(1-(i/length));
                ctx.beginPath();
                ctx.moveTo(this.history[i-1].px,this.history[i-1].py);
                ctx.lineTo(this.history[i].px,this.history[i].py);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }
}

// Listeners
// =======================================================================
window.addEventListener('resize',reconfigure);

// Start
// =======================================================================
reconfigure();
generateTrails();
window.requestAnimationFrame(update);
