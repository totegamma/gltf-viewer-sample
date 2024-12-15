import { TypedArray } from "@gltf-transform/core";

export function create_shader(gl: WebGLRenderingContext, id: string): WebGLShader {
    let shader: WebGLShader;
    const scriptElement = document.getElementById(id) as HTMLScriptElement;
    if(!scriptElement) throw new Error('Failed to get script element');

    switch(scriptElement.type){
        case 'x-shader/x-vertex': {
            const mightshader = gl.createShader(gl.VERTEX_SHADER);
            if (!mightshader) {
                throw new Error('Failed to create shader');
            }
            shader = mightshader;
            break;
        }
        case 'x-shader/x-fragment': {
            const mightshader = gl.createShader(gl.FRAGMENT_SHADER);
            if (!mightshader) {
                throw new Error('Failed to create shader');
            }
            shader = mightshader;
            break;
        }
        default :
            throw new Error(`Failed to create shader: unknown type ${scriptElement.type}`);
    }

    gl.shaderSource(shader, scriptElement.text);
    gl.compileShader(shader);
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        return shader;
    }else{
        throw new Error(`Failed to compile shader: ${gl.getShaderInfoLog(shader)}`);
    }
}

export function create_program(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    if(!program) throw new Error('Failed to create program');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        gl.useProgram(program);
        return program;
    }else{
        throw new Error(`Failed to create program: ${gl.getProgramInfoLog(program)}`);
    }
}

export function create_vbo(gl: WebGLRenderingContext, data: number[] | TypedArray): WebGLBuffer {
    const vbo = gl.createBuffer();
    if(!vbo) throw new Error('Failed to create buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}

export function create_ibo(gl: WebGLRenderingContext, data: number[] | TypedArray): WebGLBuffer {
    const ibo = gl.createBuffer();
    if(!ibo) throw new Error('Failed to create buffer');
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
}

export function set_attribute(gl: WebGLRenderingContext, vbos: WebGLBuffer[], attL: number[], attS: number[]){
    for(const i in vbos){
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[i]);
        gl.enableVertexAttribArray(attL[i]);
        gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
    }
}

