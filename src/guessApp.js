import { LTLNode, LTLEngine } from '../behave/LTLNode';
import { GridPainter } from './js/GridPainter';
import $ from 'jquery';

const taskList = [LTLEngine.sampleTask1(), LTLEngine.sampleTask2(), LTLEngine.sampleTask3(), LTLEngine.sampleTask4(), LTLEngine.sampleTask5()];
const guessMaxStep = 10;
let currentTaskIdx = 0;
let nowPos = 0;
let rightNowPos = 0;
let nowTips = '',
    nowTips2 = '';
let guessPath = '';
let truePath = '';
let guessMode = false;
let guessStep = 0;
const engineLeft = new LTLEngine();
const engineRight = new LTLEngine();
const painterLeft = new GridPainter($('#watch-container'));
const painterRight = new GridPainter($('#guess-container'));

// Buttons
const btnMove = $('#btn-move');
const btnChangeTask = $('#btn-change-task');
const btnChangeMap = $('#btn-change-map');
const btnTips = $('#btn-tips');
const btnSubmit = $('#btn-submit');
const btnGuess = $('#btn-guess');

const title = $('#title');

const url = 'http://47.89.186.64:3000';
const uid = uuid(10, 16);

const dict = {
    A: 'table',
    B: 'chair',
    C: 'outlet',
    D: 'fridge',
    _: 'none',
};

btnMove.click(() => {
    moveAndroidSteps(1);
    addAct('MOVE');
});

btnChangeTask.click(() => {
    currentTaskIdx = (currentTaskIdx + 1) % 5;
    initTask(currentTaskIdx);
    addAct('CHANGETASK');
});

btnChangeMap.click(() => {
    initTask(currentTaskIdx);
    addAct('CHANGEMAP');
});

btnGuess.click(() => {
    initGuess(currentTaskIdx);
    addAct('GUESS');
});

btnTips.click(() => {
    // console.log('NOWTASK:', engineLeft.nowTask.toString(), '\nPOSTASK:', LTLNode.positivify(engineLeft.nowTask).toString());
    const nxtDest = engineLeft.getAgentNextDest(engineLeft.nowPos, engineLeft.nowTask);

    // console.log(`NOWDEST: ${nxtDest} \n POSDEST: ${nxtDestPosi}`);

    const str = nowTips2.length <= 0 ? '' : `<br/> Avoiding ${nowTips2[0]}`;
    $('#tips').html(`Current Dest: ${dict[engineLeft.getAgentNextDest(engineLeft.nowPos, engineLeft.nowTask)]} ${str}`);
    addAct('TIPS');
});

btnSubmit.click(() => {
    console.log('true path: ', truePath);
    $.ajax({
        url : url + '/addUserTask',
        type: 'POST',
        async: 'true',
        data: {
            uid : uid,
            tid : currentTaskIdx,
            upath : guessPath,
            tpath : truePath,
            map : engineRight.printMatrix()
        },
        dataType: 'json',
        success: (res) => {
            console.log('ajax!!',res);
        }
    });
});

$(document).ready(() => {
    initApp();
});

$(document).keydown((e) => {
    if (!guessMode) {return;}
    const p = rightNowPos;
    switch (e.which) {
    case 37:
        if ((p % 5) !== 0) {guessNext(p - 1);}
        console.log('left');
        addAct('LEFT');
        break;
    case 38:
        if (p > 4) {guessNext(p - 5);}
        console.log('up');
        addAct('UP');
        break;
    case 39:
        if ((p % 5) !== 4) {guessNext(p + 1);}
        console.log('right');
        addAct('RIGHT');
        break;
    case 40:
        if (p < 20) {guessNext(p + 5);}
        console.log('bot');
        addAct('BOTTOM');
        break;
    }
});

function guessNext(pos) {
    painterRight.moveAndroid(pos);
    guessPath += ` ${pos}`;
    rightNowPos = pos;
    guessStep++;
}

function initApp() {
    painterLeft.paintGrid();
    painterRight.paintGrid();
    initTask(currentTaskIdx);

    window.LTLNode = LTLNode;
    window.LTLEngine = LTLEngine;

    console.log(LTLNode.positivify(LTLEngine.sampleTask4()));
}

function initTask(taskIdx, posLeft = 0) {
    title.html(`Task ${taskIdx}`);
    guessMode = false;
    nowPos = posLeft;
    engineLeft.setTargetLTL(taskList[taskIdx]);
    engineLeft.setAgentPosition(posLeft);

    painterLeft.paintMatrix(engineLeft.mat);
    painterLeft.setAndroid(posLeft);
}

function initGuess(taskIdx, posRight = 0) {
    guessStep = 0;
    rightNowPos = posRight;
    guessPath = `${posRight}`;
    guessMode = true;
    engineRight.setTargetLTL(taskList[taskIdx]);
    engineRight.setAgentPosition(posRight);

    painterRight.paintMatrix(engineRight.mat);
    painterRight.setAndroid(posRight);

    truePath = calcAndroidPath(guessMaxStep);
}

function moveAndroidSteps(steps) {
    for (let i = 0; i < steps; i++) {
        const [logs, nxtPos] = engineLeft.moveAgentSteps(1);
        if (nxtPos === nowPos) {
            continue;
        }
        painterLeft.moveAndroid(nxtPos, () => {

        });
        setTimeout(() => {}, 500);
        nowPos = nxtPos;
        nowTips2 = logs;
    }
    nowTips = `Current Task: ${engineLeft.nowTask.toString()}`;
}

function calcAndroidPath(steps) {
    let nowPos = rightNowPos;
    let res = `${nowPos}`;
    for (let i = 0; i < steps; i++) {
        const [logs, nxtPos] = engineRight.moveAgentSteps(1);
        if (nxtPos === nowPos) {
            continue;
        }
        nowPos = nxtPos;
        res += ` ${nxtPos}`;
    }
    return res;
}

function uuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}

function addAct(action) {
    $.ajax({
        url : url + '/addUserAct',
        type: 'POST',
        async: 'true',
        data: {
            uid : uid,
            action : action
        },
        dataType: 'json',
        success: (res) => {
            console.log('ajax!!',res);
        }
    });
}
