import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec4 } from "../../libs/MV.js";
import {modelView, loadMatrix, multMatrix, multRotationY, multRotationX, multScale, multTranslation, pushMatrix, popMatrix} from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as CUBE from '../../libs/cube.js';
import * as TORUS from '../../libs/torus.js';
import { scale } from "./libs/MV.js";

/** @type WebGLRenderingContext */
let gl;
let program;
let programTiles;

let time = 0;           // Global simulation time in days
let speed = 1/60;         // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running

let zoom = 1.0;
const DISTANCE = 5.0;

let lookat1 = lookAt([0,0,DISTANCE], [0,0,0], [0,1,0]);
let lookat2 = lookAt([0,DISTANCE,0.0001], [0,0,0], [0,1,0]);
let lookat3 = lookAt([-DISTANCE,0,0], [0,0,0], [0,1,0]);
let lookat4 = lookAt([0,DISTANCE,DISTANCE], [0,0,0], [0,1,0]);

let lookatnumber = 4;
let lookat = lookat4;

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    programTiles = buildProgramFromSources(gl, shaders["shaderTiles.vert"], shaders["shaderTiles.frag"]);
    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-DISTANCE*aspect/zoom,DISTANCE*aspect/zoom, -DISTANCE/zoom, DISTANCE/zoom,-3*DISTANCE/zoom,3*DISTANCE/zoom);

    mode = gl.LINES; 

    lookatupload();
    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    function updateProjection(){
        mProjection = ortho(-DISTANCE*aspect/zoom,DISTANCE*aspect/zoom, -DISTANCE/zoom, DISTANCE/zoom,-3*DISTANCE/zoom,3*DISTANCE/zoom);
    }

    function lookatupload(){
        if(lookatnumber==1){
            lookat=lookat1;
        }else if(lookatnumber==2){
            lookat=lookat2;
        }else if(lookatnumber==3){
            lookat=lookat3;
        }else{
            lookat= lookat4;
        }

       // uploadModelView();
    }


    document.onkeydown = function(event) {
        switch(event.key) {
            case 'w':
                 
                break;
            case 'W':
                mode = gl.LINES;
                break;
            case 's':
                
                break;
            case 'S':
                mode = gl.TRIANGLES;
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
                lookatnumber=1;
                break;
            case '2':
                lookat = lookat2;
                lookatnumber=2;
                break;
            case '3':
                lookat = lookat3;
                lookatnumber=3;
                break;
            case '4':
                lookat = lookat4;
                lookatnumber=4;
                break;
            case '+':
                if(zoom<1.4){
                    zoom = zoom + 0.10;
                }
                console.log(zoom);
                updateProjection();
                break;
            case '-':
               if(zoom>0.11){
                zoom = zoom - 0.10;
               }
               console.log(zoom);
                updateProjection();
               
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
        mProjection = ortho(-DISTANCE*aspect/zoom,DISTANCE*aspect/zoom, -DISTANCE/zoom, DISTANCE/zoom,-3*DISTANCE/zoom,3*DISTANCE/zoom);
    }

    function uploadModelView(p)
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(p, "mModelView"), false, flatten(modelView()));
    }

    function eixoRodas(p){

        //multScale([])

        uploadModelView(p);

        CYLINDER.draw(gl, program, mode);
    }

    function tiles(p){
        
       // multScale([1/2, 1/10, 1/2]);

        uploadModelView(p);

        CUBE.draw(gl, p, mode);

    }

    function drawTiles(){

        multScale([1, 1/6, 1]);

        gl.useProgram(programTiles);

        for(let i = -10; i <= 10; i++){
            for(let j = -10; j <= 10; j++){

                pushMatrix();
                    multTranslation([i*1, 0, j*1]);
                   
                if((i+j)%2==0){
                    gl.uniform4fv(gl.getUniformLocation(programTiles, "color"), flatten(vec4(1.0,1.0,1.0,1.0)));
                }
                else{
                    gl.uniform4fv(gl.getUniformLocation(programTiles, "color"), flatten(vec4(0.0,1.0,1.0,1.0)));
                }


                tiles(programTiles);
                popMatrix();
            }
        }
    }

   
    function render(timestamp)
    {

        if(animation) time += speed;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        
        gl.useProgram(programTiles);
        gl.uniformMatrix4fv(gl.getUniformLocation(programTiles, "mProjection"), false, flatten(mProjection));

       // gl.useProgram(program);
        //gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

        //lookatupload();
    
        loadMatrix(lookat);

        pushMatrix();
        drawTiles(programTiles);
        popMatrix();

        /*gl.useProgram(program);
        
        pushMatrix();
        eixoRodas(program);
        popMatrix();
        
*/


    }
}

const urls = ["shaderTiles.vert", "shaderTiles.frag", "shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))