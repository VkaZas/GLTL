const fs = require('fs');
let mat = [];
const miu = 0.00001;
const theta = 0.00001;
const beta = 0.5;
const alpha = 0.8;

/** Generate an N*N matrix where C is at the corner, D is near the wall, and A,B randomly placed **/
function generateMatrix(n) {
    let mat = [];
    let idx = [];
    for (let i=0; i<n*n; i++) idx.push(i);

    for (let i=0; i<n; i++) {
        for (let j=0; j<n; j++) {
            mat[i*n+j] = 'N';
        }
    }

    // generate C position
    // let randC = parseInt(4*Math.random());
    let randC = 1;
    // console.log('randC: ' + randC);
    const posDicC = [0, n-1, n*(n-1), n*n-1];
    mat[posDicC[randC]] = 'C';
    // console.log(posDicC[randC]);
    removeByValue(idx, posDicC[randC]);
    // console.log(idx);

    // generate D
    let idxD = [];
    for (let i=0; i<n; i++) {
        idxD.push(i);
        idxD.push(n*(n-1)+i);
    }
    for (let i=1; i<n-1; i++) {
        idxD.push(n*i);
        idxD.push(n*i+n-1);
    }
    removeByValue(idxD, posDicC[randC]);
    // let randD = parseInt(idxD.length*Math.random());
    let randD = 5;
    // console.log('randD: ' + randD);
    // console.log(idxD.length);
    mat[idxD[randD]] = 'D';
    // console.log(idxD[randD]);
    removeByValue(idx, idxD[randD]);
    // console.log(idx);

    //generate A B
    // let randA = parseInt((n*n-2)*Math.random());
    let randA = 10;
    // console.log('randA: ' + randA);
    mat[idx[randA]] = 'A';
    // console.log(idx[randA]);
    removeByValue(idx, idx[randA]);
    // console.log(idx);

    // let randB = parseInt((n*n-3)*Math.random());
    let randB = 15;
    // console.log('randB: ' + randB);
    // console.log(idx[randB]);

    // console.log(idx);
    mat[idx[randB]] = 'B';
    removeByValue(idx, idx[randB]);

    return mat;



}

function removeByValue(arr, val) {
    for(let i=arr.length-1; i>=0; i--) {
        if(arr[i] === val) {
            arr.splice(i, 1);
            break;
        }
    }
}

/** Print the generated matrix **/
function printMatrix(mat, n) {
    for (let i=0; i<n; i++) {
        let str = '';
        for (let j=0; j<n; j++) {
            str+= mat[i*n+j] + ' ';
        }
        console.log(str);
    }
}

/** Tree structure **/
class Node {
    constructor(op, val, lc = null, rc = null, pa = null, complex = 0, atoms = 0) {
        this.op = op;  // 0 for operands, 1 for single operator, 2 for bi operator
        this.val = val;
        this.lc = lc;
        this.rc = rc;
        this.pa = pa;
        this.depth = 1;
        this.complex = complex;
        this.atoms = atoms;

        if (this.op === 0) {
            switch (this.val) {
                case 'A':
                    this.atoms = 1 << 3;
                    break;
                case 'B':
                    this.atoms = 1 << 2;
                    break;
                case 'C':
                    this.atoms = 1 << 1;
                    break;
                case 'D':
                    this.atoms = 1;
                    break;
            }
        }
    }

    addLc(node) {
        this.lc = node;
        this.depth = Math.max(this.depth, node.depth + 1);
        node.pa = this;
        let cnt = 0;
        if (!!this.lc) cnt += this.lc.complex;
        if (!!this.rc) cnt += this.rc.complex;
        this.complex = cnt + 1;
        this.atoms |= this.lc.atoms;
    }

    addRc(node) {
        this.rc = node;
        this.depth = Math.max(this.depth, node.depth + 1);
        node.pa = this;
        let cnt = 0;
        if (!!this.lc) cnt += this.lc.complex;
        if (!!this.rc) cnt += this.rc.complex;
        this.complex = cnt + 1;
        this.atoms |= this.rc.atoms;
    }

    replicate() {
        let res = new Node(this.op, this.val, this.lc, this.rc, this.pa, this.complex, this.atoms);
        if (!!res.lc) {
            res.lc = res.lc.replicate();
            res.lc.pa = res;
        }
        if (!!res.rc) {
            res.rc = res.rc.replicate();
            res.rc.pa = res;
        }
        return res;
    }

    equal(node) {
        if (this.val !== node.val) return false;
        if (this.op === 0 && this.val === node.val) return true;

        let resL = true, resR = true;

        if (!!this.lc) {
            if (!!node.lc) resL = this.lc.equal(node.lc);
            else resL = false;
        } else {
            resL = !node.lc;
        }

        if (!!this.rc) {
            if (!!node.rc) resR = this.rc.equal(node.rc);
            else resR = false;
        } else {
            resR = !node.rc;
        }

        return resL && resR;
    }

    print(log = true) {
        if (this.op === 0) {
            if (!this.pa)
                if (log) console.log(this.val);
            return this.val;
        }

        let res = '';
        if (this.op === 2)
            res = '(' + this.lc.print() + ' ' + this.val + ' ' + this.rc.print() + ')';

        if (this.op === 1)
            res = this.val + ' ' + this.lc.print();

        if (!this.pa)
        {
            if (log)
                console.log(res + ' ' + this.complex);
            return res;
        }


        return res;
    }

    getQuadTuple() {
        let res = {'A':null, 'B':null, 'C':null, 'D':null};
        if (this.op === 0) {
            res[this.val] = {mark:1, pow:0};
            return res;
        }

        if (!!this.lc) {
            let lRes = this.lc.getQuadTuple();
            for (let key in lRes) {
                if (res[key] === null) res[key] = lRes[key];
            }
        }

        if (this.rc) {
            let rRes = this.rc.getQuadTuple();
            for (let key in rRes) {
                if (res[key] === null) res[key] = rRes[key];
                else if (rRes[key] !== null) {
                    res[key].mark *= rRes[key].mark;
                    res[key].pow += rRes[key].pow;
                }
            }
        }

        for (let key in res) {
            if (res[key] !== null) {
                if (this.val === 'eventually') res[key].pow++;
                else if (this.val === 'not') res[key].mark *= -1;
            }
        }

        return res;
    }
}



let hypoList = [hypoEventually, hypoAlways, hypoNot, hypoAnd, hypoOr];

/** Generate hypnosis aim tasks **/
function makeNewTasks(defaultTask, learnedTask) {
    let resTaskList = [];

    // assemble original tasks with 'and', 'eventually', 'or', 'always', 'not'
    for (let i=0; i<defaultTask.length; i++) {
        let L = defaultTask[i];
        if (L.val !== 'always' && L.val !== 'not')
            resTaskList.push(hypoAlways(L));
        if (L.val !== 'eventually' && L.val !== 'not')
            resTaskList.push(hypoEventually(L));
        if (L.val !== 'not')
            resTaskList.push(hypoNot(L));

        for (let j=i+1; j<defaultTask.length; j++) {
            // need to delete LTLs like 'T and always T', 'T or always T'
            let R = defaultTask[j];
            if (R.val === 'always') {
                if (L.equal(R.lc)) {
                    continue;
                }
            } else if (L.val === 'always') {
                if (R.equal(L.lc)) {
                    continue;
                }
            }

            if ((L.atoms & R.atoms) === 0) {  // No overlapping chars
                let flag = true;
                if (L.op === 0 && R.op === 0) flag = false;
                if ((L.val === 'always' || R.val === 'always') && (L.val === 'always' && R.val !== 'not') || (R.val === 'always' && L.val !== 'not')) flag = false;
                if (flag === true)
                    resTaskList.push(hypoAnd(L, R));

                flag = true;
                if (L.val === R.val) flag = false;
                if (flag === true)
                    resTaskList.push(hypoOr(L, R));
            }

        }
    }

    return resTaskList;
}

function printDistCoef(mat, char) {
    console.log('Dist Coef for ' + char);
    for (let i=0; i<5; i++) {
        let str = '';
        for (let j=0; j<5; j++) {
            let d = dist(mat, i*5+j, char);
            str += parseInt(Math.pow(beta, d) * 100) / 100.0 + ' ';
            // str += d + ' ';
        }
        console.log(str);
    }
}

function printDistScore(mat, distChar, qTuple) {
    console.log('Dist Score for ' + distChar);
    for (let i=0; i<5; i++) {
        let str = '';
        for (let j=0; j<5; j++) {
            let d = distScore(mat, i*5+j, distChar, qTuple);
            str += d + ' ';
            // str += d + ' ';
        }
        console.log(str);
    }
}

function distScore(mat, s0, distChar, qTuple) {
    let d = dist(mat, s0, distChar);
    return Math.pow(beta, d) * Math.pow(alpha, qTuple[distChar].pow) * qTuple[distChar].mark;
}

function dist(mat, src, distChar) {
    let target = -1;
    for (let i=0; i<mat.length; i++)
        if (mat[i] === distChar) {
            target = i;
            break;
        }
    let res = Math.abs(Math.floor(target/5) - Math.floor(src/5)) + Math.abs(target % 5 - src % 5);
    return res;
}

function judge(s0, task) {
    let RETRY_SWITCH = false;
    let res = {s1: null, term: null};
    res.s1 = judgeState(s0, task);
    res.term = judgeTerm(s0, task);

    return res;

    function judgeState(s0, task) {
        let quadTuple = task.getQuadTuple();
        let dests = [];

        // validate 5 potential destinations
        if (s0 - 5 >= 0)
            dests.push(s0-5);
        if (s0 + 5 <25)
            dests.push(s0+5);
        if (s0 % 5 !== 0)
            dests.push(s0-1);
        if ((s0+1)%5 !== 0)
            dests.push(s0+1);

        let tmpCnt = 0;
        let occupy = false;
        for (let key in quadTuple) {
            if (quadTuple[key] !== null) {
                tmpCnt++;
                if (key === mat[s0]) occupy = true;
            }
        }
        if (!(tmpCnt > 1 && occupy === true)) dests.push(s0);

        // which dest possess maximum score
        let maxScore = -2147483647, targetDest = -1;
        for (let dest of dests) {
            let score = 0;
            for (let key in quadTuple)
                if (quadTuple[key] !== null) {
                    score += distScore(mat, dest, key, quadTuple);
                }
            if (score > maxScore) {
                maxScore = score;
                targetDest = dest;
            }
        }

        return targetDest;
    }

    /** Output acc/rej/tbd (1/-1/0) **/
    function judgeTerm(s0, task) {
        let res;
        if (task.op === 0) {
            if (mat[s0] === task.val) return 1;
            else return -1;
        }

        if (task.op === 1) {
            switch (task.val) {
                case 'not':
                    res = judgeTerm(s0, task.lc);
                    if (res === 1) return -1;
                    else if (res === 0) return 0;
                    else return 1;
                    break;
                case 'eventually':
                    res = judgeTerm(s0, task.lc);
                    if (res === 1) return 1;
                    else if (res === -1) {
                        let rand = Math.random();
                        if (rand < miu) return -1;
                        else {
                            RETRY_SWITCH = true;
                            return 0;
                        }
                    } else if (res === 0) {
                        let rand = Math.random();
                        if (rand < miu) return -1;
                        else return 0;
                    }
                    break;
                case 'always':
                    res = judgeTerm(s0, task.lc);
                    if (res === -1) return -1;
                    else if (res === 1) {
                        let rand = Math.random();
                        if (rand < 1 - theta) {
                            RETRY_SWITCH = true;
                            return 0;
                        }
                        else return 1;
                    } else if (res === 0) {
                        let rand = Math.random();
                        if (rand < theta) return 1;
                        else return 0;
                    }

            }
        }

        if (task.op === 2) {
            let res1, res2;
            switch (task.val) {
                case 'and':
                    res1 = judgeTerm(s0, task.lc);
                    res2 = judgeTerm(s0, task.rc);
                    if (res1 === 1)
                        if (res2 === 1) return 1;
                    if (res1 === -1 || res2 === -1)
                        return -1;
                    return 0;
                    break;
                case 'or':
                    let nodeNG = hypoNot(task.lc);
                    let nodeNT = hypoNot(task.rc);
                    let nodeAnd = hypoAnd(nodeNG, nodeNT);
                    let nodeTarget = hypoNot(nodeAnd);
                    return judgeTerm(s0, nodeTarget);
            }
        }
    }
}

/** Main **/
function main(targetTask) {
    /** Array of all the subtrees of target LTL binary tree **/
    let roots = [];
    let fbCnt = 0;
    let succeed = true;
    /** Initial atomic tasks(transactions) **/
    let defaultTask = [
        new Node(0, 'A', null, null, null),
        new Node(0, 'B', null, null, null),
        new Node(0, 'C', null, null, null),
        new Node(0, 'D', null, null, null),
    ];

    // generate 5*5 grid with ABCD
    mat = generateMatrix(5);
    // printMatrix(mat, 5);

    let feedbackTable = [];

    // init targetTask
    getSubtrees(targetTask);
    roots.sort((node1, node2) => {
        return node1.depth < node2.depth ? 1 : -1;
    });

    let resStr = update();

    // console.log(fbCnt);
    return [resStr, fbCnt, succeed];

    function update() {
        let learnedTask = null;
        let finalTask = null;
        let validGrid = [];
        // generate action-task judgement table
        for (let k=0; k<roots.length; k++) {

            // delete sub-trees of learnedTask from defaultTask list (except for A, B, C, D)
            for (let g=0; g<k; g++) {
                learnedTask = roots[g];
                if (!!learnedTask) {
                    for (let i=defaultTask.length - 1; i>=0; i--) {
                        if (defaultTask[i].op === 0);
                        else if (learnedTask.op === 1) {
                            if (learnedTask.lc.equal(defaultTask[i]))
                                defaultTask.splice(i, 1);
                        } else if (learnedTask.op === 2) {
                            if (learnedTask.lc.equal(defaultTask[i]) || learnedTask.rc.equal(defaultTask[i]))
                                defaultTask.splice(i, 1);
                        }
                    }
                }
            }

            let tbd = makeNewTasks(defaultTask, learnedTask);

            // delete sub-trees of learnedTask from tbd list
            for (let g=0; g<k; g++) {
                learnedTask = roots[g];
                if (!!learnedTask) {
                    for (let i=tbd.length - 1; i>=0; i--) {
                        if (tbd[i].op === 0);
                        else if (learnedTask.op === 1) {
                            if (learnedTask.lc.equal(tbd[i]))
                                tbd.splice(i, 1);
                        } else if (learnedTask.op === 2) {
                            if (learnedTask.lc.equal(tbd[i]) || learnedTask.rc.equal(tbd[i]))
                                tbd.splice(i, 1);
                        }
                    }
                }
            }

            // console.log('Learning: ');
            // roots[k].print();

            // for (let node of tbd) {
            //     node.print();
            // }

            // console.log('Current task:');
            // roots[k].print();

            validGrid = [];
            for (let i=0; i<25; i++) validGrid[i] = i;
            let nextState = -1;
            while (tbd.length > 1 && validGrid.length > 0) {
                feedbackTable = [];
                // for (let node of tbd) {
                //     node.print();
                // }
                // console.log('\n' + 'Feedback Table:' + '\n');
                for (let i=0; i<25; i++) {
                    let str = '';
                    for (let j=0; j<tbd.length; j++) {
                        let G = tbd[j];
                        feedbackTable[i * tbd.length + j] = judge(i, G);
                        str += '{' + feedbackTable[i * tbd.length + j].s1 + ', ' + feedbackTable[i * tbd.length + j].term + '}';
                    }
                    // console.log('Row ' + i + ' ' + str);
                }

                // put s1 to next state or randomly select first position to go
                let idx = nextState === -1 ? validGrid[parseInt(validGrid.length * Math.random())] : nextState;
                removeByValue(validGrid, idx);

                // console.log('idx: ' + idx + ' len: ' + tbd.length);


                let trainerFeedback = judge(idx, roots[k]);
                // console.log('TrainerFeedback: ' + trainerFeedback.s1 + ' ' + trainerFeedback.term + ' idx ' + idx);
                // roots[k].print();
                fbCnt++;
                // console.log('tranerfeedback: '+trainerFeedback)
                let tmpLen = tbd.length;
                // console.log('action: ' + transaction.s0 + ' ' + transaction.s1);
                let sumMap = new Map();
                for (let i=tmpLen-1; i>=0; i--) {
                    let nowFeedback = feedbackTable[idx * tmpLen + i];
                    if (nowFeedback.s1 !== trainerFeedback.s1 ||
                        nowFeedback.term !== trainerFeedback.term) {

                        // console.log('Idx: ' + idx + ' S0S1' + transaction.s0 + ' ' + transaction.s1 + ' col_tbd: ' + i)
                        // console.log(tbd[i].print());
                        // console.log(feedbackTable[idx * tmpLen + i])
                        // console.log(judgeTerm(transaction.s0, transaction.s1, tbd[i]));
                        tbd.splice(i, 1);
                    } else {
                        let res = sumMap.get(nowFeedback.s1);

                        // already used this grid
                        if (validGrid.indexOf(nowFeedback.s1) === -1) continue;

                        if (res === undefined)
                            sumMap.set(nowFeedback.s1, 1);
                        else sumMap.set(nowFeedback.s1, res + 1);
                    }
                }

                let maxSum = -1;
                nextState = -1;
                for (let [key, val] of sumMap) {
                    if (val > maxSum) {
                        maxSum = val;
                        nextState = key;
                    }
                }

                if (tbd.length === 1) break;

                // if (1==1) {
                //     console.log('Unable to decide: --------------------------------------')
                //     for (let node of tbd) {
                //         node.print()
                //     }
                // }
            }

            if (tbd.length === 1) {
                defaultTask.push(finalTask = tbd[0]);
                // console.log('Learned: ');
                // tbd[0].print();
            } else {
                // console.log('Learning:');
                // roots[k].print();
                console.log('Unable to decide ============================');
                for (let node of tbd) {
                    node.print();
                }
                console.log('=============================================')
            }

        }

        //fail
        if (!finalTask || !finalTask.equal(targetTask)) {
            succeed = false;
        }
        if (!!finalTask)
            return finalTask.print(false);
        else return null;
    }

    /** Get all the subtrees of target LTL binary tree **/
    function getSubtrees(node) {
        if (!!node.lc)
            getSubtrees(node.lc);
        if (!!node.rc)
            getSubtrees(node.rc);

        if (node.op > 0) {
            let tmpNode = node.replicate();
            tmpNode.pa = null;
            roots.push(tmpNode);
        }
    }
}

/**  eventually C and always not A or B **/
function task1() {
    let targetTask = new Node(2, 'and');
    let nodeC = new Node(0, 'C');
    let nodeA = new Node(0, 'A');
    let nodeB = new Node(0, 'B');

    let nodeEvC = hypoEventually(nodeC);
    let nodeAB = hypoOr(nodeA, nodeB);
    let nodeNot = hypoNot(nodeAB);
    let nodeAlw = hypoAlways(nodeNot);
    targetTask.addLc(nodeEvC);
    targetTask.addRc(nodeAlw);

    return targetTask;
}

/** eventually A and eventually always D **/
function task2() {
    let targetTask = new Node(2, 'and');

    let nodeEv = new Node(1, 'eventually');
    let nodeA = new Node(0, 'A');

    let nodeEv2 = new Node(1, 'eventually');
    let nodeAlw = new Node(1, 'always');
    let nodeD = new Node(0, 'D');

    nodeEv.addLc(nodeA);
    nodeAlw.addLc(nodeD);
    nodeEv2.addLc(nodeAlw);
    targetTask.addLc(nodeEv);
    targetTask.addRc(nodeEv2);

    return targetTask;
}

/**  always eventually C and eventually D **/
function task3() {
    let targetTask = new Node(1, 'always');
    let nodeC = new Node(0, 'C');
    let nodeD = new Node(0, 'D');

    let nodeEv = hypoEventually(nodeD);
    let nodeAnd = hypoAnd(nodeC, nodeEv);

    let nodeEv2 = hypoEventually(nodeAnd);

    targetTask.addLc(nodeEv2);

    return targetTask;
}

function task4() {
    let targetTask = new Node(2, 'and');
    let nodeD = new Node(0, 'D');
    let nodeA = new Node(0, 'A');
    let nodeB = new Node(0, 'B');

    let nodeRight = hypoAlways(hypoNot(nodeD));
    let nodeLeft = hypoEventually(hypoAnd(nodeA, hypoEventually(nodeB)));
    targetTask.addLc(nodeLeft);
    targetTask.addRc(nodeRight);

    return targetTask;
}

function task5() {
    let targetTask = new Node(1, 'always');
    let nodeC = new Node(0, 'C');
    let nodeD = new Node(0, 'D');
    let nodeB = new Node(0, 'B');
    let nodeA = new Node(0, 'A');

    // let nodeEv = hypoAlways(hypoEventually(nodeD));
    // let nodeAnd = hypoAnd(nodeC, nodeEv);
    //
    // let nodeEv2 = hypoEventually(nodeAnd);
    //
    // targetTask.addLc(nodeEv2);
    //
    // return hypoOr(hypoAnd(targetTask, hypoAlways(hypoNot(nodeB))), hypoAlways(nodeA));
    return hypoNot(hypoEventually(nodeA));
}

let targetTask = task3();

let taskList = [task1, task2, task3, task4, task5];
let fileList = ['task1.tsv', 'task2.tsv', 'task3.tsv', 'task4.tsv', 'task5.tsv'];

function loop() {
    for (let task=1; task<2; task++) {
        let cnt = 0, num, str, succeed;
        for (let i=0; i<100; i++) {
            [str, num, succeed] = main(taskList[task]());
            fs.appendFile(fileList[task], i + ',' + str + ',' + num + '\n');
        }
    }
}

// loop();

function makeTasksWithDepth(depth) {
    let resList = [new Node(0, 'A'), new Node(0, 'B'), new Node(0, 'C'), new Node(0, 'D')];
    let head = 0, rear;

    for (let i=1; i<=depth; i++) {
        rear = resList.length;
        for (let j = 0; j < rear; j++) {
            let L = resList[j];
            if (L.complex + 1 === i) {
                if (L.val !== 'always' && L.val !== 'not')
                    resList.push(hypoAlways(L));
                if (L.val !== 'eventually' && L.val !== 'not')
                    resList.push(hypoEventually(L));
                if (L.val !== 'not')
                    resList.push(hypoNot(L));
            }

            for (let k = j + 1; k < rear; k++) {
                let R = resList[k];
                if (L.complex + R.complex + 1 === i) {
                    // need to delete LTLs like 'T and always T', 'T or always T'
                    if (R.val === 'always') {
                        if (L.equal(R.lc)) {
                            continue;
                        }
                    } else if (L.val === 'always') {
                        if (R.equal(L.lc)) {
                            continue;
                        }
                    }

                    if ((L.atoms & R.atoms) === 0) {  // No overlapping chars
                        let flag = true;
                        if (L.op === 0 && R.op === 0) flag = false;
                        if ((L.val === 'always' || R.val === 'always') && (L.val === 'always' && R.val !== 'not') || (R.val === 'always' && L.val !== 'not')) flag = false;
                        if (flag === true)
                            resList.push(hypoAnd(L, R));

                        flag = true;
                        if (L.val === R.val) flag = false;
                        if (flag === true)
                            resList.push(hypoOr(L, R));
                    }

                }
            }
        }
        head = rear;
    }

    for (let node of resList) {
        node.print();
    }

    console.log(resList.length);

    return resList;
}

// let testTaskList = makeTasksWithDepth(5);

function loopMain(task, times) {
    let str, num, succeed, cnt = 0;
    for (let i=0; i<times; i++) {
        [str, num, succeed] = main(task);
        if (succeed === true) cnt++;
    }
    return cnt / times;
}

// let cnt = 0;
// for (let node of testTaskList) {
//     let file = 'resultHuman_5.txt', str = '';
//     let acc = loopMain(node, 20);
//     str += cnt++ + ', ' + node.print() + ', ' + acc + '\n';
//     fs.appendFile(file, str);
//     console.log(acc + ' ' + cnt)
// }

// let nodeA = new Node(0, 'A');
// console.log(_judge(11, hypoNot(nodeA)));
// console.log(_judge(11, hypoNot(hypoEventually(nodeA))));





