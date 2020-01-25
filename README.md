# Our Captivate JS library team repository Edit 1.25.20


[Overview](#Overview)</br>
[Setup](#Basic-set-up-and-instructions)</br>
[YouTube - Step by Step Setup Walkthrough](https://www.youtube.com/watch?v=erEzaY9_LCE&feature=youtu.be)</br>
[YouTube - Torrance Learning Cohort superWrapper Demo](https://youtu.be/A4bLSshgKqI?t=3460)</br>
[Updates](#Update-Log)</br>

   #### [Actor](#Actor)
   #### [Verbs](#Verbs)
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Navigation Events](#Navigation-events)</br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Event Video Events](#Event-video-events)</br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Quiz Events](#Quiz-events)</br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Button and Clickbox Event](#Button-and-Clickbox-Events)</br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Verb Customization](#Verb-Customization)</br>
   #### [Activity](#Activty)</br>
   #### xAPI values and where superWrapper gets them
  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Parent](#Parent)</br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Quizzing](#Quizzing)</br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Video](#Event-video)</br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Extensions](#Extensions)

   #### Adobe resources that explain the API's used throughout

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Common js interface for CP](https://helpx.adobe.com/captivate/using/common-js-interface.html) </br>
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Adobe Captivate Variables](https://helpx.adobe.com/captivate/using/captivate-variables-list.html)</br>

  #### Captivate Resources
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[The superWrapper (sw) object](#The-superWrapper-object)</br>


# Overview
This wrapper was designed to be a companion to an Adobe Captivate HTML publish package.  It is designed to work from a LMS where SCORM reporting is enabled, or any course even if SCORM is not enabled.  It will not interupt or change SCORM reporting but will also report xAPI to an LRS.

It handles connection to an LRS and sends xAPI statements from the Captivate publish package with very little needed from the user to make it work.  Follow the [Setup](#Basic-set-up-and-instructions) instructions below, and the wrapper does the rest.

How does it work ? - Captivate has built in listeners and variables (API's) that allow outside software to interact with a Captivate publish package while a learner is using it.  We have levereaged those API's so you the designer pretty much design as you always would in Captivate, the user consumes the course as they always would but magic (or 1500 lines of code) will make it report robust xAPI statements to the LRS of your choosing.

Here are are all of the setup configurations for each xAPI Property and a description of when they fire of to the LRS.

## Actor
Actor is who is taking the course.  This can populate one of 3 ways with superWrapper

### Actor Scorm
If the course is published as a Scorm course and run from a LMS, superWrapper will look for the SCORM object and get the actor from scorm.LearnerId and scorm.Name - If scorm.learnerID is an email address this will become actor.mbox, if it is not a valid email actor.mbox will populate the actor.name with spaces removed and joining it with @superwrapper.com

actor.name will populate from scorm.Name

### Actor via mbox or mailto parameter
If no Scorm value is present the next place superWrapper will go is the url parameter.  An actor can be passed in through a url using ?mailto= or ?mbox= parameters.

actor.mbox will populate from this passed parameter
actor.name will populate from this passed parameter split at the @ symbol (first half of email)

example: http://superwraper/exampleonlynotaworkinglink?mailto=brian@brianfloyd.me

### Actor via superWrapper Override
If the 1st 2 methods do not yield a actor then superWrapper will presnet login screen will hide the captivate object and display a prompt to enter an email.  The captions on this login screen are editable in params.login


## Verbs
Below are the different events that superWrapper on and their respective verb. Event as used below  is any time a statement is sent to the LRS.

## Navigation events

|Verb       | When it triggers/sends to LRS | Additional Properties   |
| --------- |:-----------------------------:| -------------------------:|
| access    |When course is launched        |    |
| enter     |When user enters a slide       | |    
| return    |When returning to a menu slide |                     |
| view      |When leaving a slide           |           |
| complete  |When last slide is entered     |                     |
| pressed   |Tap/Click of button or clickbox|                     |
| focus     |When fouus on window happens   |                     |
| unfocus   |When focus on window is lost   |                     |


## Event video events

|Verb       | When it triggers/sends to LRS | Additional Properties   |
| --------- |:-----------------------------:| -------------------:|
| play      |When video is played           |   |
| pause     |When video is paused           | |    
| scrub     |When video is scrubbed         |                     |
| watch     |When end of video is reached   |           |
| mute      |When video is muted            |                     |
| unmute    |When video is unmutued         |                     |
| adjust Vol|When volume is adjusted        |                     |

## Quiz events

|Verb       | When it triggers/sends to LRS | Additional Properties    |
| --------- |:-----------------------------:| -------------------:|
| start     |When quiz is started           |   |
| finish    |When quiz is finish           ||    
| answered    |When question is answered         |                     |
| reviewed   |When slide is visited in review mode |            |
| skip     |When question           |                     |



### Button and Clickbox Event

By design this wrapper will not track buttons and clickboxes automatically.  This is becuase often buttons are used with navigation and this is already tracked with enter and viewed verbs.  If you would like a click box or button to report, add xapi_ as the prefix for the name of the button found in Captivate.  So if you had btn_1, you would simply change that to xapi_btn1 and now it will report.

Button include 2 parents. The 1st parent would be the the course name Parent and the 2nd parent would is the name of slide becuase the buttons parent is the slide and the slides partent is the course.

### Verb Customization

All of the listed by verbs by default are turned on, many of them use the verb and id found at [The Registry](https://registry.tincanapi.com).  In other cases an appropriate verb was not registered so we created custom superwrapper verbs and id's.

You can turn edit 3 properties for each verb whether is reports, the verb (how it will show in LRS verb display name), and finally verb id.  Verb Id must be valid IRI, superwrapper will resort to default if an unacceptable value it used.

These can be changed by editing params.verbs

Here is the block for navigtion verbs

```javascript
   verbs:
                {
                access:[true,'accessed','http://activitystrea.ms/schema/1.0/access'],
                enter:[true,'entered slide',`${customVerbPrefix}enteredSlide`],
                return:[true,'returned to','http://activitystrea.ms/schema/1.0/return'],
                view:[true, 'viewed slide','http://id.tincanapi.com/verb/viewed'],
                complete:[true,'completed course','http://activitystrea.ms/schema/1.0/complete'],
                open: [true,'opened','http://activitystrea.ms/schema/1.0/open'],
                pressButton: [true,'pressed button' , 'http://future-learning.info/xAPI/verb/pressed'],
                pressClickBox:[true, 'clicked box'],//same verb as above
                focus:[false,'focused','http://id.tincanapi.com/verb/focused'],
                unfocus:[false,'unfocused','http://id.tincanapi.com/verb/unfocused'],
                experience:[true, 'experienced','http://adlnet.gov/expapi/verbs/experienced']
                }
```
Lets say you wanted to use launched in place of accessed.  The access property would just change to look like this:

```javascript
        access:[true,'launched','http://adlnet.gov/expapi/verbs/launched']
```

Now every time the course is accessed it will instead use the launch verb.

Any reporting property can be toggled off by changing the 1st true to a false value        

```javascript
           enter:[false,'entered slide',`${customVerbPrefix}enteredSlide`]
```

Enter is reported when a user enters the slide, and viewed appears after user leaves the slide with duration of viewership.  If you didn't want both the above example would turn off the enter statement.

## Activity
Activity is the name the description of the event that that verb is acting on.  So the activity could be the course, a slide, a video, a button, a quiz, etc.  

A few examples:
   Brian 'entered' slide first slide
   Brian 'accessed course' Captivate Demo
   Brian 'pressed' show answer button

In  the first example the name of slide (Captivate Properties Name) is used as the activity
In the 2nd example the name of the course or [Parent](#Parent)
The final example is using the name (Captivate Properties Name for button)

## Context Activity

Context Acivities are very important to streamline LRS reporting/output.  When you include a [Parent id](#Parent-id) http://superwrapper/parent/example in an acrivites context all [activies](#Activity) with that id can be referrred too by using related properties.

Every statement except accessed and comleted will have a parent context, and in some case 2 parents.

A single parent example:
   Brian 'entered' slide first slide

In this example the context activities would contain the parent that was is the course name

A 2 parent example:

   Brian 'answered' superWrapper is cool (True/False)

In this example the context activies would include 2 parents.  The 1st parent would be the the course name [Parent](#Parent) and the 2nd parent would be the name of the [quiz](#Quizzing)



## Parent 
Parent is the main course identifier and can be broken into 3 main parts.  It will be the activity for the access and completed verb, because we are reffering to the actual course(the parent) with these 2 verbs.  For all other verbs these parent properies will be use is the parent in xAPI context activities as the parent.

### Parent Id
Parent ID is the main course ID - superWrapper creates this using the prefixId(#Prefix-Id) annd joining it with the [Parent name](#Parent-Name).  

### Parent Name
The Parent Name is taken first from params.parentName if set, 2nd from it will pull it from Capivate using the cpInfoProjectName variable.  This is set in Captivate Prefrences>Project>Information -Project Name

### Parent Description
The Parent Descripion is taken first from params.parentDescription if set, 2nd from it will pull it from Capivate using the cpInfoDescription variable.   This is set in Captivate Prefrences>Project>Information -Description

## Quizzing

### Quiz name
The Quiz Name is taken first from params.quizName if set.  If this value is null it will create quiz take the paren name and append the word Quiz on the end.   

### Quiz Id
The Quiz ID is taken first from params.quizId if set.  If this value is null it will create a quiz id based on the parent name and append the /quiz/ on the end prior to parent on IRI.

### Quiz Description
The Quiz Description is taken first from params.quizDescripion if set.  If this value is null it will creted a description that is stated or finished Assesment and the [Quiz Name](#Quiz-name)


### Quiz Question Name
The quiz question name is the question itself.

### Quiz Question ID
The quiz ID with the Adobe Captivate Ineractioon ID taken from quiz properites avaialble from the quiz sumbit event.data.cpData.interactionID using the event listener 

``` javascript window.cpAPIEventEmitter.addEventListener('CPAPI_SLIDEENTER')```

### cmi5 xAPI
Each quiz question type has its own specific context definiton designed for xAPI to maximize LRS reporting feaatures.

### Quiz Results
Here is a standard question Object.result from xapi

```javascript   
 {"result": {
    "score": {
      "scaled": 0.22,
      "raw": 10,
      "min": 0,
      "max": 10
    },
    "success": true,
    "completion": true,
    "duration": "PT0H0M26S",
    "response": "Scorm 1.2,Scorm 2004,xAPI"
  }} 
  ```
  The scaled score is the percentage contributed to overall quiz final score
  The max score is the number of points assigned in captivate to questions
  The raw score is the raw number of points the user achieved for the questioin
  Success is whether the question was answered correctly
  Duration was the amount of time th user took to answer he question
  Response was he users response to the question (this example  was  arrange in order)

When a quiz is finished the finished verb statement Oject.result will look like this

```javascript

 {"result": {
    "score": {
      "scaled": 0.78,
      "raw": 35,
      "min": 0,
      "max": 45
    },
    "success": false,
    "completion": true,
    "duration": "PT0H0M51S"
  }}
  ```
  In this case:
  Scaled is total score for the project as a %
  raw/max is total achieved point  vs total possiible points
  Sucess is set based on API 'cpQuizInfoPassFail' so can be variable based on captivae settings
  Duration is now for the enire duration of quiz 

## Event video
Event video is video that is embedded within a captivate slide

### Video Name
Video name will be the value assigned to the video object in captivate properties

### Video Id
Is created like this http://superwrapper/[videoname]/video

### Video Description
Populates the slide name the video belongs to along with the video name

### Video Parents
Vidoes will will display 2 parents.  The first parents in the parent course, the 2nd parent is the slide the video belongs too

### Video Extensions
Some of the event verbs have special reporting extensions in the xapi object.context property to give activity details.

#### Duration
All video verbs will contain http://id.tincanapi.com/extension/duration - this is the duration of the video

```javascript
  "http://id.tincanapi.com/extension/duration": {
        "name": {
          "en-US": "Video length duration"
        },
        "description": {
          "en-US": "PT42S"
        }
```
#### Pause - ending point
Paused statements will contain "http://id.tincanapi.com/extension/ending-point" - ths is the point at which the event video was paused
```javascript
 { "http://id.tincanapi.com/extension/ending-point": "PT5S"}

```
#### Scrub

Scurbbed statements will contain  "http://id.tincanapi.com/extension/ending-point": "PT25S" along with  "http://id.tincanapi.com/extension/starting-point": "PT1S" and also  "http://id.tincanapi.com/extension/scrubDuration"

```javascript
    "http://id.tincanapi.com/extension/scrubDuration": {
        "name": {
          "en-US": "scrubbed forward 24",
          "description": {
            "en-US": "PT25S"
          }
        }
```
#### Extensions

superWrapper will pass a superwrapper extension modeled below

```javascript

  "http://superwrapper/extension/slide-info": {
        "slidesSequenceToThisPoint": [
          "slide",
          "Title Slide",
          "Multiple Choice 1"
        ],
        "slideIndex": 12,
        "slideName": "Multiple Choice 1"
      }
    }

```
This provides the current Slide Index, and Slide Name, as well as an Array of slides in the order they were accessed by the suer leading up to the current slide.



## The superWrapper object

While creating this wrapper I found myself wanting to be able to interact quickly using the console and not having to type out long Catptivate API's to access.

Here is a summary of those commands (these can be excecuted at anytime from the console) or from captivate javascript console when wrapper in insalled

<span style="color:#228B22">sw.jump</span>(slideIndex) - Jump too slideIndex (slide 1 is 0 index)<br>
<span style="color:#228B22">sw.next</span>()  - Advance to next slide<br>
<span style="color:#228B22">sw.var</span>([captivate variable]) - example sw.var('cpInfoCurrentSlide') will return current slide index<br>
<span style="color:#228B22">sw.reloadWebObject</span>()<br>
<span style="color:#228B22">sw.convertMilliSecondsToISO</span>([milliseconds])<br> Will convert milliseconds to ISO8006 time foramt standard<br>
<span style="color:#228B22">sw.uriCheck</span>([uri/iri]) ensures valid IRI will return IRI if valid or will return false if invalid <br>
<span style="color:#228B22">sw.updateTitle</span>([stringValue]) change the title of the URL parge to passed string value <br>
<span style="color:#228B22">sw.toggleGeture</span>([boolean -true/false])  Allows mobile gestures to be turned off by passing true or false on a slide by slide basis as needed<br>
<span style="color:#228B22">sw.onLine</span>() - returns true or false based on navigator.onLine property 
<span style="color:#228B22">sw.parse</span>('qt') -  parse the cp.data.model object and return the values of the passed key



## Preface:

The folders concalldemo, superwrapperv1, and superwrapperScormv1 are all working examples of the captivate superwrapper for xAPI.  

The scorm version needs an LMS but the other instances can be run locally or can be accessed from:

[conference call demo version](http://www.brianfloyd.me/captivate-js-library/conCallDemo)


This repo lives on my personal server so any changes reflected here will be reflected on server.


# Basic set-up and instructions:

[YouTube - Step by Step Walkthrough](https://www.youtube.com/watch?v=erEzaY9_LCE&feature=youtu.be)

### Step 1:     

On the first slide of the project, select the slide and Actions for the slide.  Set the On Enter property to execute javascsript, choose the script_window button and add the following:

```init();```

 ![](http://www.brianfloyd.me/captivate-js-library/images/init.png)
  
                        
### Step 2: 

In captivate you have to set up these user variables for your LRS:

```v_prodKey = [ set to your LRS Key]```

```v_prodSecret = [ set to your LRS Secret ]```

```v_prodEndpoint = [set to your LRS endpoint]```
                    
Note:Included Captivate example file has these set up with our cohorts Watershed LRS. Note you can also use these variables and toggle between a sandbox and production environment.  The sandox equvalent are:

```v_key = [ set to your LRS Key]```

```v_secret = [ set to your LRS Secret ]```

```v_endpoint = [set to your LRS endpoint]```

![](http://www.brianfloyd.me/captivate-js-library/images/vars.png)
                    
 ### Step 3: 
 
 Publish the captivate ensuring the following:
 
                  -You have set up project name and description in Captivate>Preferences>Project Information
                  -You publish only in HTML (Flash - swf - is not supported)
                  -Scorm or no scorm is OK - but will change Step 6 slightly
                  -Do not zip files (uncheck publish setting)
                  
### Step 4: 

Copy this repo (use clone button and downloaad zip for easiest access)

                -In the folder superWrapperSource copy the following the files to your clipboard to paste 
                        controller.js
                        controlerNoIE.js
                        tincan.js
                        
                -In your captivate publish folder find the assets/js folder and paste the 3 files from above
                
### Step 5: 

We have to make changes to either index.html or index_scorm.html from captivate publish files

            
               
              -Open the index.html or index_scorm.html from the Captivate publish file 
              
              -Look for the <script> tag around line 10

              Insert the following lines after the script, ensuring not to overwrite anything from the /* to the */

```javascript
/********************
**  SuperWrapper  **
*******************/
//insert this code to load all the appropriate packages

var controllerVersion, tincan;

/*SuperWrapper is not compantible with Microsoft IE, this 
  causes it to display warning message and not load*/

if(navigator.appName  !== "Microsoft Internet Explorer"){
/*Load the controller file and tincan library*/	
	controllerVersion= "assets/js/controller.js";
	tincan = "assets/js/tincan.js"
}else{
	controllerVersion ="assets/js/controllerNoIE.js";
	
}
//end of inserted code
/********************
**  SuperWrapper  **
********************/
```
              
### Step 6 : 

        -Find a line similar to this in your index.hml (around line 120 but can vary) - 
        

  ```javascript
        var lJSFiles = [  'assets/js/jquery-1.11.3.min.js','assets/js/CPM.js' ]; 
```
 'var lJSFiles'   can be searched
        -On the line after paste this code
```javascript
	/*******************
	**  SuperWrapper  **
	*******************/
	lJSFiles.push(tincan,controllerVersion)
	/*this is appending the variables (files to load) we set up top
	*******************
	**  SuperWrapper **
        ********************/
```           
             
### Step 7:  

Your good to go!
            
              Deploy to sever
              Zip contents and upload to LMS (scorm publish)
              Open the folder and and open index.html file locally 
              
Check out video available at [confernce call walk through](https://www.youtube.com/watch?v=VcpQhUK5ELE&feature=youtu.be) for a walkthrough (scrub to 6 minutes)

 # Update Log
 10/2 All versions of controller update to 1.0.1 to address a defect causing video statements to not send.   

 10/3 All versions of controller updated to 1.0.2 to address a defect causing package to not load correctly from LMS - Added zip package to upload to LMS for testing to superWrapperScormv1 folder. Fixed variable naming convention problem exact capitilization for file names is critical to LMS success.

 10/4 All versoin of controller updated to 1.0.3 to address a defect where the / in parent ID was doubling up...now when user passes custom base URI in params.basedId if the end with aa / or don't the parent id will only have 1  /

 10/12  All versions of controller updated to 1.0.4 so that user login screen is more responsive.  The skip email button is now able to toggle, as well as make all the messages on the screen customizable in params.login .  Still need  to address screen layout and css

 10/12 All versions of controller updated to 1.0.5.1, login screen now sizes correctly in responsive environment (note it happens on load, switching to responsive after loading on desktop will not work - load in the resolution you will stay with)

 10/21 1.0.6 - updated comments in params to assist in customizing login page

 10/31 1.0.7 - all quiz question types are now working and reporting as CMI objects with the exception of likert - Also need to add the finished quiz verb, report scoring for each individual question and attach scoring to the finished quiz statement in results then quizzin will be done.
 
 An explanation of how quiz tracking works - The captivate API produces info about the quiz such as quiz name,  answer provided, question kind, scoring, attempts type and some other useful info.  However, the API does not provide the actual question or answers (frustrating)....to have proper CMI5 statements with correct response pattern and robust information this is needed info.  The work around that is employed here is parsing the DOM.  In non tech talk the wrapper takes a screen shot and puts all of the different informational pieces into an ordered list (an array).   I used the default set up for each question that captivate provides when you create a new quiz slide. So what does this mean for you?  Don’t delete things such as slide title or in the case of matching the Column 1 or Column 2 headers.  Reason being is it pulls the information from the particular position in the array, but if you delete it the array list will now be in a different order so statements will break or look awfully wonky(wrong info in certain fields).  That being said I did employ some coding magic and logic to allow for adding additional multiple choice, matching, or hot-spot type questions.  Tried to be as intuitive as possible.  If you want to use the wrapper in conjunction with quizzing please do, but also audit your statements for accuracy and please let me know if you find ‘breaking’ circumstances.
 
  11/2 1.0.8 Likert now works making all quiz types working with the exception of matching.  Matching did work but I made some breaking change and can’t seem to find my bug.

 The other feature added and I am excited about this one is focus and unfocus....Often we wonder if users are checknig their email or multitasking during elearning courses.....the focus, unfocus statement will tell you when they leave, and when they come back complete with duration (how long where they unfocused, or how long were they focus before unfocusing)

 11/17 1.1.0 IT'S DONE!!!  Well almost :) - A good code base is never 'done' but every feature that was outlined from an xAPI standpoint has now been added.  Here are the last list of updates and bug fixes.
        -Finished verb now reports for quzzes with total score and quiz duration in result
        -Review verb now reports in lieu of enter when a use reviews quiz
        -Added Retured verb for menu application.  If the slide is prefixed with xapi_menu_ it will report entered the first time you visit it and still provide the viewed verb on exit but on subsequent visits it will report returned.  This is designed for branching scenarios
        - Every interaction now logs in extension the slide sequence that was followed ot arrive at that poiont it can be found here in the statement:
        context.extensions.http://superwrapper/extension/slide-info.slidesSequenceToThisPoint"
        -Fixed verb customization bug - Values where hard coded in not change to OOP

Moving Forward I will continue to update this read.me with version update release info.  All feature requests, bugs and defects will now be reported using the 'issues' feature in this Git repo.  Please feel free to contribute any issues or feature requests you may have.

12/10 1.2 
  -Found a way to always parse the question use cp.data.model[key].qt so quiz questions will always repoort correctly moving forward
  -Redesigned answer logic, parses answers out of quiz more consistently
  -Fixed result.duration so you know how many seconds into slide answer was provided, works for well for inifinite/multiple attempts



 
 









