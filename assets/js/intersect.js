
function issamepoint(p1, p2) {
    return p1.dist(p2) < 0.1;
}

function findLineIntersection(u, w, v, z) {
    var uw = p5.Vector.sub(w, u);
    var vz = p5.Vector.sub(z, v);
    var uv = p5.Vector.sub(v, u);
    let beta = uw.angleBetween(vz);
    if (beta < radians(0.1))
        return false;
    let alfa = uw.angleBetween(uv);

    var vz_ = p5.Vector.sub(z, v);
    vz_.normalize();
    var mmag = -uv.mag() * sin(alfa) / sin(beta);
    if (mmag < 0 || mmag > vz.mag())
        return false;
    vz_.mult(mmag);
    var res = p5.Vector.add(v, vz_);
    return res;
}


function onSegment(p, q, r) {
    if (q.x <= max(p.x, r.x) && q.x >= min(p.x, r.x) &&
        q.y <= max(p.y, r.y) && q.y >= min(p.y, r.y))
        return true;

    return false;
}

function triorientation(p, q, r) {
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    var val = (q.y - p.y) * (r.x - q.x) -
        (q.x - p.x) * (r.y - q.y);

    if (val == 0) return 0;  // collinear

    return (val > 0) ? 1 : 2; // clock or counterclock wise
}

function doLinesIntersect(p1, q1, p2, q2) {
    // Find the four orientations needed for general and
    // special cases
    var o1 = triorientation(p1, q1, p2);
    var o2 = triorientation(p1, q1, q2);
    var o3 = triorientation(p2, q2, p1);
    var o4 = triorientation(p2, q2, q1);

    // General case
    if (o1 != o2 && o3 != o4)
        return true;

    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;

    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;

    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;

    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;

    return false; // Doesn't fall in any of the above cases
}


function isinside(point, poly) {
    let wn = 0;

    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        let pi = poly[i];
        let pj = poly[j];

        if (pj.y <= point.y) {
            if (pi.y > point.y) {
                if (isLeft(pj, pi, point) > 0) {
                    wn++;
                }
            }
        } else {
            if (pi.y <= point.y) {
                if (isLeft(pj, pi, point) < 0) {
                    wn--;
                }
            }
        }
    }
    return wn != 0;
};

function isLeft(P0, P1, P2) {
    let res = ((P1.x - P0.x) * (P2.y - P0.y)
        - (P2.x - P0.x) * (P1.y - P0.y));
    return res;
}