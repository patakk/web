precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec3 tintColor;
uniform vec3 tintColor2;
uniform vec3 incolor;
uniform float u_time;
uniform float u_usemask;
uniform float noiseamp;
uniform float seed;
uniform float hasmargin;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
varying vec2 vTexCoord;

float randomNoise(vec2 p) {
  return fract(16791.414*sin(7.*p.x+p.y*73.41));
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float noise3 (in vec2 _st, in float t) {
    vec2 i = floor(_st+t);
    vec2 f = fract(_st+t);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float fbm3 ( in vec2 _st, in float t) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise3(_st, t);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}


float fff(vec2 st, float seed){

    vec2 q = vec2(0.);
    q.x = fbm3( st + 0.1, seed*.11);
    q.y = fbm3( st + vec2(1.0), seed*.11);
    vec2 r = vec2(0.);
    r.x = fbm3( st + 1.0*q + vec2(1.7,9.2)+ 0.15*seed*0.11, seed*.11);
    r.y = fbm3( st + 1.0*q + vec2(8.3,2.8)+ 0.126*seed*0.11, seed*.11);
    float f = fbm3(st+r, seed*.11);
    float ff = (f*f*f+0.120*f*f+.5*f);

    return ff;
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    vec2 st = uv*vec2(3.2, 13.)*195.64;
    uv = uv/2.;
    //uv.y = 1. - uv.y;

    vec2 uv0 = uv;


    vec2 uvm = uv;
    vec2 uvm1 = uv*vec2(1., 1555.);
    vec2 uvm2;
    uvm2.x = uvm1.x*cos(0.) - uvm1.y*sin(0.);
    uvm2.y = uvm1.x*sin(0.) + uvm1.y*cos(0.);

    //uvm.x += .023*(-1. + 2.*smoothstep(.1, .9, .15 + fff(uvm2, 1.+seed)));
    //uvm.y += .023*(-1. + 2.*smoothstep(.1, .9, .15 + fff(uvm2, 2.+seed)));
    float fafa = smoothstep(.1, .9, .15 + fff(uvm1, 1.+seed));
    float fafa2 = smoothstep(.1, .9, .15 + fff(uvm1, 2.+seed));
    uvm.x += .047 * fafa;
    uvm.y += .007 * fafa2;
    
    vec2 q = vec2(0.);
    q.x = fbm3( st + 0.1, u_time*0.*.08);
    q.y = fbm3( st + vec2(1.0), u_time*0.*.08);
    vec2 r = vec2(0.);
    r.x = fbm3( st + 1.0*q + vec2(1.7,9.2)+ 0.15*u_time*0., u_time*0.*.08);
    r.y = fbm3( st + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time*0., u_time*0.*.08);
    float f = fbm3(st*2.35+r, u_time*.48);
    float ff = (f*f*f+0.120*f*f+.5*f);
    ff = smoothstep(.22, .7, ff);
    ff = -.5 + ff;
    ff *= .004;
    vec2 uvr = uv - vec2(1., 0.)/u_resolution*.7*0.;
    vec2 uvg = uv;
    vec2 uvb = uv + vec2(1., 0.)/u_resolution*.7*0.;
    //vec2 uvrd = uv - 0.*(1.-uv.y)*1.61*ff*vec2(1., 0.) + 0.*333.5*ff*vec2(1., 0.)/u_resolution*2.;
    //vec2 uvgd = uv - 0.*1.61*ff*vec2(1., 0.) + 0.*ff*vec2(1., 0.)/u_resolution*2.;
    //vec2 uvbd = uv - 0.*uv.y*1.61*ff*vec2(1., 0.) - 0.*333.5*ff*vec2(1., 0.)/u_resolution*2.;
    vec2 uvrd = uv - .27*ff*vec2(1.5, 1.) + 0.*333.5*ff*vec2(1., 0.)/u_resolution*2.;
    vec2 uvgd = uv - .27*ff*vec2(1.5, 1.) + 0.*ff*vec2(1., 0.)/u_resolution*2.;
    vec2 uvbd = uv - .27*ff*vec2(1.5, 1.) - 0.*333.5*ff*vec2(1., 0.)/u_resolution*2.;

    vec4 mask = texture2D(tex2, uvgd) * u_usemask + vec4(1.) * (1.-u_usemask);
    //vec4 maskb = mask;
    //maskb *= 0.;
    ////if(maskb.r > .98 && maskb.g > .98){
        //maskb.rgb = vec3(1.);
    //}

    //uv = uv + vec2(54.)/u_resolution*vec2(-.5 + randomNoise(mask.rg), -.5 + randomNoise(mask.rg+.314));

    //vec4 bgpg = texture2D(tex3, uv);
    //if(u_usemask > .1)
    //    uv = uv + .05*(mask.rg * 2. - 1.);



    //st += st * abs(sin(u_time*0.002)*3.0);
    

    //float cr = texture2D(tex0, uvr+vec2(3.,0.)/u_resolution).r;
    //float cg = texture2D(tex0, uvg+vec2(3.,0.)/u_resolution).g;
    //float cb = texture2D(tex0, uvb+vec2(3.,0.)/u_resolution).b;
    //vec4 original = vec4(cr, cg, cb, 1.0);
    vec4 original = texture2D(tex0, uv);
    vec4 blurred_original = texture2D(tex1, uv);
    

    //float crd = texture2D(tex0, uvrd).r;
    //float cgd = texture2D(tex0, uvgd).g;
    //float cbd = texture2D(tex0, uvbd).b;
    vec3 crgb = texture2D(tex0, uvrd).rgb;
    vec4 scattered_original = vec4(crgb, 1.0);
    //scattered_original.gb *= 0.;
    //scattered_original.r = 1. - scattered_original.r;

    //vec4 outc = original*p + (1.-p)*scattered_original;
    //vec4 outc = (1. - (1. - scattered_original)*original);
    vec4 outc;
    outc = (blurred_original*.25+(1.-.25)*scattered_original);  // split between blurred and scatterd
    outc = (outc*.7+(1.-.7)*original);  // split between original image and the previous line's result
    
    if(u_usemask > .01) outc *= mask;
    //outc = (outc*.99+(1.-.99)*original);
    outc = min(outc, 1.);

    float mr = -0.018;
    if(uv.x > mr && uv.x < (1.-mr) && uv.y > mr && uv.y < (1.-mr) ){
        //outc = 1. - outc;
        //outc.r *= .51;
        //outc.g *= .98;
    }
    else{
        //outc = outc*0. + .1;
    }


    float marg1 = 10./u_resolution.x;
    float margx = 20./u_resolution.x + .00051*(-.5 + fff(uv*182.1 + 281.3131,seed+25.61 ));
    float margy = 20./u_resolution.y + .00051*(-.5 + fff(uv*182.1 + 281.3131,seed+25.61 ));
    if(uv0.x < margx || uv0.x > 1.-margx || uv0.y < margy || uv0.y > 1.-margy){
        //outc = vec4(.7);
        //outc = vec4(.05);
        //outc = vec4(incolor.rgb, 1.);
        //blurred_original = vec4(.1);
    }
    float margin = 1.0;
    float dd = 2. / u_resolution.x;
    margin *= .08 + (1.-.08)*smoothstep(margx-dd, margx+dd, uv0.x);
    margin *= .08 + (1.-.08)*smoothstep(margy-dd, margy+dd, uv0.y);
    margin *= .08 + (1.-.08)*smoothstep((1.-margx)+dd, (1.-margx)-dd, uv0.x);
    margin *= .08 + (1.-.08)*smoothstep((1.-margy)+dd, (1.-margy)-dd, uv0.y);
    outc *= margin;
    //margin *= .05 + .95*smoothstep(uv0.x, 1.-margx, 1.-margx);
    //margin *= .05 + .95*smoothstep(uv0.y, 1.-margy, 1.-margy);
    if(hasmargin > 0.01){
        //outc.rgb = (1.-pow(1.-uv.y,1.))*outc.rgb * (outc.r * (1.-pow(1.-uv.y,1.)*.5)) * tintColor2 + (1.-uv.y)*outc.rgb * (outc.r * (1.-pow(1.-uv.y,3.)*.8)) * tintColor;
    }

    vec4 aaaa = texture2D(tex0, uv + vec2(3.,0.)/u_resolution);
    float bv = 1. -smoothstep(.1, .7, aaaa.r);
    vec3 bvr = bv * vec3(0., 0., 0.) + (1.-bv)*tintColor;
    //outc.rgb += bvr*.4;

    float salt = randomNoise(uv+seed/1000000.+.3143+u_time*.0000+fbm(uv)*.02);
    salt = 0.7*.9*(smoothstep(.95, .999, salt)) * (0.2126*blurred_original.r+0.7152*blurred_original.g+0.0722*blurred_original.b);
    outc.rgb = 1. - (1.-outc.rgb) * (1. - salt);
    
    float ssalt = randomNoise(uv+seed/1000000.+4.3+.3143+u_time*.0000+fbm(uv)*.02);
    ssalt = 0.5*.35*(smoothstep(.5, .999, ssalt));
    outc.rgb = 1. - (1.-outc.rgb) * (1. - ssalt);
    
    float pepper = randomNoise(uv+seed/1000000.+1.3+.3143+u_time*.0000+fbm(uv)*.02);
    pepper = 0.4*.035*(smoothstep(.5, .999, pepper));
    outc.rgb -= pepper;

    if(hasmargin > 0.4){
        //outc = outc*noiseamp + (1.-noiseamp)*blurred_original;
    }
    else{
        //outc = outc*noiseamp + (1.-noiseamp)*blurred_original;
    }   
     //outc.b *= 0.495;
    //outc = (.5 + .5*blurred_original)*scattered_original*scattered_original*scattered_original*scattered_original + .17*smoothstep(.12, .13, fff(uv*2612., seed+55.631));
    outc.a = 1.0;


    //outc = outc*.99 + blurred_original*(1.-.99);
    //salt = randomNoise(uv+seed/1000000.+.3143+u_time*.0000+fbm(uv)*.02);
    //salt = .00*(-.15 + smoothstep(.86, .999, salt));
    //outc.rgb += salt;
    
    //pepper = randomNoise(uv+seed/1000000.+1.3+.3143+u_time*.0000+fbm(uv)*.02);
    //pepper = .00*(smoothstep(.8, .999, pepper));
    //outc.rgb -= pepper;

    gl_FragColor = vec4(outc.rgb, 1.);
    //gl_FragColor = vec4(vec3(salt*5.),1.);
    //gl_FragColor = vec4(1.,0.,0.,1.);
}