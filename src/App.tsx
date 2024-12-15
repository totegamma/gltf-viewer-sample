import { useRef } from 'react'
import './App.css'

import { WebIO } from '@gltf-transform/core';
import { create_ibo, create_program, create_shader, create_vbo, set_attribute } from './utils';

import { mat4 } from 'gl-matrix';

function App() {

    const canvas = useRef<HTMLCanvasElement>(null);

    const draw = async () => {
        const c = canvas.current;
        if (!c) return;

        const io = new WebIO();
        const document = await io.read('lowpolyfoxwithcolor.glb');

        for (const node of document.getRoot().listNodes()) {
            console.log("node name: ", node.getName());
            const mesh = node.getMesh();
            if (!mesh) continue
            for (const prim of mesh.listPrimitives()) {
                for (const semantic of prim.listSemantics()) {
                    const accessor = prim.getAttribute(semantic);
                    console.log(`${semantic}: ${accessor?.getCount()} ${accessor?.getType()}`);
                }
            }
        }

        const position = document.getRoot().listNodes()[0].getMesh()?.listPrimitives()[0].getAttribute('POSITION')?.getArray();
        if (!position) return;

        const color_int = document.getRoot().listNodes()[0].getMesh()?.listPrimitives()[0].getAttribute('COLOR_0')?.getArray();
        if (!color_int) return;

        const color = new Array(color_int.length);
        for (let i = 0; i < color_int.length; i++) {
            color[i] = color_int[i] / 65535.0;
        }

        const index = document.getRoot().listNodes()[0].getMesh()?.listPrimitives()[0].getIndices()?.getArray();
        if (!index) return;

        // canvasエレメントを取得
        c.width = 500;
        c.height = 300;

        // webglコンテキストを取得
        var gl = c.getContext('webgl2')
        if (!gl) {
            console.log('Failed to get WebGL context');
            return;
        }

        // 頂点シェーダとフラグメントシェーダの生成
        var v_shader = create_shader(gl, 'vs');
        var f_shader = create_shader(gl, 'fs');

        // プログラムオブジェクトの生成とリンク
        var prg = create_program(gl, v_shader, f_shader);

        // attributeLocationを配列に取得
        var attLocation = new Array();
        attLocation[0] = gl.getAttribLocation(prg, 'position');
        attLocation[1] = gl.getAttribLocation(prg, 'color');

        // attributeの要素数を配列に格納
        var attStride = new Array();
        attStride[0] = 3;
        attStride[1] = 4;

        // VBOの生成
        var pos_vbo = create_vbo(gl, position);
        var col_vbo = create_vbo(gl, color);

        // VBO を登録する
        set_attribute(gl, [pos_vbo, col_vbo], attLocation, attStride);

        // IBOの生成
        var ibo = create_ibo(gl, index);

        // IBOをバインドして登録する
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        // uniformLocationの取得
        var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');

        // 各種行列の生成と初期化
        const mMatrix = mat4.create();
        const vMatrix = mat4.create();
        const pMatrix = mat4.create();
        const tmpMatrix = mat4.create();
        const mvpMatrix = mat4.create();
        mat4.identity(mMatrix);
        mat4.lookAt(vMatrix, [0.0, 0.0, 10.0], [0, 0, 0], [0, -1, 0]);
        mat4.perspective(pMatrix, 75, c.width / c.height, 0.1, 100);
        mat4.multiply(tmpMatrix, pMatrix, vMatrix);

        let count = 0;

        // カリングと深度テストを有効にする
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);

        // レンダリング関数
        (function render() {
            requestAnimationFrame(render);
            if (!gl || !index) return

            gl.clearColor(0.0, 182/255, 1.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var rad = (count % 360) * Math.PI / 180;

            mat4.identity(mMatrix);
            mat4.rotate(mMatrix, mMatrix, rad, [0, 1, 1]);
            mat4.multiply(mvpMatrix, tmpMatrix, mMatrix);
            gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
            gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

            gl.flush();
            count++;
        })();
    }

    return (
        <>
            <h1>GLTF Viewer</h1>
            <div className="card">
                <canvas
                    ref={canvas}
                >
                </canvas>
            </div>
            <button onClick={draw}>Draw</button>
        </>
    )
}

export default App
