/**
 * A class designed specifically for twisted bigons
 */
class TwistedPolygon{ 

    /**
     * Constructor
     * @param {Map31} map the (3, 1) map associated to the polygon
     * @param {Number} scale scaling when plotting
     */
    constructor(map, 
        scale=(windowWidth + windowHeight)/15) {
        this.map = map;
        this.n = 2;
        this.cornerCoords = new Array(4);
        this.energyCoords = new Array(4);
        this.YCoords = new Array(4);
        this.flags = new Array(2);
        this.chi = new Array(2);
        this.F1 = 1;
        this.F2 = 1;
        this.F3 = 1;
        this.F4 = 1;
        this.numVertexToShow = 6;
        this.verticesToShow = new Array(this.numVertexToShow);

        // dual vertices obtained from y-coords
        this.dualVerticesToShow = new Array(this.numVertexToShow);
        this.vertexSize = 8;
        this.canDrag = false;
        this.showDual = false;
        this.triangleNormalize = false;
        this.scale = scale; 
        this.vertexColor = [color.RED, color.GREEN, color.ORANGE, color.CYAN, color.YELLOW, color.PURPLE];

        // Trajectory control
        this.showTrajectory = [false, false]; // an array storing whether to show the trajectories
        this.iteration = [10, 10]; // number of iterations to show (exponential 2)
        this.trajSize = [2, 2]; // size of the trajectory
        this.trajectory = [new Array(), new Array()];
        this.cornerCoordTraj = new Array();

        // Monodromy of the twisted polygon
        this.monodromy = new Array(3);
        this.eigenvalues = new Array(3);
        this.dualMonodromy = new Array(3);
        this.Mdual = new Array(3);
        this.omega1 = 0;
        this.omega2 = 0;
        this.Y;

        this.setDefault();
    }

    /**
    * Update the information of the bigon:
    * - Vertices to display
    * - Trajectory
    * - Monodromy lift
    * - Invariants from the monodromy
    * @param {boolean} [updateTrajectory=false] whether to update the trajectory
    * @param {boolean} [resetReference=false] whether to reset the reference coordinates
    */
    updateInfo(updateTrajectory=false, resetReference=false) {
        this.updateMonodromy();
        this.updateEnergyCoords();
        this.updateYCoords();
        this.updateVertices();
        this.updateEigenvalues();
        this.updateInvariantsFromMonodromyLift();
        this.updateTrajCtrl();
        if (updateTrajectory) {
            this.getTrajectory();
        }
        if (resetReference) {
            this.referenceCoords = this.cornerCoords;
            this.map.numIterations = 0;
        }
        this.updateFlags();
        this.updateChi();
    }

    /**
     * Update the visualization of the bigon
     */
    updateVertices() {
        this.verticesToShow = Reconstruct.reconstructMonodromy(this.monodromy, this.cornerCoords, this.n, this.numVertexToShow);
        if (this.showDual) {
            this.dualVerticesToShow = Reconstruct.reconstructMonodromy(this.Mdual, this.YCoords, this.n, this.numVertexToShow);
        }
        if (this.triangleNormalize) {
            for (let i = 0; i < this.numVertexToShow; i++) {
                this.verticesToShow[i] = Normalize.squareToTriangle(this.verticesToShow[i]);
            }
        }
    }

    /**
     * Compute a lift of the monodromy (and its dual) of the twisted bigon
     * The twisted bigon has a canonical representation of its first six vertices 
     * where the first four vertices are on the unit square
     * The monodromy is calculated by finding a lift T such that 
     * T maps vertices 3, 4, 5, 6 back to the vertices of the unit square
     * The dual monodromy is computed as follows:
     *  Suppose the monodromy T = [T0, T1, T2]
     *  Then, a lift of T^* can be obtained thru 
     *  T^* = [T1 x T2, T2 x T0, T0 x T1]
     *  where "x" denotes the cross product of two vectors
     */
    updateMonodromy() {
        // first, compute the lift of the monodromy
        const v = Reconstruct.reconstruct3(this.cornerCoords, this.n+4);
        const M1 = Normalize.getProjectiveLift(v[0], v[1], v[2], v[3]);
        const M2 = Normalize.getProjectiveLift(v[this.n], v[this.n+1], v[this.n+2], v[this.n+3]);
        const M2Inv = MathHelper.invert3(M2);
        this.monodromy = MathHelper.matrixMult(M2Inv, M1);
        // next, compute the lift of the dual
        const T = MathHelper.transpose(this.monodromy);
        const Tdual = [
            MathHelper.cross(T[1], T[2]), 
            MathHelper.cross(T[2], T[0]),
            MathHelper.cross(T[0], T[1])
        ];
        this.dualMonodromy = MathHelper.transpose(Tdual);

        if (this.showDual) {
            const v = Reconstruct.reconstruct3(this.YCoords, this.n+4);
            const M1 = Normalize.getProjectiveLift(v[0], v[1], v[2], v[3]);
            const M2 = Normalize.getProjectiveLift(v[this.n], v[this.n+1], v[this.n+2], v[this.n+3]);
            const M2Inv = MathHelper.invert3(M2);
            this.Mdual = MathHelper.matrixMult(M2Inv, M1);
        }
    }

    /**
     * Update the eigenvalues of the monodromy
     */
    updateEigenvalues() {
        const T = this.monodromy;
        const det = MathHelper.det3(T);
        const Tnormal = [
            [T[0][0]/det, T[0][1]/det, T[0][2]/det],
            [T[1][0]/det, T[1][1]/det, T[1][2]/det],
            [T[2][0]/det, T[2][1]/det, T[2][2]/det]
        ];
        const evals = MathHelper.eigenvalue3(Tnormal);
        if (evals[3] == 1) {
            this.eigenvalues = [
                MathHelper.round(evals[0], 5).toString(),
                MathHelper.round(evals[1], 5).toString(),
                MathHelper.round(evals[2], 5).toString()
            ];
        } else {
            this.eigenvalues = [
                MathHelper.round(evals[0], 5).toString(),
                evals[1].toString(),
                evals[2].toString()
            ];
        }
    }

    /**
     * Compute the two invariants of the monodromy given in Sch07
     * Omega_1 = tr(T)^3 / det(T)
     * Omega_2 = tr(T^*)^3 / det(T^*)
     */
    updateInvariantsFromMonodromyLift() {
        const c1 = MathHelper.characteristicPoly3(this.monodromy);
        const c2 = MathHelper.characteristicPoly3(this.dualMonodromy);
        this.omega1 = Math.pow(c1[0], 3) / c1[2];
        this.omega2 = Math.pow(c2[0], 3) / c2[2];
    }
    
    /**
     * Update the energy coordinates given by the cross ratio of (k,l) map
     */
    updateEnergyCoords() {
        this.energyCoords = Geometry.translate21To31(this.cornerCoords.slice());
        // update energy, O, E
        this.F1 = 1;
        this.F2 = 1;
        this.F3 = 1;
        for (let i = 0; i < this.n; i++) {
            this.F1 *= this.cornerCoords[2*i] / (this.cornerCoords[2*i] - 1);
            this.F2 *= this.cornerCoords[2*i+1] / (this.cornerCoords[2*i+1] - 1);
            this.F3 *= (this.cornerCoords[2*i] / this.cornerCoords[2*i+1]);
        }
        this.F4 = this.F2 * this.F3 / this.F1;
    }

    /**
     * Compute the flags of a twisted polygon
     */
    updateFlags() {
        const n = this.n;
        const k = this.map.k;
        const v = Reconstruct.reconstructMonodromy(this.monodromy, this.cornerCoords, n, n+k+3);
        this.flags = new Array(n);
        for (let i = 0; i < n; i++) {
            let v1 = v[i+2];
            let v2 = Geometry.getIntersection(v[i+1], v[i+k+1], v[i+2], v[i+k+2]);
            let v3 = Geometry.getIntersection(v[i+2], v[i+k+2], v[i+3], v[i+k+3]);
            let v4 = v[i+k+2];
            this.flags[i] = Geometry.inverseCrossRatio(v1, v2, v3, v4);
        }
    }

    /**
     * Compute the energy of each vertex
     */
    updateChi() {
        const n = this.n;
        const k = this.map.k;
        const v = Reconstruct.reconstructMonodromy(this.monodromy, this.cornerCoords, n, k+n+2);
        this.chi = new Array(n);
        for (let i = 0; i < n; i++) {
            let v1 = v[i+1];
            let v2 = MathHelper.cross(MathHelper.cross(v[i+1], v[i+k+1]), MathHelper.cross(v[i], v[i+k]));
            let v3 = MathHelper.cross(MathHelper.cross(v[i+1], v[i+k+1]), MathHelper.cross(v[i+2], v[i+k+2]));
            let v4 = v[i+k+1];

            // let v1 = MathHelper.cross(v[i+k],v[i]);
            // let v2 = MathHelper.cross(v[i+k],v[i+k-1]);
            // let v3 = MathHelper.cross(v[i+k],v[i+k+1]);
            // let v4 = MathHelper.cross(v[i+k],v[i+2*k]);

            this.chi[(i+1)%n] = Geometry.inverseCrossRatio(v1, v2, v3, v4);
        }
        this.Y = 1;
        for (let i = 0; i < n; i++) {
            this.Y *= this.chi[i];
        }
    }

    /**
     * Update the y-coordinates given by the corner invariants
     */
    updateYCoords() {
        this.YCoords = new Array(this.cornerCoords.length);
        for (let i = 0; i < this.cornerCoords.length; i++) {
            this.YCoords[i] = this.cornerCoords[i] / (this.cornerCoords[i] - 1);
        }
    }

    /**
     * Compute the l2 distance from the corner coordinates of the 
     * current itertaion to the corner coordinates of itertaion 0
     * @returns The l2 distance of the corner coordinates
     */
    getDistanceToReference() {
        return MathHelper.l2dist(this.cornerCoords, this.referenceCoords);
    }

    /**
     * Compute the two invariants in [Sch07] 
     * @returns [Omega_1, Omega_2] from [Sch07]
     */
    updateInvariantsFromPoly() {
        const x = this.cornerCoords;
        // Compute Omega_1
        const num1 = Math.pow(1 - x[1] - x[3], 3);
        const denom1 = Math.pow(x[1] * x[3], 2) * (x[0] * x[2]);
        this.omega1 = num1 / denom1;
        // Compute Omega_2
        const num2 = Math.pow(1 - x[0] - x[2], 3);
        const denom2 = Math.pow(x[0] * x[2], 2) * (x[1] * x[3]);
        this.omega2 = num2 / denom2;
        return [this.omega1, this.omega2];
    }

    /**
     * Update the trajectory controls based on number of vertices
     */
    updateTrajCtrl() {
        const nPrev = this.showTrajectory.length;
        if (nPrev < this.n) {
            this.showTrajectory.push(false); // an array storing whether to show the trajectories
            this.iteration.push(10); // number of iterations to show (exponential 2)
            this.trajSize.push(2); // size of the trajectory
            this.trajectory.push(new Array());
        } else if (nPrev > this.n) {
            this.showTrajectory.splice(nPrev, this.n-nPrev);
            this.iteration.splice(nPrev, this.n-nPrev);
            this.trajSize.splice(nPrev, this.n-nPrev);
            this.trajectory.splice(nPrev, this.n-nPrev);
        }
    }

    /**
    * Set the vertices back to default (regular 8-gon)
    */
    setDefault() {
        // first, find the corner coordinates of a regular 8-gon
        const n = Math.max(4, this.map.k+1);
        let vertices = new Array(n);
        const angle = TWO_PI / n;
        for (let i = 0; i < n; i++) {
            vertices[i] = [cos(angle*i), sin(angle*i), 1];
        }
        const coords = Geometry.getCornerCoords(vertices);

        // update corner coordinates
        this.cornerCoords = new Array(2*this.n);
        for (let i = 0; i < 2*this.n; i++) {
            this.cornerCoords[i] = coords[i%2];
        }
        
        // default number of vertices to show
        this.numVertexToShow = this.n+4;

        // compute the coords of the vertices to show
        this.updateInfo(true, true);
    }

    /**
     * Set the vertices to a random type-alpha 3-spiral.
     */
    randomTypeAlphaThree() {
        for (let i = 0; i < this.n; i++) {
            let x = random();
            if (x == 0) {x = 0.5;}
            let y = random();
            if (y == 0) {y = 0.5;}
            this.cornerCoords[2*i] = x; // even corner invariants are in (0, 1)
            this.cornerCoords[2*i+1] = y / (y-1); // odd corner invariants are in (-infty, 0)
        }
        this.updateInfo(true, true);
    }

    /**
     * Set the vertices to a random type-beta 3-spiral.
     */
    randomTypeBetaThree() {
        for (let i = 0; i < this.n; i++) {
            let x = random();
            if (x == 0) {x = 0.5;}
            let y = random();
            if (y == 0) {y = 0.5;}
            this.cornerCoords[2*i] = 1 / (1 - x); // even corner invariants are in (1, infty)
            this.cornerCoords[2*i+1] = y; // odd corner invariants are in (0, 1)
        }
        this.updateInfo(true, true);
    }

    /**
     * Set the vertices to a random type-beta 2-spiral.
     */
    randomTypeBetaTwo() {
        for (let i = 0; i < this.n; i++) {
            let x = random();
            if (x == 0) {x = 0.5;}
            let y = random();
            if (y == 0) {y = 0.5;}
            let r = random();
            if (r < 0.5) {
                this.cornerCoords[2*i] = 1 / (1 - x); // even corner invariants > 0
            } else {
                this.cornerCoords[2*i] = x; // even corner invariants > 0
            }
            this.cornerCoords[2*i+1] = y / (y-1); // odd corner invariants < 0
        }
        this.updateInfo(true, true);
    }

    /**
    * Reset the polygon to some given corner coordinates
    * @param {Array<Array<Number>>} coords the coords of the polygon to set to
    */
    resetToCoords(coords) {
        this.cornerCoords = coords;
        this.updateInfo(true, true);
    }

    /**
    * Display the polygon
    * @param {number} [xt=xT] x axis translation
    * @param {number} [yt=yT] y axis translation
    */
    show(xt=xT, yt=yT) {
        // translate the coordinate system 
        translate(xt, yt);

        // draw dual vertices
        if (this.showDual) {
            // draw edges
            fill(255, 255, 255, 0);
            stroke(color.WHITE);
            beginShape();
            for (let i = 0; i < this.numVertexToShow; i++) {
                if (MathHelper.round(this.dualVerticesToShow[i][2]) == 0) {
                    throw new Error("Vertex " + i.toString() + " is not on the affine patch");
                }
                const x = this.dualVerticesToShow[i][0] / this.dualVerticesToShow[i][2];
                const y = this.dualVerticesToShow[i][1] / this.dualVerticesToShow[i][2];
                vertex((2*x-1) * this.scale, (1-2*y) * this.scale);
            }
            endShape();

            // draw vertices
            fill(color.CYAN);
            noStroke();
            for (let i = 0; i < this.dualVerticesToShow; i++) {
                if (MathHelper.round(this.dualVerticesToShow[i][2]) == 0) {
                    throw new Error("Vertex " + i.toString() + " is not on the affine patch");
                }
                const x = this.dualVerticesToShow[i][0] / this.dualVerticesToShow[i][2];
                const y = this.dualVerticesToShow[i][1] / this.dualVerticesToShow[i][2];
                circle((2*x-1) * this.scale, (1-2*y) * this.scale, 3);
            }
        }

        // draw edges
        fill(255, 255, 255, 127);
        stroke(255, 255, 255);
        strokeWeight(3);
        beginShape();
        for (let i = 0; i < this.numVertexToShow; i++) {
            if (MathHelper.round(this.verticesToShow[i][2]) == 0) {
                throw new Error("Vertex " + i.toString() + " is not on the affine patch");
            }
            const x = this.verticesToShow[i][0] / this.verticesToShow[i][2];
            const y = this.verticesToShow[i][1] / this.verticesToShow[i][2];
            vertex((2*x-1) * this.scale, (1-2*y) * this.scale);
        }
        endShape();
        strokeWeight(1);

        // draw vertices
        fill(color.WHITE);
        noStroke();
        for (let i = 0; i < this.numVertexToShow; i++) {
            if (MathHelper.round(this.verticesToShow[i][2]) == 0) {
                throw new Error("Vertex " + i.toString() + " is not on the affine patch");
            }
            const x = this.verticesToShow[i][0] / this.verticesToShow[i][2];
            const y = this.verticesToShow[i][1] / this.verticesToShow[i][2];
            circle((2*x-1) * this.scale, (1-2*y) * this.scale, 3);
        }

        // emphasize vertices to drag
        if (this.canDrag) {
            for (let i = 0; i < this.n; i++) {
                fill(this.vertexColor[i%6]);
                stroke(color.BLACK);
                if (MathHelper.round(this.verticesToShow[i+4][2]) == 0) {
                    throw new Error("Vertex 1 is not on the affine patch");
                }
                const x1 = this.verticesToShow[i+4][0] / this.verticesToShow[i+4][2];
                const y1 = this.verticesToShow[i+4][1] / this.verticesToShow[i+4][2];
                circle((2*x1-1) * this.scale, (1-2*y1) * this.scale, this.vertexSize);
            }
        }

        // display trajectories
        for (let i = 0; i < this.n; i++) {
            if (this.showTrajectory[i]) {
                fill(this.vertexColor[i%6]);
                noStroke();
                for (let j = 0; j < this.trajectory[i].length; j++) {
                    if (MathHelper.round(this.trajectory[i][j][2] == 0)) {
                        continue;
                    }
                    if (this.triangleNormalize) {
                        let v = Normalize.squareToTriangle(this.trajectory[i][j]);
                        let x = v[0] / v[2];
                        let y = v[1] / v[2];
                        circle((2*x-1) * this.scale, (1-2*y) * this.scale, this.trajSize[i]);
                    } 
                    else {
                        let x = this.trajectory[i][j][0]  / this.trajectory[i][j][2];
                        let y = this.trajectory[i][j][1] / this.trajectory[i][j][2];
                        circle((2*x-1) * this.scale, (1-2*y) * this.scale, this.trajSize[i]);
                    }
                }
            }
        }

        translate(-xt, -yt);
    }

    /**
    * Drag a vertex 
    * @param {number} [xt=xT] x axis translation
    * @param {number} [yt=yT] y axis translation
    * @param {number} [scale=this.scale] scaling of the polygon
    */
    dragVertex(xt=xT, yt=yT, scale=this.scale) {
        if (this.canDrag) {
            const w = 10 / scale;
            const mX = (mouseX - xt) / scale;
            const mY = (mouseY - yt) / scale;
            for (let i = 4; i < this.n+4; i++) {
                const x = this.verticesToShow[i][0] / this.verticesToShow[i][2];
                const y = this.verticesToShow[i][1] / this.verticesToShow[i][2];
                if (mX - w <= (2*x-1) && mX + w >= (2*x-1) && mY - w <= (1-2*y) && mY + w >= (1-2*y)) {
                    try {
                        // record the new vertex and check whether the bigon breaks
                        this.verticesToShow[i] = [(1+mX)/2, (1-mY)/2, 1];
                        // change the corner coordinates accordingly, also change the rest of the vertices
                        const tempCoords = Geometry.getCornerCoords(this.verticesToShow.map(a => a.slice()));
                        for (let j = 0; j < 2*this.n; j++) {
                            if (!Number.isFinite(tempCoords[j+4]) || tempCoords[j+4] == 0) {
                                throw new Error("The points of the polygon are not in general positions");
                            }
                            this.cornerCoords[j] = tempCoords[j+4];
                        }
                        // clear the number of iterations
                        this.updateInfo(true, true);
                    }
                    catch (err) {
                        console.log(err);
                        break;
                    }
                }
            }
        }
    }
    

    /**
     * Get the trajectories of vertex 1
     */
    getTrajectory() {
        let getTraj = false;
        for (let i = 0; i < this.n; i++) {
            if (this.showTrajectory[i]) {
                getTraj = true;
            }
        }
        if (getTraj) {
            const maxIter = Math.pow(2, Math.max(...this.iteration));
            // clear cache
            for (let i = 0; i < this.n; i++) {
                this.trajectory[i] = new Array();
            }
            this.cornerCoordTraj = new Array(maxIter);
            let temp = this.cornerCoords.slice(); // deep copy the vertices
            for (let i = 0; i < maxIter; i++) {
                try {
                    temp = this.map.act(temp, false, false, false);
                    this.cornerCoordTraj[i] = temp;
                    const v = Reconstruct.reconstruct3(temp, this.n+4);
                    for (let j = 0; j < this.n; j++) {
                        if (this.showTrajectory[j] && i < Math.pow(2, this.iteration[j])) {
                            this.trajectory[j].push(v[j+4]);
                        }
                    }
                }
                catch (err) {
                    break;
                }
            }
        } 
    }

    /**
     * Print the first three coords of the trajectory
     */
    printTrajectory() {
        let repl = 'x0,x1,x2\n';
        for (let i = 0; i < this.cornerCoordTraj.length; i++) {
            repl = repl + this.cornerCoordTraj[i][0].toString() + ',' + this.cornerCoordTraj[i][1].toString() + ',' + this.cornerCoordTraj[i][2].toString() + '\n'
        } 
        console.log(repl);
    }


    /**
     * Compute the two invariants from the (3, 1) coordinates
     * @returns [Omega_1, Omega_2]
     */
    getInvariantsFrom31() {
    }

}