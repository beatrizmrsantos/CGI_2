import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten } from "../../libs/MV.js";
import {modelView, loadMatrix, multMatrix, multRotationY, multRotationX, multScale, multTranslation, pushMatrix, popMatrix} from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as CUBE from '../../libs/cube.js';
import * as TORUS from '../../libs/torus.js';
import { scale } from "./libs/MV.js";

/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60;         // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running

let distance = 5.0;
let proj = 5.0;

let lookat1;
let lookat2;
let lookat3;
let lookat4;
let lookat = lookAt([0,distance,distance], [0,0,0], [0,1,0]);

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

   // let programColorFloor= buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader1.frag"]);

   // let program = programFloor;

    let mProjection = ortho(-proj*aspect,proj*aspect, -proj, proj,-3*proj,3*proj);

    mode = gl.LINES; 

    lookatupload();
    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    function lookatupload(){
        lookat1 = lookAt([0,0,distance], [0,0,0], [0,1,0]);
        lookat2 = lookAt([0,distance,0.0001], [0,0,0], [0,1,0]);
        lookat3 = lookAt([-distance,0,0], [0,0,0], [0,1,0]);
        lookat4 = lookAt([0,distance,distance], [0,0,0], [0,1,0]);
    }


    document.onkeydown = function(event) {
        switch(event.key) {
            case 'w':
                 
                break;
            case 'W':
               
                break;
            case 's':
                
                break;
            case 'S':
                
                break;
            case 'a':
                
                break;
            case 'd':
                
                break;
            case 'SPACE':
                
                break;
            case 'UP ARROW':
                
                break;
            case 'DOWN ARROW':
               
                break;
            case '1':
                lookat = lookat1;
                break;
            case '2':
                lookat = lookat2;
                break;
            case '3':
                lookat = lookat3;
                break;
            case '4':
                lookat = lookat4;
                break;
            case '+':
                distance = distance + 2;
                lookatupload();
                break;
            case '-':
                distance = distance - 2;
                lookatupload();
                break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    SPHERE.init(gl);
    CYLINDER.init(gl);
    CUBE.init(gl);
    TORUS.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-proj*aspect,proj*aspect, -proj, proj,-3*proj,3*proj);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function eixoRodas(){

        //multScale([])

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    function tiles(){
        
       // multScale([1/2, 1/10, 1/2]);

        uploadModelView();

        CUBE.draw(gl, program, mode);

    }

    function drawTiles(){

        multScale([1, 1/6, 1]);

        for(let i = -10; i <= 10; i++){
            for(let j = -10; j <= 10; j++){
                pushMatrix();
                    multTranslation([i*1, 0, j*1]);
                   
/*
                if((i+j)%2==0){
                    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader1.frag"]);; 
                }
                else{
                    program =buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
                }
*/
                tiles();
                popMatrix();
            }
        }
    }

   
    function render(timestamp)
    {

        if(animation) time += speed;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

        lookatupload();

        //lookat = lookat4;
    
        loadMatrix(lookat);

        pushMatrix();
        drawTiles();
        popMatrix();
        pushMatrix();
        eixoRodas();
        popMatrix();
        



    }
}

const urls = ["shader.vert", "shader.frag", "shader1.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))