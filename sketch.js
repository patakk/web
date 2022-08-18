let canvas;

let effect;
let blurH;
let blurV;

var fbo;
var effectFbo;
var bhFbo;
var bvFbo;

var charFbos = {};

var cl1, cl2, cl3, cl4;

var mm;
var WW, HH;
var ratio = Math.sqrt(2)*0+1;
//var resx = map(fxrand(), 0, 1,  1000, 1400);
//var resy = Math.round(1580*1000/resx);
var resx, resy;
var resscale = 2400/1400;
if(fxrand() < -.5){
    resx = 1400;
    resy = Math.round(1400/ratio);
}
else{
    resx = Math.round(1400/ratio);
    resy = 1400;
}
//resx=resy=1400;
var res = Math.min(resx, resy);
var zoom = .8;
var globalseed = Math.floor(fxrand()*1000000);

var hasmargin = 1.0 * (fxrand()*100 < 50);
let inconsolata;

var randomtint = [.1, .1, .1]

var pts = [];



var Engine = Matter.Engine,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Constraint = Matter.Constraint,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Composite = Matter.Composite,
    Bodies = Matter.Bodies;

var engine;
var grounds = [];
var bodies = [];

function preload() {
    effect = loadShader('assets/shaders/effect.vert', 'assets/shaders/effect.frag');
    blurH = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    blurV = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    inconsolata = loadFont('assets/fonts/couriermb.ttf');
    //inconsolata = loadFont('assets/fonts/helveticaneue/HelveticaNeueBd.ttf');
}

var deadness = map(fxrand(), 0, 1, 3, 16);
var slant = map(fxrand(), 0, 1, 11, 51);

/*function getRandomRYB(p){
    if(!p)
        p = fxrand();
    p = p%1.;
    var cryb = map2(p);
    cryb = saturatecol(cryb, map(fxrand(), 0, 1, -.3, .3));
    cryb = brightencol(cryb, map(fxrand(), 0, 1, -.3, .3));
    return cryb;
}*/

function setup(){
    pixelDensity(2);
    var or = innerWidth/innerHeight;
    var cr = resx / resy;
    var cw, ch;

    if(or > cr){
        ch = innerHeight-100;
        cw = round(ch*cr);
    }
    else{
        cw = innerWidth-100;
        ch = round(cw/cr);
    }

    canvas = createCanvas(cw, ch, WEBGL);
    canvas.id('maincanvas');

    var p5Canvas = document.getElementById("maincanvas");
    var w = document.getElementById("maincanvas").offsetWidth;
    var h = document.getElementById("maincanvas").offsetHeight;
    //p5Canvas.style.height = h-100 + 'px';
    //p5Canvas.style.width = w-100 + 'px';

    renderMode = 'simple';

    imageMode(CENTER);
    randomSeed(globalseed);
    noiseSeed(globalseed+123.1341);

    print('fxhash:', fxhash);

    //setAttributes('premultipliedAlpha', true);
    //setAttributes('antialias', true);

    //pg = createGraphics(resx, resy, WEBGL);
    //pg.colorMode(RGB, 1);
    //pg.noStroke();
    //curveDetail(44);
    //pg.textFont(inconsolata);
    //ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);
    textFont(inconsolata);
    //textAlign(CENTER, CENTER);
    imageMode(CENTER);
    rectMode(CENTER);
    colorMode(RGB, 1);

    //prepareFbos();

    //drawCube(pg);


    //pg.rotateY(accas);
    //mask.rotateY(accas);

    const pd = pixelDensity();
    fbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    effectFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    bhFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    bvFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});

    
    fbo.begin();    
    ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);

    initSim2();

    fbo.end();
    showall();
    showall();
    fxpreview();

    //frameRate(2);
    //noLoop();

    //prepareAutomata();
}

var engine;
var particles = [];
var grid = [];
var grounds = [];
var dis = 12;
var constraints = [];

function getConstr(ba, bb, pa, pb, length, stiffness, label='black'){
    var c = Constraint.create({
        pointA: { x: pa.x, y: pa.y },
        bodyA: ba,
        pointB: { x: pb.x, y: pb.y },
        bodyB: bb,
        length: length,
        stiffness: stiffness,
        angularStiffness: .01,
        label: label,
    });
    return c;
}

function initSim(){
    engine = Engine.create()
    //engine.gravity.y = .1;
    engine.gravity.x = 0;
    engine.gravity.y = .1;
    engine.gravity.y = 0;


    var bandc = [];
    var bodies = [];

    var nnx = round(random(20, 150));
    var nny = round(random(20, 150));
    while(nnx * nny > 70*70 || nnx * nny < 60*60){
        nnx = round(random(20, 150));
        nny = round(random(20, 150));
    }
    nnx = nny = 80;
    nnx = 100;
    var dims = 200;
    for(var j = 0; j < nny; j++){
        var row = [];
        for(var i = 0; i < nnx; i++){
            var x = map(i, 0, nnx-1, -dims, dims);
            var y = map(j, 0, nny-1, -dims, dims);
            var p = new Particle(x, y, 3);
            row.push(p);
            particles.push(p);
            bandc.push(p.body);
        }
        grid.push(row);
    }

    var vec0 = createVector(0, 0);
    var cv_ = createVector;
    var frqx = 0.005;
    var frqy = 0.03;
    frqx = random(.01, .04)
    frqy = random(.005, .01)
    var thresh = random(.06, .06)*2;
    for(var j = 0; j < grid.length; j++){
        for(var i = 0; i < grid[j].length; i++){
            var p = grid[j][i];
            var prob1 = power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 31.4131), 4) < thresh;
            var prob2 = power(noise(p.body.position.x*frqx+resx+2113.344, p.body.position.y*frqy+resy+2113.344, 55.2254), 4) < thresh;
            var lennz = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 3), 0, 1, .5, 2);
            //var mass = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 7), 0, 1, .5, 20);
            //p.mass = mass;
            if(i < grid[j].length-1){
                if(prob1 && i != 0 && j != 0 && i != grid[j].length && j != grid.length){
                    grid[j][i+1].body.mass = .1;
                    continue;
                }
                else{
                    var neigh = grid[j][i+1];
                    //var inter = new Particle((neigh.pos0.x + p.body.position.x)/2, (neigh.pos0.y + p.body.position.y)/2, 3);
                    var constr1 = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), .99*lennz*p.pos0.dist(neigh.pos0), .1, i%2==0 ? 'red' : 'purple');
                    //var constr2 = getConstr(inter.body, neigh.body, vec0.copy(), vec0.copy(), .99*lennz*inter.pos0.dist(neigh.pos0), .3);
                    bandc.push(constr1);
                    //bandc.push(constr2);
                }
            }
            if(j < grid.length-1){
                if(prob2 && i != 0 && j != 0 && i != grid[j].length && j != grid.length){
                    grid[j+1][i].body.mass = .1;
                    continue;
                }
                else{
                    var neigh = grid[j+1][i];
                    //var inter = new Particle((neigh.pos0.x + p.body.position.x)/2, (neigh.pos0.y + p.body.position.y)/2, 3);
                    var constr1 = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), .99*lennz*p.pos0.dist(neigh.pos0), .1, j%2==0 ? 'blue' : 'green');
                    //var constr2 = getConstr(inter.body, neigh.body, vec0.copy(), vec0.copy(), .99*lennz*inter.pos0.dist(neigh.pos0), .3);
                    bandc.push(constr1);
                    //bandc.push(constr2);
                }
            }
            if(i == 0 && j == 0){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(-resx/2, -resy/2), random(.2, .7)*p.pos0.dist(cv_(-resx/2, -resy/2)), .9, 'red');
                bandc.push(constr);
            }
            if(i == grid[j].length-1 && j == 0){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(+resx/2, -resy/2), random(.2, .7)*p.pos0.dist(cv_(+resx/2, -resy/2)), .9, 'blue');
                bandc.push(constr);
            }
            if(i == grid[j].length-1 && j == grid.length-1){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(+resx/2, +resy/2), random(.2, .7)*p.pos0.dist(cv_(+resx/2, +resy/2)), .9, 'red');
                bandc.push(constr);
            }
            if(i == 0 && j == grid.length-1){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(-resx/2, +resy/2), random(.2, .7)*p.pos0.dist(cv_(-resx/2, +resy/2)), .9, 'blue');
                bandc.push(constr);
            }
        }
    }
    
    Composite.add(engine.world, bandc);

    mouse = Mouse.create(document.getElementById("maincanvas"));
    var mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                // allow bodies on mouse to rotate
                angularStiffness: 0,
                render: {
                    visible: false
                }
            }
        });

    Composite.add(engine.world, mouseConstraint);
}

function initSim2(){
    engine = Engine.create()
    //engine.gravity.y = .1;
    engine.gravity.x = 0;
    engine.gravity.y = 0;
    //engine.gravity.y = .03;


    var bandc = getBandc();
    var bodies = [];

    
    var ground = new Ground(0, resy / 2 + 0, resx, 20, 0, true);
    grounds.push(ground);
    bandc.push(ground.body);


    Composite.add(engine.world, bandc);

    mouse = Mouse.create(document.getElementById("maincanvas"));
    var mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                // allow bodies on mouse to rotate
                angularStiffness: 0,
                render: {
                    visible: false
                }
            }
        });

    Composite.add(engine.world, mouseConstraint);
}

function getBandc(){
    var nnx = 100;
    var nny = 100;
    var dd = 6.6;
    var dims = nnx*dd;
    var bandc = [];
    for(var j = 0; j < nny; j++){
        var x = random(-1, 1);
        var y = map(j, 0, nny-1, -dims, dims);
        var p = new Particle(x, y, 4 );
        particles.push(p);
        bandc.push(p.body);
    }

    var vec0 = createVector(0, 0);
    var cv_ = createVector;
    var frqx = 0.005;
    var frqy = 0.03;
    frqx = random(.01, .04)
    frqy = random(.005, .01)
    var thresh = random(.06, .06)*2;
    for(var j = 0; j < particles.length; j++){
        var p = particles[j];
        var prob1 = power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 31.4131), 4) < thresh;
        var prob2 = power(noise(p.body.position.x*frqx+resx+2113.344, p.body.position.y*frqy+resy+2113.344, 55.2254), 4) < thresh;
        var lennz = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 3), 0, 1, .5, 2);
        //var mass = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 7), 0, 1, .5, 20);
        //p.mass = mass;
        if(j < particles.length-1){
            var neigh = particles[j+1];
            var constr = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), p.pos0.dist(neigh.pos0), .3, j==0 ? 'cool' : 'coolblack');
            bandc.push(constr);
        }
        if(j < particles.length-3){
            var neigh = particles[j+3];
            var constr = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), p.pos0.dist(neigh.pos0), .0052, 'invisible');
            bandc.push(constr);
        }
    }
    particles = [];
    for(var j = 0; j < nny; j++){
        var x = random(-1, 1) + 100;
        var y = map(j, 0, nny-1, -dims, dims);
        var p = new Particle(x, y, 4);
        particles.push(p);
        bandc.push(p.body);
    }
    
    for(var j = 0; j < particles.length; j++){
        var p = particles[j];
        var prob1 = power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 31.4131), 4) < thresh;
        var prob2 = power(noise(p.body.position.x*frqx+resx+2113.344, p.body.position.y*frqy+resy+2113.344, 55.2254), 4) < thresh;
        var lennz = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 3), 0, 1, .5, 2);
        //var mass = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 7), 0, 1, .5, 20);
        //p.mass = mass;
        if(j < particles.length-1){
            var neigh = particles[j+1];
            var constr = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), p.pos0.dist(neigh.pos0), .3, j==0 ? 'notcool' : 'notcoolblack');
            bandc.push(constr);
        }
        if(j < particles.length-4){
            var neigh = particles[j+4];
            var constr = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), p.pos0.dist(neigh.pos0), .02, 'invisible');
            //bandc.push(constr);
        }
    }

    return bandc;
}

var mouse;
function runSim() {
    mouse.position = {'x': map(mouseX, 0, width, -resx/2, resx/2), 'y' :map(mouseY, 0, height, -resy/2, resy/2)};
    Engine.update(engine, 1000 / 60);
    mouse.position = { 'x': map(mouseX, 0, width, -resx/2, resx/2), 'y': map(mouseY, 0, height, -resy/2, resy/2) };
}
var renderMode;

function drawSim() {

    stroke(.1);
    strokeWeight(3.6);
    noFill();

    allConstraints = Composite.allConstraints(engine.world);
    var shf = 10.21*noise(31.31);
    for(var k = 0; k < allConstraints.length; k++){
        var constr = allConstraints[k];
        if(constr.label.includes('Mouse')){
            continue;
        }
        var x1 = constr.bodyA ? constr.bodyA.position.x : constr.pointA.x;
        var y1 = constr.bodyA ? constr.bodyA.position.y : constr.pointA.y;
        var x2 = constr.bodyB ? constr.bodyB.position.x : constr.pointB.x;
        var y2 = constr.bodyB ? constr.bodyB.position.y : constr.pointB.y;

        var co = [.1, .1, .1]
        if(constr.label == 'red'){
            co = map2((map(power(noise(k*1.231, 33.4155), 4), 0, 1, 0, .02)+shf)%1);
            co = brightencol(co, -random(.2, .6));
            co = saturatecol(co, -random(.6, .7));
        }
        if(constr.label == 'green'){
            co = map2((map(power(noise(k*1.231, 66.7864), 4), 0, 1, 0.52, .53)+shf)%1);
            co = brightencol(co, -random(.3, .4));
            co = saturatecol(co, -random(.3, .5));
        }
        if(constr.label == 'blue'){
            co = map2((map(power(noise(k*1.231, 66.7864), 4), 0, 1, 0.54, .55)+shf)%1);
            co = brightencol(co, -random(.3, .4));
            co = saturatecol(co, random(.2, .3));
        }
        if(constr.label == 'purple'){
            co = map2((map(power(noise(k*1.231, 66.7864), 4), 0, 1, 0.61, .62)+shf)%1);
            co = brightencol(co, -random(.3, .4));
            co = saturatecol(co, -random(.4, .5));
        }
        if(constr.label == 'invisible'){
            co = [0.3, 0.3, 0.8];
            //continue
        }
        //var co = map2((shf+1.61*noise(round(k*0.0092, k*0.008)))%1.);
        //var co1 = map2((shf+1.61*noise(round(k*0.000035292, k*0.008)))%1.);
        //co = saturatecol(co, -.6);
        //var co2 = map2((shf+1.61*noise(round(k*0.0015292, k*0.008)))%1.);
        //co[0] = co1[0]*.9 + (1-.9)*co2[0];
        //co[1] = co1[1]*.9 + (1-.9)*co2[1];
        //co[1] = co1[2]*.9 + (1-.9)*co2[2];
        if(renderMode == 'simple'){
            stroke(...co);
            if(constr.label == 'invisible'){
                //line(x1, y1, -2, x2, y2, -2);
            }
            else{
                //line(x1, y1, x2, y2);
            }
        }
        if(renderMode == 'detail'){
            noStroke();
            fill(...co);
            //myline(x1, y1, x2, y2);
        }
        if(constr.label == 'cool'){
            push();
            translate(0,0,2);
            fill(.62, .62, .65);
            noStroke();
            rect(x1+10+42, y1+6-20, 90, 15)
            translate(0,0,1);
            fill(0);
            noStroke();
            textSize(14);
            text("cool curve", x1+10, y1-10)
            pop();
        }
        if(constr.label == 'notcool'){
            push();
            translate(0,0,2);
            fill(.62, .62, .65);
            noStroke();
            rect(x1+10+42+17, y1+6-20, 90+17*2, 15)
            translate(0,0,1);
            fill(0);
            noStroke();
            textSize(14);
            text("not cool curve", x1+10, y1-10)
            pop();
        }
    }

    if(invi){
        push();
        noFill();
        stroke(...map2(0.97));
        strokeWeight(2)
        for(var k = 0; k < allConstraints.length; k++){
            var constr = allConstraints[k];
            if(constr.label == 'invisible'){
                var x1 = constr.bodyA ? constr.bodyA.position.x : constr.pointA.x;
                var y1 = constr.bodyA ? constr.bodyA.position.y : constr.pointA.y;
                var x2 = constr.bodyB ? constr.bodyB.position.x : constr.pointB.x;
                var y2 = constr.bodyB ? constr.bodyB.position.y : constr.pointB.y;
                line(x1, y1, x2, y2);
            }
        }
        pop();
    }
    noFill();
    stroke(0.1);
    beginShape();
    var first = false;
    for(var k = 0; k < allConstraints.length; k++){
        var constr = allConstraints[k];
        if(constr.label == 'cool' || constr.label == 'coolblack'){
            var x1 = constr.bodyA ? constr.bodyA.position.x : constr.pointA.x;
            var y1 = constr.bodyA ? constr.bodyA.position.y : constr.pointA.y;
            var x2 = constr.bodyB ? constr.bodyB.position.x : constr.pointB.x;
            var y2 = constr.bodyB ? constr.bodyB.position.y : constr.pointB.y;
            if(!first)
                vertex(x1, y1);
            curveVertex(x2, y2);
            first = true;
        }
    }
    vertex(x2, y2);
    endShape();
    beginShape();
    var ll = '';
    for(var k = 0; k < allConstraints.length; k++){
        var constr = allConstraints[k];
        if(constr.label == 'notcool' || constr.label == 'notcoolblack'){
            var x1 = constr.bodyA ? constr.bodyA.position.x : constr.pointA.x;
            var y1 = constr.bodyA ? constr.bodyA.position.y : constr.pointA.y;
            var x2 = constr.bodyB ? constr.bodyB.position.x : constr.pointB.x;
            var y2 = constr.bodyB ? constr.bodyB.position.y : constr.pointB.y;
            vertex(x1, y1);
        }
    }
    endShape();

    for(var k = 0; k < particles.length; k++){
        //particles[k].draw();
    }

    for (var k = 0; k < grounds.length; k++) {
        grounds[k].draw();
    }
}

class Particle{
    constructor(x, y, r){
        this.pos0 = createVector(x, y);
        this.body = Bodies.circle(x, y, r, {});
    }

    draw(){
        noStroke();
        fill(0.9);
        push();
        translate(this.body.position.x, this.body.position.y);
        rotate(this.body.angle);
        rect(0, 0, 13, 3);

        pop();
    }
}

var shf = .3
class Ground{
    constructor(x, y, w, h, ang, drawable=true) {
        this.seed = random(1000);
        this.w = w;
        this.h = h;
        this.drawable = drawable;
        this.body = Bodies.rectangle(x, y, w, h, {isStatic: true});
        Matter.Body.rotate(this.body, ang);
    }

    draw() {
        if(!this.drawable)
            return;
        //stroke(.1);
        fill(.1);
        fill(...map2((shf+.25 * power(noise(this.seed,82.12), 9))%1));
        fill(...map2(.53))
        if(noise(this.seed) < .5)
            fill(...map2(0))
        fill(.1);

        noStroke();
        push();
        translate(this.body.position.x, this.body.position.y, 3);
        rotate(this.body.angle);
        rect(0, -3, this.w, this.h);
        pop();
    }
}

var issim = true;
var sim;
function draw(){
    fbo.begin();
    clear();
    ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);
    push();
    scale(resscale);

    var bgc = map2(.5);
    bgc = brightencol(bgc, -.3);
    bgc = saturatecol(bgc, -.3);
    bgc = [.12, .12, .15]
    bgc = [.62, .62, .65]
    background(...bgc);
    if(issim){
        for(var k = 0; k < 5; k++){
            runSim();
        }
    }
    
    //allConstraints = Composite.allConstraints(engine.world);
    //for(var k = 0; k < allConstraints.length; k++){
        //var constr = allConstraints[k];
        //constr.length = 5+0*sin(frameCount*0.01);
    //}
    drawSim();

    fill(.9, .2, .1);
    noStroke();
    //rect(mouse.position.x, mouse.position.y, 8, 8);
    pop();

    fbo.end();
    showall();
    //issim = false;
    //drawAutomata();
    //stepAutomata();

    //drawText();

    //stroke(1,0,0);
    //line(-1000,-1000,1000,1000)
    //line(+1000,-1000,-1000,1000)
    //fbo.end();
    //drawShapes(mask, shapes);
    //drawLines(bgpg, shapes);
    //showall();
    //fbo.draw();
    //fbo.draw();
    //drawPlants(pg);
    //  if(frameCount > 33)
        //noLoop();

}

var an = fxrand() * 3.14159;

function showall(){
    background(1);
    //pg.push();
    //pg.scale(0.8);
    //pg.pop();
    //pg.line(0,0,mouseX-width/2,mouseY-height/2);

    var dir = [cos(an), sin(an)]
    blurH.setUniform('tex0', fbo.getTexture());
    //blurH.setUniform('tex1', mask);
    blurH.setUniform('texelSize', [1.0/resx/resscale, 1.0/resy/resscale]);
    blurH.setUniform('direction', [dir[0], [1]]);
    blurH.setUniform('u_time', frameCount+globalseed*.01);
    blurH.setUniform('amp', .85);
    blurH.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
    //blurpass1.shader(blurH);
    //blurpass1.quad(-1,-1,1,-1,1,1,-1,1);
    bhFbo.begin();
    clear();
    shader(blurH);
    quad(-1,-1,1,-1,1,1,-1,1);
    bhFbo.end();
    
    blurV.setUniform('tex0', bhFbo.getTexture());
    //blurV.setUniform('tex1', mask);
    blurV.setUniform('texelSize', [1.0/resx/resscale, 1.0/resy/resscale]);
    blurV.setUniform('direction', [-dir[1], dir[0]]);
    blurV.setUniform('u_time', frameCount+globalseed*.01);
    blurV.setUniform('amp', .85);
    blurV.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
    //blurpass2.shader(blurV);
    //blurpass2.quad(-1,-1,1,-1,1,1,-1,1);
    bvFbo.begin();
    clear();
    shader(blurV);
    quad(-1,-1,1,-1,1,1,-1,1);
    bvFbo.end();

    effect.setUniform('tex0', fbo.getTexture());
    effect.setUniform('tex1', bvFbo.getTexture());
    //effect.setUniform('tex2', blurpass2);
    //effect.setUniform('tex3', bgpg);
    effect.setUniform('u_usemask', 0.);
    effect.setUniform('u_resolution', [resx*resscale, resy*resscale]);
    effect.setUniform('u_mouse',[dir[0], dir[1]]);
    effect.setUniform('u_time', frameCount);
    effect.setUniform('incolor', randomtint);
    effect.setUniform('seed', globalseed+random(.1,11));
    effect.setUniform('noiseamp', mouseX/width*0+1);
    effect.setUniform('hasmargin', hasmargin);
    //effect.setUniform('tintColor', HSVtoRGB(fxrand(), 0.2, 0.95));
    var hue1 = fxrand();
   //effect.setUniform('tintColor', HSVtoRGB(fxrand(),.3,.9));
    //effect.setUniform('tintColor2', HSVtoRGB((hue1+.45+fxrand()*.1)%1,.3,.9));
    effect.setUniform('tintColor', [0.,0.,1.]);
    effect.setUniform('tintColor2', [0.,0.,1.]);

    effectFbo.begin();
    clear();
    shader(effect);
    quad(-1,-1,1,-1,1,1,-1,1);
    effectFbo.end();
    //effectpass.shader(effect);
    //effectpass.quad(-1,-1,1,-1,1,1,-1,1);
  
    // draw the second pass to the screen
    //image(effectpass, 0, 0, mm-18, mm-18);
    var xx = 0;
    //image(pg, 0, 0, mm*resx/resy-xx, mm-xx);
    effectFbo.draw(0, 0, width, height);

}

function windowResized() {
    var or = innerWidth/innerHeight;
    var cr = resx / resy;
    var cw, ch;

    if(or > cr){
        ch = innerHeight-100;
        cw = round(ch*cr);
    }
    else{
        cw = innerWidth-100;
        ch = round(cw/cr);
    }
    resizeCanvas(cw, ch, true);
    
    var p5Canvas = document.getElementById("maincanvas");
    var w = cw;
    var h = ch;
    //p5Canvas.style.height = h-100 + 'px';
    //p5Canvas.style.width = w-100 + 'px';

    showall();
}


function footer(thesymb){
    var symbs = ",*xae";
    symbs = "*xz";
    var symb = symbs[floor(random(symbs.length))];
    if (thesymb)
        symb = thesymb;
    var fu = 15;
    var ddx = resx-fu*2;
    var nnx = round(ddx/12);
    for(var k = 0; k < nnx; k++){
        var x = map(k, 0, nnx-1, -resx/2+fu, resx/2-fu);
        var y = resy/2-fu*1.;
        //text('*', x, +y);
        //text('*', x, -y);
    }

    var ddy = resy-fu*2;
    var nny = round(ddy/12);
    for(var k = 0; k < nny; k++){
        var y = map(k, 0, nny-1, -resy/2+fu, resy/2-fu);
        var x = resx/2-fu*1.;
        //text('*', +x, y);
        //text('*', -x, y);
    }

    var x1 = -resx/2 + fu;
    var y1 = -resy/2 + fu;
    var x2 = +resx/2 - fu;
    var y2 = +resy/2 - fu;

    var det = 12;
    var nn;
    nn = round(dist(x1,y1,x2,y1)/det);
    fill(0.004);
    noStroke();
    push();
    if(symb == '.' || symb == ','){
        translate(0, -det/2);
    }
    for(var kk = 0; kk < nn; kk++){
        var x = map(kk, 0, nn, x1, x2);
        var y = y1;
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }

    nn = round(dist(x2,y1,x2,y2)/det);
    for(var kk = 0; kk < nn; kk++){
        var x = x2;
        var y = map(kk, 0, nn, y1, y2);
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }

    nn = round(dist(x2,y2,x1,y2)/det);
    for(var kk = 0; kk < nn; kk++){
        var x = map(kk, 0, nn, x2, x1);
        var y = y2;
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }

    nn = round(dist(x1,y2,x1,y1)/det);
    for(var kk = 0; kk < nn; kk++){
        var x = x1;
        var y = map(kk, 0, nn, y2, y1);
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }
    pop();
}

function polyToColliders(poly){
    var grounds = [];
    for(var i = 0; i < poly.length-1; i++){
        var p1 = poly[i];
        var p2 = poly[(i+1)%poly.length];

        var mid = p5.Vector.add(p1, p2);
        mid.mult(.5);
        var p12 = p5.Vector.sub(p2, p1);
        var dd = p12.mag();
        var ang = p12.heading();

        var body = Bodies.rectangle(mid.x, mid.y, dd, 20, {isStatic: true, label: "custom", friction: 1,frictionStatic: Infinity});
        Matter.Body.rotate(body, ang);

        grounds.push(body);
    }
    return grounds;
}

var colpolys = [];

function rotateArr(arr, num){
    for(var k = 0; k < num; k++){
        var t = arr.pop();
        arr = [t].concat(arr);
    }
    return arr;
}


var accas = fxrand()*6.28;
var ooo = Math.round(1+3*fxrand());

function max(a, b){
    if(a >= b)
        return a;
    return b;
}

function min(a, b){
    if(a <= b)
        return a;
    return b;
}


function rotateAround(vect, axis, angle) {
    // Make sure our axis is a unit vector
    axis = p5.Vector.normalize(axis);
  
    return p5.Vector.add(
      p5.Vector.mult(vect, cos(angle)),
      p5.Vector.add(
        p5.Vector.mult(
          p5.Vector.cross(axis, vect),
          sin(angle)
        ),
        p5.Vector.mult(
          p5.Vector.mult(
            axis,
            p5.Vector.dot(axis, vect)
          ),
          (1 - cos(angle))
        )
      )
    );
  }



function myline(x1, y1, x2, y2){
    var d = dist(x1,y1,x2,y2);
    var det = 1.5;
    var parts = 2 + round(d/det);
    var amp = 3.;
    var frq = 0.1;
    var v1 = createVector(x1, y1);
    var v2 = createVector(x2, y2);
    var dir = v1.sub(v2);
    dir.normalize();
    var ang = dir.heading();
    for(var k = 0; k < parts; k++){
        var p = map(k, 0, parts-1, 0, 1);
        var env = pow(1. - 2*abs(p-.5), .5);
        var x = lerp(x1, x2, p);
        var y = lerp(y1, y2, p);
        var nx = x + amp*(-.5 + power(noise(x*frq, y*frq, 311.13), 2));
        var ny = y + amp*(-.5 + power(noise(x*frq, y*frq, 887.62), 2));
        //ny += env*d*.3;
        var rr = map(power(noise(k*0.1, x1+x2), 3), 0, 1, 1.5, 2)*1.2;
        ellipse(nx, ny, rr, rr);

        if(noise(k,x1,y1) < .3){
            push();
            //fill(...map2(0));
            translate(nx, ny);
            rotate(ang);
            ellipse(
                map(power(noise(x1,k+x1,y1+62.5524),4), 0, 1, -.25, .25), 
                map(power(noise(x1,k+x1,y1+13.7442),4), 0, 1, -.25, .25), 
                map(power(noise(x1,k+x1,y1+55.313),4),  0, 1,  2., 4.), 
                map(power(noise(x1+31.31,k+x1,y1),4),   0, 1,  2., 4.)
            );
            pop();
        }
    }
}

function gethobbypoints(knots, cycle, det=12){
    var hobbypts = [];
    for (var i=0; i<knots.length-1; i++) {
        var p0x = knots[i].x_pt;
        var p1x = knots[i].rx_pt;
        var p2x = knots[(i+1)%knots.length].lx_pt;
        var p3x = knots[(i+1)%knots.length].x_pt;
        var p0y = knots[i].y_pt;
        var p1y = knots[i].ry_pt;
        var p2y = knots[(i+1)%knots.length].ly_pt;
        var p3y = knots[(i+1)%knots.length].y_pt;

        //bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);

        var steps = 44;
        var totald = 0;
        var algorithm = 0;
        if(algorithm == 0){
            for(var st = 0; st < steps; st++){
                var t = map(st, 0, steps, 0, 1);
                var tn = map(st+1, 0, steps, 0, 1);
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
                
                xn = (1-tn)*(1-tn)*(1-tn)*p0x + 3*(1-tn)*(1-tn)*tn*p1x + 3*(1-tn)*tn*tn*p2x + tn*tn*tn*p3x;
                yn = (1-tn)*(1-tn)*(1-tn)*p0y + 3*(1-tn)*(1-tn)*tn*p1y + 3*(1-tn)*tn*tn*p2y + tn*tn*tn*p3y;
    
                var tonext = dist(xn, yn, x, y);
                totald += tonext;
            }
            steps = 2 + round(totald/det);
    
            for(var st = 0; st < steps; st++){
                var t = map(st, 0, steps, 0, 1);
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
    
                hobbypts.push(createVector(x, y));
            }
        }
        if(algorithm == 1){
            var t = 0;
            var dt = 0.05;
            while(t < 1.-dt/2){
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
                hobbypts.push(createVector(x, y));
    
                var tn = t + dt;
                xn = (1-tn)*(1-tn)*(1-tn)*p0x + 3*(1-tn)*(1-tn)*tn*p1x + 3*(1-tn)*tn*tn*p2x + tn*tn*tn*p3x;
                yn = (1-tn)*(1-tn)*(1-tn)*p0y + 3*(1-tn)*(1-tn)*tn*p1y + 3*(1-tn)*tn*tn*p2y + tn*tn*tn*p3y;
                var tonext = dist(xn, yn, x, y);
                var offsc = tonext/det;
                dt = dt/offsc;
    
                t = t + dt;
            }
        }
        
    }
    return hobbypts;
}


function map(v, v1, v2, v3, v4){
    return (v-v1)/(v2-v1)*(v4-v3)+v3;
}


function mouseClicked(){
    //createShapes();
}

var invi = false;

function keyPressed(){
    //noiseSeed(round(random(1000)));
    //createShapes();
    if(key == 'g'){
        engine.gravity.y = -engine.gravity.y;
        engine.gravity.y = .03;
    }
    if(key == 'c'){
        if (renderMode == 'simple') {
            renderMode = 'detail';
        }
        else{
            renderMode = 'simple';
        }
    }
    if(key == 'r'){
        issim = !issim;
    }
    if(key == 'w'){
        allConstraints = Composite.allConstraints(engine.world);
        for(var k = 0; k < allConstraints.length; k++){
            var constr = allConstraints[k];
            constr.stiffness = 1. - constr.stiffness;
        }
    }
    if(key == 's'){
        var data = effectFbo.readToPixels();
        var img = createImage(effectFbo.width, effectFbo.height);
        for (i = 0; i < effectFbo.width; i++){
          for (j = 0; j < effectFbo.height; j++){
            var pos = (j * effectFbo.width*4) + i * 4;
            img.set(i,effectFbo.height-1-j, [data[pos], data[pos+1], data[pos+2],255]);
          }
        }
        img.updatePixels();
        img.save('output_' + fxhash, 'png');
    }
    if(key == 'i'){
        invi = !invi;
    }
}

function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2*p, g);
    else
        return 1 - 0.5 * Math.pow(2*(1 - p), g);
}

