/**
 * Helper class for normalization
 */
class Normalize {
    /**
     * Calculates a map M that maps any four vertices 
     * u0, u1, u2, u3 in the following way:
     *  u0 -> [1, 0, 0]
     *  u1 -> [0, 1, 0]
     *  u2 -> [0, 0, 1]
     *  u3 -> [1, 1, 1]
     * we say M is good if it maps the four ui's to scalar multiples of the target 
     */
    static getProjectiveLift(v0, v1, v2, v3) {
        let M = [v0, v1, v2];
        try {
            M = MathHelper.transpose(MathHelper.invert3(M));
        }
        catch (err) {
            throw new Error("The points are not in general position");
        }

        const l = MathHelper.matrixMult(M, MathHelper.vec(v3));

        // check if colinear, throw error
        if (l[0][0] == 0 || l[0][1] == 0 || l[0][2] == 0) {
            throw new Error("The points are not in general position");
        }
        const D = [
            [1/l[0][0], 0, 0],
            [0, 1/l[1][0], 0],
            [0, 0, 1/l[2][0]]
        ];
        return MathHelper.matrixMult(D, M);
    }

    /**
     * Normalize the shape so that the first four vertices are on the unit square
     *  v0 -> [1, 1, 1]
     *  v1 -> [-1, 1, 1]
     *  v2 -> [-1, -1, 1]
     *  v3 -> [1, -1, 1]
     * @param {Array<Array<Number>>} vertices vertices of the polygon
     * @param {number} [i0=0] index of first vertex
     * @param {number} [i1=1] index of second vertex
     * @param {number} [i2=2] index of third vertex
     * @param {number} [i3=3] index of fourth vertex
     * @returns vertices after normalization
     */
    static squareNormalize(vertices, i0=0, i1=1, i2=2, i3=3) {
        const e0 = [1, 1, 1];
        const e1 = [-1, 1, 1];
        const e2 = [-1, -1, 1];
        const e3 = [1, -1, 1];

        const E = this.getProjectiveLift(e0, e1, e2, e3);
        const M = this.getProjectiveLift(vertices[i0], vertices[i1], vertices[i2], vertices[i3]);

        // get the projection map
        const T = MathHelper.matrixMult(MathHelper.invert3(E), M);

        // transform all the vertices 
        let newVertices = new Array(vertices.length);
        for (let i = 0; i < vertices.length; i++) {
            const v = MathHelper.affineTransform(T, vertices[i]);
            if (MathHelper.round(Math.abs(v[2])) != 0) {
                newVertices[i] = [v[0]/v[2], v[1]/v[2], 1];
            } else {
                newVertices[i] = v;
            }
        }
        return newVertices;
    }

    /**
     * Square normalize for twisted polygons. 
     * Fixes the first vertex of the first four iterations.
     * @param {Array<Array<Number>>} vertices vertices of the polygon
     * @param {boolean} [broadcast=true] whether to broadcast the vertices via the monodromy (rotation case)
     * @returns vertices after normalization
     */
    static twistedSquareNormalize(vertices, broadcast=true) {
        const n = vertices.length;
        const k = n / 2; // k-fold rotational symmetry
        const s = n / k;
        const theta = 2 * Math.PI / k; // the angle
        const r = Math.sqrt(2);

        const e0 = [r, 0, 1];
        const e1 = [MathHelper.round(Math.cos(theta)*r), MathHelper.round(Math.sin(theta)*r), 1];
        const e2 = [MathHelper.round(Math.cos(2*theta)*r), MathHelper.round(Math.sin(2*theta)*r), 1];
        const e3 = [MathHelper.round(Math.cos(3*theta)*r), MathHelper.round(Math.sin(3*theta)*r), 1];

        const M = this.getProjectiveLift(vertices[0], vertices[2], vertices[4], vertices[6]);
        const E = this.getProjectiveLift(e0, e1, e2, e3);

        // get the projection map
        const T = MathHelper.matrixMult(MathHelper.invert3(E), M);

        // transform all the vertices 
        let newVertices = new Array(n);
        for (let i = 0; i < vertices.length; i++) {
            const v = MathHelper.affineTransform(T, vertices[i]);
            // error if v is not on the affine plane
            if (v[2] == 0) {
                throw new Error("v is on the line at infinity!");
            }
            newVertices[i] = [v[0]/v[2], v[1]/v[2], 1];
        }

        if (broadcast) {
            newVertices = this.broadcastVertices(newVertices.map(a => a.slice()));
        }

        return newVertices;
    }

    /**
     * Broadcast the first 2 vertices to the others via the monodromy
     */
    static broadcastVertices(vertices) {
        if (vertices.length % 2 != 0) {
            throw new Error("This is not a twisted bigon");
        }
        const s = vertices.length / 2;
        const theta = Math.PI * 2 / s;
        const A0 = vertices[0];
        const A1 = vertices[1];
        for (let i = 1; i < s; i++) {
            vertices[2*i] = [
                Math.cos(i*theta) * A0[0] - Math.sin(i*theta) * A0[1],
                Math.sin(i*theta) * A0[0] + Math.cos(i*theta) * A0[1], 
                1
            ];
            vertices[2*i+1] = [
                Math.cos(i*theta) * A1[0] - Math.sin(i*theta) * A1[1],
                Math.sin(i*theta) * A1[0] + Math.cos(i*theta) * A1[1], 
                1
            ];
        }
        return vertices;
    }

    /**
     * Get the center of mass of the polygon. The polygon is assumed to have point mass evenly
     * distributed to its vertices.
     * @param {Array<Array<Number>>} vertices the vertices to take the center of mass
     * @returns {Array<Number>} the vector that represents the center of mass of the polygon
     */
    static getCenterOfMass(vertices) {
        const n = vertices.length;
        let x0 = 0;
        let y0 = 0;
        for (let i = 0; i < n; i++) {
            x0 = x0 + vertices[i][0]; 
            y0 = y0 + vertices[i][1];
        }
        const x = x0 / n;
        const y = y0 / n;
        return [x, y, 1];
    }

    /**
     * Translate the vertices so that the center of mass lies at (0, 0, 1).
     * @param {Array<Array<Number>>} vertices the vertices to normalize
     * @returns {Array<Array<Number>>} the list of vertex coordinates normalized to center of mass.
     */
    static normalizeCOM(vertices) {
        const v0 = Normalize.getCenterOfMass(vertices);
        let vNew  = new Array(vertices.length);
        for (let i = 0; i < vertices.length; i++) {
            const x = vertices[i][0] - v0[0];
            const y = vertices[i][1] - v0[1];
            vNew[i] = [x, y, 1];
        }
        return vNew;
    }

    /**
     * Get the inertia matrix of the polygon with respect to the origin. 
     * Here the polygon assumed to have its center of mass at the origin. 
     * @param {Array<Array<Number>>} vertices vertices to derive inertia matrix
     * @returns {Array<Array<Number>>} the inertia matrix
     */
    static getInertiaMatrix(vertices) {
        /**
         * Helper method for inertia calculation
         * @param {Array<Array<Number>>} vertices vertices coordinates centered at COM
         * @param {Number} x0 x weights
         * @param {Number} y0 y weights
         * @returns {Number} the inertia value
         */
        function inertia(vertices, x0, y0) {
            let total = 0;
            for (let i = 0; i < vertices.length; i++) {
                const s = x0 * vertices[i][0] + y0 * vertices[i][1];
                total = total + s * s;
            }
            return total / vertices.length;
        }

        // normalize
        const vn = Normalize.normalizeCOM(vertices);
        const ixx = inertia(vn, 1, 0);
        const iyy = inertia(vn, 0, 1);
        const ixy = 0.5 * (inertia(vn, 1, 1) - ixx - iyy);
        const Ip = [
            [ixx, -ixy],
            [-ixy, iyy]
        ];
        return Ip;
    }

    /**
     * Normalize the vertices of a polygon so that the ellipse of inertia 
     * is the unit circle.
     * @param {Array<Array<Number>>} vertices homogeneous coordinates of vertices to normalize
     * @returns {Array<Array<Number>>} normalized homogeneous coordinates
     */
    static ellipseNormalize(vertices) {
        // calculate the new coordinates
        let newVertices = new Array(vertices.length);
        const normalizedVert = Normalize.normalizeCOM(vertices);
        const Ip = Normalize.getInertiaMatrix(normalizedVert);

        // get the spectral decomposition of the inertia matrix
        let decomp = MathHelper.spectralDecomposition2(Ip);
        const Q = decomp[0];
        const Qt = MathHelper.transpose(Q);
        const L = decomp[1];
        const sqrtInvL = [
            [1 / Math.sqrt(L[0][0]), 0], 
            [0, 1 / Math.sqrt(L[1][1])]
        ];

        for (let i = 0; i < normalizedVert.length; i++) {
            const vec = [[normalizedVert[i][0]], [normalizedVert[i][1]]];
            const result = MathHelper.matrixMult(Qt, MathHelper.matrixMult(sqrtInvL, MathHelper.matrixMult(Q, vec)));
            const xNew = MathHelper.round(result[0][0]);
            const yNew = MathHelper.round(result[1][0]);
            newVertices[i] = [xNew, yNew, 1];
        }
        return newVertices;
    }

    /**
     * Apply a projective transformation that changes the square normalization to a triangle normalization
     *  (0,0,1) -> (0,0,1)
     *  (1,0,1) -> (1,0,1)
     *  (1,1,1) -> (0.5,1,1)
     *  (0,1,1) -> (0,5,0.25,1)
     * @param {Array<number>} v the original vertex
     * @returns the image vertex
     */
    static squareToTriangle(v) {
        // const M = [[-1, 4/3, 0], [0, 2/3, 0], [-2, 5/3, 1]]; // projective transformation 
        const M = [
            [-0.175, 0.2, 0],
            [0, 0.05, 0],
            [-0.95, 0.225, 0.775]
        ]; // projective transformation 
        let vNew = MathHelper.matrixMult(M, MathHelper.vec(v));
        return [vNew[0][0], vNew[1][0], vNew[2][0]];
    }
}