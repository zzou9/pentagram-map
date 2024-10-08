/**
 * A class that contains the method of applying the pentagram map
 * on vertices of a polygon on the affine plane.
 */
class PentagramMap {
    /**
     * Constructor
     * @param {Number} l diagonal parameter, # vertices skipped
     * @param {Number} k spacing parameter, # vertices skipped
     */
    constructor(l=2, k=1) {
        this.l = l; // the diagonal parameter (# vertices skipped)
        this.k = k; // the spacing parameter (# vertices skipped)
        this.prev = new Array(); // keep charge of previous operations (in the form of vertices)
        this.normalization = "Ellipse";
        this.twisted = false;
        this.power = 1; // the power of the map (# of times to apply the map)
        this.shifts = 0; // shifting the vertices 
        this.numIterations = 0; // number of iterations applied to the map
        this.onlyEmbedded = false; // skip to the nearest embedded power of the map
        this.onlyConvex = false; // skip to the nearest convex power of the map
        this.onlyBird = false; // skip to the nearest power whose image is a bird
        this.squareVertices = [0, 1, 2, 3]; // vertices to use for square normalization
    }

    /**
     * A helper method that applies the map
     * @param {Array<Array<Number>>} vertices vertices of the polygon
     * @param {Number} l diagonal parameter
     * @param {Number} k spacing parameter
     * @param {Number} p number of times to apply the map 
     * @param {String} normalization normalization to apply
     * @param {Boolean} twisted whether the polygon is twisted
     * @param {Number} shifts shifting to the map
     * @returns {Array<Array<Number>>} the resulting homogeneous coordinates of the vertices
     */
    applyMap(vertices, l, k, p, normalization, twisted, shifts) {
        // if the polygon has collapsed to a point or a line, stop applying the map
        if (Geometry.isPoint(vertices)) {
            throw new Error("The polygon collapsed to a point");
        }
        if (Geometry.isLinear(vertices)) {
            throw new Error("The polygon collapsed to a line.");
        }

        const n = vertices.length;
        let newVertices = vertices.map(a => a.slice()); // deep copying the vertices

        for (let i = 0; i < n; i++) {
            // the numbering of the vertices follows from Schwartz's bird paper
            const ver1 = vertices[i%n];
            const ver2 = vertices[(i+l)%n];
            const ver3 = vertices[(i-k+2*n)%n];
            const ver4 = vertices[(i-k+l+2*n)%n];
            const vint = Geometry.getIntersection(ver1, ver2, ver3, ver4);
            newVertices[i] = vint;
        }
        // apply normalization
        if (normalization == "Square") {
            newVertices = Normalize.squareNormalize(
                newVertices, 
                this.squareVertices[0],
                this.squareVertices[1],
                this.squareVertices[2],
                this.squareVertices[3]
            );
        }
        // for twisted bigons
        if (normalization == "SquareT") {
            newVertices = Normalize.twistedSquareNormalize(newVertices);
        }
        if (normalization == "Ellipse") {
            newVertices = Normalize.ellipseNormalize(newVertices);
        }

        // apply shifting to the array
        if (shifts != 0) {
            let tempShift = new Array(n);
            for (let i = 0; i < n; i++) {
                tempShift[(i+shifts)%n] = newVertices[i];
            }
            newVertices = tempShift;
        }

        if (p == 1) {
            return newVertices;
        }

        return this.applyMap(newVertices, l, k, p-1, normalization, twisted, shifts);
    }

    /**
     * Take in a set of vertices and apply the map to it
     * @param {Array<Array<Number>>} vertices vertices to act
     * @param {boolean} [store=true] whether to store the vertex
     * @param {boolean} [countIteration=true] whether to count iterations
     * @returns the vertices of the image polygon of the pentagram map
     */
    act(vertices, store=true, countIteration=true) {
        // record the previous vertices for undo purposes
        if (store) {
            this.store(vertices);
        }

        // only showing embedded powers
        if (this.onlyEmbedded) {
            let count = 0;
            let vTemp = vertices;
            do {
                vTemp = this.applyMap(vTemp, this.l, this.k, this.power, this.normalization, this.twisted, this.shifts);
                if (count > 1000) {
                    console.error("Cannot find power that is embedded.");
                    return vertices;
                }
                count++;
            } while (!Geometry.isEmbedded(vTemp)); 
            
            if (countIteration) {
                this.numIterations += this.power * count;
            }
            return vTemp;
        }

        // only showing convex powers
        if (this.onlyConvex) {
            let vTemp = vertices;
            let count = 0;
            do {
                vTemp = this.applyMap(vTemp, this.l, this.k, this.power, this.normalization, this.twisted, this.shifts);
                if (count > 100000) {
                    console.error("Cannot find power that is convex.");
                    return vertices;
                }
                count++;
            } while (!Geometry.isConvex(vTemp));
                
            if (countIteration) {
                this.numIterations += this.power * count;
            }
            return vTemp;
        }

        if (this.onlyBird) {
            let vTemp = vertices;
            let count = 0;
            do {
                vTemp = this.applyMap(vTemp, this.l, this.k, this.power, this.normalization, this.twisted, this.shifts);
                if (count > 100000) {
                    console.error("Cannot find power that is a " + this.map.l + " bird.");
                    return vertices;
                }
                count++;
            } while (!Geometry.isBird(vTemp, this.l)); 

            if (countIteration) {
                this.numIterations += this.power * count;
            }
            return vTemp;
        }

        // record the number of iterations
        if (countIteration) {
            this.numIterations += this.power;
        }
        return this.applyMap(vertices, this.l, this.k, this.power, this.normalization, this.twisted, this.shifts);
    }

    applyFactor(vertices, k) {
        const n = vertices.length;
        let imgVertices = new Array(n)
        for (let i = 0; i < n; i++) {
            imgVertices[i] = MathHelper.cross(vertices[(-i+n)%n], vertices[(-i-k+2*n)%n]); // see formula
        }
        return imgVertices;
    }

    /**
     * Get the next embedded power of the map
     * @param {Array<Array<Number>>} vertices coordinates of the vertices
     * @returns the next embedded power
     */
    getNextEmbedded(vertices) {
        let count = 0;
        do {
            vertices = this.applyMap(vertices, this.l, this.k, 1, "Ellipse", this.twisted, this.shifts);
            if (count > 1000) {
                return ">1000";
            }
            count++;
        } while (!Geometry.isEmbedded(vertices))
        return count;
    }

    /**
     * Get the next convex power of the map
     * @param {Array<Array<Number>>} vertices coordinates of the vertices
     * @returns the next convex power
     */
    getNextConvex(vertices) {
        let count = 0;
        do {
            vertices = this.applyMap(vertices, this.l, this.k, 1, "Ellipse", this.twisted, this.shifts);
            if (count > 100000) {
                return ">100000";
            }
            count++;
        } while (!Geometry.isConvex(vertices))
        return count;
    }

    /**
     * Get the next bird power of the map
     * @param {Array<Array<Number>>} vertices coordinates of the vertices
     * @returns the next bird power
     */
    getNextBird(vertices) {
        let count = 0;
        do {
            vertices = this.applyMap(vertices, this.l, this.k, 1, "Ellipse", this.twisted, this.shifts);
            if (count > 10000) {
                return ">10000";
            }
            count++;
        } while (!Geometry.isBird(vertices, this.l))
        return count;
    }


    /**
     * Record the previous vertices for undo purposes
     * @param {Array<Array<Number>>} vertices the vertices to store
     */
    store(vertices) {
        this.prev.push([vertices, this.numIterations]);
        if (this.prev.length > 20) {
            this.prev.shift();
        }
    }

    /**
     * A function that checks whether there are any actions to revert
     * @returns {Number} the length of the stored polygons
     */
    canRevert() {
        return this.prev.length;
    }

    /**
     * Revert the last action. Can only revert up to 20 times
     * @returns {Array<Array<Number>>} the vertices of the last stored polygon
     */
    revert() {
        if (this.prev.length === 0) {
            console.log("nothing to revert")
            return null;
        }
        // pop the last set of vertices
        this.numIterations = this.numIterations - this.power;
        return this.prev.pop();
    }

    /**
     * Clear all histories of the revert actions
     */
    clearHistory() {
        this.prev = new Array();
    }
}