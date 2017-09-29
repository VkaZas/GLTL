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
export class ILTL {
    constructor(settings) {
        // default settings
        Object.assign(this, {
            // constants
            miu: 0.00001,
            theta: 0.00001,
            beta: 0.5,
            alpha: 0.5,
            matrixSize: 5,  // useless for now
            hypoList: [ILTL.hypoEventually, ILTL.hypoAlways, ILTL.hypoNot, ILTL.hypoAnd, ILTL.hypoOr],
            
            // variables
            mat: [],
            roots: [],
            defaultTask: [
                new Node(0, 'A', null, null, null),
                new Node(0, 'B', null, null, null),
                new Node(0, 'C', null, null, null),
                new Node(0, 'D', null, null, null),
            ],
            TBDTask: [],
            subTask: [],
            validGrid: [],
            feedbackTable: [],
            learntTask: null,
            targetTask: null,
            currentTask: null,
            currentTaskIndex: 0,
            succeedLastRound: true,
            finish: () => {
                alert('Training finished');
            }
        });
        
        // customized settings override
        Object.assign(this, settings);
        console.log(settings)
    }

    /** member methods **/

    // entry method
    init() {
        this.generateMatrix();
        this._generateSubtrees(this.targetTask);
        this.subTask.sort((node1, node2) => {
            return node1.depth < node2.depth ? 1 : -1;
        });
    }

    initSubTask() {
        let self = this;

        // resulting a clean TBDTask list for task candidates
        cleanSubTask(this.defaultTask, this.learntTask);
        this._makeNewTasks();
        cleanSubTask(this.TBDTask, this.learntTask);

        // reset valid grid to _judge visited grid
        for (let i=0; i<25; i++)
            this.validGrid[i] = i;

        this.currentTask = this.subTask[this.currentTaskIndex];
        // console.log(this.currentTask);
        
        function cleanSubTask(taskArr, task) {
            for (let g=0; g<taskArr.length; g++) {
                // task = self.subTask[g];
                if (!!task) {
                    for (let i=taskArr.length - 1; i>=0; i--) {
                        if (taskArr[i].op === 0);
                        else if (task.op === 1) {
                            if (task.lc.equal(taskArr[i]))
                                taskArr.splice(i, 1);
                        } else if (task.op === 2) {
                            if (task.lc.equal(taskArr[i]) || task.rc.equal(taskArr[i]))
                                taskArr.splice(i, 1);
                        }
                    }
                }
            }
        }
    }

    calcNextMove(pos) {
        if (pos === -1) {
            pos = this.validGrid[parseInt(this.validGrid.length * Math.random())];
        }
        // ILTL.removeByValue(this.validGrid, pos);

        // console.log('[calcNextMove]: TBDTask = ', this.TBDTask);

        let tmpLen = this.TBDTask.length;

        this.feedbackTable = [];
        console.log('[calcNextMove]: ');
        for (let i=0; i<tmpLen; i++) {
            this.feedbackTable[i] = this._judge(pos, this.TBDTask[i]);
            console.log(this.TBDTask[i].print(false) + ' : ' + this.feedbackTable[i].s1 + ' ' + this.feedbackTable[i].term);
        }

        // console.log('[calcNextMove]: feedbackTable = ', this.feedbackTable);

        let sumMap = new Map(), maxSum = -1, nextState = null;
        for (let i=0; i<tmpLen; i++) {
            let nowFeedback = this.feedbackTable[i];
            let res = sumMap.get(nowFeedback);

            // already used this grid
            if (this.validGrid.indexOf(nowFeedback.s1) === -1) continue;

            if (res === undefined)
                sumMap.set(nowFeedback, 1);
            else sumMap.set(nowFeedback, res + 1);

            if (sumMap.get(nowFeedback) > maxSum) {
                maxSum = sumMap.get(nowFeedback);
                nextState = nowFeedback;
            }
        }

        if (nextState !== null) return nextState;
        else {
            console.log('DEAD!!');
            alert('Failed!');
            return {
                s1: -1,
                term: 0
            }
        }
    }

    // updater
    filterByFeedback(fb, state) {
        console.log(state);
        let tmpLen = this.TBDTask.length;
        for (let i=tmpLen - 1; i>=0; i--) {
            let thisState = this.feedbackTable[i];
            if (fb === true) {
                if (state.term === 0) {
                    if (thisState.s1 !== state.s1 || thisState.term !== state.term)
                        this.TBDTask.splice(i, 1);
                } else {
                    if (thisState.term !== state.term)
                        this.TBDTask.splice(i, 1);
                }

            } else {
                if (state.term === 0) {
                    if (thisState.s1 === state.s1 && thisState.term === state.term)
                        this.TBDTask.splice(i, 1);
                } else {
                    if (thisState.term === state.term)
                        this.TBDTask.splice(i, 1);
                }

            }
        }

        // Learn success, go to next task
        if (this.TBDTask.length === 1) {
            this.learntTask = this.TBDTask[0];
            this.currentTaskIndex++;
            this.defaultTask.push(this.learntTask);
            if (this.currentTask.equal(this.targetTask))
            {
                if (this.finish instanceof Function)
                    console.log("Finished");
                    this.finish();
            }
            return this.learntTask;
        } else return 0;
    }

    predictByFeedback(fb, state) {
        let res = [];
        let tmpLen = this.TBDTask.length;
        for (let i=tmpLen - 1; i>=0; i--) {
            let thisState = this.feedbackTable[i];
            if (fb === false) {
                if (state.term === 0) {
                    if (thisState.s1 !== state.s1 || thisState.term !== state.term)
                        res.push(this.TBDTask[i].print(false));
                } else {
                    if (thisState.term !== state.term)
                        res.push(this.TBDTask[i].print(false));
                }

            } else {
                if (state.term === 0) {
                    if (thisState.s1 === state.s1 && thisState.term === state.term)
                        res.push(this.TBDTask[i].print(false));
                } else {
                    if (thisState.term === state.term)
                        res.push(this.TBDTask[i].print(false));
                }

            }
        }
        return res;

    }

    generateMatrix() {
        let n = this.matrixSize;
        let mat = [];
        let idx = [];
        for (let i=0; i<n*n; i++) idx.push(i);
    
        for (let i=0; i<n; i++) {
            for (let j=0; j<n; j++) {
                mat[i*n+j] = 'N';
            }
        }
    
        // generate C position
        let randC = parseInt(4*Math.random());
        // let randC = 1;
        // console.log('randC: ' + randC);
        const posDicC = [0, n-1, n*(n-1), n*n-1];
        mat[posDicC[randC]] = 'C';
        // console.log(posDicC[randC]);
        ILTL.removeByValue(idx, posDicC[randC]);
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
        ILTL.removeByValue(idxD, posDicC[randC]);
        let randD = parseInt(idxD.length*Math.random());
        // let randD = 5;
        // console.log('randD: ' + randD);
        // console.log(idxD.length);
        mat[idxD[randD]] = 'D';
        // console.log(idxD[randD]);
        ILTL.removeByValue(idx, idxD[randD]);
        // console.log(idx);
    
        //generate A B
        let randA = parseInt((n*n-2)*Math.random());
        // let randA = 10;
        // console.log('randA: ' + randA);
        mat[idx[randA]] = 'A';
        // console.log(idx[randA]);
        ILTL.removeByValue(idx, idx[randA]);
        // console.log(idx);
    
        let randB = parseInt((n*n-3)*Math.random());
        // let randB = 15;
        // console.log('randB: ' + randB);
        // console.log(idx[randB]);
    
        // console.log(idx);
        mat[idx[randB]] = 'B';
        ILTL.removeByValue(idx, idx[randB]);

        this.mat = mat;
        return mat;
    }

    printMatrix() {
        let n = this.matrixSize;
    for (let i=0; i<n; i++) {
        let str = '';
        for (let j=0; j<n; j++) {
            str+= this.mat[i*n+j] + ' ';
        }
        console.log(str);
    }
}

    // This method should only be called at the moment when a new task just has been learnt
    revert() {
        this.defaultTask.splice(this.defaultTask.length - 1, 1);
        this.currentTaskIndex--;
        this.learntTask = null;
    }

    _makeNewTasks() {
        let resTaskList = [];

        // assemble original tasks with 'and', 'eventually', 'or', 'always', 'not'
        for (let i=0; i<this.defaultTask.length; i++) {
            let L = this.defaultTask[i];
            if (L.val !== 'always' && L.val !== 'not')
                resTaskList.push(ILTL.hypoAlways(L));
            if (L.val !== 'eventually' && L.val !== 'not')
                resTaskList.push(ILTL.hypoEventually(L));
            if (L.val !== 'not')
                resTaskList.push(ILTL.hypoNot(L));

            for (let j=i+1; j<this.defaultTask.length; j++) {
                // need to delete LTLs like 'T and always T', 'T or always T'
                let R = this.defaultTask[j];
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
                        resTaskList.push(ILTL.hypoAnd(L, R));

                    flag = true;
                    if (L.val === R.val) flag = false;
                    if (flag === true)
                        resTaskList.push(ILTL.hypoOr(L, R));
                }

            }
        }

        this.TBDTask = resTaskList;
        return resTaskList;
    }

    _distScore(s0, distChar, qTuple) {
        let d = this._dist(s0, distChar);
        // console.log('[_distScore]: params = ',s0, distChar, qTuple);
        return Math.pow(this.beta, d) * Math.pow(this.alpha, qTuple[distChar].pow) * qTuple[distChar].mark;
    }

    _dist(src, distChar) {
        let target = -1;
        for (let i=0; i<this.mat.length; i++)
            if (this.mat[i] === distChar) {
                target = i;
                break;
            }
        // console.log('[_dist]: target = ', target);
        return Math.abs(Math.floor(target / 5) - Math.floor(src / 5)) + Math.abs(target % 5 - src % 5);
    }

    _judge(s0, task) {
        // console.log('[_judge]: s0 = ' + s0, task);
        let res = {s1: null, term: null};
        let self = this;
        res.s1 = judgeState(s0, task);
        res.term = judgeTerm(s0, task);

        return res;

        function judgeState(s0, task) {
            let quadTuple = task.getQuadTuple();
            let dests = [];

            // validate 5 potential destinations, left -> up -> right -> down
            if (s0 % 5 !== 0)
                dests.push(s0-1);
            if (s0 - 5 >= 0)
                dests.push(s0-5);
            if ((s0+1)%5 !== 0)
                dests.push(s0+1);
            if (s0 + 5 <25)
                dests.push(s0+5);



            let tmpCnt = 0;
            let occupy = false;
            for (let key in quadTuple) {
                if (quadTuple[key] !== null) {
                    tmpCnt++;
                    if (key === self.mat[s0]) occupy = true;
                }
            }
            if (!(tmpCnt > 1 && occupy === true)) dests.push(s0);
            // console.log('[judgeState]: dests = ', dests);
            // console.log('[judgeState]: quadTuple = ', quadTuple);

            // which dest possess maximum score
            let maxScore = -2147483647, targetDest = -1;
            for (let dest of dests) {
                let score = 0;
                for (let key in quadTuple)
                    if (quadTuple[key] !== null) {
                        score += self._distScore(dest, key, quadTuple);
                        // console.log('[judgeState]: score = ', score);
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
                if (self.mat[s0] === task.val) return 1;
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
                        // console.log(res);
                        if (res === 1) return 1;
                        else if (res === -1) {
                            let rand = Math.random();
                            // console.log(rand,' ', self.miu);
                            if (rand < self.miu) return -1;
                            else {
                                return 0;
                            }
                        } else if (res === 0) {
                            let rand = Math.random();
                            if (rand < self.miu) return -1;
                            else return 0;
                        }
                        break;
                    case 'always':
                        res = judgeTerm(s0, task.lc);
                        if (res === -1) return -1;
                        else if (res === 1) {
                            let rand = Math.random();
                            if (rand < 1 - self.theta) {
                                return 0;
                            }
                            else return 1;
                        } else if (res === 0) {
                            let rand = Math.random();
                            if (rand < self.theta) return 1;
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
                        let nodeNG = ILTL.hypoNot(task.lc);
                        let nodeNT = ILTL.hypoNot(task.rc);
                        let nodeAnd = ILTL.hypoAnd(nodeNG, nodeNT);
                        let nodeTarget = ILTL.hypoNot(nodeAnd);
                        return judgeTerm(s0, nodeTarget);
                }
            }
        }
    }

    _generateSubtrees(node) {
        if (!!node.lc)
            this._generateSubtrees(node.lc);
        if (!!node.rc)
            this._generateSubtrees(node.rc);

        if (node.op > 0) {
            let tmpNode = node.replicate();
            tmpNode.pa = null;
            this.subTask.push(tmpNode);
        }
    }

    /** static methods **/

    static removeByValue(arr, val) {
    for(let i=arr.length-1; i>=0; i--) {
        if(arr[i] === val) {
            arr.splice(i, 1);
            break;
        }
    }
}

    static hypoAlways(node)  {
        let always = new Node(1, 'always', null, null, null);
        always.addLc(node.replicate());
        return always;
    }

    static hypoEventually(node) {
        let eventually = new Node(1, 'eventually', null, null, null);
        eventually.addLc(node.replicate());
        return eventually;
    }

    static hypoNot(node) {
        let not = new Node(1, 'not', null, null, null);
        not.addLc(node.replicate());
        return not;
    }

    static hypoAnd(node1, node2) {
        let and = new Node(2, 'and', null, null, null);
        and.addLc(node1.replicate());
        and.addRc(node2.replicate());
        return and;
    }

    static hypoOr(node1, node2) {
        let or = new Node(2, 'or', null, null, null);
        or.addLc(node1.replicate());
        or.addRc(node2.replicate());
        return or;
    }

    /**  eventually C and not eventually A or B **/
    static task1() {
        let targetTask = new Node(2, 'and');
        let nodeC = new Node(0, 'C');
        let nodeA = new Node(0, 'A');
        let nodeB = new Node(0, 'B');

        let nodeEvC = ILTL.hypoEventually(nodeC);
        let nodeAB = ILTL.hypoOr(nodeA, nodeB);
        let nodeNot = ILTL.hypoEventually(nodeAB);
        let nodeAlw = ILTL.hypoNot(nodeNot);
        targetTask.addLc(nodeEvC);
        targetTask.addRc(nodeAlw);

        return targetTask;
    }

    /** eventually A and eventually always D **/
    static task2() {
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
    static task3() {
        let targetTask = new Node(1, 'always');
        let nodeC = new Node(0, 'C');
        let nodeD = new Node(0, 'D');

        let nodeEv = ILTL.hypoEventually(nodeD);
        let nodeAnd = ILTL.hypoAnd(nodeC, nodeEv);

        let nodeEv2 = ILTL.hypoEventually(nodeAnd);

        targetTask.addLc(nodeEv2);

        return targetTask;
    }

    /** eventually (A and eventually B)) and not eventually D  **/
    static task4() {
        let targetTask = new Node(2, 'and');
        let nodeD = new Node(0, 'D');
        let nodeA = new Node(0, 'A');
        let nodeB = new Node(0, 'B');

        let nodeRight = ILTL.hypoNot(ILTL.hypoEventually(nodeD));
        let nodeLeft = ILTL.hypoEventually(ILTL.hypoAnd(nodeA, ILTL.hypoEventually(nodeB)));
        targetTask.addLc(nodeLeft);
        targetTask.addRc(nodeRight);

        return targetTask;
    }

    /** always eventually (A and eventually B) **/
    static task5() {
        let nodeA = new Node(0, 'A');
        let nodeB = new Node(0, 'B');

        let nodeLeft = ILTL.hypoAlways(ILTL.hypoEventually(ILTL.hypoAnd(nodeA, ILTL.hypoEventually(nodeB))));

        return nodeLeft;
    }
}

