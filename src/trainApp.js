import {ILTL} from './js/LTL_interactive';
import {GridPainter} from './js/GridPainter';
import $ from 'jquery';

const uid = uuid(10, 16);
const url = 'http://47.89.186.64:3000';
// const url = 'http://localhost:3000';
let tid = 0;

let $btnPositive = $('#btn-positive'),
    $btnNegative = $('#btn-negative'),
    $btnReplace = $('#btn-replace'),
    $btnReset = $('#btn-reset'),
    $btnRevert = $('#btn-revert'),
    $btnNext = $('#btn-next'),
    $modal = $('#modal1');

let s0, s1, replacing;
let agent;
let painter;

const termDict = {
    '-1' : 'Robot:"I guess your task wants me to stop learning here"',
    '0' : 'Robot:"I think I need more steps to finish learning your task"',
    '1' : 'Robot:"I think I\'ve reached your expectation"'
};

// const taskList = [ILTL.task1(), ILTL.task2(), ILTL.task3(), ILTL.task4(), ILTL.task5()];
const taskList = [ILTL.task11(), ILTL.task12(), ILTL.task13(), ILTL.task14()];
const taskDict = {
    0 : 'Go to the desk',
    1 : 'Avoid the chair',
    2 : 'Stay at the charger',
    3 : 'Go to the fridge then go to the desk'
};

function init() {
    s0, s1, replacing = false;
    agent = new ILTL({
        targetTask: taskList[tid]
    });
    $('#h-goal').text(`Goal is to teach: ${taskDict[tid]}`);
    painter = new GridPainter($('#grid-container'), {
        clickCallBack: (index) => {
            if (!replacing) agent.initSubTask();
            // log('Learning : ' + agent.currentTask.print(), 'skyblue');
            // log('Learning : ' + agent.targetTask.print(), 'skyblue');
            s0 = index;
            s1 = agent.calcNextMove(s0);
            // console.log(s1);
            if (s1.term === -1) {
                // s1.s1 = index;
                painter.setAndroidEmotion(1);
            } else if (s1.term === 1) {
                // s1.s1 = index;
                painter.setAndroidEmotion(0);
            } else {
                painter.setAndroidEmotion(2);
            }
            // console.log('[clickCallBack]: s1 = ', s1);
            painter.setAndroid(s0);
            painter.moveAndroid(s1.s1);
            // log(s0 + '->' + s1.s1 + ` ${termDict[s1.term]}`);
            log(`${termDict[s1.term]}`);
            painter.freezePainter();
            // displayPrediction(s1);
        }
    });

    agent.init();
    painter.paintGrid();
    painter.paintMatrix(agent.mat);

    window.agent = agent;

    log('Please place your robot.', 'limegreen');
}

$(document).ready(() => {

    init();

    $('#btn-submit').click(() => {
        $.ajax({
            url : url + '/addUserSurvey',
            type: 'POST',
            async: 'true',
            data: {
                uid : uid,
                q1 : $('#q1').val(),
                q2 : $('#q2').val(),
                q3 : $('#q3').val(),
                q4 : $('#q4').val(),
            },
            dataType: 'json',
            success: (res) => {
                console.log('ajax!!',res);
            }
        });
        alert(`Your code is ${uid}`);
    });

    $btnNext.click(() => {
        if (tid === taskList.length - 1) {
            window.openModal();
            return;
        }
        tid = (tid + 1) % taskList.length;
        init();
        addAct('NEXT');
    });

    $btnPositive.click(() => {
        let res = agent.filterByFeedback(true, s1);
        if (res === 0) {
            s0 = s1;
            s1 = agent.calcNextMove(s0.s1);

            // console.log('[s1]:', s1);

            if (s1.s1 !== -1) {
                if (s1.term === -1) {
                    // s1.s1 = s0.s1;
                    painter.setAndroidEmotion(1);
                } else if (s1.term === 1) {
                    // s1.s1 = s0.s1;
                    painter.setAndroidEmotion();
                } else {
                    painter.setAndroidEmotion(2);
                }
                painter.moveAndroid(s1.s1);
                // log(s0.s1 + '->' + s1.s1 + ` ${termDict[s1.term]}`);
                log(`${termDict[s1.term]}`);
                // displayPrediction(s1);
            } else {
                log('OOPS! I may have learnt something wrong Click \'forget & retrain\' to start over.');
            }
            // $('#h-learnt').text('Robot: I\'m learning...');
        } else {
            $('#h-learnt').text(`Robot: I've learnt how to ${res.print(false)}. \n If I'm wrong, click on Forget&Retrain. \n If you want me to learn more, place me at anywhere you find reasonable. \n If I've learnt your target, please click Finish&Next`);
            // log('Task learned : ' + res.print(false), 'limegreen');
            // log('Please place your robot.', 'limegreen');
            painter.unfreezePainter();
            replacing = false;
            addLearned(res.print(false));
        }

        $.ajax({
            url : url + '/addUserTrain',
            type: 'POST',
            async: 'true',
            data: {
                uid : uid,
                tid : tid,
                ctask : agent.currentTask.print(),
                move : `${s0.s1}->${s1.s1}`,
                agree : 1
            },
            dataType: 'json',
            success: (res) => {
                console.log('ajax!!',res);
            }
        });

        addAct('POSITIVE');
    });

    $btnNegative.click(() => {
        let res = agent.filterByFeedback(false, s1);
        if (res === 0) {
            s0 = s1;
            s1 = agent.calcNextMove(s0.s1);

            // console.log('[s1]:', s1);

            if (s1.s1 !== -1) {
                if (s1.term === -1) {
                    // s1.s1 = s0.s1;
                    painter.setAndroidEmotion(1);
                } else if (s1.term === 1) {
                    // s1.s1 = s0.s1;
                    painter.setAndroidEmotion();
                } else {
                    painter.setAndroidEmotion(2);
                }
                painter.moveAndroid(s1.s1);
                // log(s0.s1 + '->' + s1.s1 + ` ${termDict[s1.term]}`);
                log(`${termDict[s1.term]}`);
                displayPrediction(s1);
            } else {
                log('OOPS! I may have learnt something wrong Click \'forget & retrain\' to start over.');
            }
            // $('#h-learnt').text('Robot: I\'m learning...');
        } else {
            $('#h-learnt').text(`Robot: I've learnt how to ${res.print(false)}. \n If I'm wrong, click on Forget&Retrain. \n If you want me to learn more, place me at anywhere you find reasonable. \n If I've learnt your target, please click Finish&Next`);
            // log('Task learned : ' + res.print(false), 'limegreen');
            // log('Please place your robot.', 'limegreen');
            painter.unfreezePainter();
            replacing = false;
            addLearned(res.print(false));
        }

        $.ajax({
            url : url + '/addUserTrain',
            type: 'POST',
            async: 'true',
            data: {
                uid : uid,
                tid : tid,
                ctask : agent.currentTask.print(),
                move : `${s0.s1}->${s1.s1}`,
                agree : 0
            },
            dataType: 'json',
            success: (res) => {
                console.log('ajax!!',res);
            }
        });
        addAct('NEGATIVE');
    });

    $btnReplace.click(() => {
        painter.clearAndroid();
        painter.unfreezePainter();
        replacing = true;
        // log('Please replace your agent.', 'limegreen');
        addAct('REPLACE');
    });

    // $btnReset.click(() => {
    //     painter.clearAndroid();
    //     painter.unfreezePainter();
    //     log('Current task has been reset. \n Please place your agent.', 'red');
    //     addAct('RESET');
    // });

    $btnRevert.click(() => {
        painter.clearAndroid();
        agent.revert();
        painter.unfreezePainter();
        // log('Reverted to previous task. \n Please place your agent.', 'red');
        addAct('REVERT');
    });

    window.painter = painter;
    window.agent = agent;

});

function displayPrediction(state) {
    // positive
    let res = agent.predictByFeedback(true, state);
    if (res.length <= 3 && res.length > 0) {
        log('By pressing Agree, agent will learn one of following:', 'orange');
        for (let str of res) log(str, 'orange');
    }
    // negative
    res = agent.predictByFeedback(false, state);
    if (res.length <= 3 && res.length > 0) {
        log('By pressing Disagree, agent will learn one of following:', 'orange');
        for (let str of res) log(str, 'orange');
    }
}

function log(str, color = 'white') {
    let $hLearnt = $('#h-learnt');
    let $p = $('<p>' + str + '</p>'),
        $logger = $('#logger'),
        $logs = $('#logger-logs');
    // $p.css('color', color);
    // $logs.append($p);
    // let deltaH = $logs.height() - $logger.height();
    // $logger.scrollTop(deltaH > -40 ? deltaH + 40 : 0);
    $hLearnt.text(str);
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

function addAct(name) {
    $.ajax({
        url : url + '/addUserTrainAct',
        type: 'POST',
        async: 'true',
        data: {
            uid : uid,
            tid : tid,
            action : name
        },
        dataType: 'json',
        success: (res) => {
            console.log('ajax add train act',res);
        }
    });
}

function addLearned(name) {
    $.ajax({
        url : url + '/addUserTrainLearned',
        type: 'POST',
        async: 'true',
        data: {
            uid : uid,
            tid : tid,
            learned : name
        },
        dataType: 'json',
        success: (res) => {
            console.log('ajax add train learned',res);
        }
    });
}





