# team-captivate-jslibrary
Our team repository

Basic set-up and instructions:

Note: You can use the captivate file in this repo and the credentials and init() statment are already there.....please change the project name in capitvate preferences prior to using

In your captivate: On the first slide on slide enter, executre javascript, in the script window put the command

init();

In captivate variables you also have to set up these variables for you LRS
             v_prodKey = [ set to your LRS KEY ]
             v_prodSecret =[ set to your LRS SECRET ]
             v_prodEndpoint =[ set to your LRS endpoint ]
        By default the params object contains environment which is set to "production", this can also be changed to "sandbox"
        If you are going to set up a sandbox your endpoint generally stays the same but you need to also set the variables
        in captivate for alternate credentials
            v_key=[ set to you sandbox LRS KEY ] 
            v_secret=[ set to your sandbox LRS SECRET ]


In this repo, you will find superWrapperSource folder:

Step 1:
  From this folder copy controller.js, controllerNoIE.js, and tincan.js and place in the cpativate publish folder assets/js

Step2:
In the index.html page that is published by captivate you need to add the changes reflect in superWrapper Source folder> index.html

Step3:
Lines 15 - 33 must be added (these are all new things, so they just need to be pasted in)

Step 4:
Lines 128 - 137 change one line from the publish package, the original line (132) is commented out in this example and its replacement line is added line 133





