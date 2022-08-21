let canvas;

let effect;
let blurH;
let blurV;

var fbo;
var velFbo;
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


var palettesstrings = [
    'f46036-5b85aa-414770-372248-f55d3e-878e88-f7cb15-76bed0-9cfffa-acf39d-b0c592-a97c73-af3e4d',
    '121212-F05454-30475E-F5F5F5-F39189-BB8082-6E7582-046582',
    '084c61-db504a-e3b505-4f6d7a-56a3a6-177e89-084c61-db3a34-ffc857-323031',
    '32373b-4a5859-f4d6cc-f4b860-c83e4d-de6b48-e5b181-f4b9b2-daedbd-7dbbc3',
    'fa8334-fffd77-ffe882-388697-54405f-ffbc42-df1129-bf2d16-218380-73d2de',
    '3e5641-a24936-d36135-282b28-83bca9-ed6a5a-f4f1bb-9bc1bc-e6ebe0-36c9c6',
    '304d7d-db995a-bbbbbb-222222-fdc300-664c43-873d48-dc758f-e3d3e4-00ffcd',
    '5fad56-f2c14e-f78154-4d9078-b4431c-8789c0-45f0df-c2cae8-8380b6-111d4a',
    '4C3A51-774360-B25068-FACB79-dddddd-2FC4B2-12947F-E71414-F17808-Ff4828',
    '087e8b-ff5a5f-3c3c3c-f5f5f5-c1839f-1B2430-51557E-816797-D6D5A8-ff2222',
    '4C3F61-B958A5-9145B6-FF5677-65799B-C98B70-EB5353-394359-F9D923-36AE7C-368E7C-187498',
    '283d3b-197278-edddd4-c44536-772e25-0d3b66-faf0ca-f4d35e-ee964b-f95738-fe5d26-f2c078-faedca-c1dbb3-7ebc89-3d5a80-98c1d9-e0fbfc-ee6c4d-293241',
    '99e2b4-99d4e2-f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1',
    '080708-3772ff-df2935-fdca40-e6e8e6-d8dbe2-a9bcd0-58a4b0-373f51-1b1b1e',
];
var palettes = [];
palettesstrings.forEach(stri => {
  var palette = [];
  var swatches = stri.split('-');
  for(var s = 0; s < swatches.length; s++){
    var cc = hex2rgb(swatches[s]);
    cc = rgb2hsv(...cc);
    cc[1] *= 0.8;
    if(fxrand() < .5){
        cc[1] *= 0.5;
        cc[2] *= 0.7;
    }
    cc = hsv2rgb(...cc);
    palette.push(cc);
  }
  palettes.push(palette);
})

var palette0 = palettes[Math.floor(palettes.length*fxrand())];
//palette0 = palettes[12]
palette0 = shuffle(palette0);

function getRandomColor(pal){
    if(pal){
        return pal[Math.floor(pal.length*fxrand())];
    }
    else{
        return palette0[Math.floor(palette0.length*fxrand())];
    }
}

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
var lines = [];
var bodies = [];

var clipper = [];
var rectClipper = [];
var simpleClipper = [];

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
    velFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    bhFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    bvFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});

    
    fbo.begin();    
    ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);

    initPlants();
    initWeb();

    fbo.end();
    showall();
    showall();
    fxpreview();

    //frameRate(2);
    //noLoop();

    //prepareAutomata();
}

var plants = [];

class Plant{
    constructor(k){
        this.idx = k;
        var x1;
        x1 = random(-resx/2*.8, resx/2*.8);
        x1 = map(k, 0, 3, -resx/2*.66, resx/2*.66) + random(-150, 150);
        var y1 = resy/2;
        var x2 = x1 + random(-200, 200);
        var y2 = map(power(fxrand(), 4), 0, 1, -resy/2*.95, resy/2*.3);
        var p1 = createVector(x1, y1);
        var p2 = createVector(x2, y2);
        this.height = y1 - y2;
        
        this.pts = [];
        var d = p1.dist(p2);
        var det = 5;
        var parts = round(d/det);

        var ee = random(1, 3);
        for(var k = 0; k < parts; k++){
            var p = map(k, 0, parts-1, 0, 1);
            var px = pow(p, ee);
            var py = p;
            var x = lerp(x1, x2, px);
            var y = lerp(y1, y2, py);
            this.pts.push(createVector(x, y));
        }
    }
    getTwo(option=0){
        var p1 = random(.1, .6);
        var p2 = random(p1+.05, .9);
        if(option == 1){
            p1 = random(.1, .2);
            p2 = random(.8, .96);
        }
        else{
            if(fxrand() < .5){
                p1 = random(.1, .2);
                p2 = random(.23, .33);
            }
            else{
                p1 = random(.7, .8);
                p2 = random(.83, .93);
            }
        }
        var idx1 = round(p1*this.pts.length);
        var idx2 = round(p2*this.pts.length);
        var outpts = [];
        for(var k = idx1; k < idx2; k++){
            outpts.push(this.pts[k]);
        }
        return outpts;
    }

    draw(){
        stroke(0.1);
        strokeWeight(1);
        noFill();
        for(var q = 0; q < 6; q++){
            beginShape();
            for(var k = 0; k < this.pts.length; k++){
                var y = this.pts[k].y;
                var x = this.pts[k].x + 4*(-.5 + power(noise((y+1000.)*0.05, q*21.31), 3));
                vertex(x, y);
            }
            endShape();
        }

        noStroke();
        stroke(.2);
        var dd1 = round(map(noise(this.pts.length), 0, 1, this.pts.length*.7, this.pts.length*.8));
        for(var k = dd1; k < this.pts.length-1; k++){
            var aa = map(noise(k,this.pts.length, 31.413), 0, 1, .1, .2);
            if(this.idx == 0 || this.idx == 3){
                aa = pow(aa, .67);
            }
            fill(aa);
            var x = this.pts[k].x;
            var y = this.pts[k].y;
            var rr = map(power(noise(k*0.01, this.idx), 3), 0, 1, 20, 50);
            var head = atan2(this.pts[k+1].y-y, this.pts[k+1].x-x);
            push();
            translate(x, y);
            rotate(head+radians(-90+map(noise(k,this.pts.length, 22.22), 0, 1, -30, 30)));
            myellipse(0, rr/2, rr/8, rr);
            for(var q = 0; q < 30; q++){
                //ellipse(random(-12, 12), random(-12, 12), random(1,2), random(1,2))
            }
            pop();
        }

        var roo = round(map(noise(this.pts.length*2.131, 314.41), 0, 1, this.pts.length*.1, this.pts.length*.4));
        var roo2 = round(map(noise(this.pts.length*2.131, 314.41), 0, 1, this.pts.length*.1, this.pts.length*.4));
        var x = this.pts[roo].x;
        var y = this.pts[roo].y;
        var x2 = this.pts[roo+1].x;
        var y2 = this.pts[roo+1].y;
        var tilt = p5.Vector.sub(createVector(x, y), createVector(x2, y2)).heading();
        fill(.1)
        noStroke();
        if(this.height > resy/2)
            drawLeaf(x, y, tilt);

    }

}

function drawLeaf(x0, y0, tilt){
    push();
    translate(x0, y0);
    fxrand();
    rotate(tilt-PI/2);
    var wi = map(power(noise(x0+y0, y0, 33.14), 4), 0, 1, 8, 14);
    var spr = map(power(noise(x0+y0, x0*y0, 22.66), 4), 0, 1, 11, 77);
    var bg = map(power(noise(x0*31.4+y0, x0/y0*22.44, 22.12), 4), 0, 1, 0.1, 0.3);
    var don = map(power(noise(x0+y0*31.4, x0/y0*66.66, 77.34), 4), 0, 1, 80, 420);
    var dir = round(power(noise(x0+y0*251.4, x0/y0*36.73, 12.75), 4))*2-1;
    for(var k = 0; k < 222; k++){
        var x = map(k, 0, 222, 0, dir*spr);
        var y = map(k, 0, 222, bg, 1);
        var ee = map(k, 0, 222, 0, 1);
        ee = pow(1-2*abs(.5-ee), .5);
        y = pow(1-2*abs(.5-y), .5);
        y = map(y, 0, 1, 0, -don);
        myellipse(x-1+1*2*power(noise(x0+y0*251.4+k, x0/y0*36.73, 12.75), 4), y, wi*ee, 12*ee, .4)
    }
    pop();
}

function myellipse(x0, y0, w, h, amp=1){
    beginShape();
    for(var k = 0; k < 40; k++){
        var ang = map(k, 0, 40, 0, 2*PI);
        var sca = map(power(noise(k,44.8481), 3), 0, 1, .5, 1.5);
        var x = x0 + w/2*sca*cos(ang);
        var y = y0 + h/2*sca*sin(ang);
        fill(.2*.75 + .25*map(power(noise(x0+y0+w+h), 4), 0, 1, 0.1, .4));
        vertex(x, y);
    }
    endShape();
}

function reverse(arr){
    var out = [];
    for(var k = 0; k < arr.length; k++){
        out.push(arr[arr.length-k-1]);
    }
    return reverse;
}

function initPlants(){
    for(var k = 0; k < 4; k++){
        plants.push(new Plant(k));
    }
}

function drawPlants(){
    for(var k = 0; k < plants.length; k++){
        plants[k].draw();
    }
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
    engine.gravity.y = .1;
    engine.gravity.x = 0;
    engine.gravity.y = .0;
    //engine.gravity.y = 0;


    var bandc = [];
    var bodies = [];

    var nnx = round(random(20, 150));
    var nny = round(random(20, 150));
    while(nnx * nny > 70*70 || nnx * nny < 60*60){
        nnx = round(random(20, 150));
        nny = round(random(20, 150));
    }
    nnx = 21;
    nny = 20;
    var dims = 211;
    for(var j = 0; j < nny; j++){
        var row = [];
        for(var i = 0; i < nnx; i++){
            var x = map(i, 0, nnx-1, -dims, dims);
            var y = map(j, 0, nny-1, -dims, dims);
            var p = new Particle(x, y, 2);
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
    var thresh1 = random(.06, .16)*0;
    var thresh2 = random(.06, .16)*0;
    for(var j = 0; j < grid.length; j++){
        for(var i = 0; i < grid[j].length; i++){
            var p = grid[j][i];
            var env = map(p.pos0.mag(), 0, dist(244/2,244/2,0,0), 0, 1);
            env = map(pow(env, 4), 0, 1, .4, .8);
            env = 1.;
            var prob1 = power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 31.4131), 4) < thresh1;
            var prob2 = power(noise(p.body.position.x*frqx+resx+2113.344, p.body.position.y*frqy+resy+2113.344, 55.2254), 4) < thresh2;
            var lennz = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 3), 0, 1, .99, 1);
            //var mass = map(power(noise(p.body.position.x*frqx+resx, p.body.position.y*frqy+resy, 87.6612), 7), 0, 1, .5, 20);
            //p.mass = mass;
            if(i < grid[j].length-1){
                if(prob1 && i != 0 && j != 0 && i != grid[j].length && j != grid.length){
                    grid[j][i+1].body.mass = .01;
                    continue;
                }
                else{
                    var neigh = grid[j][i+1];
                    //var inter = new Particle((neigh.pos0.x + p.body.position.x)/2, (neigh.pos0.y + p.body.position.y)/2, 3);
                    var constr1 = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), env*lennz*p.pos0.dist(neigh.pos0), .1, 'h');
                    //var constr2 = getConstr(inter.body, neigh.body, vec0.copy(), vec0.copy(), env*lennz*inter.pos0.dist(neigh.pos0), .3);
                    bandc.push(constr1);
                    //bandc.push(constr2);
                }
            }
            if(j < grid.length-1){
                if(prob2 && i != 0 && j != 0 && i != grid[j].length && j != grid.length){
                    grid[j+1][i].body.mass = .01;
                    continue;
                }
                else{
                    var neigh = grid[j+1][i];
                    //var inter = new Particle((neigh.pos0.x + p.body.position.x)/2, (neigh.pos0.y + p.body.position.y)/2, 3);
                    var constr1 = getConstr(p.body, neigh.body, vec0.copy(), vec0.copy(), env*lennz*p.pos0.dist(neigh.pos0), .1, 'v');
                    //var constr2 = getConstr(inter.body, neigh.body, vec0.copy(), vec0.copy(), env*lennz*inter.pos0.dist(neigh.pos0), .3);
                    bandc.push(constr1);
                    //bandc.push(constr2);
                }
            }
            var dd = round(fxrand());
            if(i == 0 && j == 0){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(-(resx/2-15)+dd*.5*random(resx), -(resy/2-15)+(1-dd)*.5*random(resy)), 3, .9, 'red');
                //bandc.push(constr);
            }
            else if(i == grid[j].length-1 && j == 0){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(+(resx/2-15)-dd*.5*random(resx), -(resy/2-15)+(1-dd)*.5*random(resy)), 3, .9, 'red');
                //bandc.push(constr);
            }
            else if(i == grid[j].length-1 && j == grid.length-1){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(+(resx/2-15)-dd*.5*random(resx), +(resy/2-15)-(1-dd)*.5*random(resy)), 3, .9, 'red');
                //bandc.push(constr);
            }
            else if(i == 0 && j == grid.length-1){
                var constr = getConstr(p.body, null, vec0.copy(), cv_(-(resx/2-15)+dd*.5*random(resx), +(resy/2-15)-(1-dd)*.5*random(resy)), 3, .9, 'red');
                //bandc.push(constr);
            }
            else{
                if(j == 0 && fxrand() < .3){
                    var constr = getConstr(p.body, null, vec0.copy(), cv_(map(p.pos0.x, -200, 200, -300, 300), -(resy/2-15)), 3, .1, 'red');
                    //bandc.push(constr);
                }
                if(j == grid.length-1 && fxrand() < .3){
                    var constr = getConstr(p.body, null, vec0.copy(), cv_(map(p.pos0.x, -200, 200, -300, 300), +(resy/2-15)), 3, .1, 'red');
                    //bandc.push(constr);
                }
                if(i == 0 && fxrand() < .3){
                    var constr = getConstr(p.body, null, vec0.copy(), cv_(-(resx/2-15), p.pos0.y), 3, .1, 'red');
                    //bandc.push(constr);
                }
                if(i == grid[j].length-1 && fxrand() < .3){
                    var constr = getConstr(p.body, null, vec0.copy(), cv_(+(resx/2-15), p.pos0.y), 3, .1, 'red');
                    //bandc.push(constr);
                }
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

var mouse;
function runSim() {
    mouse.position = {'x': map(mouseX, 0, width, -resx/2, resx/2), 'y' :map(mouseY, 0, height, -resy/2, resy/2)};
    Engine.update(engine, 1000 / 60);
    mouse.position = { 'x': map(mouseX, 0, width, -resx/2, resx/2), 'y': map(mouseY, 0, height, -resy/2, resy/2) };
}
var renderMode;

var frqh = map(fxrand(), 0, 1, 0.0005, 0.03);
var frqv = map(fxrand(), 0, 1, 0.0005, 0.03);

function drawSim(drawVelocity) {

    if(!drawVelocity){
        drawPlants();
    }

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

        if(!constr.bodyA){
            var ve1 = p5.Vector.sub(createVector(constr.pointA.x, constr.pointA.y), simpleClipper[3]);
            var ve2 = p5.Vector.sub(simpleClipper[2], simpleClipper[3]);
            var vn1 = ve1.copy();
            var vn2 = ve2.copy();
            vn1.normalize();
            vn2.normalize();
            var d1 = ve1.mag();
            var d2 = ve2.mag();
            var down = d1/d2;
            down = pow(1. - 2*abs(.5 - down), .5)*.6; 
            var simi = p5.Vector.dot(vn1, vn2);
            var xx1 = simpleClipper[3].x;
            var yy1 = simpleClipper[3].y;
            var xx2 = simpleClipper[2].x;
            var yy2 = simpleClipper[2].y;
            if(simi > 0.99){
                var d = d2;
                var doamp = map(power(noise(xx1+yy1+xx2+yy2), 4), 0, 1, 6, 12);
                y1 += down*d/doamp;
            }
        }
        if(!constr.bodyB){
            var ve1 = p5.Vector.sub(createVector(constr.pointB.x, constr.pointB.y), simpleClipper[3]);
            var ve2 = p5.Vector.sub(simpleClipper[2], simpleClipper[3]);
            var vn1 = ve1.copy();
            var vn2 = ve2.copy();
            vn1.normalize();
            vn2.normalize();
            var d1 = ve1.mag();
            var d2 = ve2.mag();
            var down = d1/d2;
            down = pow(1. - 2*abs(.5 - down), .5)*.6; 
            var simi = p5.Vector.dot(vn1, vn2);
            var xx1 = simpleClipper[3].x;
            var yy1 = simpleClipper[3].y;
            var xx2 = simpleClipper[2].x;
            var yy2 = simpleClipper[2].y;
            if(simi > 0.99){
                var d = d2;
                var doamp = map(power(noise(xx1+yy1+xx2+yy2), 4), 0, 1, 6, 12);
                y2 += down*d/doamp;
            }
        }

        co = palette0[floor((k*.01))%palette0.length]
        if(constr.label == 'red'){
            co = palette0[floor((k*.01))%palette0.length]
        }
        if(constr.label == 'h'){
            co = palette0[floor((k*frqh))%palette0.length]
        }
        if(constr.label == 'v'){
            co = palette0[floor((k*frqv)+ 18)%palette0.length]
        }

        if(!drawVelocity){
            if(renderMode == 'simple'){
                stroke(...co);
                stroke(.9);
                stroke(.8);
                stroke(.1);
                if(!constr.label.includes('long')){
                    curvedDown(x1, y1, x2, y2);
                }
                else if(!constr.bodyA || !constr.bodyB){
                    stroke(.9,.1,.2);
                    stroke(.1);
                    stroke(.8);
                    line(x1, y1, x2, y2);
                }
                else{
                    line(x1, y1, x2, y2);
                }
            }
            if(renderMode == 'detail'){
                stroke(...co);
                stroke(.9);
                //line(x1, y1, x2, y2);
                noStroke();
                fill(.9,.1,.2);
                fill(.8);
                fill(.1);
                myline(x1, y1, x2, y2, constr.label);
            }
        }
        else{
            var vxa = constr.bodyA ? constr.bodyA.velocity.x : 0;
            var vya = constr.bodyA ? constr.bodyA.velocity.y : 0;
            var vxb = constr.bodyB ? constr.bodyB.velocity.x : 0;
            var vyb = constr.bodyB ? constr.bodyB.velocity.y : 0;

            var r1 = map(constrain(vxa, -2, 2), -2, 2, 0, 1);
            var g1 = map(constrain(vya, -2, 2), -2, 2, 0, 1);
            var r2 = map(constrain(vxb, -2, 2), -2, 2, 0, 1);
            var g2 = map(constrain(vyb, -2, 2), -2, 2, 0, 1);
            
            var r1 = constrain(abs(vxa)/2, 0, 1);
            var g1 = constrain(abs(vya)/2, 0, 1);
            var r2 = constrain(abs(vxb)/2, 0, 1);
            var g2 = constrain(abs(vyb)/2, 0, 1);

            hackLine(x1, y1, x2, y2, [r1,g1,0], [r2,g2,0], 14.2)
        }
    }

    
    for(var k = 0; k < lines.length; k++){
        if(!lines[k].label.includes('wall'))
            continue;
        lines[k].draw();
    }

    for(var k = 0; k < particles.length; k++){
        //particles[k].draw();
    }

    for (var k = 0; k < grounds.length; k++) {
        //grounds[k].draw();
    }
}

function curvedDown(x1, y1, x2, y2){
    var a = createVector(x1, y1);
    var b = createVector(x2, y2);
    var mid = p5.Vector.add(a, b);
    mid.div(2);
    mid.add(createVector(0, 3));

    beginShape();
    curveVertex(a.x, a.y);
    curveVertex(a.x, a.y);
    curveVertex(mid.x, mid.y);
    curveVertex(b.x, b.y);
    curveVertex(b.x, b.y);
    endShape();
}

function hackLine(x1, y1, x2, y2, c1, c2, th){
    th /= 2;
    var a = createVector(x1, y1);
    var b = createVector(x2, y2);
    var dir = p5.Vector.sub(b, a);
    dir.normalize();
    dir.rotate(PI/2);
    dir.mult(th);
    var p1 = p5.Vector.sub(a, dir);
    var p2 = p5.Vector.add(a, dir);
    var p3 = p5.Vector.add(b, dir);
    var p4 = p5.Vector.sub(b, dir);

    noStroke();
    beginShape();
    fill(...c1);
    vertex(p1.x, p1.y);
    vertex(p2.x, p2.y);
    fill(...c2);
    vertex(p3.x, p3.y);
    vertex(p4.x, p4.y);
    endShape();
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

var bgc = getRandomColor();
var bgc1 = hsv2rgb(.125, .02, .6);
var bgc2 = hsv2rgb(.14, .02, .5);

bgc = [.1, .1, .1]
bgc = [.71, .71, .71]
bgc = [.12, .12, .12]

function draw(){
    fbo.begin();
    clear();
    ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);
    push();
    scale(resscale);
    noStroke();
    beginShape();
    fill(...bgc1);
    vertex(-resx/2, -resy/2);
    vertex(+resx/2, -resy/2);
    fill(...bgc2);
    vertex(+resx/2, +resy/2);
    vertex(-resx/2, +resy/2);
    endShape();
    if(issim){
        for(var k = 0; k < 5; k++){
            runSim();
        }
    }
    translate(-50, 100)
    drawSim();
    var xxxxx = min(resy/2, simpleClipper[0].y + 100);
    var xxxxx = simpleClipper[0].y + 600;
    myline(simpleClipper[0].x, simpleClipper[0].y, simpleClipper[0].x, xxxxx, 'straight')
    noStroke();
    fill(.1);
    ellipse(simpleClipper[0].x, xxxxx-5*.7, 17*.7, 17*.7);
    ellipse(simpleClipper[0].x, xxxxx-17*.7, 17*.7, 21*.7);
    myline(simpleClipper[0].x+8, xxxxx, simpleClipper[0].x+2, xxxxx+10)
    myline(simpleClipper[0].x-8, xxxxx, simpleClipper[0].x-2, xxxxx+10)
    myline(simpleClipper[0].x+8, xxxxx+1, simpleClipper[0].x+2, xxxxx+10)
    myline(simpleClipper[0].x-8, xxxxx+1, simpleClipper[0].x-2, xxxxx+10)
    myline(simpleClipper[0].x+8, xxxxx, simpleClipper[0].x+2, xxxxx-2)
    myline(simpleClipper[0].x-8, xxxxx, simpleClipper[0].x-2, xxxxx-2)
    myline(simpleClipper[0].x+8, xxxxx+1, simpleClipper[0].x+2, xxxxx-2)
    myline(simpleClipper[0].x-8, xxxxx+1, simpleClipper[0].x-2, xxxxx-2)
    myline(simpleClipper[0].x+5, xxxxx, simpleClipper[0].x+2, xxxxx+6)
    myline(simpleClipper[0].x-5, xxxxx, simpleClipper[0].x-2, xxxxx+6)
    myline(simpleClipper[0].x+5, xxxxx+1, simpleClipper[0].x+2, xxxxx+6)
    myline(simpleClipper[0].x-5, xxxxx+1, simpleClipper[0].x-2, xxxxx+6)
    myline(simpleClipper[0].x+5, xxxxx, simpleClipper[0].x+2, xxxxx-2)
    myline(simpleClipper[0].x-5, xxxxx, simpleClipper[0].x-2, xxxxx-2)
    myline(simpleClipper[0].x+5, xxxxx+1, simpleClipper[0].x+2, xxxxx-2)
    myline(simpleClipper[0].x-5, xxxxx+1, simpleClipper[0].x-2, xxxxx-2)
    myline(simpleClipper[0].x, xxxxx-17, simpleClipper[0].x-12, xxxxx-7+5)
    myline(simpleClipper[0].x, xxxxx-17, simpleClipper[0].x+12, xxxxx-7+5)
    myline(simpleClipper[0].x, xxxxx-17+1, simpleClipper[0].x-9, xxxxx-7+6+1)
    myline(simpleClipper[0].x, xxxxx-17+1, simpleClipper[0].x+9, xxxxx-7+6+1)
    pop();
    fbo.end();
    
    if(renderMode == 'detail' || showvel){
        velFbo.begin();
        clear();
        ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);
        push();
        scale(resscale);
        noStroke();
        background(0);
        drawSim(true);
        pop();
        velFbo.end();
    }
    else{
        velFbo.begin();
        clear();
        ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);
        push();
        scale(resscale);
        noStroke();
        background(0);
        pop();
        velFbo.end();
    }



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

function initWeb(){
    engine = Engine.create()
    //engine.gravity.y = .1;
    engine.gravity.x = 0;
    engine.gravity.y = .015;


    var rx = random(-33, 33)*0.1;
    var ry = random(-33, 33)*0.1;
    //initClipper(rx, ry);
    initClipperFromPlants();
    
    var rp = createVector(rx, ry);
    var nn = round(random(15, 24));
    var r = resx / 4;
    var nlines = [];
    
    for (var k = 0; k < nn; k++) {
      var ang = map(k, 0, nn, 0, 2 * PI) + (PI / nn)/2 * random(-1, 1);
      var x = rx + r * cos(ang);
      var y = ry + r * sin(ang);
      var line = new Line(rx, ry, x, y, "web_long");
      nlines.push(line);
    }
  
    var laps = 77;
    var total = nlines.length * laps;
    var dp0 = (1 / total) * 0.98;
    var dp = dp0;
    var flag1 = true;
    var flag2 = true;
    var pp = 1.;
    var k = 0;
    while(pp > .01) {
      var line1 = nlines[k % nlines.length];
      var pt = line1.getP(pp);
      pp -= dp;
      if(pt.dist(rp) < 120 && pt.dist(rp) > 88){
        //pp -= dp*nlines.length*7;
        dp *= 1.03;
      }
      if(pt.dist(rp) < 22 && flag2){
        flag2 = false;
        //pp -= dp*nlines.length*7;
        dp *= .12;
      }
      bodies.push(pt);
      k++;
    }
    total = bodies.length;
    
    for(var k = 0; k < bodies.length; k++){
      var dy = map(k, 0, bodies.length, 0, 1);
      dy = map(pow(dy, .8), 0, 1, 0, 130);
      //bodies[k].y += dy;
    }
  
    for (var k = 0; k < total-1; k++) {
      var pt1 = bodies[k];
      var pt2 = bodies[k+1];
      lines.push(new Line(pt1.x, pt1.y, pt2.x, pt2.y, "web", 1, k, k + 1));
  
      if (k < total - nlines.length){
        var pt3 = bodies[k];
        var pt4 = bodies[k + nlines.length];
        lines.push(
          new Line(pt3.x, pt3.y, pt4.x, pt4.y, "web", 1, k, k + nlines.length)
        );
      }
      if (k < nlines.length && random() < 1.3){
        var toout = p5.Vector.sub(pt1, rp);
        toout.normalize();
        toout.mult(400);
        var pt4 = p5.Vector.add(pt1, toout);
        bodies.push(pt4.copy());
        lines.push(
          new Line(pt1.x, pt1.y, pt4.x, pt4.y, "web", 1, k, bodies.length-1)
        );
      }
    }
    
    warpWeb(bodies, rectClipper, simpleClipper);
    clipWeb();


    var bandc = [];
    var vec0 = createVector(0, 0);
    for(var k = 0; k < bodies.length; k++){
        var p = new Particle(bodies[k].x, bodies[k].y, 1);
        p.body.mass = 0.001;
        particles.push(p);
        bandc.push(p.body);
    }
    for(var k = 0; k < lines.length; k++){
        if(lines[k].label.includes('wall'))
            continue;
        var bo1 = null;
        var bo2 = null;;
        var po1 = vec0.copy();
        var po2 = vec0.copy();
        if(lines[k].b1 !== null) bo1 = particles[lines[k].b1].body;
        if(lines[k].b2 !== null) bo2 = particles[lines[k].b2].body;
        if(lines[k].b1 === null) po1 = lines[k].a;
        if(lines[k].b2 === null) po2 = lines[k].b;
        var dd = lines[k].a.dist(lines[k].b)
        if(lines[k].b1 === null || lines[k].b2 === null){
            dd *= .6;
        }
        var stf = 0.001;
        if(lines[k].label.includes('long')){
            dd *= .05;
            //stf = .8;
        }
        if(fxrand() < .04 && k < 100){
            //dd *= .3;
            //stf = .3;
        }
        var constr = getConstr(bo1, bo2, po1, po2, lines[k].length*dd, stf, lines[k].label);
        if(fxrand() > .05 && !lines[k].label.includes('long')) bandc.push(constr);
    }

    var coco1 = simpleClipper[0];
    var coco2 = simpleClipper[1];
    var dd = coco1.dist(coco2);
    var constr1 = getConstr(null, null, coco1, coco2, dd, stf, 'straight');
    
    var coco3 = simpleClipper[2];
    var coco4 = simpleClipper[3];
    var dd = coco3.dist(coco4);
    var constr2 = getConstr(null, null, coco3, coco4, dd, stf, 'aaa');

    bandc.push(constr1);
    bandc.push(constr2);

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


var debug = [];

function initClipperFromPlants(){
    
    var ch = round(random(1));
    var pts1;
    var pts2;
    if(fxrand() < -.33){
        pts1 = plants[0].getTwo(ch);
        pts2 = plants[1].getTwo(1-ch);
    }
    else{
        if(fxrand() < 1.5){
            pts1 = plants[1].getTwo(ch);
            pts2 = plants[2].getTwo(1-ch);
        }
        else{
            pts1 = plants[2].getTwo(ch);
            pts2 = plants[3].getTwo(1-ch);
        }
    }

    simpleClipper.push(pts1[pts1.length-1]);
    simpleClipper.push(pts2[pts2.length-1]);
    simpleClipper.push(pts2[0]);
    simpleClipper.push(pts1[0]);

    pts2 = reverse(pts2);
    
    clipper = clipper.concat(pts1);
    clipper = clipper.concat(pts2);
    
    rectClipper.push(createVector(-400, -400));
    rectClipper.push(createVector(+400, -400));
    rectClipper.push(createVector(+400, +400));
    rectClipper.push(createVector(-400, +400));
}

function initClipper(rx, ry){
    rx2 = rx +random(-33, 33);
    ry2 = ry +random(-33, 33);
    var rnr = round(random(3, 5));
    rnr = 4;
    var ang = PI/4 + radians(random(-20, 20));
    var dang = radians(random(10, 20));
    var shf = random(2*PI);
    for (var k = 0; k < rnr; k++) {
        var kk = k;
        //var ang = map(kk, 0, rnr, 0, 2 * PI) + PI + PI/4 + PI/4*random(-1,1);
        var rr = random(resx/3, resx/2);
        var x = rx2 + rr * cos(ang+shf);
        var y = ry2 + rr * sin(ang+shf);
        ang += dang + radians(random(-20, 20));
        dang = PI/2;
        clipper.push(createVector(x, y));
    }
    
    rectClipper.push(createVector(rx-400, ry-400));
    rectClipper.push(createVector(rx+400, ry-400));
    rectClipper.push(createVector(rx+400, ry+400));
    rectClipper.push(createVector(rx-400, ry+400));
}

function warpWeb(pts, poly1, poly2){
  var x1 = poly1[0].x;
  var x2 = poly1[1].x;
  var y1 = poly1[0].y;
  var y2 = poly1[3].y;
  var raa = random(.1, .12);
  raa = random(.1, .12);
  for(var k = 0; k < pts.length; k++){
    var pt = pts[k];
    var px = map(pt.x, x1, x2, 0, 1);
    var py = map(pt.y, y1, y2, 0, 1);
    
    var tx1 = map(px, 0, 1, poly2[0].x, poly2[1].x);
    var ty1 = map(px, 0, 1, poly2[0].y, poly2[1].y);
    var tx2 = map(px, 0, 1, poly2[3].x, poly2[2].x);
    var ty2 = map(px, 0, 1, poly2[3].y, poly2[2].y);
    var npx = lerp(tx1, tx2, py);
    var npy = lerp(ty1, ty2, py);
    
    npx = raa*pt.x + (1-raa)*npx;
    npy = raa*pt.y + (1-raa)*npy;
    
    pts[k].set(npx, npy);
  }
  
  for(var k = 0; k < lines.length; k++){
      var p1 = bodies[lines[k].b1];
      var p2 = bodies[lines[k].b2];
      lines[k].set(p1.x, p1.y, p2.x, p2.y);
  }
}

function clipWeb(){
  var clines = [];
  
  for(var k = 0; k < lines.length; k++){
    var line = lines[k];
    
    if(isinside(line.a, clipper) && !isinside(line.b, clipper) || !isinside(line.a, clipper) && isinside(line.b, clipper)){
      
      for(var q = 0; q < clipper.length; q++){
        var cl1 = clipper[q];
        var cl2 = clipper[(q+1)%clipper.length];
        var intersection = findLineIntersection(line.a, line.b, cl1, cl2);
        if(!isinside(line.a, clipper) && !isinside(line.b, clipper))
          continue;
        if(intersection){
          debug.push(intersection);
          var nline;
          if(isinside(line.a, clipper)){
            //nbody = intersection.copy();
            //bodies.push(nbody);
            nline = new Line(line.a.x, line.a.y, intersection.x, intersection.y, line.label, 1, line.b1, null);
          }
          else{
            //nbody = intersection.copy();
            //bodies.push(nbody);
            nline = new Line(line.b.x, line.b.y, intersection.x, intersection.y, line.label, 1, line.b2, null);
          }
          clines.push(nline);
          break;
        }
      }
    }
    else if(isinside(line.a, clipper) && isinside(line.b, clipper)){
      clines.push(line);
   }
  }
  lines = clines;
}

class Line{
    constructor(x1, y1, x2, y2, label, length, b1, b2){
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.b1 = b1;
        this.b2 = b2;
        this.length = length;
        this.a = createVector(x1, y1);
        this.b = createVector(x2, y2);
        this.label = label;
    }

  getLength() {
    return this.a.dist(this.b);
  }
  
  set(x1, y1, x2, y2){
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
  }

  getP(pin) {
    var p = pin;
    if(pin < .3){
      //p = pin*.8;
    }
    //p = constrain(p + .3*(-.5+power(noise(this.x1*444.3, this.y1*144.3), 3)), 0, 1);
    return createVector(
      lerp(this.a.x, this.b.x, p),
      lerp(this.a.y, this.b.y, p)
    );
  }

  draw() {
    stroke(0.1);
    if (this.label === "web") stroke(1, 0, 0);
    stroke(0.1);
    //var p1 = bodies[this.b1];
    //var p2 = bodies[this.b2];
    //line(p1.x, p1.y, p2.x, p2.y);
    line(this.x1, this.y1, this.x2, this.y2);
  }
}


function initWebOld(){
    engine = Engine.create()
    //engine.gravity.y = .1;
    engine.gravity.x = 0;
    engine.gravity.y = .5;
    var bandc = [];

    var pad = 250;
    //lines.push(new Line(-(resx/2-pad), -(resy/2-pad), +(resx/2-pad), -(resy/2-pad), 'wall', 1.0));
    //lines.push(new Line(+(resx/2-pad), -(resy/2-pad), +(resx/2-pad), +(resy/2-pad), 'wall', 1.0));
    //lines.push(new Line(+(resx/2-pad), +(resy/2-pad), -(resx/2-pad), +(resy/2-pad), 'wall', 1.0));
    //lines.push(new Line(-(resx/2-pad), +(resy/2-pad), -(resx/2-pad), -(resy/2-pad), 'wall', 1.0));

    var rn = round(random(5, 7));
    var rx = 0;
    var ry = 0;
    for(var k = 0; k < rn; k++){
        var ang1 = map(k, 0, rn, 0, 2*PI) + PI/rn*map(power(noise(k*1.231, 21.314), 5), 0, 1, -1, 1);
        var ang2 = map((k+1)%rn, 0, rn, 0, 2*PI) + PI/rn*map(power(noise(((k+1)%rn)*1.231, 21.314), 5), 0, 1, -1, 1);
        var r1 = map(power(noise(k*1.231, 335.552), 5), 0, 1, 500, 600);
        var r2 = map(power(noise(((k+1)%rn)*1.231, 335.552), 5), 0, 1, 500, 600);
        var x1 = rx + r1*cos(ang1);
        var y1 = ry + r1*sin(ang1);
        var x2 = rx + r2*cos(ang2);
        var y2 = ry + r2*sin(ang2);
        lines.push(new Line(x1, y1, x2, y2, 'wall', 1.0));
    }
    
    // radial
    var rx = 0*random(-200, 200);
    var ry = random(-200, -100);
    var nn = round(random(16, 26));
    var nn = round(random(33, 35));
    var r = resx;
    var body0 = createVector(rx, ry);
    bodies.push(body0);
    for(var k = 0; k < nn; k++){
      var ang = map(k, 0, nn, 0, 2*PI) + PI/nn*random(-1,1);
      var x = rx + r*cos(ang);
      var y = ry + r*sin(ang);
      var line = new Line(rx, ry, x, y, 'web');
      var minintersection = createVector(x, y);
      var mindist = 1000000;
      var thesplit;
      for(var q = 0; q < lines.length; q++){
        var tline = lines[q];
        if(tline.label.includes('web'))
          continue;
        if(doLinesIntersect(line.a, line.b, tline.a, tline.b)){
          var intersection = findLineIntersection(line.a, line.b, tline.a, tline.b);
          if (!intersection){
            intersection = findLineIntersection(line.a, line.b, tline.b, tline.a);
            if (!intersection){}
            else{
              if(intersection.dist(line.a) < mindist){
                mindist = intersection.dist(line.a);
                minintersection = intersection;
                thesplit = tline;
              }
            }
          }
          else{
            if(intersection.dist(line.a) < mindist){
              mindist = intersection.dist(line.a);
              minintersection = intersection;
              thesplit = tline;
            }
          }
        }
      }
      
      var nline = new Line(rx, ry, minintersection.x, minintersection.y, 'web_long', random(.5, .6)*0+.5, 0, null);

      if(nline.getLength() > 2){
        var nlines = [];
        for(var q = 0; q < lines.length; q++){
            if(lines[q] == thesplit)
              continue;
            nlines.push(lines[q]);
          }
          
          //bodies.push(minintersection);
          nlines.push(nline);
          nlines.push(new Line(thesplit.a.x, thesplit.a.y, minintersection.x, minintersection.y, thesplit.label+'_long', 1));
          nlines.push(new Line(thesplit.b.x, thesplit.b.y, minintersection.x, minintersection.y, thesplit.label+'_long', 1));
          lines = nlines;
      }
      
    }
    
    var vr = createVector(rx, ry);
    var qq = round(random(570, 574));
    for(var k = 0; k < qq; k++){
      var aa = random(2*PI);
      aa = k*.11*random(.7,1.3);
      var rr = map(pow(random(1), .5), 0, 1, 0, 200);
      rr = map(k, 0, qq, 0, 180);
      var x0 = rx + rr*cos(aa);
      var y0 = ry + rr*sin(aa);
      //while(x0 < -resx/2+pad || x0 > resx/2-pad || y0 < -resy/2+pad || y0 > resy/2-pad){
      //  rr = map(pow(random(1), .5), 0, 1, 0, 200);
      //  x0 = rx + rr*cos(aa);
      //  y0 = ry + rr*sin(aa);
      //}
      var v0 = createVector(x0, y0)
      var ang = p5.Vector.sub(v0, vr).heading() + PI/2;
      var r = resx;
      var x1 = x0 + r*cos(ang);
      var y1 = y0 + r*sin(ang);
      var x2 = x0 + r*cos(ang+PI);
      var y2 = y0 + r*sin(ang+PI);
      var lineright = new Line(x0, y0, x1, y1, 'web', 1.0);
      var lineleft = new Line(x0, y0, x2, y2, 'web', 1.0);
      var right = createVector(x1, y1);
      var left = createVector(x2, y2);
      var mdright = 1000000;
      var mdleft = 1000000;
      var rightsplit;
      var leftsplit;
      var right0;
      var left0;
      var rightsplit0;
      var leftsplit0;
      var mdright0 = 1000000;
      var mdleft0 = 1000000;
      for(var q = 0; q < lines.length; q++){
        var tline = lines[q];
        var coco = 0;
        if(doLinesIntersect(lineright.a, lineright.b, tline.a, tline.b) || doLinesIntersect(lineright.b, lineright.a, tline.a, tline.b)){
          var intersectionright = findLineIntersection(lineright.a, lineright.b, tline.b, tline.a);
          if (intersectionright){
            if(intersectionright.dist(lineright.a) < mdright){
              mdright = intersectionright.dist(lineright.a);
              right = intersectionright;
              rightsplit = tline;
            }
          }
          else{
            intersectionright = findLineIntersection(lineright.a, lineright.b, tline.a, tline.b);
            if(!intersectionright)
              continue;
            if(intersectionright.dist(lineright.a) < mdright){
              mdright = intersectionright.dist(lineright.a);
              right = intersectionright;
              rightsplit = tline;
            }
          }
          coco++;
        }
        if(doLinesIntersect(lineleft.a, lineleft.b, tline.a, tline.b) || doLinesIntersect(lineleft.a, lineleft.b, tline.b, tline.a)){
          var intersectionleft = findLineIntersection(lineleft.a, lineleft.b, tline.b, tline.a);
          if (intersectionleft){
            if(intersectionleft.dist(lineleft.a) < mdleft){
              mdleft = intersectionleft.dist(lineleft.a);
              left = intersectionleft;
              leftsplit = tline;
            }
          }
          else{
            intersectionleft = findLineIntersection(lineleft.a, lineleft.b, tline.a, tline.b);
            if(!intersectionleft)
              continue;
            if(intersectionleft.dist(lineleft.a) < mdleft){
              mdleft = intersectionleft.dist(lineleft.a);
              left = intersectionleft;
              leftsplit = tline;
            }
          }
          coco++;
        }
      }
      var nlines = [];
      
      for(var q = 0; q < lines.length; q++){
        if(lines[q] == rightsplit)
          continue;
        if(lines[q] == leftsplit)
          continue;
        nlines.push(lines[q]);
      }
      
      var lr = p5.Vector.sub(right, left);
      lr.mult(1/3);
      var mid1 = p5.Vector.add(left, lr);
      var mid2 = p5.Vector.add(mid1, lr);

      if(right && left){
        //bodies.push(mid1)
        //bodies.push(mid2)
        bodies.push(left)
        bodies.push(right)
        //nlines.push(new Line(left.x, left.y, right.x, right.y, 'web', random(.2, .7)*0+1, leftsplit.label.includes('wall') ? null : bodies.length-2, rightsplit.label.includes('wall') ? null : bodies.length-1));
        //nlines.push(new Line(        left.x,         left.y,  mid1.x,  mid1.y,            'web',  random(1., 1.26), leftsplit.label.includes('wall') ? null : bodies.length-2, bodies.length-4));
        //nlines.push(new Line(        mid1.x,         mid1.y,  mid2.x,  mid2.y,            'web',  random(1., 1.26),                                           bodies.length-4, bodies.length-3));
        //nlines.push(new Line(        mid2.x,         mid2.y, right.x, right.y,            'web',  random(1., 1.26),                                           bodies.length-3, rightsplit.label.includes('wall') ? null : bodies.length-1));
        nlines.push(new Line( leftsplit.a.x,  leftsplit.a.y,  left.x,  left.y,  leftsplit.label,  leftsplit.length,                                              leftsplit.b1, bodies.length-2));
        nlines.push(new Line( leftsplit.b.x,  leftsplit.b.y,  left.x,  left.y,  leftsplit.label,  leftsplit.length,                                              leftsplit.b2, bodies.length-2));
        nlines.push(new Line(rightsplit.a.x, rightsplit.a.y, right.x, right.y, rightsplit.label, rightsplit.length,                                             rightsplit.b1, bodies.length-1));
        nlines.push(new Line(rightsplit.b.x, rightsplit.b.y, right.x, right.y, rightsplit.label, rightsplit.length,                                             rightsplit.b2, bodies.length-1));
      }
      
      lines = nlines;
    }

    var vec0 = createVector(0, 0);
    for(var k = 0; k < bodies.length; k++){
        if(k == 0)
        print(bodies[k])
        var p = new Particle(bodies[k].x, bodies[k].y, 3);
        particles.push(p);
        bandc.push(p.body);
    }
    for(var k = 0; k < lines.length; k++){
        if(lines[k].label.includes('wall'))
            continue;
        var bo1 = null;
        var bo2 = null;;
        var po1 = vec0.copy();
        var po2 = vec0.copy();
        if(lines[k].b1 !== null) bo1 = particles[lines[k].b1].body;
        if(lines[k].b2 !== null) bo2 = particles[lines[k].b2].body;
        if(lines[k].b1 === null) po1 = lines[k].a;
        if(lines[k].b2 === null) po2 = lines[k].b;
        var dd = lines[k].a.dist(lines[k].b)
        if(lines[k].b1 === null || lines[k].b2 === null){
            dd *= .2;
        }
        var stf = 0.01;
        if(lines[k].label.includes('long'))
            stf = .1;
        var constr = getConstr(bo1, bo2, po1, po2, lines[k].length*dd, stf, lines[k].label);
        bandc.push(constr);
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


var an = fxrand() * 3.14159;

function showall(){
    background(1);
    //pg.push();
    //pg.scale(0.8);
    //pg.pop();
    //pg.line(0,0,mouseX-width/2,mouseY-height/2);

    var tempFbo = showvel ? velFbo : fbo;
    for(var qq = 0; qq < 5; qq++){
        var dir = [cos(an), sin(an)]
        dir = [1, 0];
        blurH.setUniform('tex0', tempFbo.getTexture());
        blurH.setUniform('tex1', velFbo.getTexture());
        blurV.setUniform('motionMask', [1, 0]);
        blurH.setUniform('texelSize', [1.0/resx/resscale, 1.0/resy/resscale]);
        blurH.setUniform('direction', [dir[0], [1]]);
        blurH.setUniform('u_time', frameCount+globalseed*.01);
        blurH.setUniform('amp', .85*(1. - showvel));
        blurH.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
        bhFbo.begin();
        clear();
        shader(blurH);
        quad(-1,-1,1,-1,1,1,-1,1);
        bhFbo.end();
        
        blurV.setUniform('tex0', bhFbo.getTexture());
        blurV.setUniform('tex1', velFbo.getTexture());
        blurV.setUniform('motionMask', [0, 1]);
        blurV.setUniform('texelSize', [1.0/resx/resscale, 1.0/resy/resscale]);
        blurV.setUniform('direction', [-dir[1], dir[0]]);
        blurV.setUniform('u_time', frameCount+globalseed*.01);
        blurV.setUniform('amp', .85*(1. - showvel));
        blurV.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
        bvFbo.begin();
        clear();
        shader(blurV);
        quad(-1,-1,1,-1,1,1,-1,1);
        bvFbo.end();

        tempFbo = bvFbo;
    }
    bvFbo = tempFbo;
    

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
    //effectFbo.draw(0, 0, width, height);
    if(showvel)
        effectFbo.draw(0, 0, width, height);
    else
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




function myline(x1, y1, x2, y2, label){
    var d = dist(x1,y1,x2,y2);
    var det = 1.2;
    var parts = 2 + round(d/det);
    var amp = 1.5;
    var frq = 0.1;
    var v1 = createVector(x1, y1);
    var v2 = createVector(x2, y2);
    var dir = v1.sub(v2);
    dir.normalize();
    var ang = dir.heading();
    var doamp = map(power(noise(x1+y1+x2+y2), 4), 0, 1, 6, 12);
    var fac = map(power(noise(x1*13.+y1*13.+x2*13.+213.31,y2+213.31), 4), 0, 1, .73, .98);


    for(var k = 0; k < parts; k++){
        var down = map(k, 0, parts-1, 0, 1);
        down = pow(1. - 2*abs(.5 - down), .5); 
        if(label=='straight')
            down *= .0;
        if(label=='aaa')
            down *= .6;
        
        var p = map(k, 0, parts-1, 0, 1);
        var env = pow(1. - 2*abs(p-.5), .5);
        var x = lerp(x1, x2, p);
        var y = lerp(y1, y2, p);
        var nx = x + amp*(-.5 + power(noise(x*frq, y*frq, 311.13), 2));
        var ny = y + amp*(-.5 + power(noise(x*frq, y*frq, 887.62), 2));
        ny += down*d/doamp;
        //ny += env*d*.3;
        var rr = map(power(noise(k*0.1, x1+x2), 3), 0, 1, 1.5, 2)*1.12*fac;
        ellipse(nx, ny, rr, rr);

        if(noise(k,x1,y1) < .2){
            push();
            //fill(...map2(0));
            translate(nx, ny);
            fill(.1);
            rotate(ang);
            ellipse(
                map(power(noise(x1,k+x1,y1+62.5524),4), 0, 1, -.25, .25), 
                map(power(noise(x1,k+x1,y1+13.7442),4), 0, 1, -.25, .25), 
                map(power(noise(x1,k+x1,y1+55.313),4),  0, 1,  3., 4.)*.78, 
                map(power(noise(x1+31.31,k+x1,y1),4),   0, 1,  3., 4.)*.68
            );
            pop();
        }
    }
}



function map(v, v1, v2, v3, v4){
    return (v-v1)/(v2-v1)*(v4-v3)+v3;
}


function mouseClicked(){
    //createShapes();
}

var invi = false;
var showvel = false;

function keyPressed(){
    //noiseSeed(round(random(1000)));
    //createShapes();
    if(key == 'g'){
        engine.gravity.y = -engine.gravity.y;
        engine.gravity.y = .03;
    }
    if(key == 'q'){
        showvel = !showvel;
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

