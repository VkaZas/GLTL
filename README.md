# LTL_by_human

##Description

### Algorithm
This project utilizes a basic __NodeJS + Express + MySQL__ structure. _algorithm_ folder is legacy, useless for now.
The main algorithm files are _behave/LTLNode.js_ for __explain__ part, and _src/js/LTL_interactive.js_ for __training__ part. And the 5
tasks for both parts are hard coded in these two javascript files, you can change them there. Also, _src/behaveApp.js_ is another legacy, useless for now.

Logics in guess page and train page are written in _src/guessApp.js_ and _src/trainApp.js_. Unfortunately, the code is a mess and highly coupled.

### Database
The database info in written in _server.js_ line 27~33. It's a free db service and thus it's unstable. 
There are 6 tables in database and they are all have a 'ltl' prefix:

__ltl_expl__ and __ltl_expl_act__ contains grid info and user actions for __explain__ part.

__ltl_train__, __ltl_train_act__ and __ltl_train__learned__ contains steps information, user action and learnt task information for __training__ part.

###UI
Didn't have enough time to care about UI, the basic style is written in _scss/index.scss_, it is responsive for different resolutions thanks to _materialize.css_ but it not responsive enough.

_GridPainter.scss_ contains styles for grid world.

###Misc
Remember to run _gulp_ and use _forever_ to keep server running on aliyun. TODO: add cookie in this project.
