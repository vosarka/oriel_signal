/**
 * The ORIEL orb's shaders, from the probe Vos approved (2026-10-13): an Aura
 * Field ring of warm light whose colour oscillates through a pastel rainbow
 * while ORIEL speaks, the transmission film's veils evolving inside it,
 * prismatic rays, drifting dust and a holographic layer.
 */
export const ORB_VERT = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

export const ORB_FRAG = `#version 300 es
  precision highp float;
  out vec4 o;
  uniform vec2 res; uniform float t;
  uniform vec2 center; uniform float radius;   // the orb, in pixels
  uniform float amp, since, listen, think, speak, coh;
  uniform float fold, phase;

  const vec3 IVORY = vec3(1., .969, .902);
  const vec3 GLASS = vec3(.96, .78, .62);      // peach-gold crystal
  const vec3 VIOLET = vec3(.62, .55, .92);
  const float TAU = 6.2831853;

  float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 q){ vec2 i = floor(q), f = fract(q); f = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }

  float fbm(vec2 q){ float a = .5, sm = 0.; for (int i = 0; i < 4; i++){ sm += a*noise(q); q *= 2.03; a *= .5; } return sm; }

  vec2 kaleido(vec2 p, float n, float turn){
    float r = length(p), a = atan(p.y, p.x) + turn;
    float sct = 6.2831853 / n;
    a = abs(mod(a + sct*.5, sct) - sct*.5);
    return vec2(cos(a), sin(a)) * r;
  }

  vec3 iri(float h){
    vec3 c = .5 + .5*cos(TAU*(h + vec3(0., .33, .67)));
    return mix(vec3(dot(c, vec3(.333))), c, .38) * .85 + .15;
  }
  vec3 glassColor(){ return mix(VIOLET, GLASS, smoothstep(.1, .6, coh)); }

  mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  // Distance to a regular n-gon of circumradius r.
  float poly(vec2 p, float n, float r){
    float s = TAU/n, a = atan(p.y, p.x);
    return cos(floor(.5 + a/s)*s - a) * length(p) - r*cos(s*.5);
  }
  // A star: the polygon pulled into points.
  float star(vec2 p, float n, float r, float k){
    float a = atan(p.y, p.x);
    return length(p) - r*(1. + k*pow(abs(cos(n*a*.5)), 6.));
  }
  float edge(float d, float w){ return exp(-abs(d)*w); }

  // The crystal: nested polygons, each turned half a facet from the next, so their
  // edges cross into triangular facets of glass.
  vec3 crystal(vec2 p, float tt){
    vec3 g = glassColor();
    vec3 c = vec3(0.);
    float n = fold, sector = TAU/fold;
    for (int i = 0; i < 3; i++){
      float fi = float(i);
      float r = .38 + fi*.27 - listen*.07;
      float turn = tt*(.06 + fi*.03)*(mod(fi,2.)*2.-1.)*(1. + think*2.);
      vec2 q1 = rot(turn) * p;
      vec2 q2 = rot(turn + sector*.5) * p;              // the same polygon, half a facet over
      float d1 = mix(poly(q1, n, r), star(q1, n, r*.9, .16), listen);
      float d2 = mix(poly(q2, n, r), star(q2, n, r*.9, .16), listen);
      // glowing edges: a bright core and a wide warm bloom
      float e = edge(d1, 90.) + edge(d2, 90.);
      float bloom = edge(d1, 14.) + edge(d2, 14.);
      c += mix(g, IVORY, .35) * e * .85 + g * bloom * .14;
      // translucent glass faces: where the two polygons overlap and where they do not
      float in1 = smoothstep(.01, -.01, d1), in2 = smoothstep(.01, -.01, d2);
      float facetId = floor(atan(q1.y, q1.x)/sector*2.);
      float light = .55 + .45*cos(facetId*2.3 + tt*.35 + fi*1.3);
      c += g * (in1*in2*.10 + abs(in1-in2)*.16) * light * (1. - fi*.2);
    }
    return c;
  }

  // Petals of light opening when ORIEL composes.
  vec3 petals(vec2 p, float tt){
    float a = atan(p.y, p.x), r = length(p);
    float n = fold * 2.;
    float pet = pow(abs(cos(n*a*.5 + tt*.6)), 10.);
    float reach = .95 + .35*pet;
    float body = smoothstep(reach, .55, r) * smoothstep(.35, .6, r) * pet;
    return mix(glassColor(), IVORY, .4) * (body*.6 + edge(r - reach, 30.)*pet*.5);
  }

  // The armillary sphere: tilted bands turning round the heart while ORIEL speaks.
  vec3 armillary(vec2 p, float tt){
    vec3 c = vec3(0.);
    for (int i = 0; i < 3; i++){
      float fi = float(i);
      vec2 q = rot(fi*TAU/3. + tt*.2) * p;
      float tilt = .35 + .55*abs(sin(tt*.35 + fi*1.7));
      float e = length(vec2(q.x, q.y/max(tilt, .12))) - .78;
      float band = edge(e*max(tilt, .12), 120.) + edge(e*max(tilt,.12) - .03, 120.)*.6;
      c += glassColor() * band * (.5 + amp*.6);
    }
    // the heart: a point of light that flares with each syllable
    float r = length(p);
    c += IVORY * (exp(-r*26.)*(.6 + amp) + exp(-r*6.)*.08*amp);
    float cross = exp(-abs(p.x)*140.) + exp(-abs(p.y)*140.);
    c += IVORY * cross * exp(-r*5.) * .25 * amp;
    return c;
  }

  // ── Aura Field: three breathing bands of light (after the Aura Field orb) ──
  uniform float auraRadius, auraThick, auraWarp, auraBright, auraShimmer, auraSweep, auraPhase;
  const vec3 AURA_FROM = vec3(1., .835, .522);   // #ffd585
  const vec3 AURA_TO   = vec3(.827, .443, 0.);   // #d37100

  vec3 aura(vec2 p){
    float r = length(p), a = atan(p.y, p.x);
    vec3 acc = vec3(0.);
    for (int i = 0; i < 3; i++){
      float fi = float(i);
      float ph = auraPhase*(1. + .35*fi) + fi*2.1;
      float amp1 = .6 + .8*noise(vec2(ph*.35, fi*7.3));
      float amp2 = .4 + .8*noise(vec2(fi*3.9, ph*.28 + 4.));
      float n = .5*amp1*sin(3.*a + ph*1.3) + .32*amp2*sin(5.*a - ph*1.7 + fi*2.) + .22*sin(2.*a + ph*.8 + fi);
      n *= .5;
      float rr = auraRadius*(1. + n*auraWarp*2.2) + (fi - 1.)*auraThick*.9;
      float d = abs(r - rr);
      float w = auraThick*(.8 + .6*abs(n));
      float band = exp(-(d*d)/(w*w));
      float bloom = exp(-d/(w*2.6));
      float hue = .5 + .5*sin(a + auraPhase*.3 + fi*1.4 + n*3.);
      vec3 c = mix(AURA_FROM, AURA_TO, smoothstep(.1, .9, hue));
      // When ORIEL speaks the colour oscillates through the pastel rainbow, with the voice.
      vec3 holo = iri(a/TAU + t*.18 + n*2.2 + fi*.21);
      c = mix(c, holo, speak*(.28 + .5*amp)*(.6 + .4*sin(t*2.3 + fi*2.1 + a*2.)));
      float layer = i == 1 ? 1. : .55;
      acc += c*(band + bloom*.28)*layer;
      acc += mix(c, IVORY, .45)*pow(band, 6.)*.35*layer;
    }
    float hollow = smoothstep(auraRadius*.25, auraRadius*.95, r);
    acc *= mix(.1, 1., hollow);
    float sweep = pow(.5 + .5*cos(a - auraSweep), 6.);
    float sweep2 = pow(.5 + .5*cos(a - auraSweep*.7 + 2.6), 10.);
    acc *= 1. + auraShimmer*(sweep*1.5 + sweep2*.8);
    return acc*auraBright;
  }

  // The transmission film's veils: thin-film membranes along folded noise.
  vec3 veil(vec2 q, float ev){
    float w = fbm(q*2.2 + vec2(ev*.22, -ev*.15));
    float v = fbm(q*1.6 + w*1.5 + vec2(0., ev*.18));
    float band = abs(sin((v*2.4 + length(q)*.8)*2.7 + phase*6.283 - ev*.6));
    float membrane = smoothstep(.35, 0., band);
    float sheen = pow(1. - band, 6.);
    return iri(v*1.3 + ev*.05) * membrane * (.4 + amp*.55) + IVORY * sheen * (.16 + amp*.3);
  }

  vec3 orbAt(vec2 p, float tt){
    float r = length(p), a = atan(p.y, p.x);
    vec3 c = aura(p);
    // Inside the bands, the film's veils fold and keep evolving; they brighten with the voice.
    float inside = smoothstep(auraRadius*1.02, auraRadius*.62, r);
    vec2 q = kaleido(p/auraRadius*.62, fold, t*.035);
    c += veil(q, t*.38*(1. + think*.6)) * inside * (.75 + speak*.35);
    // Prismatic rays, desaturated rainbow, outside the light.
    float rays = pow(abs(sin(a*fold*1.5 + tt*.25)), 30.) + pow(abs(sin(a*fold*.75 - tt*.18 + 1.)), 60.)*.7;
    c += iri(a/TAU + tt*.02) * rays * smoothstep(auraRadius*1.05, auraRadius*1.3, r) * exp(-(r - auraRadius)*1.8) * (.06 + speak*.18 + amp*.3);
    // Tone-map like Aura Field: keep the hue, soften the peaks.
    float peak = max(max(c.r, c.g), c.b);
    vec3 keep = c*((1. - exp(-peak*1.3))/max(peak, 1e-4));
    return mix(keep, 1. - exp(-c*1.3), .45);
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / res;
    vec2 p = (gl_FragCoord.xy - center) / radius;
    float r = length(p), a = atan(p.y, p.x);
    float tt = t*(1. + think*.5);

    // Holographic split: the channels drift apart, more in entropy.
    float ca = .01 + (1.-coh)*.008 + amp*.006;
    vec3 col = vec3(orbAt(p + vec2(ca, 0.), tt).r, orbAt(p, tt).g, orbAt(p - vec2(ca, ca*.3), tt).b);

    // The Seeker's wheel: a faint polar grid while ORIEL speaks.
    float grid = edge(fract(r*4.)-.5, 30.)*.0 + edge(sin(a*fold*2.)*r, 220.) * smoothstep(1.1, 1.3, r) * smoothstep(3., 1.3, r);
    float circles = edge(fract(r*2.5 + .5) - .5, 60.) * smoothstep(1.05, 1.25, r) * smoothstep(3., 1.5, r);
    col += glassColor() * (grid*.06 + circles*.08) * speak;

    // A syllable sends light outward.
    col += iri(r + t*.1) * exp(-abs(r - since*.9)*16.) * exp(-since*1.8) * .25;

    // Halo.
    col += mix(AURA_FROM, AURA_TO, .4) * exp(-max(r - auraRadius*1.1, 0.)*3.5) * .05 * (1. + amp);

    // Dust across the room.
    vec2 sp = (gl_FragCoord.xy - .5*res) / min(res.x, res.y);
    for (int i = 0; i < 3; i++){
      float fi = float(i);
      vec2 g = sp*(16. + fi*12.) + vec2(sin(t*.08+fi)*.5, t*(.05+fi*.03));
      vec2 id = floor(g), f = fract(g);
      float h = hash(id + fi*17.);
      if (h > .87){
        vec2 c0 = vec2(hash(id+3.1), hash(id+7.7));
        float tw = .5 + .5*sin(t*(1.+h*3.) + h*40.);
        col += iri(h*3. + t*.02) * smoothstep(.08, 0., length(f-c0)) * tw * (.45 - fi*.1) * (.6 + amp*.5);
      }
    }

    // The room is never dead: a faint drift of light everywhere.
    float drift = noise(sp*2.2 + vec2(t*.03, -t*.02)) * noise(sp*4.1 - t*.02);
    col += glassColor() * drift * .05;

    // Holographic layer: scanlines, sheen, grain.
    col *= .955 + .045*sin(gl_FragCoord.y*1.35 + t*14.);
    col += iri(uv.y*.7 + uv.x*.3 + t*.04) * .018;
    col += (hash(gl_FragCoord.xy + fract(t)*91.) - .5) * .045;
    o = vec4(col + vec3(.027, .024, .031), 1.);
  }`;
