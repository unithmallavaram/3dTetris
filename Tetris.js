/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
//const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles.json"; // triangles file loc
//var defaultEye = vec3.fromValues(0,0,-0.5); // default eye position in world space
//var defaultCenter = vec3.fromValues(0.5,0.5,0.5); // default view direction in world space
//var defaultEye = vec3.fromValues(0.4,1.3,-2); // default eye position in world space
//var defaultCenter = vec3.fromValues(0.4,1.3,0); // default view direction in world space
var defaultEye = vec3.fromValues(0.6,0.7,-1.7); // default eye position in world space
var defaultCenter = vec3.fromValues(0.6,1.1,0); // default view direction in world space
var defaultUp = vec3.fromValues(0,1,0); // default view up vector
var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
//var lightPosition = vec3.fromValues(-0.5,1.5,-0.5); // default light position
var lightPosition = vec3.fromValues(0.6,0.7,-1.7);
var rotateTheta = Math.PI/50; // how much to rotate models by with each key press

/* webgl and geometry data */
var gl = null; // the all powerful gl object. It's all here folks!
var inputTriangles = []; // the triangle data as loaded from input files
var numTriangleSets = 0; // how many triangle sets in input scene
var vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
var normalBuffers = []; // this contains normal component lists by set, in triples
var triSetSizes = []; // this contains the size of each triangle set
var triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
var viewDelta = 0; // how much to displace view with each key press

/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader

var uAlphaLoc;

/* interaction variables */
var Eye = vec3.clone(defaultEye); // eye position in world space
var Center = vec3.clone(defaultCenter); // view direction in world space
var Up = vec3.clone(defaultUp); // view up vector in world space

var defColor = [0.8, 0.8, 0.8];

var jsonArray = [];
var jsonTriangles = [];
var boardState = [];

var fieldArray = [];

var trans = 0.1;
var theta = 5*Math.PI/180;

//board variables
var s = 0.1;
var g = 0.04;
var baseVertices = [[0, 0, 0],[s,0,0],[s,s,0],[0,s,0],[0,0,s],[s,0,s],[s,s,s],[0,s,s]];
var row = 18;
var column = 9;
var delay = 600;
//tetromino starting column
var k = 4;

var tetAlpha = 0;
var fieldAlpha = 0.5;


var isReachedEnd = 0;
var isGameEnd = 0;
var isPause = 0;

var score = 0;
var level = 1;

var toggle = 1;

var isTurnOver = 0;

var powerTet = -1;
//tetrominoes
var tetrominoes = [
    {
        ambient : [0,1,0]
    },
    {
        ambient : [1,1,0]
    },
    {
        ambient : [0,1,1]
    },
    {
        ambient : [1,0,0]
    },
    {
        ambient : [0,0,1]
    },
];


//0B 1T 2Ell 3L 4Z
var currTet = {
    id: 0,
    pos: [],
    center: 0,
    nextOnRotate: 1
}; //not tet

var nextTet = {
    id: 0,
    pos: []
};


var powerUp = new Audio("powerUp.mp3");
var rowClear = new Audio("rowClear.mp3");
var music = new Audio("music.mp3");
music.loop = true;


function resetVariables(){
    inputTriangles = []; // the triangle data as loaded from input files
    numTriangleSets = 0; // how many triangle sets in input scene
    vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
    normalBuffers = []; // this contains normal component lists by set, in triples
    triSetSizes = []; // this contains the size of each triangle set
    triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
    viewDelta = 0; 
}

// ASSIGNMENT HELPER FUNCTIONS
function generateTriangleJson(){

    //generate generic cuboids
    for(var i=0; i<row*column; i++){
        jsonArray[i] = {};
        jsonArray[i].material = {"ambient": defColor, "diffuse": [0.0,0.0,0.6], "specular": [0.3,0.3,0.3], "n":40, "alpha": tetAlpha, "texture": "billie.jpg"};
        jsonArray[i].normals = [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1],[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]];
        jsonArray[i].uvs = [[0,0], [0,1], [1,1], [1,0]];
        jsonArray[i].triangles = [[0,1,2],[2,3,0],[0,1,5],[5,4,0],[4,5,6],[6,7,4],[2,3,7],[7,6,2],[1,2,6],[6,5,1],[0,3,7],[7,4,0]];
        jsonArray[i].vertices = [];
        jsonArray[i].block = [];
        jsonArray[i].isFilled = 0;
    }

    //generate vertices for the cuboids
    var k = 0;
    for(i=0; i<row; i++){
        for(var j=0; j<column; j++){
            addTranslation(j, i, k);
            k++;
        }
    }
}

function addTranslation(x, y, k){
    var result = [];
    //perform translation for each vertex
    for(var i=0; i<8; i++){
        var xcoord = baseVertices[i][0];
        var ycoord = baseVertices[i][1];
        var zcoord = baseVertices[i][2];
        var vertex = [xcoord + x*(s+g), ycoord + y*(s+g), zcoord];
        jsonArray[k].vertices.push(vertex);
    }
}



function allocateSerialNumbers(){
    var s = row*column-1;
    var x=1;
    for(var i=row-1; i>=0; i--){
        var y = 1;
        for(var j=column-1; j>=0; j--){
            jsonArray[s].block.push(x);
            jsonArray[s].block.push(y);
            boardState.push(jsonArray[s]);
            y += 1;
            s -= 1;
        }
        x += 1;
    }
}


function startGame(){

    //boardState[116].material.ambient = [1,0,1]
    //boardState[116].isFilled = 1;
    document.getElementById("start").disabled = true;
    //playSound(3);

    //load the board state
    renderBoard();

    //generate a random tetromino and store it in the current tetromino
    currTet.id = getRandomTet();
    loadTetromino(currTet);

    //animate the tetromino
    animate();

    //store the resultant board state based on the previous board state and the current tetromino
}

function loadTetromino(currTet){
    var s = 4;
    if(currTet.id == 0){//Box
        boardState[0*column + k].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[0*column + k].isFilled = 1;
        boardState[0*column + k].material.alpha = 1;
        boardState[0*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[0*column + k + 1].isFilled = 1;
        boardState[0*column + k + 1].material.alpha = 1;
        boardState[1*column + k].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k].isFilled = 1;
        boardState[1*column + k].material.alpha = 1;
        boardState[1*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 1].isFilled = 1;
        boardState[1*column + k + 1].material.alpha = 1;
        //block positions
        currTet.pos.push(0*column + k, 0*column + k + 1, 1*column + k, 1*column + k + 1);
    }
    else if(currTet.id == 1){//Tee
        boardState[0*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[0*column + k + 1].isFilled = 1;
        boardState[0*column + k + 1].material.alpha = 1;
        boardState[1*column + k].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k].isFilled = 1;
        boardState[1*column + k].material.alpha = 1;
        boardState[1*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 1].isFilled = 1;
        boardState[1*column + k + 1].material.alpha = 1;
        boardState[1*column + k + 2].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 2].isFilled = 1;
        boardState[1*column + k + 2].material.alpha = 1;
        //block positions
        currTet.pos.push(0*column + k + 1, 1*column + k, 1*column + k + 1, 1*column + k + 2);
        currTet.center = 1*column + k + 1;
        currTet.nextOnRotate = 1;
    }
    else if(currTet.id == 2){//Ell
        boardState[0*column + k].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[0*column + k].isFilled = 1;
        boardState[0*column + k].material.alpha = 1;
        boardState[1*column + k].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k].isFilled = 1;
        boardState[1*column + k].material.alpha = 1;
        boardState[1*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 1].isFilled = 1;
        boardState[1*column + k + 1].material.alpha = 1;
        boardState[1*column + k + 2].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 2].isFilled = 1;
        boardState[1*column + k + 2].material.alpha = 1;
        //block positions
        currTet.pos.push(0*column + k, 1*column + k, 1*column + k + 1, 1*column + k + 2);
        currTet.center = 1*column + k + 1;
        currTet.nextOnRotate = 1;
    }
    else if(currTet.id == 3){//Line
        boardState[1*column + k - 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k - 1].isFilled = 1;
        boardState[1*column + k - 1].material.alpha = 1;
        boardState[1*column + k].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k].isFilled = 1;
        boardState[1*column + k].material.alpha = 1;
        boardState[1*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 1].isFilled = 1;
        boardState[1*column + k + 1].material.alpha = 1;
        //block positions
        currTet.pos.push(1*column + k - 1, 1*column + k, 1*column + k + 1);
        currTet.center = 1*column + k;
        currTet.nextOnRotate = 1;
    }
    else if(currTet.id == 4){//Zee
        boardState[0*column + k].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[0*column + k].isFilled = 1;
        boardState[0*column + k].material.alpha = 1;
        boardState[0*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[0*column + k + 1].isFilled = 1;
        boardState[0*column + k + 1].material.alpha = 1;
        boardState[1*column + k + 1].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 1].isFilled = 1;
        boardState[1*column + k + 1].material.alpha = 1;
        boardState[1*column + k + 2].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[1*column + k + 2].isFilled = 1;
        boardState[1*column + k + 2].material.alpha = 1;
        //block positions
        currTet.pos.push(0*column + k, 0*column + k + 1, 1*column + k + 1, 1*column + k + 2);
        currTet.center = 1*column + k + 1;
        currTet.nextOnRotate = 1;
    }
}

function getRandomTet(){
    return parseInt(((Math.random())*100)%5);
}

function isStartPosEmpty(){
    //check if there is place to load the next tetromino
    if(boardState[0*column + k].isFilled == 1){
        if(!currTet.pos.includes(0*column + k)){
            return 0;
        }
    }
    if(boardState[0*column + k + 1].isFilled == 1){
        if(!currTet.pos.includes(0*column + k + 1)){
            return 0;
        }
    }
    if(boardState[1*column + k - 1].isFilled == 1){
        if(!currTet.pos.includes(1*column + k - 1)){
            return 0;
        }
    }
    if(boardState[1*column + k].isFilled == 1){
        if(!currTet.pos.includes(1*column + k)){
            return 0;
        }
    }
    if(boardState[1*column + k + 1].isFilled == 1){
        if(!currTet.pos.includes(1*column + k + 1)){
            return 0;
        }
    }
    if(boardState[1*column + k + 2].isFilled == 1){
        if(!currTet.pos.includes(1*column + k + 2)){
            return 0;
        }
    }
    return 1;
}

function animate(){
    //window.requestAnimationFrame(animate);
    //play audio
    //document.getElementById('animate').play();
    //document.getElementById('animate').muted = false;

    document.getElementById('score_v').innerHTML = score;
    document.getElementById('level_v').innerHTML = level;

    //check if the game ends
    ///*
    var r=0;
    //if at least one cube in a row is filled
    for(var j=0; j<row; j++){
        for(var k=0; k<column; k++){
            if(boardState[j*column + k].isFilled == 1){
                r += 1;
                break;
            }
        }
    }
    
    //find some condition for ending the game
    if(r == row){
        isGameEnd = 1;
    }
    //*/

    if(!isStartPosEmpty()){
        isGameEnd = 1;;
    }


    if(!isGameEnd){
        //the piece touches the bottom
        if(isReachedEnd){
            //debugger;
            //clear a row if filled completely
            clearFilledRows();
            adjustFloatingCubes();

            //load a new tetromino
            clearCurrTet();

            if(powerTet < 0){
                currTet.id = getRandomTet();
            }
            else{
                currTet.id = powerTet - 1;
                powerTet = -1;
                isTurnOver = 1;
            }
            
            if(isStartPosEmpty())
                loadTetromino(currTet);


            isReachedEnd = 0;
        }

        //perform animation and update the board
        setTimeout(function alterState() {
            if(!isPause)
                translateVertical();
            setTimeout(animate, delay);
        }, delay);
    }
    else{
        window.alert("Game Over! Reload to play again!!");
        music.pause();
    }

    //render the final board
    renderBoard();
}

function clearFilledRows(){
    var filledRows = [];

    //identify the filled rows
    for(var i=0; i<row; i++){
        var filledCubes = 0;
        for(var j=0; j<column; j++){
            if(boardState[i*column + j].isFilled == 1){
                filledCubes += 1;
            }
        }
        if(filledCubes == column){
            filledRows.push(i);
        }
    }

    //remove the filled rows and adjust rest of the rows
    for(i=0; i<filledRows.length; i++){
        //clear all the rows
        for(j=0; j<column; j++){
            boardState[filledRows[i]*column + j].material.ambient = defColor;
            boardState[filledRows[i]*column + j].isFilled = 0;
            boardState[filledRows[i]*column + j].material.alpha = tetAlpha;
        }
        //for every filled row, score increases by 10;
        score += 10;  
        //renderBoard();
    }

    for(i=0; i<filledRows.length; i++){
        //adjust the rest of the rows
        for(var u=filledRows[i]; u>=0; u--){
            if(u == 0){
                for(var v=0; v<column; v++){
                    boardState[u*column + v].material.ambient = defColor;
                    boardState[u*column + v].isFilled = 0;
                    boardState[u*column + v].material.alpha = tetAlpha;
                }
            }
            else{
                for(var v=0; v<column; v++){
                    boardState[u*column + v].material.ambient = boardState[(u-1)*column + v].material.ambient;
                    boardState[u*column + v].isFilled = boardState[(u-1)*column + v].isFilled;
                    boardState[u*column + v].material.alpha = boardState[(u-1)*column + v].material.alpha;
                }   
            }
        }

        //renderBoard();
    }
    if(filledRows.length)
        
        playSound(2);
    renderBoard();

    //increase level with score
    if(score >= 10 && score < 60){
        if(level == 1)
            //window.alert("Level Up!!");
        level = 2;
        delay = 500;
    }
    else if (score >= 60 && score < 90){
        if(level == 2)
            //window.alert("Level Up!!");
        level = 3;
        delay = 400;
        //power up
        if(!isTurnOver){
            playSound(1);
            checkPowerTet();
        }
    }
    else if (score >= 90 && score < 120){
        if(level == 3)
            //window.alert("Level Up!!");
        level = 4;
        delay = 300;
    }
    else if (score >= 120){
        if(level == 4)
            //window.alert("Level Up!!");
        level = 5;
        delay = 200;
    }


    //power ups
    if(filledRows.length > 1){
        playSound(1);
        delay = 800;
    }

}

function checkPowerTet(){
    powerTet = prompt("This is a power up!! Enter the number of next tetronome you want(Number in the range 1-5).");
    if(powerTet<0 || powerTet>5){
        checkPowerTet();
    }   
    else{
        return;
    }
}

function adjustFloatingCubes(){

}

function clearCurrTet(){
    currTet.id = 0;
    currTet.pos = [];
}

function translateVertical(){
    //document.getElementById('animate').play();
    //document.getElementById('animate').muted = false;
    //check if the block can move down (check all possible cases)
    //for all the cubes spanning the tetromino
    for(var i=0; i<currTet.pos.length; i++){
        //check if a cube is in the final row
        if(currTet.pos[i] >= (row-1)*column && (currTet.pos[i] <= (row*column-1))){
            isReachedEnd = 1;
            break;
        }
        //check if a cube has an occupied cube below it
        if(boardState[currTet.pos[i] + column].isFilled == 1){
            //check if the occupied cube doesn't belong to the tetromino
            if(!currTet.pos.includes(currTet.pos[i] + column)){
                isReachedEnd = 1;
                break;
            }
        }
    }

    //if the tetromino is not at the end
    //move the block down by a cube
    if(!isReachedEnd){
        //store the curr pos in a temp location
        var tempPos = currTet.pos;

        //clear the curr pos
        currTet.pos = [];
        clearBoardCubes(tempPos);

        //translate and update the position - 
        //both in currTet and boardState
        for(var i=0; i<tempPos.length; i++){
            currTet.pos.push(tempPos[i]+column);
        }
        fillBoardCubes(currTet.pos);

        //update the center
        currTet.center += column;
        //console.log(currTet.center);
    }
}

function translateHorizontal(dir){
    //document.getElementById('animate').play();
    //document.getElementById('animate').muted = false;
    var canMove = 1;
    //for all the cubes that the current tetromino spans
    for(var i=0; i<currTet.pos.length; i++){
        //check if movement is possible
        //check if any of the cubes of the tet is on the extreme right or extreme left
        if(dir == -1){   //extreme left
            if((currTet.pos[i]%column == 0)){
                canMove = 0;
                break;
            }
        }
        if(dir == 1){   //extreme right
            if(((currTet.pos[i]+1)%column == 0)){
                canMove = 0;
                break;
            }
        }
        //check if a cube is filled in the moving direction
        if(boardState[currTet.pos[i] + dir].isFilled == 1){
            //if filled, the cube shouldn't belong to the tetromino
            if(!currTet.pos.includes(currTet.pos[i] + dir)){
                canMove = 0;
                break;   
            }
        }
    }

    if(canMove){
        //store the curr pos in a temp location
        var tempPos = currTet.pos;

        //clear the curr pos
        currTet.pos = [];
        clearBoardCubes(tempPos);

        //translate and update the position - 
        //both in currTet and boardState
        for(var i=0; i<tempPos.length; i++){
            currTet.pos.push(tempPos[i]+ dir);
        }
        fillBoardCubes(currTet.pos);

        //update the center
        currTet.center += dir;
        //console.log(currTet.center);
    }
}

function fillBoardCubes(arr){
    for(var i=0; i<arr.length; i++){
        boardState[arr[i]].material.ambient = tetrominoes[currTet.id].ambient;
        boardState[arr[i]].isFilled = 1;
        boardState[arr[i]].material.alpha = 1;
    }
}

function clearBoardCubes(arr){
    for(var i=0; i<arr.length; i++){
        boardState[arr[i]].material.ambient = defColor;
        boardState[arr[i]].isFilled = 0;
        boardState[arr[i]].material.alpha = tetAlpha;
    }
}

function rotateOnce(){
    //check if rotation is possible
    //debugger;
    var isRotationPossible = isRotatePossible();

    if(isRotationPossible){
        var c = currTet.center;

        //clear current tetromino
        clearBoardCubes(currTet.pos);
        currTet.pos = [];

        //Get the rotated tetromino
        //do nothing for box
        if(currTet.id == 1){  //Tee
            if(currTet.nextOnRotate == 0){   
                currTet.pos.push(c - column, c - 1, c, c + 1);
            }
            else if(currTet.nextOnRotate == 1){   
                currTet.pos.push(c - column, c, c + 1, c + column);
            }
            else if(currTet.nextOnRotate == 2){   
                currTet.pos.push(c - 1, c, c + 1, c + column);
            }
            else if(currTet.nextOnRotate == 3){   
                currTet.pos.push(c - column, c, c - 1, c + column);
            }
            currTet.nextOnRotate = (currTet.nextOnRotate + 1)%4;
        }
        else if(currTet.id == 2){  //Ell
            if(currTet.nextOnRotate == 0){   
                currTet.pos.push(c - 1 - column, c - 1, c, c + 1);
            }
            else if(currTet.nextOnRotate == 1){   
                currTet.pos.push(c + 1 - column, c - column, c, c + column);
            }
            else if(currTet.nextOnRotate == 2){   
                currTet.pos.push(c - 1, c, c + 1, c + 1 + column);
            }
            else if(currTet.nextOnRotate == 3){   
                currTet.pos.push(c - column, c, c + column, c - 1 + column);
            }
            currTet.nextOnRotate = (currTet.nextOnRotate + 1)%4;
        }
        else if(currTet.id == 3){  //Line
            if(currTet.nextOnRotate == 0){ 
                currTet.pos.push(c - 1, c, c + 1);
            }
            else if(currTet.nextOnRotate == 1){   
                currTet.pos.push(c - column, c, c + column);
            }   
            currTet.nextOnRotate = (currTet.nextOnRotate + 1)%2; 
        }
        else if(currTet.id == 4){  //Zee
            if(currTet.nextOnRotate == 0){   
                currTet.pos.push(c - 1 - column, c - column, c, c + 1);
            }
            else if(currTet.nextOnRotate == 1){   
                currTet.pos.push(c - column + 1, c, c+1, c+column);
            }
            currTet.nextOnRotate = (currTet.nextOnRotate + 1)%2;
        }
        //add the rotated tet to the board
        fillBoardCubes(currTet.pos);
    }
}

function isRotatePossible(){
    var c = currTet.center;

    //check if the center is on the extreme right or left
    if(c%column == 0 || (c+1)%column == 0){
        return 0;
    }

    //check if all the neighbors are empty
    if(boardState[c - 1 - column].isFilled == 1){
        if(!currTet.pos.includes(c - 1 - column)){
            return 0;
        }
    }
    if(boardState[c - column].isFilled == 1){
        if(!currTet.pos.includes(c - column)){
            return 0;
        }
    }
    if(boardState[c + 1 - column].isFilled == 1){
        if(!currTet.pos.includes(c + 1 - column)){
            return 0;
        }
    }
    if(boardState[c - 1].isFilled == 1){
        if(!currTet.pos.includes(c - 1)){
            return 0;
        }
    }
    if(boardState[c + 1].isFilled == 1){
        if(!currTet.pos.includes(c + 1)){
            return 0;
        }
    }
    if(boardState[c - 1 + column].isFilled == 1){
        if(!currTet.pos.includes(c - 1 + column)){
            return 0;
        }
    }
    if(boardState[c + column].isFilled == 1){
        if(!currTet.pos.includes(c + column)){
            return 0;
        }
    }
    if(boardState[c + 1 + column].isFilled == 1){
        if(!currTet.pos.includes(c + 1 + column)){
            return 0;
        }
    }
    //if control reaches here, rotation is possible
    return 1;
}

function moveToBottom(){
    for(var i=0; i<row; i++){
        if(!isReachedEnd){
            translateVertical();
        }        
        else{
            break;
        }
    }
}

function renderBoard(){
    loadModels();
    setupShaders();
    renderModels();
    resetVariables();
}

function playSound(s){
    switch(s){
        case 1:
            powerUp.play();
            break;
        case 2:
            rowClear.play();
            break;
        case 3:
            music.play();
            break;
    }

}

/* MAIN -- HERE is where execution begins after window load */

function main() {
    setupWebGL(); // set up the webGL environment

    //generate the board
    generateTriangleJson();

    //========================
    //render the field
    //renderField();
    //========================

    //label the board
    allocateSerialNumbers();

    //========================
    addBoard();
    //allocateSerialNumbers2();
    //========================
    
    //window.alert("Welcome to Tetris! Press ok to start the game!");
    //start the game
    //startGame();
    

} // end main

var bDep1 = s+s/20;
var bDep2 = s+s/20+s;
var baseVertices2 = [[0, 0, bDep1],[s,0,bDep1],[s,s,bDep1],[0,s,bDep1],[0,0,bDep2],[s,0,bDep2],[s,s,bDep2],[0,s,bDep2]];

function renderField(){
    //generate triangles for the field
    generateField();
    //allocateSerialNumbers();
    //renderBoard();
}

//board length, height and width
var bl = (s+g)*column;
var bh = (s+g)*row;
//var boardVertices = [[0-g-g, 0-g-g, bDep1], [bl+g, 0-g-g, bDep1], [bl+g, bh+g, bDep1], [0-g-g, bh+g, bDep1], [0-g-g, 0-g-g, bDep2], [bl+g, 0-g-g, bDep2], [bl+g, bh+g, bDep2], [0-g-g, bh+g, bDep2]];
var boardVertices = [[0, 0, bDep1], [bl, 0, bDep1], [bl, bh, bDep1], [0, bh, bDep1], [0, 0, bDep2], [bl, 0, bDep2], [bl, bh, bDep2], [0, bh, bDep2]];
var fieldVertex = {};

function addBoard(){
    fieldVertex.material = {"ambient": [0.5, 0.5, 0.5], "diffuse": [0.0,0.0,0.6], "specular": [0.3,0.3,0.3], "n":40, "alpha": fieldAlpha, "texture": "billie.jpg"};
    fieldVertex.normals = [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1],[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]];
    fieldVertex.uvs = [[0,0], [0,1], [1,1], [1,0]];
    fieldVertex.triangles = [[0,1,2],[2,3,0],[0,1,5],[5,4,0],[4,5,6],[6,7,4],[2,3,7],[7,6,2],[1,2,6],[6,5,1],[0,3,7],[7,4,0]];
    fieldVertex.vertices = boardVertices;
    fieldVertex.block = [];
    fieldVertex.isFilled = 0;

    //boardState.push(fieldVertex);
}

function generateField(){

    //generate generic cuboids
    for(var i=0; i<row*column; i++){
        fieldArray[i] = {};
        fieldArray[i].material = {"ambient": [1, 1, 1], "diffuse": [0.0,0.0,0.6], "specular": [0.3,0.3,0.3], "n":40, "alpha": fieldAlpha, "texture": "billie.jpg"};
        fieldArray[i].normals = [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1],[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]];
        fieldArray[i].uvs = [[0,0], [0,1], [1,1], [1,0]];
        fieldArray[i].triangles = [[0,1,2],[2,3,0],[0,1,5],[5,4,0],[4,5,6],[6,7,4],[2,3,7],[7,6,2],[1,2,6],[6,5,1],[0,3,7],[7,4,0]];
        fieldArray[i].vertices = boardVertices;
        fieldArray[i].block = [];
        fieldArray[i].isFilled = 0;
    }

    //generate vertices for the cuboids
    var k = 0;
    for(i=0; i<row; i++){
        for(var j=0; j<column; j++){
            addTranslation2(j, i, k);
            k++;
        }
    }
}

function addTranslation2(x, y, k){
    var result = [];
    //perform translation for each vertex
    for(var i=0; i<8; i++){
        var xcoord = baseVertices2[i][0];
        var ycoord = baseVertices2[i][1];
        var zcoord = baseVertices2[i][2];
        var vertex = [xcoord + x*(s+g), ycoord + y*(s+g), zcoord];
        fieldArray[k].vertices.push(vertex);
    }
}

function allocateSerialNumbers2(){
    var s = row*column-1;
    var x=1;
    for(var i=row-1; i>=0; i--){
        var y = 1;
        for(var j=column-1; j>=0; j--){
            fieldArray[s].block.push(x);
            fieldArray[s].block.push(y);
            boardState.push(fieldArray[s]);
            y += 1;
            s -= 1;
        }
        x += 1;
    }

}

// does stuff when keys are pressed
function handleKeyDown(event) {
    // set up needed view params
    var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
    lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
    viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector
    
    // highlight static variables
    handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn; // nothing selected initially
    handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn; // nothing selected initially

    switch (event.code) {
        
        // model selection
        case "KeyP": 
            //pause
            if(!isPause){
                music.pause();
            }
            else{
                music.play();
            }
            isPause = !isPause;
            break;
        case "ArrowRight": 
            translateHorizontal(1);
            renderBoard();
            break;
        case "ArrowLeft": 
            translateHorizontal(-1);
            renderBoard();
            break;
        case "ArrowUp": 
            rotateOnce();
            renderBoard();
            break;
        case "ArrowDown":
            translateVertical();
            renderBoard();
            break;
        case "Space": 
            moveToBottom();
            break;
        case "KeyD": 
            translateHorizontal(1);
            renderBoard();
            break;
        case "KeyA": 
            translateHorizontal(-1);
            renderBoard();
            break;
        case "KeyW": 
            rotateOnce();
            renderBoard();
            break;
        case "KeyS":
            translateVertical();
            renderBoard();
            break;
        case "KeyJ":
            defaultEye[0] -= trans; 
            defaultCenter[0] -= trans;
            Eye = vec3.clone(defaultEye); 
            Center = vec3.clone(defaultCenter);
            renderBoard();
            break;
        case "KeyL":
            defaultEye[0] += trans; 
            defaultCenter[0] += trans;
            Eye = vec3.clone(defaultEye); 
            Center = vec3.clone(defaultCenter);
            renderBoard();
            break;
        case "KeyI":
            defaultEye[1] -= trans; 
            defaultCenter[1] -= trans;
            Eye = vec3.clone(defaultEye); 
            Center = vec3.clone(defaultCenter);
            renderBoard();
            break;
        case "KeyK":
            defaultEye[1] += trans; 
            defaultCenter[1] += trans;
            Eye = vec3.clone(defaultEye); 
            Center = vec3.clone(defaultCenter);
            renderBoard();
            break;
        case "KeyU":
            defaultEye[2] += trans; 
            defaultCenter[2] += trans;
            Eye = vec3.clone(defaultEye); 
            Center = vec3.clone(defaultCenter);
            renderBoard();
            break;
        case "KeyO":
            defaultEye[2] -= trans; 
            defaultCenter[2] -= trans;
            Eye = vec3.clone(defaultEye); 
            Center = vec3.clone(defaultCenter);
            renderBoard();
            break;
        case "KeyV":
            if(toggle == 1){
                defaultEye = vec3.fromValues(-0.1,-0.1,-0.75); // default eye position in world space
                defaultCenter = vec3.fromValues(0.5,0.5,0); // default view direction in world space
                Eye = vec3.clone(defaultEye); 
                Center = vec3.clone(defaultCenter);
                toggle = 2;
            }else{
                defaultEye = vec3.fromValues(0.6,0.7,-1.7); // default eye position in world space
                defaultCenter = vec3.fromValues(0.6,1.1,0);
                Eye = vec3.clone(defaultEye); 
                Center = vec3.clone(defaultCenter);
                toggle = 1;
            }
            renderBoard();
            break;

    } // end switch
} // end handleKeyDown

// set up the webGL environment
function setupWebGL() {
    
    // Set up keys
    document.onkeydown = handleKeyDown; // call this when key pressed

    ///*
    var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
      var cw = imageCanvas.width, ch = imageCanvas.height; 
      imageContext = imageCanvas.getContext("2d"); 
      var bkgdImage = new Image(); 
      bkgdImage.crossOrigin = "Anonymous";
      //bkgdImage.crossOrigin = "null";
      bkgdImage.src = "https://ncsucgclass.github.io/prog4/stars.jpg";
      //bkgdImage.src = "https://github.com/unithmallavaram/prog3/blob/gh-pages/wall.jpg";
      bkgdImage.onload = function(){
          var iw = bkgdImage.width, ih = bkgdImage.height;
          imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
     }
    //*/
     
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(1.0, 1.0, 1.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read models in, load them into webgl buffers
function loadModels() {
    
    //inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles"); // read in the triangle data
    //inputTriangles = jsonTriangles;
    var a = [];
    a.push(fieldVertex);
    inputTriangles = a.concat(boardState);
    //inputTriangles.push(fieldVertex);
    //inputTriangles.concat(boardState);
    //inputTriangles = boardState;

    try {
        if (inputTriangles == String.null)
            throw "Unable to load triangles file!";
        else {
            var whichSetVert; // index of vertex in current triangle set
            var whichSetTri; // index of triangle in current triangle set
            var vtxToAdd; // vtx coords to add to the coord array
            var normToAdd; // vtx normal to add to the coord array
            var triToAdd; // tri indices to add to the index array
            var maxCorner = vec3.fromValues(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE); // bbox corner
            var minCorner = vec3.fromValues(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE); // other corner
        
            // process each triangle set to load webgl vertex and triangle buffers
            numTriangleSets = inputTriangles.length; // remember how many tri sets
            for (var whichSet=0; whichSet<numTriangleSets; whichSet++) { // for each tri set
                
                // set up hilighting, modeling translation and rotation
                inputTriangles[whichSet].center = vec3.fromValues(0,0,0);  // center point of tri set
                inputTriangles[whichSet].on = false; // not highlighted
                inputTriangles[whichSet].translation = vec3.fromValues(0,0,0); // no translation
                inputTriangles[whichSet].xAxis = vec3.fromValues(1,0,0); // model X axis
                inputTriangles[whichSet].yAxis = vec3.fromValues(0,1,0); // model Y axis 

                // set up the vertex and normal arrays, define model center and axes
                inputTriangles[whichSet].glVertices = []; // flat coord list for webgl
                inputTriangles[whichSet].glNormals = []; // flat normal list for webgl
                var numVerts = inputTriangles[whichSet].vertices.length; // num vertices in tri set
                for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
                    vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert]; // get vertex to add
                    normToAdd = inputTriangles[whichSet].normals[whichSetVert]; // get normal to add
                    inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
                    inputTriangles[whichSet].glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
                    vec3.max(maxCorner,maxCorner,vtxToAdd); // update world bounding box corner maxima
                    vec3.min(minCorner,minCorner,vtxToAdd); // update world bounding box corner minima
                    vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd); // add to ctr sum
                } // end for vertices in set
                vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts); // avg ctr sum

                // send the vertex coords and normals to webGL
                vertexBuffers[whichSet] = gl.createBuffer(); // init empty webgl set vertex coord buffer
                gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichSet]); // activate that buffer
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW); // data in
                normalBuffers[whichSet] = gl.createBuffer(); // init empty webgl set normal component buffer
                gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichSet]); // activate that buffer
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glNormals),gl.STATIC_DRAW); // data in
            
                // set up the triangle index array, adjusting indices across sets
                inputTriangles[whichSet].glTriangles = []; // flat index list for webgl
                triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length; // number of tris in this set
                for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
                    triToAdd = inputTriangles[whichSet].triangles[whichSetTri]; // get tri to add
                    inputTriangles[whichSet].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
                } // end for triangles in set

                // send the triangle indices to webGL
                triangleBuffers.push(gl.createBuffer()); // init empty triangle index buffer
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]); // activate that buffer
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(inputTriangles[whichSet].glTriangles),gl.STATIC_DRAW); // data in

            } // end for each triangle set 
        } // end if triangle file loaded
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end load models

// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec3 aVertexNormal; // vertex normal
        
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying vec3 vVertexNormal; // interpolated normal for frag shader

        void main(void) {
            
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

            // vertex normal (assume no non-uniform scale)
            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
        }
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float; // set float to medium precision

        // eye location
        uniform vec3 uEyePosition; // the eye's position in world
        
        // light properties
        uniform vec3 uLightAmbient; // the light's ambient color
        uniform vec3 uLightDiffuse; // the light's diffuse color
        uniform vec3 uLightSpecular; // the light's specular color
        uniform vec3 uLightPosition; // the light's position
        
        // material properties
        uniform vec3 uAmbient; // the ambient reflectivity
        uniform vec3 uDiffuse; // the diffuse reflectivity
        uniform vec3 uSpecular; // the specular reflectivity
        uniform float uShininess; // the specular exponent

        uniform float uAlpha;
        
        // geometry properties
        varying vec3 vWorldPos; // world xyz of fragment
        varying vec3 vVertexNormal; // normal of fragment
            
        void main(void) {
        
            // ambient term
            vec3 ambient = uAmbient*uLightAmbient; 
            
            // diffuse term
            vec3 normal = normalize(vVertexNormal); 
            vec3 light = normalize(uLightPosition - vWorldPos);
            float lambert = max(0.0,dot(normal,light));
            vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
            
            // specular term
            vec3 eye = normalize(uEyePosition - vWorldPos);
            vec3 halfVec = normalize(light+eye);
            float highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
            vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
            
            // combine to output color
            //vec3 colorOut = ambient + diffuse + specular; // no specular yet
            vec3 colorOut = ambient;
            //gl_FragColor = vec4(colorOut, 1.0); 
            gl_FragColor = vec4(colorOut, uAlpha);
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
                gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array
                
                // locate vertex uniforms
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
                // locate fragment uniforms
                var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
                var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
                var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
                var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
                var lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess
                
                // pass global constants into fragment uniforms
                gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
                gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
                gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
                gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
                gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position

                alphaULoc = gl.getUniformLocation(shaderProgram, "uAlpha"); // ptr to shininess

                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderModels() {
    
    // construct the model transform matrix, based on model state
    function makeModelTransform(currModel) {
        var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

        // move the model to the origin
        mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currModel.center)); 
        
        // scale for highlighting if needed
        if (currModel.on)
            mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(1.2,1.2,1.2)),mMatrix); // S(1.2) * T(-ctr)
        
        // rotate the model to current interactive orientation
        vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
        mat4.set(sumRotation, // get the composite rotation
            currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
            currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
            currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
            0, 0,  0, 1);
        mat4.multiply(mMatrix,sumRotation,mMatrix); // R(ax) * S(1.2) * T(-ctr)
        
        // translate back to model center
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.center),mMatrix); // T(ctr) * R(ax) * S(1.2) * T(-ctr)

        // translate model to current interactive orientation
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.translation),mMatrix); // T(pos)*T(ctr)*R(ax)*S(1.2)*T(-ctr)
        
    } // end make model transform
    
    // var hMatrix = mat4.create(); // handedness matrix
    var pMatrix = mat4.create(); // projection matrix
    var vMatrix = mat4.create(); // view matrix
    var mMatrix = mat4.create(); // model matrix
    var pvMatrix = mat4.create(); // hand * proj * view matrices
    var pvmMatrix = mat4.create(); // hand * proj * view * model matrices
    
    //window.requestAnimationFrame(renderModels); // set up frame render callback
    
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // set up projection and view
    // mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
    mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10); // create projection matrix
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
    mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view

    // render each triangle set
    var currSet; // the tri set and its material properties
    for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
        currSet = inputTriangles[whichTriSet];
        
        // make model transform, add to view project
        makeModelTransform(currSet);
        mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
        gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
        gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
        
        // reflectivity: feed to the fragment shader
        gl.uniform3fv(ambientULoc,currSet.material.ambient); // pass in the ambient reflectivity
        gl.uniform3fv(diffuseULoc,currSet.material.diffuse); // pass in the diffuse reflectivity
        gl.uniform3fv(specularULoc,currSet.material.specular); // pass in the specular reflectivity
        gl.uniform1f(shininessULoc,currSet.material.n); // pass in the specular exponent
        
        gl.uniform1f(alphaULoc,currSet.material.alpha);

        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichTriSet]); // activate
        gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichTriSet]); // activate
        gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed

        // triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[whichTriSet]); // activate
        gl.drawElements(gl.TRIANGLES,3*triSetSizes[whichTriSet],gl.UNSIGNED_SHORT,0); // render
        
    } // end for each triangle set
} // end render model

