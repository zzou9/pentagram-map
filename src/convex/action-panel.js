/**
 * A class that stores information of the action panel
 */

class ActionPanel extends Panel {

    /**
     * Constructor
     * @param {Number} x x coordinate
     * @param {Number} y y coordinate
     * @param {PentagramMap} map the map
     * @param {Polygon} polygon the polygon
     * @param {InfoPanel} infoPanel information panel
     * @param {Number} w the width of the panel
     * @param {Number} h the height of the panel
     */
    constructor(x, y, map, polygon, w=200, h=400) {
        super(x, y, w, h, "Action", color.CADET_BLUE);
        this.map = map;
        this.polygon = polygon;
        this.speed = 1;
        this.action = null;
        this.isRunning = false;

        /**
         * Populate the buttons
         */

        // control k
        this.diagonalBox = new Button(this.x+25, this.y+40, 100, 20, [["Diagonal: " + this.map.l, color.BLACK]]);
        this.buttons.push(this.diagonalBox);
        this.decDiagonal = new TriangleButton(this.x+135, this.y+45, 10, 10, "left");
        this.buttons.push(this.decDiagonal);
        this.incDiagonal = new TriangleButton(this.x+155, this.y+45, 10, 10, "right");
        this.buttons.push(this.incDiagonal);

        // control l
        this.spacingBox = new Button(this.x+25, this.y+70, 100, 20, [["Spacing: " + this.map.k, color.BLACK]]);
        this.buttons.push(this.spacingBox);
        this.decSpacing = new TriangleButton(this.x+135, this.y+75, 10, 10, "left");
        this.buttons.push(this.decSpacing);
        this.incSpacing = new TriangleButton(this.x+155, this.y+75, 10, 10, "right");
        this.buttons.push(this.incSpacing);

        // control shifting (numbering of vertices)
        this.shiftsBox = new Button(this.x+25, this.y+100, 100, 20, [["Shifts: " + this.map.shifts, color.BLACK]]);
        this.buttons.push(this.shiftsBox);
        this.decShifts = new TriangleButton(this.x+135, this.y+105, 10, 10, "left");
        this.buttons.push(this.decShifts);
        this.incShifts = new TriangleButton(this.x+155, this.y+105, 10, 10, "right");
        this.buttons.push(this.incShifts);


        // control the speed the map acts
        this.speedBox = new Button(this.x+25, this.y+130, 100, 20, [["Speed: " + this.speed, color.BLACK]]);
        this.buttons.push(this.speedBox);
        this.decSpeed = new TriangleButton(this.x+135, this.y+135, 10, 10, "left");
        this.buttons.push(this.decSpeed);
        this.incSpeed = new TriangleButton(this.x+155, this.y+135, 10, 10, "right");
        this.buttons.push(this.incSpeed);

        // control the number of times the map acts
        this.powerBox = new Button(this.x+25, this.y+160, 100, 20, [["Power: " + this.map.power, color.BLACK]]);
        this.buttons.push(this.powerBox);
        this.decPower = new TriangleButton(this.x+135, this.y+165, 10, 10, "left");
        this.buttons.push(this.decPower);
        this.incPower = new TriangleButton(this.x+155, this.y+165, 10, 10, "right");
        this.buttons.push(this.incPower);

        // display control
        this.actionButton = new Button(this.x+25, this.y+190, 150, 20, [["Start Action", color.GREEN]]);
        this.buttons.push(this.actionButton);
        this.showDiagonalButton = new Button(this.x+25, this.y+220, 150, 20, [["Show Diagonals", color.GREEN]]);
        this.buttons.push(this.showDiagonalButton);
        this.showEllipseButton = new Button(this.x+25, this.y+250, 150, 20, [["Show Ellipse of Inertia", color.GREEN]]);
        this.buttons.push(this.showEllipseButton);

        // convex, embed, and bird control
        this.embedButton = new Button(this.x+25, this.y+280, 150, 20, [["Skip Non-Embedded", color.BLACK]]);
        this.buttons.push(this.embedButton); 
        this.convexButton = new Button(this.x+25, this.y+310, 150, 20, [["Skip Nonconvex", color.BLACK]]);
        this.buttons.push(this.convexButton); 
        this.birdButton = new Button(this.x+25, this.y+340, 150, 20, [["Skip Non-" + this.map.l + "-Bird", color.BLACK]]);
        this.buttons.push(this.birdButton); 

        // show next power
        this.nextButton = new Button(this.x+25, this.y+370, 150, 20, [["Show Next Power", color.BLACK]]);
        this.buttons.push(this.nextButton); 
    }

    /**
     * Display the panel
     */
    show() {
        super.show();
    }

    /**
     * Update the diagonal and spacing box 
     */
    updateDiagonalAndSpacing() {
        this.diagonalBox.text = [["Diagonal: " + this.map.l, color.BLACK]];
        this.spacingBox.text = [["Spacing: " + this.map.k, color.BLACK]];
    }

    /**
     * One iteration of a map action
     */
    mapAction() {
        try {
            this.polygon.vertices = this.map.act(polygon.cloneVertices());
            this.polygon.updateInfo();
        }
        catch (err) {
            clearInterval(this.action);
            console.log(err);
            this.actionButton.text = [["Start Action", color.GREEN]];
            this.isRunning = false;
        }
    }

    /**
     * Call methods when the buttons are clicked
     */
    buttonMouseAction() {
        // diagonal control
        if (this.decDiagonal.isHovering() && this.map.l-1 > this.map.k) {
            this.map.l--;
            this.diagonalBox.text = [["Diagonal: " + this.map.l, color.BLACK]];
        }
        if (this.incDiagonal.isHovering() && this.polygon.numVertex > 3*this.map.l) {
            this.map.l++;
            this.diagonalBox.text = [["Diagonal: " + this.map.l, color.BLACK]];
        }

        // spacing control
        if (this.decSpacing.isHovering() && this.map.k > 1) {
            this.map.k--;
            this.spacingBox.text = [["Spacing: " + this.map.k, color.BLACK]];
        }
        if (this.incSpacing.isHovering() && this.map.k < this.map.l-1 && this.polygon.numVertex > 3*this.map.k+1) {
            this.map.k++;
            this.spacingBox.text = [["Spacing: " + this.map.k, color.BLACK]];
        }

        // shifting control
        if (this.decShifts.isHovering() && this.map.shifts > 0) {
            this.map.shifts--;
            this.shiftsBox.text = [["Shifts: " + this.map.shifts, color.BLACK]];
        }
        if (this.incShifts.isHovering()) {
            if (this.map.twisted) {
                if (this.map.shifts < this.polygon.numVertex/4-1) {
                    this.map.shifts++;
                    this.shiftsBox.text = [["Shifts: " + this.map.shifts, color.BLACK]];
                }
            } else if (this.map.shifts < this.polygon.numVertex-1) {
                this.map.shifts++;
                this.shiftsBox.text = [["Shifts: " + this.map.shifts, color.BLACK]];
            }
        }

        // speed control
        if (this.decSpeed.isHovering() && this.speed > 1) {
            this.speed--;
            this.speedBox.text = [["Speed: " + this.speed, color.BLACK]];
        }
        if (this.incSpeed.isHovering()) {
            this.speed++;
            this.speedBox.text = [["Speed: " + this.speed, color.BLACK]];
        }

        // power control
        if (this.decPower.isHovering() && this.map.power > 1) {
            this.map.power--;
            this.powerBox.text = [["Power: " + this.map.power, color.BLACK]];
        }
        if (this.incPower.isHovering()) {
            this.map.power++;
            this.powerBox.text = [["Power: " + this.map.power, color.BLACK]];
        }

        // display control
        if (this.actionButton.isHovering()) {
            if (!this.isRunning) {
                this.actionButton.text = [["Pause Action", color.RED]];
                this.action = setInterval(() => this.mapAction(), 1000/this.speed);
                this.isRunning = true;
            } else {
                this.actionButton.text = [["Start Action", color.GREEN]];
                clearInterval(this.action);
                this.isRunning = false;
            }
        }
        if (this.showDiagonalButton.isHovering()) {
            if (!this.polygon.showDiagonal) {
                this.polygon.showDiagonal = true;
                this.showDiagonalButton.text = [["Hide Diagonals", color.RED]];
            } else {
                this.polygon.showDiagonal = false;
                this.showDiagonalButton.text = [["Show Diagonals", color.GREEN]];
            }
        }
        if (this.showEllipseButton.isHovering()) {
            if (!this.polygon.showEllipse) {
                this.polygon.showEllipse = true;
                this.showEllipseButton.text = [["Hide Ellipse of Inertia", color.RED]];
            } else {
                this.polygon.showEllipse = false;
                this.showEllipseButton.text = [["Show Ellipse of Inertia", color.GREEN]];
            }
        }

        // convex and embedded control
        if (this.embedButton.isHovering()) {
            if (this.map.onlyEmbedded) {
                this.map.onlyEmbedded = false;
                this.embedButton.text = [["Skip Non-Embedded", color.BLACK]];
            } else {
                this.map.onlyEmbedded = true;
                this.embedButton.text = [["Skip Non-Embedded", color.GREEN]];
            }
        }
        if (this.convexButton.isHovering()) {
            if (this.map.onlyConvex) {
                this.map.onlyConvex = false;
                this.convexButton.text = [["Skip Nonconvex", color.BLACK]];
            } else {
                this.map.onlyConvex = true;
                this.convexButton.text = [["Skip Nonconvex", color.GREEN]];
            }
        }
        if (this.birdButton.isHovering()) {
            if (this.map.onlyBird) {
                this.map.onlyBird = false;
                this.birdButton.text = [["Skip Non-" + this.map.l + "-Bird", color.BLACK]];
            } else {
                this.map.onlyBird = true;
                this.birdButton.text = [["Skip Non-" + this.map.l + "-Bird", color.GREEN]];
            }
        }

        // show and compute next power
        if (this.nextButton.isHovering()) {
            if (this.polygon.showNext) {
                this.polygon.showNext = false;
                this.nextButton.text = [["Show Next Power", color.BLACK]];
            } else {
                this.polygon.showNext = true;
                this.nextButton.text = [["Show Next Power", color.GREEN]];
            }
        }
    }
}