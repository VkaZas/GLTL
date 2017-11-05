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
            this.mat[2] = 'B';
            this.mat[4] = 'A';
            this.mat[6] = 'C';
            this.mat[19] = 'D';
            return this.mat;

            // this.mat = ['B', 'B', 'B', 'B', 'B',
            //             'B', 'A', '_', '_', 'B',
            //             'B', '_', 'C', 'B', 'B',
            //             'B', '_', 'C', '_', 'B',
            //             'B', '_', 'D', '_', 'B',
            //             'B', '_', 'C', '_', 'B'];
            // return this.mat;
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

        // add trimmed tasks
        let trimTaskList = [];
        for (let subTask of this.subTaskList) {
            let res = LTLEngine.getTrimSubTrees(subTask);
            if (res.length > 0)
                trimTaskList = _.concat(trimTaskList, res);
        }
        this.tryAddToSubtaskList(trimTaskList);
        console.log('setTargetLTL after added trimNodes: ', this.subTaskList);

        this.computeProbabilityTable();
        if (createMat) this.generateMatrix(true);
        this.computeValueIterationNetwork();
    }

    setAgentPosition(posIdx) {
        this.nowPos = posIdx;
    }

    setAgentTarget(node) {
        this.nowTask = node;
    }

    getAgentNextMove(startPos, startTask) {
        let dests = this._getAvailableNextPositions(startPos);
        let state = this._posToState(startPos);
        let nodeStateMap = this.getNodeStateProbabilityTable(startTask, state);

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
                } else {
                    nowV += this.valueMap.get(nodePosHash) * prob;
                    // console.log(nodePosHash, this.valueMap.get(nodePosHash));
                }

            }
            // console.log(nowV);
            if (nowV > maxV) {
                maxV = nowV;
                finalDest = dest;
            }
        }

        if (!finalDest) {
            console.log("[Failed to find next step]: at position " + startPos + ' with ' + startTask.toString());
            // console.log('dests: ', dests);
            // console.log('nodeStateMap', nodeStateMap);
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

    getOptionalNextMoves(startPos, startTask) {
        let res = [];
        let trimTreeList = LTLEngine.getTrimSubTrees(startTask);
        console.log('Trim tree list: ', trimTreeList);
        for (let trimTask of trimTreeList) {
            let [trimNxtPos, ] = this.getAgentNextMove(startPos, trimTask);
            res.push([trimTask, trimNxtPos]);
        }
        return res;
    }

    moveAgentSteps(steps, log=true) {
        let logs = [];
        for (let i = 0; i < steps; i++) {
            /** When a sub-task is completed(acc-ed or rej-ed), re-do it according to the type of the parent node of this sub-task(always or eventually) **/
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

            /** Small chance to sudden acc/rej or (acc for eventually) or (rej for always) **/
            if (this.nowTask.type === 3) {
                console.log("Terminated: " + this.nowTask.val);
                return;
            }

            /** Calculate next move and its reason **/
            let [nxtPos, nxtTask] = this.getAgentNextMove(this.nowPos, this.nowTask);
            console.log("[" + this.nowPos + ' ' + this.nowTask.toString() + "] => [" + nxtPos + ' ' + nxtTask.toString() + ']');

            // find other optional next moves to find the reason for current move
            let optionalNxtMoves = this.getOptionalNextMoves(this.nowPos, this.nowTask);
            let visited = {};
            console.log('Optional next moves: ', optionalNxtMoves);
            for (let [trimTask, trimNxtPos] of optionalNxtMoves) {
                if (nxtPos !== trimNxtPos && !visited[trimNxtPos]) {
                    visited[trimNxtPos] = 1;
                    // TODO: there should be some function calls
                    let logStr = 'If my task were ' + trimTask.toString() + ', I would go ' + trimNxtPos;
                    if (trimNxtPos === this.nowPos)
                        logStr = 'If my task were ' + trimTask.toString() + ', I would stay at ' + trimNxtPos;
                    console.log(logStr);
                    logs.push(logStr);
                }
            }

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
        return logs;
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
                                    this.tryAddToSubtaskList(LTLNode.and(lResNode, rResNode));
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
                                    this.tryAddToSubtaskList(LTLNode.or(lResNode, rResNode));
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

        /** To valid states to conform with atoms of the split sub-tree **/
        function extractState(state, atoms) {
            let res = state;
            for (let i = 0; i < 26; i++)
                if (((atoms >> i) & 1) === 0) {
                    res &= ~(1 << i);
                }
            return res;
        }
    }

    /** During 'task transformation' and 'task trimming', some tasks that are not belong to original sub-tasks may occur. Add them to it.**/
    tryAddToSubtaskList(node) {
        if (node instanceof LTLNode) {  // single node
            for (let subtask of this.subTaskList) {
                if (subtask.toString() === node.toString()) return;
            }
            this.subTaskList.push(node);
        } else if (node instanceof Array) {  // multiple nodes
            for (let nowNode of node) {
                let existed = false;
                for (let subtask of this.subTaskList) {
                    if (subtask.toString() === nowNode.toString()) {
                        existed = true;
                        break;
                    }
                }
                if (!existed) this.subTaskList.push(nowNode);
            }
        }
    }

    /** Compute VIN with probability table and the given environment **/
    computeValueIterationNetwork() {
        this.valueMap.clear();
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

    static getTrimSubTrees(node) {
        let res = [];
        let rootNode = _.cloneDeep(node);

        trim(rootNode);
        return res;

        function trim(node) {
            if (node.type === 1) {
                if (node.pa === null) {
                    res.push(node.lc.deepCopy());
                } else {
                    if (node === node.pa.lc) {
                        node.pa.lc = node.lc;
                        res.push(rootNode.deepCopy());
                        node.pa.lc = node;
                    } else {
                        node.pa.rc = node.lc;
                        res.push(rootNode.deepCopy());
                        node.pa.rc = node;
                    }
                }
                trim(node.lc);
            } else if (node.type === 2) {
                if (node.pa === null) {  // the root node
                    res.push(node.lc.deepCopy());
                    res.push(node.rc.deepCopy());
                    trim(node.lc);
                    trim(node.rc);
                } else {
                    if (node === node.pa.lc) {
                        node.pa.lc = node.lc;
                        res.push(rootNode.deepCopy());
                        node.pa.lc = node;

                        node.pa.lc = node.rc;
                        res.push(rootNode.deepCopy());
                        node.pa.lc = node;
                    } else {
                        node.pa.rc = node.lc;
                        res.push(rootNode.deepCopy());
                        node.pa.rc = node;

                        node.pa.rc = node.rc;
                        res.push(rootNode.deepCopy());
                        node.pa.rc = node;
                    }
                    trim(node.lc);
                    trim(node.rc);
                }
            }

        }
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

    /** eventually A and always not B **/
    static sampleTask6() {
        let A = LTLNode.createAtomNode(0);
        let B = LTLNode.createAtomNode(1);

        return LTLNode.and(LTLNode.eventually(A), LTLNode.always(LTLNode.not(B)));
    }
}

export {LTLNode, LTLEngine};

