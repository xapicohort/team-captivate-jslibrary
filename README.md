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
 
 

 
 









