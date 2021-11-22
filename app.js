import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec4 } from "../../libs/MV.js";
import {modelView, loadMatrix, multMatrix, multRotationY, multRotationX, multRotationZ, multScale, multTranslation, pushMatrix, popMatrix} from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as CUBE from '../../libs/cube.js';
import * as TORUS from '../../libs/torus.js';
import { rotateY, rotateZ, scale } from "./libs/MV.js";

/** @type WebGLRenderingContext */
let gl;
let program;

let time = 0;           // Global simulation time in days
let speed = 1/60;         // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running
let rotationCannon = 0;
let rotationHead = 0;
let movement = 0;
let shoot = false;
let bullets = [];

let zoom = 1.0;
const DISTANCE = 5.0;

/*let lookat1 = lookAt([0,0,DISTANCE], [0,0,0], [0,1,0]);
let lookat2 = lookAt([0,DISTANCE,0.0001], [0,0,0], [0,1,0]);
let lookat3 = lookAt([DISTANCE,0,0], [0,0,0], [0,1,0]);
let lookat4 = lookAt([DISTANCE,DISTANCE,DISTANCE], [0,0,0], [0,1,0]);

let lookat = lookat3;*/

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    

    let mProjection = ortho(-DISTANCE*aspect/zoom,DISTANCE*aspect/zoom, -DISTANCE/zoom, DISTANCE/zoom,-3*DISTANCE/zoom,3*DISTANCE/zoom);

    mode = gl.LINES; 
    
    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case 'w':
                if(rotationCannon>-60){
                    rotationCannon -=1;
                }
                break;
            case 'W':
                mode = gl.LINES;
                break;
            case 's':
                if(rotationCannon<7){
                    rotationCannon +=1;
               }
                break;
            case 'S':
                mode = gl.TRIANGLES;
                break;
            case 'a':
                rotationHead +=2;
                break;
            case 'd':
                rotationHead -=2;
                break;
            case ' ':
                shoot = true;
                console.log(shoot);
                break;
            case 'ArrowDown':
                if(movement<8){
                    movement+=0.05;
                }
                break;
            case 'ArrowUp':
                if(movement>-8){
                    movement-=0.05;
                }
                break;
            case '1':
                loadMatrix(lookAt([-DISTANCE,0,0], [0,0,0], [0,1,0]));
                //lookat = lookat1;
                break;
            case '2':
                loadMatrix(lookAt([0,DISTANCE,0.0001], [0,0,0], [0,1,0]));
                //lookat = lookat2;
                break;
            case '3':
                loadMatrix(lookAt([0,0,DISTANCE], [0,0,0], [0,1,0]));
                //lookat = lookat3;
                break;
            case '4':
                loadMatrix(lookAt([DISTANCE,DISTANCE,DISTANCE], [0,0,0], [0,1,0]));
                //lookat = lookat4;
                break;
            case '+':
                if(zoom<30){
                    zoom = zoom * 1.1;
                }
                updateProjection();
                break;
            case '-':
               if(zoom>0.003){
                zoom = zoom * 0.9;
               }
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

    function updateProjection(){
        mProjection = ortho(-DISTANCE*aspect/zoom,DISTANCE*aspect/zoom, -DISTANCE/zoom, DISTANCE/zoom,-3*DISTANCE/zoom,3*DISTANCE/zoom);
    }

    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-DISTANCE*aspect/zoom,DISTANCE*aspect/zoom, -DISTANCE/zoom, DISTANCE/zoom,-3*DISTANCE/zoom,3*DISTANCE/zoom);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }


    //tanque todo
    function tank(){

        multTranslation([movement,0,0]);

        pushMatrix();
            lowerBody();
        popMatrix();
        pushMatrix();
            multTranslation([0, 0.27, 0]);
            upperBody();
        popMatrix();
    }

    //corpo superior do tanque
    function upperBody(){
        
        pushMatrix();
            body();
        popMatrix();
        pushMatrix();
            multTranslation([0,1.75,0]);
            headSet();
        popMatrix();

    }

     //conjunto que roda
     function headSet(){

        multRotationY(rotationHead);

        pushMatrix();
            head();
        popMatrix();
        pushMatrix();
            multTranslation([-0.5,0.5,0]);
            atenna();
        popMatrix();
        pushMatrix();
            multTranslation([-1,0,0]);
            canon();
        popMatrix();
       
    }


    //ligacao cubo com cilindro
    function canon(){

        multRotationZ(rotationCannon);

        pushMatrix();
            cube();
        popMatrix();
        pushMatrix();
            multTranslation([-1.4,0,0]);
            bulletPipe();
        popMatrix();
    }

    //pipe com o projetil
    function bulletPipe(){

        multRotationZ(90)

        pushMatrix();
            pipe();
        popMatrix();
        pushMatrix();
            multTranslation([0,1.225,0]);
            bullet();
        popMatrix();

    }

    function bullet(){

        multScale([1/5,1/5,1/5]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,0.0,0.0,1.0)));

        uploadModelView();

        SPHERE.draw(gl, program, mode);

    }

      //cilindro para disparar
      function pipe(){

        multScale([1/6,2.6,1/6]);

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    //cubo de ligacao canhao e body
    function cube(){

        multScale([0.4,0.4,0.4]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,1.0,0.0,1.0)));

        uploadModelView();

        CUBE.draw(gl, program, mode);
    }

    //cilindro pequeno
    function atenna(){

        multScale([0.7,0.3,0.7]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,1.0,0.0,1.0)));

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    //cilindro grande
    function head(){

        multScale([2,0.7,2]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(255/256,128/256,0.0,1.0)));

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }


    //dois cubos juntos
    function body(){
        
        multRotationY(90);

        pushMatrix();
            bodySmall();
        popMatrix();
        pushMatrix();
            multTranslation([0,0.8,0])
            bodyBig();
        popMatrix();
    }

    //cubo grande do corpo do tanque
    function bodyBig(){

        multScale([3,1.2,6]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(0.0,1.0,0.0,1.0)));

        uploadModelView();

        CUBE.draw(gl, program, mode);
    }

    //cubo pequeno do corpo do tanque
    function bodySmall(){

        multScale([2,1/2.5,5]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(0.0,1.0,0.0,1.0)));

        uploadModelView();

        CUBE.draw(gl, program, mode);

    }


   //5 eixos com rodas
    function lowerBody(){

        pushMatrix();
            axisWheels();
        popMatrix();
        pushMatrix();
            multTranslation([1,0,0]);
            axisWheels();
        popMatrix();
        pushMatrix();
            multTranslation([2,0,0]);
            axisWheels();
        popMatrix();
        pushMatrix();
            multTranslation([-1,0,0]);
            axisWheels();
        popMatrix();
        pushMatrix();
            multTranslation([-2,0,0]);
            axisWheels();
        popMatrix();


    }

    //eixo com duas rodas
    function axisWheels(){

        multRotationZ((movement/(2*3.14*0.45))*360);
        multScale([0.6, 0.6, 0.6]);


        pushMatrix();
            multTranslation([0,0,2.2]);
            wheel();
        popMatrix();
        pushMatrix();
            axis();
        popMatrix();
        pushMatrix();
            multTranslation([0,0,-2.2]);
            wheel();
        popMatrix();  


    }

    function axis(){

        multRotationX(90);
        multScale([1/4,4,1/4]);

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    //roda toda
    function wheel(){

        multRotationX(90);

        pushMatrix();
            torus();
            sphere();
        popMatrix();
        
    }

    function torus(){

        multScale([1, 1.5, 1]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(0.5,0.5,0.5,1.0)));

        uploadModelView();

        TORUS.draw(gl, program, mode);
    }

    function sphere(){

        multScale([0.4,0.4,0.4]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,1.0,1.0,1.0)));

        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }



    function tiles(){

        uploadModelView();

        CUBE.draw(gl, program, mode);

    }



    function drawTiles(){

        multScale([1, 1/6, 1]);

        for(let i = -10; i <= 10; i++){
            for(let j = -10; j <= 10; j++){

                pushMatrix();
                    multTranslation([i*1, 0, j*1]);
                   
                    if((i+j)%2==0){
                        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,1.0,1.0,1.0)));
                    }
                    else{
                        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(0.0,1.0,1.0,1.0)));
                    }

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
    
        //loadMatrix(lookat);

        pushMatrix();
            drawTiles();
        popMatrix();
        pushMatrix();
            multTranslation([0,0.51,0])
            tank();
        popMatrix();

        


    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))