import {ILTL} from './js/LTL_interactive';
import {GridPainter} from './js/GridPainter';
import $ from 'jquery';

$(document).ready(() => {
    let s0, s1, replacing = false;
    let agent = new ILTL({
        targetTask: ILTL.task4()
    });
    let painter = new GridPainter($('#grid-container'), {
        clickCallBack: (index) => {
            if (!replacing) agent.initSubTask();
            log('Learning : ' + agent.currentTask.print(), 'skyblue');
            s0 = index;
            s1 = agent.calcNextMove(s0);
            // console.log('[clickCallBack]: s1 = ', s1);
            painter.setAndroid(s0);
            painter.moveAndroid(s1.s1);
            log(s0 + '->' + s1.s1);
            painter.freezePainter();
            displayPrediction(s1);
        }
    });

    let $btnPositive = $('#btn-positive'),
        $btnNegative = $('#btn-negative'),
        $btnReplace = $('#btn-replace'),
        $btnReset = $('#btn-reset'),
        $btnRevert = $('#btn-revert');

    $btnPositive.click(() => {
        let res = agent.filterByFeedback(true, s1);
        if (res === 0) {
            s0 = s1;
            s1 = agent.calcNextMove(s0.s1);
            if (s1.s1 !== -1) {
                painter.moveAndroid(s1.s1);
                log(s0.s1 + '->' + s1.s1);
                displayPrediction(s1);
            } else {

            }

        } else {
            log('Task learned : ' + res.print(), 'limegreen');
            log('Please place your agent.', 'limegreen');
            painter.unfreezePainter();
            replacing = false;
        }
    });

    $btnNegative.click(() => {
        let res = agent.filterByFeedback(false, s1);
        if (res === 0) {
            s0 = s1;
            s1 = agent.calcNextMove(s0.s1);
            if (s1.s1 !== -1) {
                painter.moveAndroid(s1.s1);
                log(s0.s1 + '->' + s1.s1);
                displayPrediction(s1);
            } else {

            }
        } else {
            log('Task learned : ' + res.print(), 'limegreen');
            log('Please place your agent.', 'limegreen');
            painter.unfreezePainter();
            replacing = false;
        }
    });

    $btnReplace.click(() => {
        painter.clearAndroid();
        painter.unfreezePainter();
        replacing = true;
        log('Please replace your agent.', 'limegreen');
    });

    $btnReset.click(() => {
        painter.clearAndroid();
        painter.unfreezePainter();
        log('Current task has been reset. \n Please place your agent.', 'red');
    });

    $btnRevert.click(() => {
        painter.clearAndroid();
        agent.revert();
        painter.unfreezePainter();
        log('Reverted to previous task. \n Please place your agent.', 'red');
    });

    agent.init();
    painter.paintGrid();
    painter.paintMatrix(agent.mat);

    log('Please place your agent.', 'limegreen');

    window.painter = painter;
    window.agent = agent;

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
});

function log(str, color = 'white') {
    let $p = $('<p>' + str + '</p>'),
        $logger = $('#logger'),
        $logs = $('#logger-logs');
    $p.css('color', color);
    $logs.append($p);
    let deltaH = $logs.height() - $logger.height();
    $logger.scrollTop(deltaH > -40 ? deltaH + 40 : 0);
}







