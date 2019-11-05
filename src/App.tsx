import React from "react";

// TODO: Move these into their own files

const fragmentShaderSource = `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

uniform float uTime;

void main() {
  gl_FragColor = vec4(abs(sin(uTime)), 0, 0.5, 1);
}
`;

const vertexShaderSource = `
// an attribute will receive data from a buffer
attribute vec4 a_position;

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`;

class App extends React.Component<{}, {}> {
  canvas: HTMLCanvasElement | null = null;
  gl: WebGLRenderingContext | null = null;
  program: WebGLProgram | null = null;
  positionBuffer: WebGLBuffer | null = null;
  initialTime: number;

  constructor(props: {}) {
    super(props);

    this.initialTime = new Date().getTime();
  }

  createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error("no shader");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (success) {
      return shader;
    }

    console.log(gl.getShaderInfoLog(shader));

    gl.deleteShader(shader);
  };

  createProgram = (
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) => {
    const program = gl.createProgram();

    if (!program) {
      throw new Error("no program");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (success) {
      return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  };

  initializeGl = () => {
    const gl = this.gl!;

    // create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = this.createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource
    )!;

    const fragmentShader = this.createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    )!;

    // Link the two shaders into a program
    this.program = this.createProgram(gl, vertexShader, fragmentShader)!;

    // Create a buffer and put three 2d clip space points in it
    this.positionBuffer = gl.createBuffer()!;

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

    const positions = [0, 0, 0, 1, 1, 0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // code above this line is initialization code.

    // code below this line is rendering code.
    // TODO: Move this stuff to render()
  };

  mainLoop = () => {
    requestAnimationFrame(this.mainLoop);

    const gl = this.gl!;

    if (!this.program) {
      throw new Error("No program");
    }

    const positionAttributeLocation = gl.getAttribLocation(
      this.program,
      "a_position"
    );

    // look up where the vertex data needs to go.
    const timeUniform = gl.getUniformLocation(this.program, "uTime");

    gl.uniform1f(timeUniform, (new Date().getTime() - this.initialTime) / 1000);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(this.program);

    const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const size = 2; // 2 components per iteration
    const type = gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer

    gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    const start = 0;
    const count = 3;

    gl.drawArrays(gl.TRIANGLES, start, count);
  };

  setRef = (canvas: HTMLCanvasElement) => {
    let firstRun = this.gl === null;

    this.gl = canvas.getContext("webgl");

    this.canvas = canvas;

    this.initializeGl();

    if (firstRun) {
      this.mainLoop();
    }

    // Get the strings for our GLSL shaders
  };

  render() {
    return (
      <div
        style={{
          padding: "20px"
        }}
        className="App"
      >
        <canvas
          ref={this.setRef}
          width="500"
          height="500"
          style={{
            border: "1px solid lightgray"
          }}
        ></canvas>
        <img src="./leaves.jpg"></img>
      </div>
    );
  }
}

export default App;
