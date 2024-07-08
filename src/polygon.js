/**
 * A class that stores information of the polygon
 */
class Polygon{ 
    
    /**
     * Constructor
     * @param {PentagramMap} map the map associated to the polygon
     * @param {Number} numVertex number of vertices of the polygon
     * @param {Array<Array<Number>>} vertices an array that stores the coords of verteices
     * @param {Boolean} inscribed whether the polygon is inscribed
     * @param {Number} scale scaling when plotting
     * @param {Boolean} canDrag whether the polygon vertices can be dragged
     */
    constructor(map,
                numVertex=7, 
                vertices=new Array(7), 
                inscribed=false,
                scale=(windowWidth + windowHeight)/20,
                canDrag=true) {
        this.map = map;
        this.numVertex = numVertex; 
        this.vertices = vertices; 
        this.inscribed = inscribed;
        this.embedded = true;
        this.convex = true;
        this.scale = scale; 
        this.center = [0, 0, 1];
        this.canDrag = canDrag;
        this.showDiagonal = false; // display the diagonals in the map
        this.showEllipse = false; // display the ellipse of inertia

        // if regular, populate vertices
        let angle = TWO_PI / this.numVertex;
        for (let counter = 0; counter < this.numVertex; counter++) {
            let sx = this.center[0] + cos(angle*counter);
            let sy = this.center[1] + sin(angle*counter);
            this.vertices[counter] = [sx, sy, 1];
        }
    }

    /**
     * Set the vertices back to default (regular n-gon)
     * @param {Number} numVertex the number of vertices of the n-gon
     */
    setDefault(numVertex) {
        this.numVertex = numVertex;
        this.scale = (windowWidth + windowHeight)/20;
        this.center = [0, 0, 1];
        
        // re-populate the vertices
        this.vertices = new Array(numVertex);
        let angle = TWO_PI / this.numVertex;
        for (let i = 0; i < this.numVertex; i++) {
            let sx = this.center[0] + cos(angle*i);
            let sy = this.center[1] + sin(angle*i);
            this.vertices[i] = [sx, sy, 1];
        }

        // reset the number of iterations of the map
        this.map.numIterations = 0;

        // update embedded and convexity information
        this.embedded = true;
        this.convex = true;
    }

    /**
     * Display the polygon
     */
    show() {
        // translate the coordinate system 
        translate(xT, yT);

        // draw the inscribed circle if the polygon is inscribed
        if (this.inscribed) {
            noFill();
            stroke(color.RED);
            circle(0, 0, this.scale*2);
        }

        // draw edges
        fill(color.WHITE);
        stroke(color.BLACK);
        beginShape();
        for (let i in this.vertices) {
            vertex(this.vertices[i][0] * this.scale, this.vertices[i][1] * this.scale);
        }
        endShape(CLOSE);

        // draw the diagonal lines the map is acting on
        if (this.showDiagonal) {
            const l = this.map.l; // diagonal to take
            const k = this.map.k; // points to skip
            const n = this.numVertex; // number of vertices
            
            // draw diagonals
            stroke(color.GREEN);
            for (let i = 0; i < n; i++) {
                line(this.vertices[i%n][0] * this.scale, this.vertices[i%n][1] * this.scale,
                    this.vertices[(i+l)%n][0] * this.scale, this.vertices[(i+l)%n][1] * this.scale
                );

            }

            // draw vertices
            fill(color.RED);
            noStroke();
            for (let i = 0; i < n; i++) {
                const ver1 = this.vertices[i%n];
                const ver2 = this.vertices[(i+l)%n];
                const ver3 = this.vertices[(i-k+2*n)%n];
                const ver4 = this.vertices[(i-k+l+2*n)%n];
                const ver = MathHelper.getIntersection(ver1, ver2, ver3, ver4);
                circle(ver[0] * this.scale, ver[1] * this.scale, 5);
            }
        }

        // draw the ellipse of inertia
        if (this.showEllipse) {
            const Ip = Normalize.getInertiaMatrix(this.vertices);
            const decomp = MathHelper.spectralDecomposition2(Ip);
            const Q = decomp[0];
            const Lambda = decomp[1];
            const theta = Math.atan(Q[1][0] / Q[0][0]);

            // draw the ellipse
            rotate(-theta);
            noFill();
            stroke(color.GREEN);
            ellipse(0, 0, Math.sqrt(Lambda[0][0], 2) * this.scale, Math.sqrt(Lambda[1][1], 2) * this.scale);
            rotate(theta);
        }

        // draw vertices with color red
        if (this.canDrag) {
            fill(color.RED);
            noStroke();
            for (let i = 0; i < this.vertices.length; i++) {
                circle(this.vertices[i][0] * this.scale, this.vertices[i][1] * this.scale, 5);
            }
        }

        translate(-xT, -yT);
    }

    /**
     * Drag a vertex 
     */
    dragVertex() {
        if (this.canDrag) {
            const w = 5 / this.scale;
            const mX = (mouseX - xT) / this.scale;
            const mY = (mouseY - yT) / this.scale;
            let dragging = false;
            for (let i in this.vertices) {
                if (mX - w <= this.vertices[i][0] && mX + w >= this.vertices[i][0] 
                    && mY - w <= this.vertices[i][1] && mY + w >= this.vertices[i][1]
                    && dragging == false) {
                    // clear the number of iterations
                    this.map.numIterations = 0;
                    dragging = true;
                    if (this.inscribed) {
                        const r = Math.sqrt(mX * mX + mY * mY);
                        this.vertices[i] = [mX/r, mY/r, 1];
                    } else {
                        this.vertices[i] = [mX, mY, 1];
                    }
                    this.updateEmbedded();
                    this.updateConvex();
                }
            }
        }
    }

    /**
     * Compute a triangle embedding of the polygon.
     * The embedding is stored in a 3D array E, where E[i][j][k]
     * stores the orientation of the triangle spanned by the vertices
     * i, j, k. 
     * @returns {Array<Array<Array<Number>>>} the embedding array
     */
    triangleEmbedding() {
        // setting up the embedding array
        const n = this.numVertex;
        let E = new Array(n);
        for (let i = 0; i < n; i++) {
            E[i] = new Array(n);
            for (let j = 0; j < n; j++) {
                E[i][j] = new Array(n);
            }
        }

        // populate the values
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                for (let k = 0; k < n; k++) {
                    E[i][j][k] = MathHelper.triangleOrientation(
                        this.vertices[i], this.vertices[j], this.vertices[k]
                    );
                }
            }
        }

        return E;
    }

    /**
     * Compute the energy of the map (as in [Sch24])
     * @returns the energy
     */
    computeEnergy() {
        const n = this.numVertex;
        const l = this.map.l;
        const k = this.map.k;
        const v = this.vertices;
        let energy = 1;
        for (let i = 0; i < n; i++) {
            const l1 = [v[i][0] - v[(i-k+n)%n][0], v[i][1] - v[(i-k+n)%n][1]];
            const l2 = [v[i][0] - v[(i-l+n)%n][0], v[i][1] - v[(i-l+n)%n][1]];
            const l3 = [v[i][0] - v[(i+l)%n][0], v[i][1] - v[(i+l)%n][1]];
            const l4 = [v[i][0] - v[(i+k+n)%n][0], v[i][1] - v[(i+k+n)%n][1]];
            energy *= MathHelper.crossRatio(l1, l2, l3, l4);
        }
        return energy;
    }

    /**
     * Update whether the polygon is embedded
     */
    updateEmbedded() {
        this.embedded = MathHelper.isEmbedded(this.vertices);
    }

    /**
     * Update whether the polygon is convex
     */
    updateConvex() {
        this.convex = MathHelper.isConvex(this.vertices);
    }

    /**
     * Print the information of the polygon
     */
    print() {
        /* 
            Print the info of this polygon
        */
        console.log("This is a polygon with", this.numVertex, "vertices:");
        for (let i = 0; i < this.numVertex; i++) {
            // I don't know how to deal with rounding ups
            console.log("vertex", v, "is at", this.vertices[i][0], this.vertices[i][1]);
        }
    }

    /**
     * Deep clone the vertices
     * @returns {Array<Array<Number>>} a deep clone of the vertices
     */
    cloneVertices() {
        /*
            Return a deep clone of the vertices
        */
        function cloneVector(vector) {
            const x = vector[0]; 
            const y = vector[1];
            const z = vector[2];
            return [x, y, z];
        }
        return this.vertices.map(cloneVector);
    }
}