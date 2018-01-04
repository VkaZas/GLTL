const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    let obj = req.body;
    let resObj = {};
    req.getConnection((err, conn) => {
        if (err) {
            resObj['info'] = '[DB Error]' + err;
            resObj['result'] = 0;
            res.json(JSON.stringify(resObj))
        } else {
            let sql =  `INSERT INTO ltl(uid, action, timestamp) VALUES ('${obj.uid}', '${obj.action}', '${Date.now()}')`;
            conn.query(sql, [], function(err, row) {
                if (!err) {
                    resObj['result'] = 1;
                    res.json(JSON.stringify(resObj));
                } else {
                    // todo : implement error checking
                    console.log(err, row);
                }
            });
        }
    });
});

module.exports = router;