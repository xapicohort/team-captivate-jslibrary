# team-captivate-jslibrary
Our team repository

Basic set-up and instructions:

Note: You can use the captivate file in this repo and the credentials and init() statment are already there as a template i you like.....please change the project name in capitvate preferences prior to using.  The template LRS is the complimentary one set up by Watershed, for access please reach out to Brian Floyd on Slack channel.

Step 1:

In your captivate: On the first slide on slide enter, execute javascript, in the script window add the command:

               init();

Step 2:
In captivate variables you also have to set up these variables for you LRS

             v_prodKey = [ set to your LRS KEY ]
             v_prodSecret =[ set to your LRS SECRET ]
             v_prodEndpoint =[ set to your LRS endpoint ]
             
By default the params object contains environment which is set to "production", this can also be changed to "sandbox"

If you are going to set up a sandbox your endpoint generally stays the same but you need to also set the variables in captivate for alternate credentials
        
            v_key=[ set to you sandbox LRS KEY ] 
            v_secret=[ set to your sandbox LRS SECRET ]


Step 3:Publish the captivate following these parameters

        - HTML only
        - Unzipped
        - Scorm or No Scorm is OK
        
In this repo, you will find superWrapperSource folder (Needed for Step 4, 5 & 6):

Step 4:
From this folder copy these files 
         
          controller.js
          controllerNoIE.js 
          tincan.js
          
          Place in the captivate publish folder assets/js folder.
          
Step5:

In the index.html or index_scorm.html page that is published by captivate:

        Add the changes reflect in superWrapper Source folder> indexSource.html
        Lines 15 - 33 must be added (these are all new things, so they just need to be pasted in)

Step 6:

        Find this line in index.html:
            var lJSFiles = [  'assets/js/jquery-1.11.3.min.js','assets/js/CPM.js' ];
            
            Replace with Lines 128 - 137 from superwrapper source folder>indexSource.html
Step 7:

    -Scorm only - zip package from inside folder for lms payload
    -Server - Deploy website





