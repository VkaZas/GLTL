/**
 * Created by vkaza on 2017/12/21.
 */
const express = require('express');
const path = require('path');
const app = express();
const mysql = require('mysql');
const myConnection = require('express-myconnection');
const bodyParser = require('body-parser');

const addUserAct = require('./route/addUserAct');
const addUserTask = require('./route/addUserTask');
const addUserTrain = require('./route/addUserTrain');
const addUserTrainAct = require('./route/addUserTrainAct');
const addUserTrainLearned = require('./route/addUserTrainLearned');

app.use('/static', express.static(path.join(__dirname, 'img')));
app.use('/static',express.static(path.join(__dirname, 'dist')));
app.set('views',path.join(__dirname , 'views') );
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(myConnection(mysql, {
    host: 'us-cdbr-iron-east-03.cleardb.net',
    user: 'b79cde1de40a72',
    password: '2c000eb5',
    database: 'heroku_16d34676adbb711',
    port: '3306'
}, 'single'));

app.use('/addUserAct', addUserAct);
app.use('/addUserTask', addUserTask);
app.use('/addUserTrain', addUserTrain);
app.use('/addUserTrainAct', addUserTrainAct);
app.use('/addUserTrainLearned', addUserTrainLearned);

app.get('/behave/', (req, res) => res.render('behave'));
app.get('/guess/', (req, res) => res.render('guess'));
app.get('/train/', (req, res) => res.render('train'));

app.listen(3000, () => console.log('Example app listening on port 3000!'));