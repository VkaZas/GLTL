import _ from 'lodash';

const miu = 0.99;
const gama = 0.9;
const beta = 0.9;

let defaultLTLNodeProps = {
    type : 0, //  0 for atoms, 1 for unary operator, 2 for binary operator, 3 for acc/rej
    val : 0, // integer for atom's sequence number and string for operator names
    lc : null,
    rc : null,
    pa : null,
    atoms : 0
};

class LTLNode {
    constructor(props) {
        Object.assign(this, defaultLTLNodeProps);
        Object.assign(this, props);
    }

    addLc(node) {
        this.lc = node;
        node.pa = this;
        this.atoms |= this.lc.atoms;
    }

    addRc(node) {
        this.rc = node;
        node.pa = this;
        this.atoms |= this.rc.atoms;
    }

    getSubTrees() {
        let res = this.deepCopy();

        res.pa = null;
        if (this.type === 0) return [res];
        if (!!this.lc)
            res = _.concat(res, this.lc.getSubTrees());
        if (!!this.rc)
            res = _.concat(res, this.rc.getSubTrees());

        res = _.sortBy(res, (o) => {
            return [o.toString().length, o.toString()];
        });

        return res;
    }

    deepCopy() {
        let res = _.cloneDeep(this);
        res.pa = null;
        return res;
    }

    eq(node) {
        return _.eq(this, node);
    }

    toString(log = false) {
        if (this.type === 0) {
            let char = String.fromCharCode(this.val + 65);
            if (!this.pa)
                if (log) console.log(char);
            return char;
        }

        let res = '';
        if (this.type === 2)
            res = '(' + this.lc.toString() + ' ' + this.val + ' ' + this.rc.toString() + ')';

        if (this.type === 1)
            res = this.val + ' ' + this.lc.toString();

        if (this.type === 3)
            res = this.val;

        if (!this.pa)
        {
            if (log)
                console.log(res + ' ');
            return res;
        }


        return res;
    }

    static createAtomNode(id) {
        return new LTLNode({val : id, atoms : 1 << id});
    }

    static createAccNode() {
        return new LTLNode({type:3, val:'acc'});
    }

    static createRejNode() {
        return new LTLNode({type:3, val:'rej'});
    }

    static always(node) {
        let res = new LTLNode({
            type : 1,
            val : 'always'
        });
        res.addLc(node);
        return res;
    }

    static eventually(node) {
        let res = new LTLNode({
            type : 1,
            val : 'eventually'
        });
        res.addLc(node);
        return res;
    }

    static not(node) {
        let res = new LTLNode({
            type : 1,
            val : 'not'
        });
        res.addLc(node);
        return res;
    }

    static and(lNode, rNode) {
        let res = new LTLNode({
            type : 2,
            val : 'and'
        });
        res.addLc(lNode);
        res.addRc(rNode);
        return res;
    }

    static or(lNode, rNode) {
        let res = new LTLNode({
            type : 2,
            val : 'or'
        });
        res.addLc(lNode);
        res.addRc(rNode);
        return res;
    }
}

let defaultLTLEngineProps = {
    targetLTL : null,
    state : 0, // n-hot binary representation of n dimension state
    subTaskList : [],
    hashMap : new Map(),  // node-state hash
    mat : [],
    matrixSize : 5,
    valueMap : new Map(),  // node-pos hash
    iterationTimes : 500,
    nowPos : 0,
    nowTask : null,
    nowStack : [],
    nowHistory : ''
};

class LTLEngine {
    constructor(props) {
        Object.assign(this, defaultLTLEngineProps);
        Object.assign(this, props);
    }

    generateMatrix(fix=false) {
        let n = this.matrixSize;
        if (fix) {
            for (let i = 0; i < n*n; i++) this.mat[i] = '_';
            this.mat[9] = 'B';
            this.mat[17] = 'A';
            this.mat[19] = 'C';
            this.mat[5] = 'D';
            return this.mat;
        }

        let mat = [];
        let idx = [];
        for (let i=0; i<n*n; i++) idx.push(i);

        for (let i=0; i<n; i++) {
            for (let j=0; j<n; j++) {
                mat[i*n+j] = '_';
            }
        }

        // generate C position
        let randC = parseInt(4*Math.random());
        // let randC = 1;
        // console.log('randC: ' + randC);
        const posDicC = [0, n-1, n*(n-1), n*n-1];
        mat[posDicC[randC]] = 'C';
        // console.log(posDicC[randC]);
        _.pull(idx, posDicC[randC]);
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
        _.pull(idxD, posDicC[randC]);
        let randD = parseInt(idxD.length*Math.random());
        // let randD = 5;
        // console.log('randD: ' + randD);
        // console.log(idxD.length);
        mat[idxD[randD]] = 'D';
        // console.log(idxD[randD]);
        _.pull(idx, idxD[randD]);
        // console.log(idx);

        //generate A B
        let randA = parseInt((n*n-2)*Math.random());
        // let randA = 10;
        // console.log('randA: ' + randA);
        mat[idx[randA]] = 'A';
        // console.log(idx[randA]);
        _.pull(idx, idx[randA]);
        // console.log(idx);

        let randB = parseInt((n*n-3)*Math.random());
        // let randB = 15;
        // console.log('randB: ' + randB);
        // console.log(idx[randB]);

        // console.log(idx);
        mat[idx[randB]] = 'B';
        _.pull(idx, idx[randB]);

        this.mat = mat;
        return mat;
    }

    printMatrix() {
        let n = this.matrixSize;
        for (let i = 0; i < n; i++) {
            let str = '';
            for (let j = 0; j < n; j++) {
                str += this.mat[i * n + j] + ' ';
            }
            console.log(str);
        }
    }

    setTargetLTL(node, createMat = true) {
        this.targetLTL = this.nowTask = node;

        this.subTaskList = [];
        this.nowStack = [];
        this.nowHistory = '';
        this.hashMap.clear();
        this.valueMap.clear();

        this.setAgentPosition(0);
        this.setAgentTarget(node);
        this.subTaskList = this.targetLTL.getSubTrees();
        this.computeProbabilityTable();
        if (createMat) this.generateMatrix();
        this.computeValueIterationNetwork();
    }

    setAgentPosition(posIdx) {
        this.nowPos = posIdx;
    }

    setAgentTarget(node) {
        this.nowTask = node;
    }

    getAgentNextMove() {
        let dests = this._getAvailableNextPositions(this.nowPos);
        let state = this._posToState(this.nowPos);
        let nodeStateMap = this.getNodeStateProbabilityTable(this.nowTask, state);

        // calc best direction
        let finalDest = null, maxV = -100;
        for (let dest of dests) {
            let nowV = 0;
            for (let [key, {resNode, prob}] of nodeStateMap) {
                let nodePosHash = LTLEngine._hashPos(resNode, dest);
                // console.log(nodePosHash);
                if (resNode.val === 'acc') {
                    nowV += prob;
                } else if (resNode.val === 'rej') {
                    nowV += -prob;
                } else
                    nowV += this.valueMap.get(nodePosHash) * prob;
            }
            // console.log(nowV);
            if (nowV > maxV) {
                maxV = nowV;
                finalDest = dest;
            }
        }

        if (!finalDest) {
            console.log("[Failed to find next step]: at position " + this.nowPos + ' with ' + this.nowTask.toString());
        }

        // decide next task by chance f(μ)
        let nxtTask = null;
        let chance = Math.random();
        let probSum = 0;
        for (let [key, {resNode, prob}] of nodeStateMap) {
            probSum += prob;
            if (probSum > chance) {
                nxtTask = resNode;
                break;
            }
        }

        return [finalDest, nxtTask];
    }

    moveAgentSteps(steps, log=true) {
        for (let i = 0; i < steps; i++) {
            if (this.nowTask.type === 3 && this.nowStack.length > 0) {
                let recoverTask = this.nowStack.pop();
                let chance = Math.random();
                if (this.nowTask.val === 'acc') {
                    if (recoverTask.val === 'always') {
                        if (chance < miu) {  // big chance to re-evaluate
                            this.nowTask = recoverTask;
                            continue;
                        }
                    } else if (recoverTask.val === 'eventually') {
                        continue;  // 100% chance to acc that recover task
                    }
                } else if (this.nowTask.val === 'rej') {
                    if (recoverTask.val === 'eventually') {
                        if (chance < miu) {  // big chance to re-evaluate
                            this.nowTask = recoverTask;
                            continue;
                        }
                    } else if (recoverTask.val === 'always') {
                        continue;  // 100% chance to rej that recover task
                    }
                }
            }

            if (this.nowTask.type === 3) {
                console.log("Terminated: " + this.nowTask.val);
                return;
            }


            let [nxtPos, nxtTask] = this.getAgentNextMove();
            console.log("[" + this.nowPos + ' ' + this.nowTask.toString() + "] => [" + nxtPos + ' ' + nxtTask.toString() + ']');

            // exclude those small-chance direct acc/rej
            if ((this.nowTask.val === 'always' && nxtTask.val !== 'acc') || (this.nowTask.val === 'eventually' && nxtTask.val !== 'rej')) {
                this.nowStack.push(this.nowTask);
            }

            this.nowTask = nxtTask;
            this.nowPos = nxtPos;

            let charCode = this.mat[nxtPos].charCodeAt(0);
            if (charCode >= 65 && charCode <= 91) {
                this.nowHistory += this.mat[nxtPos];
            }
        }
    }

    computeProbabilityTable() {
        for (let subTask of this.subTaskList) {
            let states = LTLEngine.generatePossibleStates(subTask.atoms);
            for (let state of states) {
                this.getNodeStateProbabilityTable(subTask, state);
            }
        }
    }

    getNodeStateProbabilityTable(node, state) {
        state = extractState(node.atoms, state);
        let nodeStateHash = LTLEngine._hash(node, state), resMap = new Map();
        if (this.hashMap.has(nodeStateHash)) return this.hashMap.get(nodeStateHash);

        switch (node.type) {
            case 0:  // an atom
                if (((state >> node.val) & 1) === 1) {
                    incMapVal(resMap, LTLNode.createAccNode(), 1);
                } else {
                    incMapVal(resMap, LTLNode.createRejNode(), 1);
                }
                break;

            case 1: // a unary operator
                let childRes = this.getNodeStateProbabilityTable(node.lc, state);

                switch (node.val) {
                    case 'always':
                        for (let key of childRes.keys()) {
                            let {resNode, prob} = childRes.get(key);
                            if (resNode.type === 3) {   // acc or rej
                                if (resNode.val === 'acc') {
                                    incMapVal(resMap, LTLNode.createAccNode(), prob * (1 - miu));
                                    incMapVal(resMap, node, prob * miu);
                                } else {
                                    incMapVal(resMap, LTLNode.createRejNode(), prob);
                                }
                            } else {
                                incMapVal(resMap, LTLNode.createAccNode(), prob * (1 - miu));
                                incMapVal(resMap, resNode, prob * miu)
                            }
                        }
                        break;
                    case 'eventually':
                        for (let key of childRes.keys()) {
                            let {resNode, prob} = childRes.get(key);
                            if (resNode.type === 3) {   // acc or rej
                                if (resNode.val === 'rej') {
                                    incMapVal(resMap, LTLNode.createRejNode(), prob * (1 - miu));
                                    incMapVal(resMap, node, prob * miu);
                                } else {
                                    incMapVal(resMap, LTLNode.createAccNode(), prob);
                                }
                            } else {
                                incMapVal(resMap, LTLNode.createRejNode(), prob * (1 - miu));
                                incMapVal(resMap, resNode, prob * miu)
                            }
                        }
                        break;
                    case 'not':
                        for (let key of childRes.keys()) {
                            let {resNode, prob} = childRes.get(key);
                            if (resNode.type === 3) {   // acc or rej
                                if (resNode.val === 'acc') {
                                    incMapVal(resMap, LTLNode.createRejNode(), prob);
                                } else {
                                    incMapVal(resMap, LTLNode.createAccNode(), prob);
                                }
                            } else {
                                incMapVal(resMap, resNode, prob);
                            }
                        }
                        break;
                }
                break;

            case 2:  // binary operator
                let lcState = extractState(state, node.lc.atoms),
                    rcState = extractState(state, node.rc.atoms);
                let lcRes = this.getNodeStateProbabilityTable(node.lc, lcState),
                    rcRes = this.getNodeStateProbabilityTable(node.rc, rcState);

                switch (node.val) {
                    case 'and':
                        for (let [lKey, lVal] of lcRes) {
                            let lResNode = lVal.resNode, lProb = lVal.prob;
                            for (let [rKey, rVal] of rcRes) {
                                let rResNode = rVal.resNode, rProb = rVal.prob;

                                if (lResNode.val === 'rej' || rResNode.val === 'rej') {  // rej&rej, rej&acc, rej&S
                                    incMapVal(resMap, LTLNode.createRejNode(), lProb * rProb);
                                } else if (lResNode.val === 'acc' && rResNode.val === 'acc') {  // acc&acc
                                    incMapVal(resMap, LTLNode.createAccNode(), lProb * rProb);
                                } else if (lResNode.type < 3 && rResNode.type < 3) {  // S1&S2
                                    tryAddToSubtaskList(LTLNode.and(lResNode, rResNode), this);
                                    incMapVal(resMap, LTLNode.and(lResNode, rResNode), lProb * rProb);
                                } else if (lResNode.type < 3) {  // S1&acc
                                    incMapVal(resMap, lResNode, lProb * rProb);
                                } else {  // acc&S2
                                    incMapVal(resMap, rResNode, lProb * rProb);
                                }
                            }
                        }
                        break;
                    case 'or':
                        for (let [lKey, lVal] of lcRes) {
                            let lResNode = lVal.resNode, lProb = lVal.prob;
                            for (let [rKey, rVal] of rcRes) {
                                let rResNode = rVal.resNode, rProb = rVal.prob;

                                if (lResNode.val === 'acc' || rResNode.val === 'acc') {  // acc&acc, rej&acc, acc&S
                                    incMapVal(resMap, LTLNode.createAccNode(), lProb * rProb);
                                } else if (lResNode.val === 'rej' && rResNode.val === 'rej') {  // rej&rej
                                    incMapVal(resMap, LTLNode.createRejNode(), lProb * rProb);
                                } else if (lResNode.type < 3 && rResNode.type < 3) {  // S1&S2
                                    tryAddToSubtaskList(LTLNode.or(lResNode, rResNode), this);
                                    incMapVal(resMap, LTLNode.or(lResNode, rResNode), lProb * rProb);
                                } else if (lResNode.type < 3) {  // S1&rej
                                    incMapVal(resMap, lResNode, lProb * rProb);
                                } else {  // rej&S2
                                    incMapVal(resMap, rResNode, lProb * rProb);
                                }
                            }
                        }
                        break;
                }

        }

        this.hashMap.set(nodeStateHash, resMap);
        return resMap;

        function incMapVal(map, node, val) {
            let key = LTLEngine._hash(node);
            if (map.has(key)) {
                let {resNode, prob} = map.get(key);
                prob += val;
                map.set(key, {resNode, prob})
            } else {
                map.set(key, {
                    resNode : node,
                    prob : val
                })
            }
        }

        function tryAddToSubtaskList(node, self) {
            for (let subtask of self.subTaskList) {
                if (subtask.toString() === node.toString()) return;
            }
            self.subTaskList.push(node);
        }

        function extractState(state, atoms) {
            let res = state;
            for (let i = 0; i < 26; i++)
                if (((atoms >> i) & 1) === 0) {
                    res &= ~(1 << i);
                }
            return res;
        }
    }

    computeValueIterationNetwork() {
        for (let i = 0; i < this.iterationTimes; i++) {
            let backupValueMap = _.cloneDeep(this.valueMap);
            for (let node of this.subTaskList) {
                for (let posIdx = 0; posIdx < this.matrixSize * this.matrixSize; posIdx++) {
                    let nodePosHash = LTLEngine._hashPos(node, posIdx);
                    if (i === 0) backupValueMap.set(nodePosHash, 0);
                    else {
                        let value = this.getNodePosValueIteration(node, posIdx);
                        backupValueMap.set(nodePosHash, value);
                    }
                }
            }
            this.valueMap = backupValueMap;
        }
    }

    getNodePosValueIteration(node, posIdx) {
        let dests = this._getAvailableNextPositions(posIdx);
        let state = this._posToState(posIdx);
        let nodeStateMap = this.getNodeStateProbabilityTable(node, state);

        let maxV = -2147483647;
        for (let dest of dests) {
            for (let [key, {resNode, prob}] of nodeStateMap) {
                let nowV = 0;
                if (resNode.val === 'acc') {
                    nowV = 1;
                } else if (resNode.val === 'rej') {
                    nowV = -1;
                } else {
                    let nodePosHash = LTLEngine._hashPos(resNode, dest);
                    nowV = prob * gama * this.valueMap.get(nodePosHash);
                }
                if (nowV > maxV) {
                    maxV = Math.max(maxV, nowV);
                }

            }
        }
        return maxV;
    }
    
    _getAvailableNextPositions(posIdx) {
        let dests = [posIdx];
        if (posIdx % this.matrixSize !== 0)
            dests.push(posIdx - 1);
        if (posIdx - this.matrixSize >= 0)
            dests.push(posIdx - this.matrixSize);
        if ((posIdx + 1) % this.matrixSize !== 0)
            dests.push(posIdx + 1);
        if (posIdx + this.matrixSize < this.matrixSize * this.matrixSize)
            dests.push(posIdx + this.matrixSize);
        return dests;
    }

    _posToState(posIdx) {
        let charCode = this.mat[posIdx].charCodeAt(0);
        if (charCode < 65 || charCode > 90) return 0;
        return 1 << (charCode - 65);
    }

    static generatePossibleStates(atoms) {
        let res = [];
        for (let i = 0; i < 26; i++) {
            if (((atoms >> i) & 1) === 1) {
                if (res.length === 0)
                    res.push(0, 1 << i);
                else {
                    let newStates = _.map(res, (x) => {
                        return x | (1 << i);
                    });
                    res = _.concat(res, newStates);
                }
            }
        }
        return _.sortBy(res, (o) => o);
    }

    static _hash(node, state) {
        return node.toString() + (!!state ? ' ' + state : '');
    }

    static _hashPos(node, posIdx) {
        return node.toString() + ' POS ' + posIdx;
    }

    /** always eventually (A and eventually B) **/
    static sampleTask1() {
        let A = LTLNode.createAtomNode(0),
            B = LTLNode.createAtomNode(1);
        return LTLNode.always(LTLNode.eventually(LTLNode.and(A, LTLNode.eventually(B))));
    }

    /** (eventually A) and (eventually always B)**/
    static sampleTask2() {
        let A = LTLNode.createAtomNode(0);
        let B = LTLNode.createAtomNode(1);
        return LTLNode.and(LTLNode.eventually(A), LTLNode.eventually(LTLNode.always(B)));
    }

    /** (A and eventually C) and always not B **/
    static sampleTask3() {
        let A = LTLNode.createAtomNode(0);
        let B = LTLNode.createAtomNode(1);
        let C = LTLNode.createAtomNode(2);

        return LTLNode.and(LTLNode.and(A, LTLNode.eventually(C)), LTLNode.always(LTLNode.not(B)));
    }

    /** eventually A and (always not (B or C))**/
    static sampleTask4() {
        let A = LTLNode.createAtomNode(0);
        let B = LTLNode.createAtomNode(1);
        let C = LTLNode.createAtomNode(2);

        return LTLNode.and(LTLNode.eventually(A), LTLNode.always(LTLNode.not(LTLNode.or(B, C))));
    }

    /** eventually (A and eventually C) and always not B **/
    static sampleTask5() {
        let A = LTLNode.createAtomNode(0);
        let B = LTLNode.createAtomNode(1);
        let C = LTLNode.createAtomNode(2);

        return LTLNode.and(LTLNode.eventually(LTLNode.and(A, LTLNode.eventually(C))), LTLNode.always(LTLNode.not(B)));
    }
}

export {LTLNode, LTLEngine};

