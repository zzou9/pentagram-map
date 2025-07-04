/**
 * A class that stores information of the control panel
 */
class CtrlPanel extends Panel {

    /**
     * Constructor
     * @param {Number} x x coordinate
     * @param {Number} y y coordinate
     * @param {TwistedBigon} polygon the polygon
     * @param {Array<TwistedBigon>} mapPolygons polygon mirrors
     * @param {TwistedPolygonMap} map the map
     * @param {Number} w (optional) width of the panel
     * @param {Number} h (optional) height of the panel
     */
    constructor(x, y, polygon, mapPolygons, map, w=200, h=305) {
        super(x, y, w, h, "Polygon Control", color.CADET_BLUE);
        this.polygon = polygon;
        this.mapPolygons = mapPolygons;
        this.map = map;
        this.rate = -2;

        // populate the buttons
        this.nBox = new Button(this.x+25, this.y+35, 100, 20, [["n: " + this.polygon.n, color.BLACK]]);
        this.buttons.push(this.nBox);
        this.decN = new TriangleButton(this.x+135, this.nBox.y+5, 10, 10, "left");
        this.buttons.push(this.decN);
        this.incN = new TriangleButton(this.x+155, this.nBox.y+5, 10, 10, "right");
        this.buttons.push(this.incN);
        this.numVertexBox = new Button(this.x+25, this.nBox.y+30, 100, 20, [["# Vertices: " + this.polygon.numVertexToShow, color.BLACK]]);
        this.buttons.push(this.numVertexBox);
        this.decNumVertex = new TriangleButton(this.x+135, this.numVertexBox.y+5, 10, 10, "left");
        this.buttons.push(this.decNumVertex);
        this.incNumVertex = new TriangleButton(this.x+155, this.numVertexBox.y+5, 10, 10, "right");
        this.buttons.push(this.incNumVertex);
        this.sizeBox = new Button(this.x+25, this.numVertexBox.y+30, 100, 20, [["Vertex Size: " + this.polygon.vertexSize, color.BLACK]]);
        this.buttons.push(this.sizeBox);
        this.decSize = new TriangleButton(this.x+135, this.sizeBox.y+5, 10, 10, "left");
        this.buttons.push(this.decSize);
        this.incSize = new TriangleButton(this.x+155, this.sizeBox.y+5, 10, 10, "right");
        this.buttons.push(this.incSize);

        // polygon control
        this.defaultButton = new Button(this.x+25, this.sizeBox.y+30, 150, 20, [["Set Default", color.BLACK]]);
        this.buttons.push(this.defaultButton);
        this.random1Button = new Button(this.x+25, this.defaultButton.y+30, 150, 20, [["Rand. Type-α 3-Spiral", color.BLACK]]);
        this.buttons.push(this.random1Button);
        this.random2Button = new Button(this.x+25, this.random1Button.y+30, 150, 20, [["Rand. Type-β 3-Spiral", color.BLACK]]);
        this.buttons.push(this.random2Button);
        this.random3Button = new Button(this.x+25, this.random2Button.y+30, 150, 20, [["Rand. Type-β 2-Spiral", color.BLACK]]);
        this.buttons.push(this.random3Button);
        this.dragButton = new Button(this.x+25, this.random3Button.y+30, 150, 20, [["Drag: ", color.BLACK], ["On", color.GREEN]]);
        this.buttons.push(this.dragButton);
        this.normalizationButton = new Button(this.x+25, this.dragButton.y+30, 150, 20, [["Normalization: Square", color.BLACK]]);
        this.buttons.push(this.normalizationButton);
    }

    /**
     * Display the panel
     */
    show() {
        this.nBox.text[0][0] = "n: " + this.polygon.n;
        this.numVertexBox.text[0][0] = "# Vertices: " + this.polygon.numVertexToShow;
        this.sizeBox.text[0][0] = "Vertex Size: " + this.polygon.vertexSize;
        if (this.polygon.triangleNormalize) {
            this.normalizationButton.text[0][0] = "Normalization: Triangle", color.BLACK;
        } else {
            this.normalizationButton.text[0][0] = "Normalization: Square", color.BLACK;
        }
        super.show();
    }

    /**
     * Disable the inscribed feature of vertices
     */
    disableInscribe() {
        this.polygon.inscribed = false;
    }

    /**
     * Mouse Action
     */
    buttonMouseAction() {
        this.showingControl();
        if (this.showPanel) {
            // changing n
            if (this.decN.isHovering() && polygon.n > 2) {
                this.polygon.n--;
                this.polygon.setDefault();
                this.polygon.updateInfo(true, true);
                // broadcast to mirrors
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].n--;
                    this.mapPolygons[i].setDefault();
                    this.mapPolygons[i].updateInfo(true, true);
                }
                this.polygon.map.clearHistory();
            }
            if (this.incN.isHovering() && polygon.n < 7) {
                this.polygon.n++;
                this.polygon.setDefault();
                this.polygon.updateInfo(true, true);
                // broadcast to mirrors
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].n++;
                    this.mapPolygons[i].setDefault();
                    this.mapPolygons[i].updateInfo(true, true);
                }
                this.polygon.map.clearHistory();
            } 

            // changing number of vertices to show
            if (this.decNumVertex.isHovering() && this.polygon.numVertexToShow > 6) {
                this.polygon.numVertexToShow -= 1;
                this.polygon.updateVertices();
                // broadcast to mirrors
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].numVertexToShow = this.polygon.numVertexToShow;
                    this.mapPolygons[i].updateVertices();
                }
            }
            if (this.incNumVertex.isHovering() && this.polygon.numVertexToShow < 100) {
                this.polygon.numVertexToShow += 1;
                this.polygon.updateVertices();
                // broadcast to mirrors
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].numVertexToShow = this.polygon.numVertexToShow;
                    this.mapPolygons[i].updateVertices();
                }
            }

            // changing size of the dragging vertices
            if (this.decSize.isHovering() && this.polygon.vertexSize > 4) {
                this.polygon.vertexSize -= 1;
            }
            if (this.incSize.isHovering() && this.polygon.vertexSize < 10) {
                this.polygon.vertexSize += 1;
            }

            // set the bigon back to default
            if (this.defaultButton.isHovering()) {
                this.polygon.setDefault();
                // broadcast
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].setDefault();
                }
            }

            // randomly generating twisted polygons
            if (this.random1Button.isHovering()) {
                this.map.k = 3;
                this.polygon.triangleNormalize = true;
                this.polygon.randomTypeAlphaThree();
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].cornerCoords = this.polygon.cornerCoords;
                    this.mapPolygons[i].triangleNormalize = true;
                    this.mapPolygons[i].updateInfo(true, true);
                }
            }

            if (this.random2Button.isHovering()) {
                this.map.k = 3;
                this.polygon.triangleNormalize = false;
                this.polygon.randomTypeBetaThree();
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].cornerCoords = this.polygon.cornerCoords;
                    this.mapPolygons[i].triangleNormalize = false;
                    this.mapPolygons[i].updateInfo(true, true);
                }
            }

            if (this.random3Button.isHovering()) {
                this.map.k = 2;
                this.polygon.triangleNormalize = true;
                this.polygon.randomTypeBetaTwo();
                for (let i = 0; i < this.mapPolygons.length; i++) {
                    this.mapPolygons[i].cornerCoords = this.polygon.cornerCoords;
                    this.mapPolygons[i].triangleNormalize = true;
                    this.mapPolygons[i].updateInfo(true, true);
                }
            }

            // dragging control
            if (this.dragButton.isHovering()) {
                if (this.polygon.canDrag) {
                    this.polygon.canDrag = false;
                    this.dragButton.text = [["Drag: ", color.BLACK], ["Off", color.RED]];
                } else {
                    this.polygon.canDrag = true;
                    this.dragButton.text = [["Drag: ", color.BLACK], ["On", color.GREEN]];
                }
            }

            // toggle normalization
            if (this.normalizationButton.isHovering()) {
                if (this.polygon.triangleNormalize) {
                    this.polygon.triangleNormalize = false;
                    this.polygon.updateInfo(true, true);
                    // broadcast to mirrors
                    for (let i = 0; i < this.mapPolygons.length; i++) {
                        this.mapPolygons[i].triangleNormalize = false;
                        this.mapPolygons[i].updateInfo(true, true);
                    }
                }
                else {
                    this.polygon.triangleNormalize = true;
                    this.polygon.updateInfo(true, true);
                    // broadcast to mirrors
                    for (let i = 0; i < this.mapPolygons.length; i++) {
                        this.mapPolygons[i].triangleNormalize = true;
                        this.mapPolygons[i].updateInfo(true, true);
                    }
                }
            }
        }
    }

    /**
     * Control whether to show or hide the panel
     */
    showingControl() {
        if (mouseX >= this.x && mouseY >= this.y && mouseX <= this.x + this.w && mouseY <= this.y + 30) {
            if (this.showPanel) {
                this.showPanel = false;
                this.h = 30
            } else {
                this.showPanel = true;
                this.h = 305;
            }
        }
    }

    /**
     * Update the y positions of the buttons
     */
    updateButtonPositions() {
        this.nBox.y = this.y+35;
        this.decN.y = this.y+45
        this.incN.y = this.y+45;

        this.numVertexBox.y = this.nBox.y+30;
        this.decNumVertex.y = this.numVertexBox.y+5;
        this.incNumVertex.y = this.numVertexBox.y+5;
        this.sizeBox.y = this.numVertexBox.y+30;
        this.decSize.y = this.sizeBox.y+5;
        this.incSize.y = this.sizeBox.y+5;

        this.defaultButton.y = this.sizeBox.y+30;
        this.dragButton.y = this.defaultButton.y+30;
    }
}