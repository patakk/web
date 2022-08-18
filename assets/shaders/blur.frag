precision mediump float;




// texcoords from the vertex shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;
uniform sampler2D tex1;

// the size of a texel or 1.0 / width , 1.0 / height
uniform vec2 texelSize;
uniform float amp;
uniform float seed;

uniform float u_time;
// which way to blur, vec2(1.0, 0.0) is horizontal, vec2(0.0, 1.0) is vertical
uniform vec2 direction;


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

// gaussian blur filter modified from Filip S. at intel 
// https://software.intel.com/en-us/blogs/2014/07/15/an-investigation-of-fast-real-time-gpu-based-image-blur-algorithms
// this function takes three parameters, the texture we want to blur, the uvs, and the texelSize
vec3 gaussianBlur( sampler2D t, vec2 texUV, vec2 stepSize ){   
	// a variable for our output                                                                                                                                                                 
	vec3 colOut = vec3( 0.0 );                                                                                                                                   

	// stepCount is 9 because we have 9 items in our array , const means that 9 will never change and is required loops in glsl                                                                                                                                     
	const int stepCount = 9;

	// these weights were pulled from the link above
	float gWeights[stepCount];
	    gWeights[0] = 0.10855;
	    gWeights[1] = 0.13135;
	    gWeights[2] = 0.10406;
	    gWeights[3] = 0.07216;
	    gWeights[4] = 0.04380;
	    gWeights[5] = 0.02328;
	    gWeights[6] = 0.01083;
	    gWeights[7] = 0.00441;
	    gWeights[8] = 0.00157;

	// these offsets were also pulled from the link above
	float gOffsets[stepCount];
	    gOffsets[0] = 0.66293;
	    gOffsets[1] = 2.47904;
	    gOffsets[2] = 4.46232;
	    gOffsets[3] = 6.44568;
	    gOffsets[4] = 8.42917;
	    gOffsets[5] = 10.41281;
	    gOffsets[6] = 12.39664;
	    gOffsets[7] = 14.38070;
	    gOffsets[8] = 16.36501;
	
	// lets loop nine times
	for( int i = 0; i < stepCount; i++ ){  

        vec2 ss = stepSize;
        //ss.x += 0.*texelSize.x*13.*fff(vec2(1.,1.)*.03*float(i), seed+25.2214);
        //ss.y += 0.*texelSize.x*13.*fff(vec2(1.,1.)*.03*float(i), seed+15.7214);
		// multiply the texel size by the by the offset value                                                                                                                                                               
	    vec2 texCoordOffset = gOffsets[i] * ss;

		// sample to the left and to the right of the texture and add them together                                                                                                           
	    vec3 col = texture2D( t, texUV + texCoordOffset ).xyz + texture2D( t, texUV - texCoordOffset ).xyz; 

		// multiply col by the gaussian weight value from the array
		col *= gWeights[i];

		// add it all up
	    colOut +=  col;                                                                                                                               
	}

	// our final value is returned as col out
	return colOut;                                                                                                                                                   
} 


void main() {

  	vec2 uv = gl_FragCoord.xy*texelSize;
    vec2 st = uv*vec2(2.2, 5.)*.2;
    uv = uv/2.;
    //uv.y = 1. - uv.y;

    st.x = st.x + seed;
    st.y = st.y + seed;

	vec3 color = vec3(0.0);

    float ff = fff(st, seed);
    ff = ff + .2;
	ff = smoothstep(.26+.4, .38+.4, ff);

    float ffx = fff(uv*vec2(3.,3.)*13.2, 0.*seed+u_time+55.2214);
    float ffy = fff(uv*vec2(3.,3.)*13.2, 0.*seed+u_time+123.651);

    ffx = .0 + .99*smoothstep(.2, .8, ffx);
    ffy = .0 + .99*smoothstep(.2, .8, ffy);


    float dd = pow(length(uv-vec2(.5))/1.5, 2.)*3.;
    //float dd = .031 + pow(abs(uv.x-.5)/1.5, 2.)*8.;

    vec2 dir = direction;

    if(dir.x > .5){
        //ff2.xy = vec2(ff2.y, -ff2.x);
    }

	// use our blur function
	vec3 blur;

    
    //vec4 bgpg = texture2D(tex1, uv);
	//vec3 blur1 = gaussianBlur(tex0, uv, texelSize * vec2(ffx, ffy) *amp*.2 + 0.*texelSize * vec2(ffx, ffy) * amp*3. * (3.*pow(uv.y, 6.)));
	//vec3 blur2 = gaussianBlur(tex0, uv, texelSize * vec2(ffx, ffy) *amp*.2  + 0.*texelSize * vec2(ffx, ffy) * amp*3. * (3.*pow(uv.y, 6.)));

	vec3 blur1 = gaussianBlur(tex0, uv, texelSize * .5*amp*18.);
	vec3 blur2 = gaussianBlur(tex0, uv, texelSize * .5*amp*2.);

    //blur = 1. - (1.-blur1) * (1.-blur2);
    blur = blur1*0. + blur2*(1.-0.); 
	//blur = gaussianBlur(tex0, uv, texelSize * amp*15.*dir * dd);
	//blur = gaussianBlur(tex0, uv, texelSize *  amp *.65);

  	//gl_FragColor = vec4(ffx,ffx,ffx, 1.0);
  	gl_FragColor = vec4(blur.rgb, 1.0);

}