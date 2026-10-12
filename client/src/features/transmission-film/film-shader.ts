/**
 * The transmission film's shaders: translucent veils in a pastel rainbow,
 * multicoloured dust, a holographic sheen, and the static of a signal being
 * caught. The geometry flows at one steady pace and never jumps; ORIEL's voice
 * moves only the light: how bright the folds burn, the sheen, the dust, and a
 * ring of light leaving the centre on each syllable (amp, tone, since).
 * Approved by Vos, 2026-10-12, from the taste probe.
 */
export const FILM_VERT = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

export const FILM_FRAG = `#version 300 es
  precision highp float;
  out vec4 o;
  uniform vec2 res; uniform float t; uniform float act;
  uniform float fold; uniform float k; uniform float phase;
  uniform float lock; uniform float burst;
  uniform float amp;    // the voice's loudness, smoothed: 0 silent .. 1 full
  uniform float tone;   // brightness of the voice: 0 dark .. 1 bright
  uniform float speech; // time that has passed while speaking: geometry evolves only with the voice
  uniform float since;  // seconds since the last syllable

  const vec3 GOLD = vec3(0.847, 0.710, 0.427);
  const vec3 IVORY = vec3(1.0, 0.969, 0.902);

  float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 q){
    vec2 i = floor(q), f = fract(q); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 q){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * noise(q); q *= 2.03; a *= .5; } return s; }

  // Rainbow, desaturated toward pastel, leaning gold.
  vec3 iri(float h){
    vec3 c = .5 + .5 * cos(6.2831853 * (h + vec3(0., .33, .67)));
    c = mix(vec3(dot(c, vec3(.333))), c, .42);
    return mix(c * .85 + .15, GOLD, .22);
  }

  // Mirror-folded polar coordinates; the sectors turn while ORIEL speaks.
  vec2 kaleido(vec2 p, float n, float turn){
    float r = length(p), a = atan(p.y, p.x) + turn;
    float s = 6.2831853 / n;
    a = abs(mod(a + s * .5, s) - s * .5);
    return vec2(cos(a), sin(a)) * r;
  }

  // A translucent veil: thin-film bands along folded noise, lit at the folds.
  vec3 veil(vec2 q, float ev, float shift){
    float w = fbm(q * 2.2 + vec2(ev * .22, -ev * .15));
    float v = fbm(q * 1.6 + w * 1.5 + vec2(0., ev * .18));
    float bands = 2.4 + mod(k, 5.) * .3;
    float band = abs(sin((v * 2.4 + length(q) * .8) * bands + shift - ev * .6));
    float membrane = smoothstep(.35, 0., band);
    float sheen = pow(1. - band, 6.);
    vec3 film = iri(v * 1.3 + ev * .05 + shift * .1 + tone * .25);
    return film * membrane * (.4 + amp * .55) + IVORY * sheen * (.18 + amp * .3);
  }

  // A ring of light leaving the centre on every syllable.
  float ripple(float r){
    float front = since * .55;
    float ring = exp(-abs(r - front) * 38.) * exp(-since * 1.6);
    return ring;
  }

  // Drifting multicoloured dust, three layers deep; it quickens with the voice.
  vec3 dust(vec2 p, float t, float ev){
    vec3 c = vec3(0.);
    for (int i = 0; i < 3; i++){
      float fi = float(i);
      float sc = 14. + fi * 11.;
      vec2 g = p * sc + vec2(sin(t * .1 + fi) * .6, t * (.2 + fi * .07));
      vec2 id = floor(g), f = fract(g);
      float h = hash(id + fi * 17.);
      if (h > .84){
        vec2 c0 = vec2(hash(id + 3.1), hash(id + 7.7));
        float d = length(f - c0);
        float tw = .55 + .45 * sin(t * (1.5 + h * 4.) + h * 40.);
        c += iri(h * 3. + t * .05) * smoothstep(.09, 0., d) * tw * (.9 - fi * .22) * (.6 + amp * .8);
      }
    }
    return c;
  }

  vec3 scene(vec2 p, float t){
    float r = length(p);
    float ev = t * .38;   // the geometry flows at one steady pace; the voice only lights it
    float breath = 1.;
    float wM = 1. - smoothstep(.6, 1.05, act);
    float wT = smoothstep(.6, 1.05, act) * (1. - smoothstep(1.6, 2.05, act));
    float wG = smoothstep(1.6, 2.05, act);
    vec3 col = vec3(.0196);
    float rip = ripple(r);

    // I · Mirror: folds that breathe and turn with the voice.
    vec2 pm = p / breath;
    vec2 qm = kaleido(pm, fold, t * .035);
    col += veil(qm, ev, phase * 6.283) * smoothstep(.98, .08, r) * wM;
    col += iri(r * 2. - ev * .1) * rip * .5 * wM;

    // II · Threshold: the tear widens with the voice.
    float open = .05 + .1 * (.5 + .5 * sin(ev * .6));
    float side = sign(p.x);
    vec2 qt = p / breath; qt.y += side * open * .5; qt.x -= side * open * .45;
    vec3 torn = veil(kaleido(qt, fold - 2., -t * .03), ev, phase * 6.283 + 1.);
    float seam = exp(-abs(p.x) / max(open * .3, .004)) * smoothstep(.85, 0., abs(p.y));
    col += (torn * smoothstep(0., open * .5, abs(p.x)) * smoothstep(.98, .08, length(qt))
          + (IVORY * (.5 + amp * .6) + iri(p.y * .8 + ev * .2) * .5) * seam
          + iri(p.y * 2. + ev * .1) * rip * .35) * wT;

    // III · Gift: one ring that breathes when ORIEL breathes.
    float r0 = .25 + .012 * sin(ev * .5);
    float d = abs(r - r0 - .014 * sin(atan(p.y, p.x) * fold + ev * 1.2));
    col += (IVORY * exp(-d * 60.) * (.6 + amp * .5) + iri(atan(p.y, p.x) / 6.283 + ev * .08) * exp(-d * 10.) * (.25 + amp * .3)
          + veil(p * 1.4 / breath, ev, 2.) * smoothstep(r0, 0., r) * .35
          + iri(r * 3. + ev * .1) * rip * .45) * wG;

    col += dust(p, t, 0.) * .55;
    return col;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / res;
    vec2 p = (gl_FragCoord.xy - .5 * res) / res.y;
    float noiseAmt = 1. - lock;

    // Glitch: strong only while the signal is being caught; a whisper afterwards.
    float rows = 72.;
    float row = floor(uv.y * rows);
    float step12 = floor(t * 12.);
    float tear = step(1. - noiseAmt * .45 - burst * .1 - .002, hash(vec2(row, step12)));
    float block = step(.95, hash(vec2(floor(uv.y * 9.), step12 * .5))) * (noiseAmt * .8 + burst * .35);
    p.x += (tear + block) * (hash(vec2(row, step12 + 1.)) - .5) * .14;

    // Holographic split: red and blue drift apart, a little more on loud syllables.
    float ca = .0015 + noiseAmt * .016 + burst * .005 + tear * .005;
    vec3 col;
    col.r = scene(p + vec2(ca, 0.), t).r;
    col.g = scene(p, t).g;
    col.b = scene(p - vec2(ca, ca * .3), t).b;

    // Holographic sheen and scanlines.
    col += iri(uv.y * .7 + p.x * .5 + t * .05) * .03;
    col *= .94 + .06 * sin(gl_FragCoord.y * 1.4 + t * 18.);

    // Static: the transmission being caught.
    float snow = hash(gl_FragCoord.xy * .5 + vec2(floor(t * 30.) * 17., floor(t * 30.) * 31.));
    float roll = smoothstep(.0, .08, abs(fract(uv.y + t * .25) - .5) - .38);
    float staticAmt = clamp(noiseAmt * .85 + burst * .12, 0., .9);
    col = mix(col, vec3(snow) * vec3(.95, .92, .88) * .55, staticAmt * (.75 + .25 * roll));
    col += (1. - roll) * .04 * staticAmt;

    col *= smoothstep(1.3, .25, length(p));
    col += (hash(gl_FragCoord.xy + fract(t) * 91.) - .5) * .035;
    o = vec4(col, 1.);
  }`;
