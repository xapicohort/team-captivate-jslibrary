# team-captivate-jslibrary
Our team repository

Basic set-up and instructions:

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


In this repo, you will find captivateSourceFiles folder:

  From this folder copy controller.js, controllerNOIE.js, and tincan.js and place in the cpativate publish folder assets/js
  
In the index.html page you need to add the changes reflect in captivateSourceFiiles folder> index.html

