# Our Captivate JS library team repository


## Preface:

The folders concalldemo, superwrapperv1, and superwrapperScormv1 are all working examples of the captivate superwrapper for xAPI.  

The scorm version needs an LMS but the other instances can be run locally or can be accessed from:

[conference call demo version](http://www.brianfloyd.me/captivate-js-library/conCallDemo)


This repo lives on my personal server so any changes reflected here will be reflected on server.


# Basic set-up and instructions:

### Step 1:  

In your captivate project on the first slide in the on slide enter action add action 'execute javascript', in the 
script window add:

```init();```
                                               
                        
### Step 2: 

In captivate you have to set up these user variables for your LRS:

```v_prodKey = [ set to your LRS Key]```

```v_prodSecret = [ set to your LRS Secret ]```

```v_prodEndpoint = [set to your LRS endpoint]```
                    
Note:Included Captivate example file has these set up with our cohorts Watershed LRS
                    
 ### Step 3: 
 
 Publish the captivate ensuring the following:
 
                  -You have set up project name and description in Captivate>Preferences>Project Information
                  -You publish only in HTML (Flash - swf - is not supported)
                  -Scorm or no scorm is OK - but will change Step 6 slightly
                  -Do not zip files (uncheck publish setting)
                  
### Step 4: 

Copy this repo (use clone button and downloaad zip for easiest access)

                -In the folder superWrapperSource copy the following the files
                        controller.js
                        controlerNoIE.js
                        tincan.js
                        
                -In your captivate publish folder find the assets/js folder and paste the 3 files from above
                
### Step 5: 

We have to make changes to either index.html or index_scorm.html from captivate publish files

              -From this repo folder superWrapperSource open the indexSource.html or index_scormSource.html in 
               your favorite code editor
               
              -Open the index.html or index_scorm.html in the same code editor
              
              Lines 15 - 33 must be copied and pasted from indexSource.html to index.html
              
### Step 6 : 

Find a line similar to this in your index.hml (around line 120 but can vary) 
  
            	var lJSFiles = [  'assets/js/jquery-1.11.3.min.js','assets/js/CPM.js' ];
              
              Replace with lines 128 - 137 from the superWrapperSource folder indexSource.html (same as above)

### Step 7:  

Your good to go!
            
              Deploy to sever
              Zip contents and upload to LMS (scorm publish)
              Open the folder and and open index.html file locally 
              
Check out video available at [confernce call walk through](https://www.youtube.com/watch?v=VcpQhUK5ELE&feature=youtu.be) for a walkthrough (scrub to 6 minutes)

                
 10/2 All versions of controller update to 1.0.1 to address a defect causing video statements to not send.   

 10/3 All versions of controller updated to 1.0.2 to address a defect causing package to not load correctly from LMS - Added zip package to upload to LMS for testing to superWrapperScormv1 folder. Fixed variable naming convention problem exact capitilization for file names is critical to LMS success.

 10/4 All versoin of controller updated to 1.0.3 to address a defect where the / in parent ID was doubling up...now when user passes custom base URI in params.basedId if the end with aa / or don't the parent id will only have 1  /

 10/12  All versions of controller updated to 1.0.4 so that user login screen is more responsive.  The skip email button is now able to toggle, as well as make all the messages on the screen customizable in params.login .  Still need  to address screen layout and css

 10/12 All versions of controller updated to 1.0.5.1, login screen now sizes correctly in responsive environment (note it happens on load, switching to responsive after loading on desktop will not work - load in the resolution you will stay with)

 10/21 1.0.6 - updated comments in params to assist in customizing login page

 10/31 1.0.7 - all quiz question types are now working and reporting as CMI objects with the exception of likert - Also need to add the finished quiz verb, report scoring for each individual question and attach scoring to the finished quiz statement in results then quizzin will be done.
 
 An explanation of how quiz tracking works - The captivate API produces info about the quiz such as quiz name,  answer provided, question kind, scoring, attempts type and some other useful info.  However, the API does not provide the actual question or answers (frustrating)....to have proper CMI5 statements with correct response pattern and robust information this is needed info.  The work around that is employed here is parsing the DOM.  In non tech talk the wrapper takes a screen shot and puts all of the different informational pieces into an ordered list (an array).   I used the default set up for each question that captivate provides when you create a new quiz slide. So what does this mean for you?  Don’t delete things such as slide title or in the case of matching the Column 1 or Column 2 headers.  Reason being is it pulls the information from the particular position in the array, but if you delete it the array list will now be in a different order so statements will break or look awfully wonky(wrong info in certain fields).  That being said I did employ some coding magic and logic to allow for adding additional multiple choice, matching, or hot-spot type questions.  I tried to be as intuitive as possible.  If you want to use the wrapper in conjunction with quizzing please do, but also audit your statements for accuracy and please let me know if you find ‘breaking’ circumstances.
 
 

 
 









