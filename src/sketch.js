let polygon;
let map;
// define the visualization of the polygon
const modes = ["Planar", "Unit Square Normalized"]

function setup() {
    createCanvas(windowWidth, windowHeight);
    polygon = new Polygon();
    map = new Map();
}

function draw() {
    background(0, 255, 255);

    push();
    polygon.show();
    pop();
}

function mouseClicked() {

    debug();
}

function keyPressed() {
    // applying the map
    if (key === ' ') {
        polygon.vertices = map.act({...polygon.vertices});

        console.log("Vertices after the map acts: ", polygon.vertices);
    } else if (key === 'r' || key === 'R') {
        if (map.canRevert()) {
            polygon.vertices = map.revert();
        }
    }

    // changing the number of vertices of a polygon
    if (keyCode === UP_ARROW) { // up arrow
        polygon.setDefault(polygon.numVertex+1);
    } else if (keyCode === DOWN_ARROW){ 
        // the number of vertices has to > 4
        polygon.setDefault(Math.max(polygon.numVertex-1,5)); 
        // TODO: may adopt Schwartz 2024 notations
    }
}

// TODO: need to add buttons for changing number of edges

function debug() {
    // for debug purposes, gets called when the mouse is clicked

    // const matrix = [
    //     [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
    //     [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], 
    //     [0, 0, 0, 0, 0, 0, 0, 0, 1, -2, 0, 0, 0], 
    //     [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
    //     [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], 
    //     [0, 0, 0, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0],
    //     [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0],
    //     [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, -1, 0],
    //     [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, -1, 0], 
    //     [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
    //     [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, -1], 
    //     [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, -1]
    // ];
    // const rrefMatrix = MathHelper.computeRREF(matrix);
    // console.log(rrefMatrix);

    polygon.squareNormalize();
}