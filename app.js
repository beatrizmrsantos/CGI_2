import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec4, mult, subtract, add, normalMatrix, normalize, inverse, mat4, transpose, scale } from "../../libs/MV.js";
import {modelView, loadMatrix, multMatrix, multRotationY, multRotationX, multRotationZ, multScale, multTranslation, pushMatrix, popMatrix} from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as CUBE from '../../libs/cube.js';
import * as TORUS from '../../libs/torus.js';
import { scalem, translate } from "./libs/MV.js";

/** @type WebGLRenderingContext */
let gl;
let program;
      
let mode;                 // Drawing mode (gl.LINES or gl.TRIANGLES)
let rotationCannon = 0;   //rotacao do canhao do tanque no ecra
let rotationHead = 0;    //rotacao da cabeca do tanque no ecra
let movement = 0;       //tranlacao no ecra
let zoom = 1.0;
let x;                 //ponto do centro do cilindro do canhao

let shoot = false;
let bullets = [];

//vetor acelaracao
const a = (9.8)/800; 
let t = translate(0,-a,0); 
let acelaration = subtract(t,mat4());
let scaleVelocity = scalem(0.2,0.2,0.2);

const DISTANCE = 5.0;

let lookat1 = lookAt([-DISTANCE,0,0], [0,0,0], [0,1,0]);
let lookat2 = lookAt([0,DISTANCE,0.0001], [0,0,0], [0,1,0]);
let lookat3 = lookAt([0,0,DISTANCE], [0,0,0], [0,1,0]);
let lookat4 = lookAt([DISTANCE,DISTANCE,DISTANCE], [0,0,0], [0,1,0]);
let mView = lookat3;

//constantes de parametro dos objetos
const TORUS_RADIUS = 0.7;
const SPERE_RADIUS = 0.5;
const CUBE_SIZE = 1;

//constantes que se pode mudar
const WHEEL_SIZE = 1;
const TANK_UPPERBODY_SIZE = 1;
const HEAD_SIZE = 1;
const SIZE_ANTENNA=1;
const SIZE_CANNON= 1;

//size originais
const WHEEL_THICK = 1.5;
const WHEEL_HEIGHT = 1;
const SPHERE_SIZE = 0.4;

//constantes tiles
const TILE_HEIGHT = 1/6;
const TILE_LENGHT = CUBE_SIZE;
const TILE_WIDTH = CUBE_SIZE;

//distancia entre rodas do mesmo eixo
const DISTANCE_WHEELS = 2;

//constantes do eixo
const AXIS_WIDTH = WHEEL_SIZE*DISTANCE_WHEELS*2;
const AXIS_HEIGHT = 0.25;
const AXIS_WHEEL_SIZE = 0.6;

//constantes das rodas e eixo
const WHEEL_TRANSLATION = WHEEL_SIZE*DISTANCE_WHEELS + SPERE_RADIUS*SPHERE_SIZE;
const WHEEL_AXIS_TRANSLATION_1 = WHEEL_SIZE*(TORUS_RADIUS*2)*AXIS_WHEEL_SIZE + 0.1;
const WHEEL_AXIS_TRANSLATION_2 = WHEEL_SIZE*(TORUS_RADIUS*4)*AXIS_WHEEL_SIZE + 0.2;
const TRANSLATION_TOP_TILES = WHEEL_SIZE*AXIS_WHEEL_SIZE*TORUS_RADIUS + (TILE_HEIGHT)/2;

//constantes tamanho cubo pequeno
const TANK_LOWERBODY_LENGTH = DISTANCE_WHEELS*WHEEL_SIZE;
const TANK_LOWERBODY_WIDTH = WHEEL_AXIS_TRANSLATION_2*2;
const TANK_LOWERBODY_HEIGHT = WHEEL_SIZE*AXIS_WHEEL_SIZE*TORUS_RADIUS;


//constantes tamanho cubo maior
const TANK_UPPERBODY_WIDTH = 6*TANK_UPPERBODY_SIZE;
const TANK_UPPERBODY_HEIGHT = 1.2*TANK_UPPERBODY_SIZE;
const TANK_UPPERBODY_LENGHT = 3*TANK_UPPERBODY_SIZE;

const TRANSLATION_TANK = WHEEL_SIZE*AXIS_WHEEL_SIZE*TORUS_RADIUS/2;
const TRANSLATION_BODY_BIG = TANK_UPPERBODY_HEIGHT/2 + TANK_LOWERBODY_HEIGHT/2;

// constantes head
const HEAD_CYLINDER_HEIGHT=0.7*HEAD_SIZE;
const HEAD_CYLINDER_RADIUS=2*HEAD_SIZE;
const TRANSLATION_HEAD=TANK_UPPERBODY_HEIGHT + TANK_LOWERBODY_HEIGHT/2 +HEAD_CYLINDER_HEIGHT/2;

//constantes da antena
const ANTENNA_HEIGHT = 0.3*SIZE_ANTENNA;
const ANTENNA_RADIUS = 0.7*SIZE_ANTENNA;
const TRANSLATION_ANTENNA = HEAD_CYLINDER_HEIGHT/2 + ANTENNA_HEIGHT/2 ;

//constantes do pipe e cubo (canhao)
const CANNON_SQUARE = 0.4* SIZE_CANNON;
const CANNON_PIPE_RADIUS = 1/6* SIZE_CANNON;
const CANNON_HEIGHT = 2.6 *SIZE_CANNON;
const TRANSLATION_SQUARE = HEAD_CYLINDER_RADIUS/2;
const TRANSLATION_CANNON = CANNON_HEIGHT/2;


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
                mView = lookat1;
                break;
            case '2':
                mView = lookat2;
                break;
            case '3':
                mView = lookat3;
                break;
            case '4':
                mView = lookat4;
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
    function tank(timestamp){

        multTranslation([movement,0,0]);

        pushMatrix();
            lowerBody();
        popMatrix();
            multTranslation([0, TRANSLATION_TANK, 0]);
            upperBody(timestamp);
    }

    //corpo superior do tanque
    function upperBody(timestamp){
        
        pushMatrix();
            body();
        popMatrix();
            multTranslation([0,TRANSLATION_HEAD,0]);
            headSet(timestamp);

    }

     //conjunto que roda
     function headSet(timestamp){

        multRotationY(rotationHead);

        pushMatrix();
            head();
        popMatrix();
        pushMatrix();
            multTranslation([-TRANSLATION_ANTENNA,TRANSLATION_ANTENNA,0]);
            atenna();
        popMatrix();
            multTranslation([-TRANSLATION_SQUARE,0,0]);
            canon(timestamp);
       
    }


    //ligacao cubo com cilindro
    function canon(timestamp){

        multRotationZ(rotationCannon);

        pushMatrix();
            cube();
        popMatrix();
        pushMatrix();
            multTranslation([-TRANSLATION_CANNON,0,0]);
            x = mult(inverse(mView), modelView());
            pipe();
        popMatrix();

        if(shoot){
            addBullet(timestamp);

            shoot = false;
        }
       
    }


    function addBullet(timestamp){

        multTranslation([-CANNON_HEIGHT,0,0]);

        let pos = mult(inverse(mView), modelView());
        let vel = mult(scaleVelocity, subtract(pos,x));

        bullets.push({posicao: pos, velocidade: vel, tempo: timestamp});

    }

    function bullet(){

        multScale([CANNON_PIPE_RADIUS,CANNON_PIPE_RADIUS,CANNON_PIPE_RADIUS]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,0.0,0.0,1.0)));

        uploadModelView();

        SPHERE.draw(gl, program, mode);

    }

      //cilindro para disparar
      function pipe(){

        multRotationZ(90);
        multScale([CANNON_PIPE_RADIUS,CANNON_HEIGHT,CANNON_PIPE_RADIUS]);

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    //cubo de ligacao canhao e body
    function cube(){

        multScale([CANNON_SQUARE,CANNON_SQUARE,CANNON_SQUARE]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,1.0,0.0,1.0)));

        uploadModelView();

        CUBE.draw(gl, program, mode);
    }

    //cilindro pequeno em cima do tanque
    function atenna(){

        multScale([ANTENNA_RADIUS,ANTENNA_HEIGHT,ANTENNA_RADIUS]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,1.0,0.0,1.0)));

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    //cilindro grande
    function head(){

        multScale([HEAD_CYLINDER_RADIUS,HEAD_CYLINDER_HEIGHT,HEAD_CYLINDER_RADIUS]);

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
            multTranslation([0,TRANSLATION_BODY_BIG,0])
            bodyBig();
    
    }

    //cubo grande do corpo do tanque
    function bodyBig(){

        multScale([TANK_UPPERBODY_LENGHT,TANK_UPPERBODY_HEIGHT,TANK_UPPERBODY_WIDTH]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(0.0,1.0,0.0,1.0)));

        uploadModelView();

        CUBE.draw(gl, program, mode);
    }

    //cubo pequeno do corpo do tanque
    function bodySmall(){

        multScale([TANK_LOWERBODY_LENGTH,TANK_LOWERBODY_HEIGHT,TANK_LOWERBODY_WIDTH]);

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
            multTranslation([WHEEL_AXIS_TRANSLATION_1,0,0]);
            axisWheels();
        popMatrix();
        pushMatrix();
            multTranslation([WHEEL_AXIS_TRANSLATION_2,0,0]);
            axisWheels();
        popMatrix();
        pushMatrix();
            multTranslation([-WHEEL_AXIS_TRANSLATION_1,0,0]);
            axisWheels();
        popMatrix();
            multTranslation([-WHEEL_AXIS_TRANSLATION_2,0,0]);
            axisWheels();


    }

    //eixo com duas rodas
    function axisWheels(){

        multRotationZ((movement/(2*3.14*0.45))*360);
        multScale([AXIS_WHEEL_SIZE, AXIS_WHEEL_SIZE, AXIS_WHEEL_SIZE]);


        pushMatrix();
            multTranslation([0,0,WHEEL_TRANSLATION]);
            wheel();
        popMatrix();
        pushMatrix();
            axis();
        popMatrix();
            multTranslation([0,0,-WHEEL_TRANSLATION]);
            wheel(); 

    }

    function axis(){

        multRotationX(90);
        multScale([AXIS_HEIGHT,AXIS_WIDTH,AXIS_HEIGHT]);

        uploadModelView();

        CYLINDER.draw(gl, program, mode);
    }

    //roda toda
    function wheel(){

        multRotationX(90);
        multScale([WHEEL_SIZE,WHEEL_SIZE,WHEEL_SIZE]);

        pushMatrix();
            torus();
        popMatrix();
            sphere();
        
    }

    function torus(){

        multScale([WHEEL_HEIGHT, WHEEL_THICK, WHEEL_HEIGHT]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(0.5,0.5,0.5,1.0)));

        uploadModelView();

        TORUS.draw(gl, program, mode);
    }

    function sphere(){

        multScale([SPHERE_SIZE,SPHERE_SIZE,SPHERE_SIZE]);

        gl.uniform4fv(gl.getUniformLocation(program, "ucolor"), flatten(vec4(1.0,1.0,1.0,1.0)));

        uploadModelView();

        SPHERE.draw(gl, program, mode);
    }



    function tiles(){

        uploadModelView();

        CUBE.draw(gl, program, mode);

    }



    function drawTiles(){

        multScale([TILE_LENGHT, TILE_HEIGHT, TILE_WIDTH]);

        for(let i = -10; i <= 10; i++){
            for(let j = -10; j <= 10; j++){

                pushMatrix();
                    multTranslation([i, 0, j]);
                   
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

    function calc(timestamp){

        for(let i = 0; i < bullets.length; i++){
            //let time = timestamp - bullets[i].tempo;
            //let a = mat4(scale(time,acelaration));
            
            let posfinal = add(bullets[i].velocidade,bullets[i].posicao);

            bullets[i].posicao = posfinal;
            bullets[i].velocidade = add(bullets[i].velocidade, acelaration);
            //bullets[i].tempo = timestamp;

            if(bullets[i].posicao[1][3] <= 0.1){
                bullets.splice(i,1);
            }
        }
        
    }

   
    function render(timestamp)
    {

        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        

        gl.useProgram(program);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(mView);

        pushMatrix();
            drawTiles();
        popMatrix();
        pushMatrix();
            multTranslation([0,TRANSLATION_TOP_TILES,0])
            tank(timestamp);
        popMatrix();

        
        for(let i = 0; i < bullets.length; i++){

            loadMatrix(mult(mView, bullets[i].posicao));
            bullet();
        }
        
        
        calc(timestamp);
        

    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))