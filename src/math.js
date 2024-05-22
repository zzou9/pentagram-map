const r = 10; // default digit to round to

class MathHelper {
    /*
        vector and matrix operations
    */

    static invert2(mat) {
        // invert a 2x2 matrix
        const det = mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
        // check invertibility
        if (det == 0) {
            console.error("Matrix is not invertible");
            return null;
        }
        let inverse = [
            [mat[1][1] / det, -mat[0][1] / det],
            [-mat[1][0] / det, mat[0][0] / det]
        ];
        return inverse;
    }
    
    static matrixMult(mat1, mat2) {
        // calculate the product of two matrices
        // mat1 is m-by-n, mat2 is n-by-k
        // the product should be m-by-k
        const m = mat1.length;
        const n = mat2.length;
        const k = mat2[0].length;
    
        // Check if matrices are valid for multiplication
        if (mat1[0].length != n) {
            console.error("Matrices cannot be multiplied: Invalid dimensions.");
            return null;
        }
    
        // Initialize the result matrix with zeros
        let result = new Array(m);
        for (let i = 0; i < m; i++) {
            result[i] = new Array(k);
        }
    
        // Perform matrix multiplication
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < k; j++) {
                result[i][j] = 0;
                for (let l = 0; l < n; l++) {
                    result[i][j] = result[i][j] + mat1[i][l] * mat2[l][j];
                }
            }
        }
        return result;
    }

    static det3(mat) {
        /*
            Compute the determinant of a 3x3 matrix
        */
        const a = mat[0][0] * mat[1][1] * mat[2][2];
        const b = mat[0][0] * mat[1][2] * mat[2][1];
        const c = mat[0][1] * mat[1][0] * mat[2][2];
        const d = mat[0][1] * mat[1][2] * mat[2][0];
        const e = mat[0][2] * mat[1][0] * mat[2][1];
        const f = mat[0][2] * mat[1][1] * mat[2][0];
        return a - b - c + d + e - f;
    }

    static checkAffineTransform(T) {
        /*
            Check whether a projective transformation fixes the line at infinity
        */
        const v1 = this.matrixMult(T, [[1], [0], [0]]);
        const v2 = this.matrixMult(T, [[0], [1], [0]]);
        console.log(T);
        console.log(v1, v2);
        if (v1[2][0] != 0 || v2[2][0] != 0) {
            return false;
        }
        return true;
    }

    static affineTransform(T, v) {
        /* 
            Apply the affine transformation T on v 
            (provided that T is an affine transform)
        */

        // apply the affine transform on the vector
        const vert = [[v.x], [v.y], [1]];
        const result = this.matrixMult(T, vert);

        // error if v is not on the affine plane
        if (result[2][0] == 0) {
            console.error("v is on the line at infinity!");
            return null;
        }

        const x = this.round(result[0][0] / result[2][0], r);
        const y = this.round(result[1][0] / result[2][0], r);
        return createVector(x, y);
    }

    static fourToFourProjection(s, t) {
        /*
            Takes in two lists of four points in general position of the projective plane. 
            Return the projective transformation that sends the first list of points
            to the second list of points. 
            This is the same as solving a linear equation.

            Params:
                - s: the four vertices of the source given in 4-by-3 matrix
                    where each row is the homogeneous coordinate
                - t: the four vertices of the target given in 4-by-3 matrix
                    where each row is the homogeneous coordinate
        */

        // // normalize s
        // for (let i = 0; i < s.length; i++) {
        //     for (let j = 0; j < s[0].length; j++) {
        //         s[i][j] = this.round(s[i][j], r);
        //     }
        // }

        // populate the augmented matrix 
        const A = [
            [s[0][0], s[0][1], s[0][2], 0, 0, 0, 0, 0, 0, -t[0][0], 0, 0, 0], 
            [0, 0, 0, s[0][0], s[0][1], s[0][2], 0, 0, 0, -t[0][1], 0, 0, 0],
            [0, 0, 0, 0, 0, 0, s[0][0], s[0][1], s[0][2], -t[0][2], 0, 0, 0], 
            [s[1][0], s[1][1], s[1][2], 0, 0, 0, 0, 0, 0, 0, -t[1][0], 0, 0], 
            [0, 0, 0, s[1][0], s[1][1], s[1][2], 0, 0, 0, 0, -t[1][1], 0, 0],
            [0, 0, 0, 0, 0, 0, s[1][0], s[1][1], s[1][2], 0, -t[1][2], 0, 0], 
            [s[2][0], s[2][1], s[2][2], 0, 0, 0, 0, 0, 0, 0, 0, -t[2][0], 0], 
            [0, 0, 0, s[2][0], s[2][1], s[2][2], 0, 0, 0, 0, 0, -t[2][1], 0],
            [0, 0, 0, 0, 0, 0, s[2][0], s[2][1], s[2][2], 0, 0, -t[2][2], 0], 
            [s[3][0], s[3][1], s[3][2], 0, 0, 0, 0, 0, 0, 0, 0, 0, -t[3][0]], 
            [0, 0, 0, s[3][0], s[3][1], s[3][2], 0, 0, 0, 0, 0, 0, -t[3][1]],
            [0, 0, 0, 0, 0, 0, s[3][0], s[3][1], s[3][2], 0, 0, 0, -t[3][2]]
        ];

        // solve for the linear system using Gaussian elimination
        const AR = this.computeRREF(A);
        const T = [
            [-AR[0][12], -AR[1][12], -AR[2][12]], 
            [-AR[3][12], -AR[4][12], -AR[5][12]], 
            [-AR[6][12], -AR[7][12], -AR[8][12]]
        ];

        // const x = [[-AR[0][12]], [-AR[1][12]], [-AR[2][12]], 
        //     [-AR[3][12]], [-AR[4][12]], [-AR[5][12]], 
        //     [-AR[6][12]], [-AR[7][12]], [-AR[8][12]], 
        //     [-AR[9][12]], [-AR[10][12]], [-AR[11][12]], [1]
        // ]
        // console.log("multiplying A by x", this.matrixMult(A, x));

        return T;
    }

    static computeRREF(matrix) {
        /*
            Compute the reduced row echelon form of a rectangular matrix
        */ 

        // Make a copy of the matrix to avoid modifying the original
        const m = matrix.map(row => [...row]);
    
        let lead = 0;
        const rowCount = m.length;
        const colCount = m[0].length;
    
        for (let r = 0; r < rowCount; r++) {
            if (colCount <= lead) {
                return;
            }
    
            let i = r;
            while (m[i][lead] === 0) {
                i++;
                if (rowCount === i) {
                    i = r;
                    lead++;
                    if (colCount === lead) {
                        return;
                    }
                }
            }
    
            // Swap the rows
            const temp = m[i];
            m[i] = m[r];
            m[r] = temp;
    
            // Normalize the pivot row
            const val = m[r][lead];
            for (let j = 0; j < colCount; j++) {
                m[r][j] /= val;
            }
    
            // Eliminate other rows
            for (let i = 0; i < rowCount; i++) {
                if (i !== r) {
                    const val = m[i][lead];
                    for (let j = 0; j < colCount; j++) {
                        m[i][j] -= val * m[r][j];
                    }
                }
            }
            lead++;
        }
    
        return m;
    }

    static round(number, digit) {
        /*   
            round a number to the nearest digit 
        */
        const scale = Math.pow(10, digit);
        const scaledNumber = number * scale;
        const roundedScaledNumber = Math.round(scaledNumber);
        return roundedScaledNumber / scale;
    }
}
