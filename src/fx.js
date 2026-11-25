/*
 * AO trailer — single-pass GLSL post FX over the Canvas2D scene.
 * RGB split · shutter flash · invert · whiteout · halftone · radial speed lines ·
 * zoom blur · whip blur · bloom · shake/roll · scanlines · vignette · grain.
 * All uniforms are reset per frame and driven by impactPulse envelopes in cuts.js.
 */
(function () {
  'use strict';
  const AO = window.AO;

  const VERT = `#version 300 es
  in vec2 p; out vec2 v;
  void main(){ v = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

  const FRAG = `#version 300 es
  precision highp float;
  uniform sampler2D T;
  uniform vec2 R; uniform float uTime;
  uniform float uRgb, uRgbAng, uFlash, uInvert, uWhite, uHalftone, uSpeed, uZoomBlur, uWhip, uWhipAng, uBloom, uScan, uVig, uGrain, uZoom, uRoll;
  uniform vec2 uShake, uFocus; uniform vec3 uSpeedCol, uFlashCol;
  in vec2 v; out vec4 o;

  float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }

  vec2 camUV(vec2 uv){
    float a = R.x/R.y;
    uv -= .5; uv.x *= a;
    float c = cos(uRoll), s = sin(uRoll);
    uv = mat2(c,-s,s,c)*uv;
    uv /= uZoom; uv.x /= a;
    return uv + .5 + uShake;
  }
  vec3 tap(vec2 uv){
    vec2 d = vec2(cos(uRgbAng), sin(uRgbAng))*uRgb;
    return vec3(texture(T, uv+d).r, texture(T, uv).g, texture(T, uv-d).b);
  }
  void main(){
    vec2 uv = camUV(v);
    vec3 col = tap(uv);

    if (uWhip > 0.001){
      vec2 dir = vec2(cos(uWhipAng), sin(uWhipAng)) * uWhip * 0.09;
      vec3 acc = col; float w = 1.;
      for (int i=1;i<14;i++){ float k = float(i)/13.-.5; acc += tap(uv + dir*k); w += 1.; }
      col = acc/w;
    }
    if (uZoomBlur > 0.001){
      vec2 dir = (uv - uFocus) * uZoomBlur * 0.16;
      vec3 acc = col; float w = 1.;
      for (int i=1;i<12;i++){ float k = float(i)/11.; acc += tap(uv - dir*k); w += 1.; }
      col = acc/w;
    }
    if (uBloom > 0.001){
      vec3 b = vec3(0.); vec2 px = 1./R;
      for (int i=0;i<12;i++){
        float an = float(i)*0.5236; vec2 off = vec2(cos(an),sin(an))*px*(9.+ 7.*float(i%3));
        vec3 s = texture(T, uv+off).rgb; b += max(s-0.72, 0.);
      }
      col += b/12.*uBloom*2.2;
    }
    if (uHalftone > 0.001){
      float cell = 7.;
      vec2 g = gl_FragCoord.xy; float an = .785; mat2 m = mat2(cos(an),-sin(an),sin(an),cos(an));
      vec2 q = m*g/cell; vec2 f = fract(q)-.5;
      float l = dot(col, vec3(.299,.587,.114));
      float r = sqrt(1.-l)*.62;
      float dotm = 1.-smoothstep(r-.08, r+.08, length(f));
      col = mix(col, col*(1.-dotm*.55), uHalftone);
    }
    if (uSpeed > 0.001){
      vec2 d = v - uFocus; d.x *= R.x/R.y;
      float ang = atan(d.y, d.x); float rad = length(d);
      float seg = floor((ang+3.14159)/6.28318*180.);
      float n = h12(vec2(seg, floor(uTime*24.)));
      float line = step(.86, n) * smoothstep(.16, .55, rad);
      float wobble = fract(n*13.7 + uTime*3.);
      line *= step(.25, wobble);
      col = mix(col, uSpeedCol, line*uSpeed*.6*smoothstep(.2,.7,rad));
    }
    if (uScan > 0.001) col *= 1. - uScan*.18*(.5+.5*sin(gl_FragCoord.y*3.14159));
    col = mix(col, 1.-col, uInvert);
    col = mix(col, uFlashCol, clamp(uFlash,0.,1.));
    col = mix(col, vec3(1.), clamp(uWhite,0.,1.));
    vec2 vv = v-.5; col *= 1. - uVig*dot(vv,vv)*1.6;
    col += (h12(gl_FragCoord.xy + fract(uTime*7.)*100.)-.5)*uGrain;
    o = vec4(col,1.);
  }`;

  function createFX(glCanvas, srcCanvas) {
    const gl = glCanvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
    const defaults = {
      uRgb: 0, uRgbAng: 0, uFlash: 0, uInvert: 0, uWhite: 0, uHalftone: 0, uSpeed: 0, uZoomBlur: 0,
      uWhip: 0, uWhipAng: 0, uBloom: 0.12, uScan: 0, uVig: 0.18, uGrain: 0.035, uZoom: 1, uRoll: 0,
      uShake: [0, 0], uFocus: [0.5, 0.5], uSpeedCol: [1, 1, 1], uFlashCol: [1, 1, 1],
    };
    const u = JSON.parse(JSON.stringify(defaults));
    function reset() {
      for (const k in defaults) u[k] = Array.isArray(defaults[k]) ? defaults[k].slice() : defaults[k];
    }
    if (!gl) {
      // Fallback: show the 2D canvas directly (no post FX).
      srcCanvas.style.cssText = glCanvas.style.cssText;
      glCanvas.replaceWith(srcCanvas);
      return { u, reset, render() {}, ok: false };
    }
    function sh(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const L = {};
    ['T', 'R', 'uTime', ...Object.keys(defaults)].forEach((k) => (L[k] = gl.getUniformLocation(prog, k)));

    function render(t) {
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
      gl.uniform1i(L.T, 0);
      gl.uniform2f(L.R, glCanvas.width, glCanvas.height);
      gl.uniform1f(L.uTime, t);
      for (const k in defaults) {
        const val = u[k];
        if (Array.isArray(val)) (val.length === 2 ? gl.uniform2f : gl.uniform3f).call(gl, L[k], ...val);
        else gl.uniform1f(L[k], val);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return { u, reset, render, ok: true };
  }

  AO.hexToRgb = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  AO.createFX = createFX;
})();
