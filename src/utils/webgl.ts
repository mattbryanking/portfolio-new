const VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTextTex;
uniform sampler2D uVideoTex;
uniform vec2 uResolution;
uniform vec2 uCellSize;
uniform float uStagger;
uniform vec3 uVoid;
uniform float uVideoAspect;
uniform float uInvertVoid;

const float AMBIENT = .2;

const vec3 BLUE = vec3(0.35, 0.55, 1.0);
const vec3 LUMA = vec3(0.299, 0.587, 0.114);

void main() {
  // screen-space pixel (y from top)
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uResolution;

  // grid cell for this pixel
  float row = floor(px.y / uCellSize.y);
  float rowStagger = mod(row, 2.0) * uStagger;
  float col = floor((px.x - rowStagger) / uCellSize.x);

  // cell rect in screen space
  float cellX = col * uCellSize.x + rowStagger;
  float cellY = row * uCellSize.y;

  // sample video brightness at cell center
  vec2 center = vec2(cellX + uCellSize.x * 0.5, cellY + uCellSize.y * 0.5);
  float screenAspect = uResolution.x / uResolution.y;
  float vidU = center.x / uResolution.x;
  float vidV = center.y / uResolution.y;
  float scale = screenAspect / uVideoAspect;
  
  if (scale > 1.0) {
    vidV = (vidV - 0.5) / scale + 0.5;
  } else {
    vidU = (vidU - 0.5) * scale + 0.5;
  }
  
  vec2 vidUV = vec2(vidU, 1.0 - vidV);
  float brightness = dot(texture2D(uVideoTex, vidUV).rgb, LUMA);

  // void check
  vec2 nearest = clamp(uVoid.xy, vec2(cellX, cellY), vec2(cellX + uCellSize.x, cellY + uCellSize.y));
  float d = distance(nearest, uVoid.xy);
  float mask = step(uVoid.z, d);

  // inverted mode: letters inside void at full brightness, outside at ambient
  if (uInvertVoid > 0.0) {
    float inside = 1.0 - mask;
    brightness = mix(brightness, max(brightness, 0.25), inside);
    mask = mix(AMBIENT, 1.5, inside) * uInvertVoid;
  }

  float textAlpha = texture2D(uTextTex, vUv).a;
  float vis = brightness * mask * textAlpha;
  gl_FragColor = vec4(BLUE * vis, 1.0);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s)!)
  }
  return s
}

function createTex(gl: WebGLRenderingContext, filter: number) {
  const t = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  return t
}

export function initWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false })!

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG)
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program)!)
  }
  gl.useProgram(program)

  // fullscreen triangle
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const textTex = createTex(gl, gl.NEAREST)
  const videoTex = createTex(gl, gl.LINEAR)

  const uniforms = {
    uTextTex: gl.getUniformLocation(program, 'uTextTex')!,
    uVideoTex: gl.getUniformLocation(program, 'uVideoTex')!,
    uResolution: gl.getUniformLocation(program, 'uResolution')!,
    uCellSize: gl.getUniformLocation(program, 'uCellSize')!,
    uStagger: gl.getUniformLocation(program, 'uStagger')!,
    uVoid: gl.getUniformLocation(program, 'uVoid')!,
    uVideoAspect: gl.getUniformLocation(program, 'uVideoAspect')!,
    uInvertVoid: gl.getUniformLocation(program, 'uInvertVoid')!,
  }

  gl.uniform1i(uniforms.uTextTex, 0)
  gl.uniform1i(uniforms.uVideoTex, 1)

  return { gl, textTex, videoTex, uniforms }
}