
      
//TODO: look for instances of toLowerCase();
//MULTIPLE CHOICE QUESTIONS MUST HAVE THE DEFAULT COLUMN 1 and COLUMN 2 headers must be, they can be changed, but not deleted or empty
//NOTE:Quiz results are very experimental, still a work in progress
console.log('SuperWrapper v1.0.4');
const customVerbPrefix="http://id.superwrapper.com/verb/";
const params = {
    "environment":"production",
    "reportingToLrs":false,
    "Validate_email_address":false,//non-working feature
    "display_en_lang":["en-US","en-CA","es","fr-CA"],//uses whichever value is in the first positiiion [0] in Array
    "verbs":{
                access:[true,'accessed course','http://activitystrea.ms/schema/1.0/access'],
                enter:[true,'entered slide',`${customVerbPrefix}enteredSlide`],
                return:[true,'returned to','http://activitystrea.ms/schema/1.0/return'],
                view:[true, 'viewed slide','http://id.tincanapi.com/verb/viewed'],
                complete:[true,'completed course','http://activitystrea.ms/schema/1.0/complete'],
                open: [true,'opened','http://activitystrea.ms/schema/1.0/open'],
                pressButton: [true,'pressed button' , 'http://future-learning.info/xAPI/verb/pressed'],
                pressClickBox:[true, 'clicked box'],//same verb as above
                experience:[false, 'experienced','http://adlnet.gov/expapi/verbs/experienced'],
            "quiz":
            {
                start:[true,'started','http://activitystrea.ms/schema/1.0/start'],
                skip:[true,'skipped',"http://id.tincanapi.com/verb/skipped"],
                answer:[true,'answered',"http://adlnet.gov/expapi/verbs/answered"],
                review:[true,'reviewed','https://brindlewaye.com/xAPITerms/verbs/reviewed/'],
                finish:[true,'completed','http://activitystrea.ms/schema/1.0/complete']
            },
            "video":
            {
                play:[true,'played','http://activitystrea.ms/schema/1.0/play'],
                pause:[true,'paused', "http://id.tincanapi.com/verb/paused"],
                scrub:[true,'scrubbed', `${customVerbPrefix}scrubbed`],
                mute:[true,'scrubbed', `${customVerbPrefix}muted`],
                unmute:[true,'scrubbed', `${customVerbPrefix}unmuted`],
                adjustVolume:[true,'adjusted volume',`${customVerbPrefix}adjustVolume`],
                watch: [false,'watched','http://activitystrea.ms/schema/1.0/watch']
            },
        },
    "consoleLog":{
                statements:true,
                quickLogVerbActivity:false,
                quizLog:false,
                videoLog:true,
                eventListener:false
    },
    "login":{
                loginMessage:null,
                placeholderText:"This is now dynamic",
                skipEmail:false,
                skipEmailValue:null,
                invalidMsg:null

    },
    "quizName":null,
    "quizId":null,//uses baseID-ActivityName
    "remove_play_button_on_mobile":true,
    "parentName":null,
    "baseId":null,//uses base URL and path by default but can be defined to custom URI
    "returnToLastSlideVisited":true,//TODO:write query to check last slide visited
    "sw_reloadWebObject":"Prefacing a clickbox or button with this title will force a refresh of all active iFrames",
    "xapi_":"Prefacing a button or clickbox with this title will track button interactions"
};
//TODO:put it regex check for valid IRI for all passed paramter ID's, set to null if invlaid so it defaults
let xApiController,user,sw,quiz;
function init(){
    //if statement is if user returns to slide and init is called again, but the xApiController object
    //is already created it will not try to create a 2nd option
    if(typeof xApiController !=="object"){
    //set up the superWrapper object
    sw = new SuperWrapper();
    user = new Learner();
    user.init(()=>{
        xApiController = new XAPIController();
        sw.updateTitle(xApiController.parentName);
         //this call is so the first slide produces the parent launch statement
         //@params "Verb_to_use_when_file_opened":["launched","accessed","experienced"]
         //it is the only time the argument will be null
         if(params.verbs.access[0])xApiController.defineStmt(null);
        //define that course is launched for xApiControllerr.cpListener()
        xApiController.launchFlag =true;
        //adds 2 event listeners, one is for any interaction with the DOM 
        //the second is listening for slide change event
        xApiController.cpListeners(); 
     });
};

};
class XAPIController{
constructor(store){
        this.totalSlides = sw.var('cpInfoSlideCount');
        this.currentSlideName=sw.var('cpInfoCurrentSlideLabel');
        this.currentSlideIndex=sw.var('cpInfoCurrentSlideIndex')+1;
        this.slides=[];
        this.verb = new Verbs();
        this.activityType = new Types();
        this.projectEnterTime = new Date().getTime();
        this.url = new URL(location);
        this.slideVids = [];
        this.idPrefix = (()=>{
        let uri =  params.baseId ||this.url.origin+this.url.pathname;
        if(uri[uri.length-1] ==='/') return uri;
        else return `${uri}/`
        })();
        this.parentName = params.parentName || sw.var('cpInfoProjectName');
        this.parentId = `${this.idPrefix}parent/${sw.insert_(this.parentName)}`;
        this.parentDescription =sw.var('cpInfoDescription');
        this.activityDescription='null';
        this.slideEnterTime = null;
        this.pauseTime=null;
        this.video=null;
        this.videoDuration=null;
        this.categoryName = null;
        this.categoryId = null;
        this.groupName = null;
        this.groupId=null;
        this.quizParent=null;
        this.actorName = user.learner.name;
        this.actorEmail = user.learner.id;
        this.registrationId =(()=>{
               return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
               })
         })();
        
         this.revision =(()=>{
             return this.actorEmail.split('@')[0]+this.projectEnterTime
         })();
        this.lmsUser=user.learner.name;
        this.lmsId =user.learner.id;
        if (params.reportingToLrs){
        this.lrs=(()=>{ 
            if (params.environment ==='sandbox'){
            var username = sw.var('v_key');
            var password = sw.var('v_secret');
            var endpoint = sw.var('v_endpoint');
            }
            else if(params.environment === 'production'){
                var username = sw.var('v_prodKey');
                var password = sw.var('v_prodSecret');
                var endpoint = sw.var('v_prodEndpoint');
            }
            try {
                let lrs = new TinCan.LRS({
                    endpoint: endpoint,
                    username: username,
                    password: password,
                    allowFail: false 
                });
                console.log('%c LRS endpoint:','color:#90ee90',lrs.endpoint,)
                return lrs;
            } catch (ex) {console.log("Failed to setup LRS object: " + ex); }
        })();
        }else(console.log('%c Reporting OFF - no LRS set up for this session','color:orange'))
        this.ie=(()=>{
            if (navigator.appVersion.indexOf('MSIE') !=-1){
                alert("If possible please use Chrome, Firefox, or Safari as this site does not work well with older version of Internet Explorer");
                return true;
            }else{
                return false;
            }
        })();
    };
    defineStmt(passedActivity,verb){
        //console.log(passedActivity)
        let prevSlideIndex =(sw.var('cpInfoPrevSlide'));
        if(prevSlideIndex ===0  || passedActivity===null){
            //if there is no previous slide index the project was launched and captures
            //the Captivate Project Name which is defined in xapi constructor this.parentName
            passedActivity = passedActivity || (()=>{
             this.launch = true;
             return this.parentName})();
            };
        this.parentType= this.activityType.course;
        this.activity = passedActivity;
        this.activityId = `${this.idPrefix}slide/${sw.insert_(this.activity)}`;
        this.categoryDescription = `This category contains ${this.categoryName} items`;
        this.videoId =this.activityId+"/video";
        this.videoName =this.activity+" Video Content";
        this.verbId=this.verb[`${verb}Id`];
        this.verbName=this.verb[verb];
        //first if is for access verb, since access happens when project is opened access is not passed into 
        //definestmt like it is for all other instances
        if (arguments[0]===null  && arguments.length==1){
            this.verbName =this.verb.access;
            this.verbId=this.verb.accessId;
            this.activityId=this.parentId;
            this.activity=this.parentName;
            this.type = this.activityType.course;
            this.activityDescription = `The captivate project ${this.activity} was launched`;
             }
        switch (verb){
        case'enter':
            this.type = this.activityType.slide;
            this.activityDescription = `Slide ${this.activity} was entered`;  
        break;
        case 'answer':
            this.type =this.activityType.question;
            this.activityDescription =`Question:${quiz.question}`;
            this.activity=`${quiz.question}`;
            this.activityId=this.idPrefix +"quiz/"+quiz.questionId;
        break;
        case'pressed the button': 
        case'pressed the click box':
                this.verbName = this.verb.press;
                this.verbId=this.verb.pressId;
                this.type = this.activityType.interaction;
                this.activityDescription = `${this.activity} button was interacted with`;
            if(verb==='pressed the click box'){
                this.verbName=this.verb.pressClickBox; 
            }  
        break;    
        case'skip':
            this.activityDescription =`Skipped question slide ${passedActivity}`;
            this.type =this.activityType.question;
        break;
        case'complete':
            this.activityDescription=`Completed by reaching the slide of ${passedActivity}`;
            this.type = this.activityType.course;
            this.activityId=this.parentId;
        break;
        case 'start':
            this.activityDescription=`Started Assessment ${quiz.quizName}`;
            this.activity = quiz.quizName;
            this.activityId = quiz.quizId;
            this.type = this.activityType.assessment;
        break;
        case 'finish':
            console.log(quiz.quizName)
                this.activityDescription=`Finished Assessment ${quiz.quizName}`;
                this.activity = quiz.quizName;
                this.activityId = quiz.quizId;
                this.type = this.activityType.assessment;
        break;
        case'view':
            this.activityDescription =`Slide ${this.activity} was viewed`;
        break;
        case 'play':
        case 'pause':
        case 'scrub':
        case 'mute':
        case 'unmute':
        case 'adjust':
            this.activity=passedActivity;
            this.activityId=`${this.idPrefix}video/${passedActivity}`;
            this.type=this.activityType.video;
            this.activityDescription=`Slide ${this.currentSlideIndex} Video - ${passedActivity}`
            this.videoDuration=($(this.video)[0].duration);
        break;
        }
    this.createStmt();
    this.prepareStmtToSend();
    this.sendStmt();
    };
    createActor(){
        return new TinCan.Agent({
            mbox:`mailto:${this.actorEmail}`,
            name:this.actorName});
    };
    createDefinition(type){
        //only passes a type for quiz defnitions see class Defintions for all the types
      
        if(arguments[0] != null  && this.verbName !=='completed' ){
         
            let definitions = new Definitions();
            return definitions.returnDefinition(sw.insert_(type));
        } else{
        return new TinCan.Activity({
            definition : {
                "name":{[params.display_en_lang[0]]:sw.remove_(this.activity)},
                "description":{[params.display_en_lang[0]]:`${sw.remove_(this.activityDescription)}`},
                "type":this.type
            },
            id : this.activityId
        });
    }   
    };
    createVerb(){
        return new TinCan.Verb({
            "id":this.verbId,
            "display":{
                [params.display_en_lang[0]]:this.verbName
            } 
        });
    };
    createContext(){
        let endingPoint,startingPoint;
        if(this.verbName ===this.verb.scrub) endingPoint =`PT${Math.round(this.newTime)}S`;
        else if (this.verbName ===this.verb.adjust) {
            endingPoint =`${Number(this.newTime).toFixed(2)}`;
        }
        else endingPoint = `PT${Math.round(this.pauseTime)}S`
        if(this.verbName === this.verb.adjust)startingPoint = `${Number(this.pauseTime).toFixed(2)}`;
        else startingPoint = `PT${Math.round(this.pauseTime)}S`;
        return new TinCan.Context(
            {
                "registration":this.registrationId,
                "revision":this.revision,
                "language":params.display_en_lang[0],
                "extensions": {
                    "http://id.tincanapi.com/extension/invitee": {
                        "studentId": this.lmsId,
                        "studentName": this.lmsUser
                      },
                "http://superwrapper/extension/slide-info":{
                    "slideIndex":this.currentSlideIndex,
                    "slideName":this.currentSlideName
                },
                "http://id.tincanapi.com/extension/ending-point": endingPoint,
                "http://id.tincanapi.com/extension/starting-point":startingPoint,
                "http://id.tincanapi.com/extension/scrubDuration":{
                    "name":{[params.display_en_lang[0]]:this.scrubTime,
                    "description":{[params.display_en_lang[0]]:`PT${Math.round(this.rawScrubTime)}S`}
                    }
                },
                "http://id.tincanapi.com/extension/duration":{
                    "name":{[params.display_en_lang[0]]:'Video length duration'},
                    "description":{[params.display_en_lang[0]]:`PT${Math.round(this.videoDuration)}S`}
                }
            
        }
        });
    };
    createContextActivities(){
         let context = new TinCan.ContextActivities({
            "parent": [
                {
                  "objectType": "Activity",
                  "id":this.parentId,
                  "definition": {
                    "name": {
                      [params.display_en_lang[0]]:this.parentName
                    },
                    "description": {
                      [params.display_en_lang[0]]: this.parentDescription
                    },
                    "type": this.parentType
                  }
                }
              ],
              "category": [
                {
                    "objectType": "Activity",
                    "id": this.categoryId,
                    "definition": {
                      "name": {
                        [params.display_en_lang[0]]: this.categoryName
                      },
                
                      "type": this.categoryType
                    }
                  }
              ],
              "grouping": [
                {
                    "objectType": "Activity",
                    "id": this.groupId,
                    "definition": {
                      "name": {
                        [params.display_en_lang[0]]: this.groupName
                      },
                      "type": this.groupType
                    }
                  }
              ]
        });
        if (this.groupName===null) context.grouping= null;
        if (this.categoryName===null) context.category= null;
        // console.log(context)
        return  context;
    };
   
        createResult(quizType){
        if (!quizType)return new TinCan.Result({
            duration:this.totalDurationTime
        })
        else 
        return new TinCan.Result({
            "score": {
                "scaled": (()=>{
                    if(quiz.correct) return (1.0) 
                    else return 0; })(),
                "raw": (()=>{
                    if(quiz.correct) return 1 
                    else return 0; })()
              },
              "success": quiz.correct,
              "completion": true,
              "duration": this.totalDurationTime,
              "response": quiz.selectedAnswer.toString()
        });
    };
    createStmt(){
        this.stmt = new TinCan.Statement({});
        this.stmt.actor = this.createActor();
        this.stmt.verb = this.createVerb();
        this.stmt.target =this.createDefinition((typeof quiz  !='undefined' && quiz.correct!==null)?quiz.questionType:null);
        this.stmt.context =this.createContext();
        this.stmt.context.contextActivities = this.createContextActivities();
        this.stmt.result=this.createResult((typeof quiz  !='undefined' && quiz.correct!==null)?true:false);
        this.stmt.context.platform =navigator.platform;
        const clearCtx =['groupId','groupName','groupName','categoryId','categoryName'];//reset context for next activity
        clearCtx.map(ctxt=>this[ctxt]=null);
    };
    prepareStmtToSend(){
        //console.log(this.verbName)
        switch (this.verbName){
                case 'started':
                    //creates quiz parent id
                    this.stmt.target.id = this.stmt.target.id+'/quiz';
                      //creates quiz parent info for question parent used in 'answered'
                    this.quizParent = this.stmt.target;
                break;
                case 'answered':
                    //set activityType for answered to Types(aseessment)
                    this.quizParent.definition.type=this.activityType.assessment;
                    //cretate 2nd parent for slide
                    add2ndParent(this.quizParent);
                break;
                case 'entered slide':
                case 'accessed course':
                 
                    //the currentslide becomes the videos 2nd parent
                    this.vidParent = this.stmt.target;
                    //has no result so it is removed
                    this.stmt.result=null;
                    //the current slide being entered is a 2nd parent to buttons on that slide
                    this.buttonParent = this.stmt.target;
                break;
                case 'completed course':
                    //sets property of complete to true
                    
                    this.stmt.result.complete=true
                break;
                case 'completed':
                        this.stmt.result.complete=true
                        this.quizParent = this.stmt.target;
                        this.stmt.target.id = this.stmt.target.id+'/quiz';
                        add2ndParent(this.quizParent);
                break;

                case 'pressed the button':
                case 'pressed the click box':
                    //when a button or click box is pressed set a the slide is the buttons 2nd parent.
                   add2ndParent(this.buttonParent);
                    //change id to show /button/button name from captivate
                    this.stmt.target.id=`${this.idPrefix}button/${sw.insert_(this.activity)}`;
                break; 
                case 'played':
                    //add 2nd parent to reflect slide
                   add2ndParent(this.vidParent);
                   //delete unneeded vid extensions
                    delete this.stmt.context.extensions["http://id.tincanapi.com/extension/ending-point"];
                    delete this.stmt.context.extensions["http://id.tincanapi.com/extension/starting-point"];
                    
                break;
                case 'paused':
                        //add 2nd parent to reflect slide
                       add2ndParent(this.vidParent);
                        //delete unneeded vid extensions
                        delete this.stmt.context.extensions["http://id.tincanapi.com/extension/starting-point"];
                break;
                case 'scrubbed':
                case  'adjusted volume':
                        //add 2nd parent to reflect slide
                        add2ndParent(this.vidParent);
                    break;
                case 'muted':
                case 'unmuted':
                        //add 2nd parent to reflect slide
                        add2ndParent(this.vidParent)
                        //delete unneeded vid extensions
                        delete this.stmt.context.extensions["http://id.tincanapi.com/extension/starting-point"];
                break;
        }
            //remove scrub duration if not a scrubbed statement
            //console.log(this.verbName);
            
            if(this.verbName !='scrubbed'){delete this.stmt.context.extensions["http://id.tincanapi.com/extension/scrubDuration"]}
            //remove all video extensions from statmen if not a video object

            if (this.video ===null) {
                delete this.stmt.context.extensions["http://id.tincanapi.com/extension/ending-point"];
                delete this.stmt.context.extensions["http://id.tincanapi.com/extension/starting-point"];
                delete this.stmt.context.extensions["http://id.tincanapi.com/extension/duration"];
            }
            //remove extension for SCORM user in LMS profile
            if (typeof user.scorm !='object')delete this.stmt.context.extensions["http://id.tincanapi.com/extension/invitee"];
            //add slide to all visited slides
            if(sw.var('cpInfoCurrentSlideLabel') != this.slides[this.slides.length-1] &&this.verbName !='entered slide')this.slides.push(sw.var('cpInfoCurrentSlideLabel'));
            //removes parent if the verb is accessed or complete, becuase you can only access and complete the parent itself
            if(this.verbName===this.verb.access  ||
               this.verbName===this.verb.complete ) this.stmt.context.contextActivities.parent=null;
            //helper function

            function add2ndParent(parent){
                xApiController.stmt.context.contextActivities.parent[1]=parent;
            }
    };
    sendStmt(){
       let stmt =this.stmt;
        if (this.ie===true  || params.reportingToLrs ===false){
            if(params.consoleLog.statements) console.log("%c🖨 Reporting off console only","color:red",{stmt});
            if(params.consoleLog.quickLogVerbActivity)console.log(stmt.verb.display['en-US'],stmt.target.definition.name['en-US']);
            return
        }
		else{
            this.lrs.saveStatement(
                stmt, {
                    callback: function (err, xhr) {
                        if (err !== null) {
                            if (xhr !== null) {
                               
                                if(params.consoleLog.statements) console.log("%c💾 Warning:Statement failure","color:orange",{stmt});
                                console.log("Failed to save statement: " + xhr.responseText + " (" + xhr.status + ")");
                                return;
                            }
                            console.log("Failed to save statement: " + err);
                            return;
                        }
                       if(params.consoleLog.statements) console.log("%c💾 Statement saved","color:green",{stmt});
                       if(params.consoleLog.quickLogVerbActivity)console.log(stmt.verb.display['en-US'],stmt.target.definition.name['en-US']);
                    }
                }
            )
        }
    };
    cpListeners(){
            window.cpAPIEventEmitter.addEventListener('CPAPI_SLIDEENTER',e=>{
            this.slideVids=[];
            this.video=null;
            //sw.typeText();
            this.quizhandler(e);
            if(sw.var('cpInQuizScope')==0){this.quizStarted = false}
            if(sw.var('cpInQuizScope')==true  && !this.quizStarted){
                if(quiz.question ===null){
                    if(params.verbs.quiz.start)this.defineStmt(quiz.quizName,'start');
                    this.quizStarted = true;
                }
            }
            this.currentSlideName = sw.var('cpInfoCurrentSlideLabel');
            //update index - cp Index starts as 0, slides start at 1
            this.currentSlideIndex=sw.var('cpInfoCurrentSlideIndex')+1;
            this.totalSlides=sw.var('cpInfoSlideCount');
           if(this.currentSlideIndex === this.totalSlides && params.verbs.complete){
                this.defineStmt(null,'complete');
                //console.log(this.slides)
                this.defineStmt(this.slides[this.slides.length-2],'view')
                this.launchFlag=true;
           };
            if(this.slideEnterTime===null){
            //first slide enter time becomes project entry time
            this.slideEnterTime = this.projectEnterTime;
            };
            //this listener is when time changes, set exit Time
            this.slideExitTime = new Date().getTime();
            let milliSeconds = Math.floor((this.slideExitTime-this.slideEnterTime));
            this.totalDurationTime = sw.convertMilliSecondsToISO(milliSeconds);
            //console.log(this.slides)
            if(!this.launchFlag){
                 //console.log(this.slides)
                // console.log(this.slides[this.slides.length-1]);
                 if(params.verbs.view[0]){this.defineStmt(this.slides[this.slides.length-1],'view');
                 }
                 //this listener is for slide change, so the end of the last slide now becomes
                 //beginning time for this slide
                 this.slideEnterTime = this.slideExitTime
              }else this.launchFlag=false;
              if(params.verbs.enter[0])this.defineStmt(sw.var('cpInfoCurrentSlideLabel'),'enter');
               if(typeof e.Data.videos !=="undefined"){
                   xApiController.appendVideoListener(e.Data.videos.length);
                }
            });
            window.cpAPIEventEmitter.addEventListener('CPAPI_INTERACTIVEITEMSUBMIT',e=>{
             if(params.consoleLog.eventListner)console.log(e);
                xApiController.clickTime = new Date().getTime();
                xApiController.totalDurationTime= sw.convertMilliSecondsToISO(Math.floor(xApiController.clickTime-xApiController.slideEnterTime));
                let activity = e.cpData.itemname;
                let typeNum = e.cpData.objecttype;
                let verb;
                switch (typeNum){
                    case 177:
                        verb = 'pressed the button';
                    break;
                    case 13:
                        verb = 'pressed the click box';
                    break;
                    case 24:
                        verb='submitted text box entry';//TODO:Finish this
                        this.tebInput = $(`[id^='${activity}']`).text();
                    break;
                    default:
                        verb = 'pressed the button'
                    break;
                }
                
                if (activity.substr(0,18) ==='sw_reloadWebObject' 
                || activity.substr(0,18) ==='xapi_sw_reloadWebO'){
                    sw.reloadWebObject();
                    this.groupName ="A grouping category for the refresh button";
                    this.groupId=`${this.idPrefix}group/refreshButton`
                    this.groupType=this.activityType.buttonGroup
                }
                else if (activity.substr(0,5).toLowerCase()==="xapi_"){
                    activity = sw.remove_(activity.slice(5,activity.length));
                    this.groupName ="A grouping category for buttons";
                    this.groupId=`${this.idPrefix}group/resumeButtons`
                    this.groupType=this.activityType.buttonGroup
                    xApiController.defineStmt(activity,verb);
                   
                }else{
                    this.groupName =null;
                    this.groupId=null;

                }
                 });
            window.cpAPIEventEmitter.addEventListener('CPAPI_QUESTIONSUBMIT',e=>{
                this.quizhandler(e) 
                console.log(quiz)
                if(quiz.correct===true){
                    this.defineStmt(quiz.Name,'finish')
                }
                if(params.verbs.quiz.answer){
                    this.defineStmt(quiz.question,'answer');
                }
            })
            window.cpAPIEventEmitter.addEventListener('CPAPI_QUESTIONSKIP',e=>{
                this.quizhandler(e);
                if(params.verbs.quiz.skip)this.defineStmt(this.slides[this.slides.length-1],'skip')
            })
            window.cpAPIEventEmitter.addEventListener('CPAPI_VARIABLEVALUECHANGED','v_increment',e=>{
            });
      
    };
    appendVideoListener(totalVids){
        //checkLoad ensures that at least one video element exists on the slide prior to running
            sw.checkLoad('video', ()=>{
                 let videos = ($('video'))
                 $.each(videos, vid=>{
                    let vidTemp = new VideoObject(videos[vid])
                    xApiController.slideVids.push(vidTemp)
                 })
                 //set up to look for a new video to enter timeline every 2nd, and continue to search 
                 //until all the videos on the page are present
                 let checkForVideo = setInterval(()=>{
                 let vidObj = $('video');
                    if (vidObj.length > videos.length){
                        xApiController.slideVids.push(new VideoObject(vidObj[vidObj.length-1]));
                        //(xApiController.slideVids); 
                        clearInterval(checkForVideo);
                    }
                  },1000)
                   
            });       
    };
    quizhandler(data){
     quiz = new Quiz(data);   
     if(params.consoleLog.quizLog)console.log(quiz)
    }
};
class SuperWrapper{
    constructor(){
        this.capGetVarValue = data=>{
            let getData = window.cpAPIInterface.
             getVariableValue(data);
             return getData;
       };
        this.capSetVarValue =(variable, value)=>{
            window.cpAPIInterface.setVariableValue(variable, value);
            return `Variable ${variable} set to ${value}`;
        };
        this.verbId ='http://id.superwrapper.com/verb/';//TODO:add validaton
    };
    jump(slide){
        this.capSetVarValue('cpCmndGotoSlide',slide);
        //console.log(slide)
    };
    next(){
        window.cpAPIInterface.next();
    };
    play(){
        cp.movie.play();
    };
    var(value){
       return this.capGetVarValue(value)
    };
    reloadWebObject(){
        $('iframe').attr('src', $('iframe').attr('src'));
    };
    convertMilliSecondsToISO(millis){
        
        let minutes = Math.floor(millis / 60000);
        let seconds = ((millis % 60000) / 1000).toFixed(0);
        return `PT0H${minutes}M${Number(seconds) < 10 ? '0' : ''}${seconds}S`;
    };
    getInput(type){
        let tebInput = this.var('v_tebValue');
        switch(type){
            case 'name':
                if (tebInput!=null || tebInput !="" ){
                    xApiController.actorName = tebInput;
                    xApiController.actorEmail= `${tebInput}@superwrapper.com`;
                
                }else return false;
            break;
            case 'email':
                if(!user.testEmail(tebInput)) user.swEmail = tebInput
                else return false;
            break;

            case 'essay':
                xApiController.tebInput = tebInput;
            break;
                }
           
    };
    insert_(input){//helperfunction replace spaces with _underscore_
        if(input.indexOf(' '))
        return (input.indexOf(' ') >0) ? input.split(' ').join('_'):input;
        else
        return (input.indexOf('-') >0) ? input.split('-').join('_'):input;
    };
    remove_(input){
        return (input.indexOf('_') > 0) ? input.split('_').join(' '):input;
    };
    uriCheck(uri){
        //console.log(uri)
        let validUri = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        let valid = validUri.test(uri);   
        //console.log(valid)
        if(valid)return uri
        else return null;
    };
    checkLoad(element,callback){//helper fucntion to wait for element to load before taking action
        const elementInterval = setInterval(checkElement, 500, callback)
        function checkElement(callback){   
        if($(element).length > 0){
            clearInterval(elementInterval);
            callback();
        }
    };
    };
    typeText(){
        if($('span.cp-actualText').text() !=""){
            let temp = $('span.cp-actualText').text();
             $('span.cp-actualText').text('');
            let splitText = temp.split(' ');
            let counter =0;
            let current="";
            let typing = setInterval(()=>{
                current =$('span').text();
               $('span').text('');
            let newText = current +" "+splitText[counter];
               $('span:first').text(newText)
                //$('span.cp-actualText').text('');
                //$('span.cp-actualText').text(newText);
                counter++
                if (counter == splitText.length){clearInterval(typing)};
            },250)
           };
    };
    openWebsite(email){
        //TODO:refine these optioni
         location.href = `mailto:${email}?subject=Brian%20Floyd's%20Resume`;
    };
    callWebsite(url,description){//helper function to manually call website for param passing
        let appendEmailParam ="";
        let urlTest =url.substr(0,9);
       appendEmailParam = `?mailto=${xApiController.actorEmail}`;
        xApiController.activityId =url;
        xApiController.createStmt(description);
        window.open(url+appendEmailParam,"_parent");
    };
    updateTitle(parentName){
        $('title').text(parentName);
    };
    toggleGeture(bool){
        if(typeof bool ==='boolean')cp.m_gestureHandler.enabled = bool;
        else return;
    };
};
class Learner{
    constructor(){
    this.scorm = this.getAPI();//call functions that get scorm object
    this.findAPITries = 0;//call variable needed for previous function
    this.url = new URL(location);//get url infomration
    this.url_emailParam = this.url.searchParams.get("mbox")  || this.url.searchParams.get('mailto');//grab mbox param for url if passed
    this.learner=null;//creates an empty learner
    this.testEmail = email=>{ 
        let emailValidation = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let valid = emailValidation.test(email);
        return valid;
    };//function to test email
    };
    init(callback){

    if (typeof this.scorm ==="object"){

           //if there is a scorm user avaiable this will grab data from scorm if available
        this.learner = {
        "id":(this.testEmail(this.scorm.LearnerId))?this.scorm.LearnerId:`${insert_(this.scorm.LearnerId)}@superwrapper.com`,
        "name":this.scorm.LearnerName
         };
    
         callback();    
    }
    else if(this.url_emailParam !==null  && this.testEmail(this.url_emailParam)){
          //if scorm not available next check mbox parameter in the url to see if any 
         //value has been passed
        this.learner = {
            "id":this.url_emailParam,
            "name":this.url_emailParam.split('@')[0]
             };
             sw.capSetVarValue('v_actorName',this.learner.name);
            callback();
    }
    else{
        //present user with login screen TODO:Rework onload to pop up faster
        console.log('Must pass an email address into login screen is updated');
        this.loginScreen(callback);
    }  
    };
    findAPI(win){
        // Check to see if the window (win) contains the API
        // if the window (win) does not contain the API and
        // the window (win) has a parent window and the parent window
        // is not the same as the window (win)
        while ( (win.API == null) && (win.parent != null) && (win.parent != win) )
        {
            // increment the number of this.findAPITries
            this.findAPITries++;
            // Note: 7 is an arbitrary number, but should be more than sufficient
            if (this.findAPITries > 7)
            {
                return null;
            }
            // set the variable that represents the window being
            // being searched to be the parent of the current window
            // then search for the API again
            win = win.parent;
        }
        return win.API;
            };
    getAPI()
        {
        // start by looking for the API in the current window
        var theAPI = this.findAPI(window);
        // if the API is null (could not be found in the current window)
        // and the current window has an opener window
        if ( (theAPI == null) && (window.opener != null) && (typeof(window.opener) != "undefined") )
        {
            // try to find the API in the current window’s opener
            theAPI = this.findAPI(window.opener);
        }
        // if the API has not been found
        if (theAPI == null)
        {
            // Alert the user that the API Adapter could not be found
            theAPI = false;
        }
        return theAPI;
    };
 loginScreen(callback){
    sw.checkLoad('.cpMainContainer',()=>{
             $('.cpMainContainer').hide();
             $(`<div class ="login-screen">`)
             .appendTo('body')
             .css({
            "width":"98vw",
            "min-height":"100vh",
            "border":"1px black solid",
            "border-radius":"5px",
            "background-color":"grey"
            //TODO:Create xAPI WRapper logo/background
            }); 
            sw.login = $('.login-screen');
            sw.placeholder = params.login.placeholderText || "Please enter your email and press enter or submit";
            sw.footer ="Powered by SuperWrapper";
            sw.message= params.login.loginMessage ||`Entering an email address will be the user that is reported to the demo LRS, for this
                        demonstration if you would prefer please press the skip button and a demo email
                        will be assinged to you`
    //create input box
            $(`<input class ="email-input" type="email" placeholder ="${sw.placeholder}">"`)
            .appendTo(sw.login)
            .css({
                "min-width":"50vw",
                "min-height":"5vh",
                "font-size":"90%",
                "margin-left":"50%",
                "margin-top":"10%",
                "border-radius":"10px",
                "box-shadow":"5px 5px grey",
                "transform":"translate(-50%,-25%)",
            }).
            focus()
            //event listener for enter
            .on("keyup", e=>{
                if(e.which ===13 || e.code===13){
                    let email = $(e.target).val()
                    passEmail(email);
                } 
            });
            $(`<div class="message">${sw.message}</div>`)
            .appendTo(sw.login)
            .css({
                "width":"60%",
                "padding-top":"25px",
                "font-family":"arial",
                "margin-left":"50%",
                "transform":"translate(-50%,-10%)",
                "color":"#FFFAFA"
            })

            if(!params.login.skipEmail){
            $('<button id="skip">Skip Email</button>')
            .insertBefore('.message')
            .css({
                "background-color":"orange",
                "color":"#FFFAFA",
                "margin-left":"2vw",
                "min-width":"8vw",
                "min-height":"5vh",
                "border-radius":"5px",
                "box-shadow": "2px 2px #888888"
        
            }).hover($(this).css({
                "background-color":"#EE7600",
                "background-color":"orange"
            }))  .on('click',()=>{
                console.log('click')
                window.open(`${this.url.href}?mbox=${(()=>{return ((user.testEmail(params.login.skipEmailValue))?params.login.skipEmailValue:'user@SuperWrapper.com')})()}`,"_parent");
            });
        }

            $('<button id="submit">Submit Email</button>')
            .insertBefore('.message')
            .css({
                "background-color":"green",
                "color":"white",
                "margin-left":"30vw",
                "min-width":"8vw",
                "min-height":"5vh",
                "border-radius":"5px",
                "box-shadow": "2px 2px #888888",
             
            }).on ('click',()=>passEmail($('.email-input').val()))
        
            $(`<footer class ="footer">${sw.footer}</footer>`)
            .insertAfter('.message')
            .css({
                "color":"#FFFAFA",
                "position":"absolute",
                "bottom":"4%",
                "left":"50%",
                "transform":"translate(-50%,-50%)",
                "font-family":"arial",
                "font-size":"80%"
            });

        function passEmail(email){
            let valid = user.testEmail(email);
            if(!valid)$('.email-input').val('').focus('').attr("placeholder",params.login.invalidMsg || "Invalid email please try again and press enter");
            else {
                window.open(`${user.url.href}?mbox=${email}`,"_parent");
            }


        }    
    });
}};
class VideoObject{
    constructor(vidObj){
        this.video =vidObj;
        this.duration = vidObj.duration;
        this.name = vidObj.cpVideo.id;
        this.pauseTime = [];
        this.autoPlay =  (vidObj.autoPlay ===1) ? true :false;
        this.flag= this.autoPlay ? 'play':'paused';
        this.startVolume =1;
        let playFlag = setInterval(()=>{
            if($(this.video)[0].paused===false){
                xApiController.video=this.video;
                xApiController.defineStmt(this.name,'play');
                clearInterval(playFlag);
            }
            },1000)
        $(`#btmControl${this.name}`).on('mousedown', ()=>{
             this.getStartTime= this.video.currentTime; 
        })
        this.listener = $(`#btmControl${this.name}`).on(xApiController.eventBinder,e=>{
                let playbarAction = ($(e.target)[0].innerText);
                let playbar;
                (playbarAction.indexOf(',')> -1)? playbar = playbarAction.split(",")[0]:playbar = playbarAction;
                (playbarAction.indexOf('set to')> -1)? playbar = playbarAction.split("set to")[0]:playbar = playbar;
                switch(playbar.trim()){
                    case 'Stop':
                        this.pauseTime.push(this.video.currentTime);
                        if(params.consoleLog.videoLog)console.log(`stopped at ${this.pauseTime}`);
                        break;
                    case 'Pause':
                            this.pauseTime.push(this.video.currentTime);
                            if(params.consoleLog.videoLog)console.log(`paused at ${this.pauseTime[this.pauseTime.length-1]}`);
                            xApiController.pauseTime=this.pauseTime[this.pauseTime.length-1];
                            xApiController.defineStmt(this.name,'pause');
                            break;
                    case 'Play':
                        if(params.consoleLog.videoLog)console.log(`played after pause/stop at ${this.pauseTime[this.pauseTime.length-1]}`)
                        break;
                    case 'Progress':
                            let a = playbarAction.split(',')[1];
                            a = a.split('at')[1];
                            a = a.split('seconds')[0];
                            //TODO:test to ensure that seconds don't become minutes on videos with duration >60 seconds
                            let scrubTime = this.video.currentTime - this.getStartTime ;
                            let rawTime = scrubTime;
                            (scrubTime <0) ? scrubTime=`scrubbed back ${Math.abs(scrubTime)}`:scrubTime=`scrubbed forward ${Math.abs(scrubTime)}`
                            if(params.consoleLog.videoLog) console.log(scrubTime);
                            if(params.verbs.video.scrub){
                            xApiController.newTime=this.video.currentTime;
                            xApiController.pauseTime=this.getStartTime;
                            xApiController.scrubTime=scrubTime;
                            xApiController.rawScrubTime=Math.abs(rawTime);
                            xApiController.defineStmt(this.name,'scrub');
                            }
                        break;
                    case 'Mute':
                        if(params.consoleLog.videoLog) console.log('mute at'+$(this.video)[0].currentTime);
                        if(params.verbs.video.mute){
                            xApiController.pauseTime=$(this.video)[0].currentTime;
                            xApiController.defineStmt(this.name,'mute');
                        }
                       
                        break;
                    case 'Unmute':
                        if(params.consoleLog.videoLog) xApiController.defineStmt(this.name,'unmute');
                        if(params.verbs.video.unmute)xApiController.pauseTime=$(this.video)[0].currentTime;
                        break;
                    case 'Volume':
                        if(params.consoleLog.videoLog)console.log(`adjust to ${this.newVolume}`);
                        if(params.verbs.video.adjustVolume[0]){
                        this.newVolume = playbarAction.split('set to')[1];
                        xApiController.pauseTime= this.startVolume;
                        xApiController.newTime =this.newVolume;
                        xApiController.defineStmt(this.name,'adjust');
                        this.startVolume=this.newVolume;
                        }
                        break;
                    case 'Full Screen':
                        if(params.consoleLog.videoLog)console.log('Full Screen');
                        break;
                }
            })    
            }
};

class Verbs{
    constructor(){
        this.enter = params.verbs.enter[1] || "entered slide"
        this.enterId =sw.uriCheck(params.verbs.enter[2]) || `${sw.verbId}enteredSlide`;
        this.view = params.verbs.view[1] ||'viewed slide';
        this.viewId = sw.uriCheck(params.verbs.view[2]) || 'http://id.tincanapi.com/verb/viewed';
        this.access =params.verbs.access[1] || 'accessed course';
        this.accessId =sw.uriCheck(params.verbs.access[2]) || 'http://activitystrea.ms/schema/1.0/access';
        this.return =params.verbs.return[1] ||'returned to';
        this.returnId =sw.uriCheck(params.verbs.return[2]) ||'http://activitystrea.ms/schema/1.0/return';
        this.open =params.verbs.open[1] ||'opened';
        this.openId=sw.uriCheck(params.verbs.open[2])  ||'http://activitystrea.ms/schema/1.0/open';
        this.complete =params.verbs.complete[1] ||'completed course';
        this.completeId=sw.uriCheck(params.verbs.complete[2])  || 'http://activitystrea.ms/schema/1.0/complete';
        this.finish = params.verbs.quiz.finish[1] ||'completed';
        this.finishId =sw.uriCheck(params.verbs.quiz.finish[2])  || 'http://activitystrea.ms/schema/1.0/complete';
        this.start=params.verbs.quiz.start[1] ||'started';
        this.startId = sw.uriCheck(params.verbs.quiz.start[2]) || 'http://activitystrea.ms/schema/1.0/start';
        this.answer=params.verbs.quiz.answer[1] ||"answered";
        this.answerId=sw.uriCheck(params.verbs.quiz.answer[2])  || "http://adlnet.gov/expapi/verbs/answered";
        this.skip=params.verbs.quiz.skip[1] = "skipped question";
        this.skipId=sw.uriCheck(params.verbs.quiz.skip[2]) || "http://id.tincanapi.com/verb/skipped";
        this.review=params.verbs.quiz.review[1] ||"reviewed";
        this.reviewId=sw.uriCheck(params.verbs.quiz.review[2] )|| 'https://brindlewaye.com/xAPITerms/verbs/reviewed/';
        this.adjust = params.verbs.video.adjustVolume[1] || 'adjusted volume';
        this.adjustId =sw.uriCheck(params.verbs.video.adjustVolume[2]) ||`${sw.verbId}adjustVolume`;
        this.mute =params.verbs.video.mute[1] ||'muted';
        this.muteId = sw.uriCheck(params.verbs.video.mute[2]) || `${sw.verbId}mute`;
        this.unmute =params.verbs.video.unmute[1] ||'unmuted';
        this.unmuteId = sw.uriCheck(params.verbs.video.unmute[2]) ||`${sw.verbId}unumute`;
        this.scrub = params.verbs.video.scrub[1] || 'scrubbed';
        this.scrubId = sw.uriCheck(params.verbs.video.scrub[2]) ||`${sw.verbId}scrub`;
        this.play=params.verbs.video.play[1] ||'played';
        this.playId =sw.uriCheck(params.verbs.video.play[2]) || 'http://activitystrea.ms/schema/1.0/play';
        this.pause = params.verbs.video.pause[1] ||"paused";
        this.pauseId=sw.uriCheck(params.verbs.video.pause[2]) ||"http://id.tincanapi.com/verb/paused";
        this.watch=params.verbs.video.watch[1] || 'watched';
        this.watchId = sw.uriCheck(params.verbs.video.watch[2]) || 'http://activitystrea.ms/schema/1.0/watch';
        this.experience =params.verbs.experience[1]||'experienced';
        this.experienceId =sw.uriCheck(params.verbs.experience[2]) || 'http://adlnet.gov/expapi/verbs/experienced';
        this.press=params.verbs.pressButton[1] ||'pressed the button';
        this.pressClickBox=params.verbs.pressClickBox[1] || 'pressed the click box';
        this.pressId = sw.uriCheck(params.verbs.pressButton[2]) || 'http://future-learning.info/xAPI/verb/pressed';
    }
};
//define activity types
class Types{
    constructor(){
        this.slide ='http://id.tincanapi.com/activitytype/slide';
        this.page="http://activitystrea.ms/schema/1.0/page";
        this.category="http://id.tincanapi.com/activitytype/category";
        this.subcategory ="http://id.tincanapi.com/activitytype/subcategory"
        this.group="http://activitystrea.ms/schema/1.0/group";
        this.buttonGroup = "http://superwrapper/group/buttongroup";
        this.video="http://activitystrea.ms/schema/1.0/video";
        this.pdf="http://activitystrea.ms/schema/1.0/pdf";
        this.source=`http://activitystrea.ms/schema/1.0/source`;
        this.course=`http://adlnet.gov/expapi/activities/course`;
        this.interaction ='http://adlnet.gov/expapi/activities/interaction';
        this.question="http://adlnet.gov/expapi/activities/cmi.interaction";
        this.assessment="http://adlnet.gov/expapi/activities/assessment";
    }
};
class Quiz{
    constructor(data){
        this.possibleAnswers = [];
        this.quizName=params.quizName || xApiController.parentName + " Quiz";
        this.quizId=params.quizId || xApiController.parentId;
        this.questionType = sw.var('cpQuizInfoQuestionSlideType');
        this.totalquestions =sw.var('cpQuizInfoTotalQuestionsPerProject');
        this.questionId=data.cpData.interactionID;
        this.question=null;
        //this.questionNumber =data.cpdata.questionNumber+1||null;
        let labels = $('[id^=si]');
        let textArray=[];
        labels.filter(label=>{
         if($(labels[label]).text()!='') {
          if($(labels[label]).text() == '<< ' ||
          $(labels[label]).text() == '>> '||
          //$(labels[label]).text() == 'Submit '||
          $(labels[label]).text() == 'Skip ')return;
          if(textArray.indexOf($(labels[label]).text()) ==-1)
             textArray.push($(labels[label]).text());
    }
   });
   //console.log(textArray)
    if(typeof data.cpData.correctAnswer !='undefined'){
        this.correctAnswer = (()=>{
            let answers = data.cpData.correctAnswer;
            if(answers.indexOf(';'))answers = answers.split(';')
            return answers;
        })();
        this.selectedAnswer =  (()=>{
            let answers = data.cpData.selectedAnswer;
            if(answers.indexOf(';'))answers = answers.split(';')
            return answers;
             })();   
        this.correct = (()=>{return (JSON.stringify(this.correctAnswer)==JSON.stringify(this.selectedAnswer))?true:false})();
        if(this.questionType=='long-fill-in'  || this.questionType =='fill-in'){
                this.questionTitle=textArray[0];
                this.question= textArray[1];
                this.correctAnswer = (()=>{
                    let answers = data.cpData.correctAnswer;
                    if(answers.indexOf(':'))answers = answers.split(':')
                    return answers;
                })();
                this.selectedAnswer =  (()=>{
                    let answers = data.cpData.selectedAnswer;
                    if(answers.indexOf(':'))answers = answers.split(':')
                    return answers;
                     })();
                this.correct =(()=>{
                    return (this.correctAnswer.indexOf(this.selectedAnswer[0])>-1)?true:false;
                })(); 
            } 
            else if(this.questionType==='matching'){
                this.question = textArray[3];
                let parse = textArray.slice(3,textArray.indexOf('Submit '))
                //TODO:rewrite result cleaner
                let result = parse.filter(check=> (check.indexOf('A)')))
                                  .filter(check=>check !=" ")
                                  .filter(check=>check.indexOf('1.'))
                                  .filter(check=>check.indexOf('1)'))
                                  .filter(check=>check.indexOf('a.'))
                                  .filter(check=>check.indexOf('a)'))
                let  numOfChoices =this.correctAnswer.toString().split(',').length;
                this.source=result.slice(result.length - numOfChoices,result.length);
                this.target=result.slice(result.length-(numOfChoices+1)-numOfChoices,result.length-(numOfChoices+1))
            }
        }
        else this.correctAnswer,this.selectedAnswer,this.correct = null;
   this.questionTitle = textArray[2]  || null;
   (this.questionType==='sequencing')?this.question=textArray[2]||null:this.question = textArray[3] || null;
   if(this.questionType ==='hotspot') this.question =textArray[1]||null;
   if(this.questionType !='matching')this.possibleAnswers= (this.questionType==='sequencing')
   ?this.possibleAnswers = textArray.slice(3,textArray.indexOf('Submit '))||null
   :this.possibleAnswers = textArray.slice(4,textArray.indexOf('Submit '))||null;
}
};
class Definitions{
constructor(){
    this.choice =  new TinCan.Activity({definition: {
        "name":{[params.display_en_lang[0]]:xApiController.activity},
            "description": {
                [params.display_en_lang[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "choice",
            "correctResponsesPattern": [
                (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                        quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;
                    } else return quiz.correctAnswer;
                })()
            ],
            "choices": 
                (()=>{
                    let answers =[];
                    quiz.possibleAnswers.map((answer,index)=>{
                       let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                        "description":{
                            [params.display_en_lang[0]]:answer
                        }
                    }
                        answers.push(tempAnswer)})
                    return answers
            })()
    },
    id:xApiController.activityId
});
    this.true_false= new TinCan.Activity({"definition": 
        {
            "description": {
                [params.display_en_lang[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "true-false",
            "correctResponsesPattern": [quiz.correctAnswer]
        },
        id:xApiController.activityId
    });
    this.long_fill_in= new TinCan.Activity({"definition": {
            "description": {
                [params.display_en_lang[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "long-fill-in",
            "correctResponsesPattern": [
                "{case_matters=false}{lang=en}"+  (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                        quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;
                    } else return quiz.correctAnswer;
                })()
            ]
    },
    id:xApiController.activityId
});

    this.matching = (()=>{let def = new TinCan.Activity({"definition": {
        "name":{[params.display_en_lang[0]]:quiz.question},
            "description": {
                [params.display_en_lang[0]]: quiz.question
            }, 
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "matching",
            "correctResponsesPattern": [
                // "ben[.]3[,]chris[.]2[,]troy[.]4[,]freddie[.]1"
                (()=>{
                        let aAndb = quiz.correctAnswer.toString().split(',');
                        let correctAnswer='';
                        quiz.source.map((answer,index)=>{
                            
                            correctAnswer=correctAnswer+`${answer.trim()}[.]${aAndb[index].substr(2,2)}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;
                 
                })()
            ],
            "source": 
                (()=>{
                    let answers =[];
                    quiz.source.map((answer,index)=>{
                       let tempAnswer={"id":`${answer.trim()}`,
                        "description":{
                            [params.display_en_lang[0]]:answer.trim()
                        }
                    }
                        answers.push(tempAnswer)})
                    return answers
            })()
             ,
            "target": 
            (()=>{
                let answers =[];
                quiz.target.map((answer,index)=>{
                   let tempAnswer={"id":`${answer.trim()}`,
                    "description":{
                        [params.display_en_lang[0]]:answer.trim()
                    }
                }
                    answers.push(tempAnswer)})
                return answers
        })()
    },
    id:xApiController.activityId});

return def;
    })();

    this.fill_in_the_blank = new TinCan.ActivityDefinition( {"definition": {
            "description": {
                [params.display_en_lang[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "fill-in",
            "correctResponsesPattern": [
                (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                        quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;
                    } else return quiz.correctAnswer;
                })()
            ]
        
    },
    id:xApiController.activityId
});
    this.sequencing = new TinCan.ActivityDefinition({"definition": {
            "description": {
                [params.display_en_lang[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "sequencing",
            "correctResponsesPattern": 
                (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                        quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;
                    } else return quiz.correctAnswer;
                })()
            ,
            "choices":  (()=>{
                let answers =[];
                quiz.possibleAnswers.map((answer,index)=>{
                   let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                    "description":{
                        [params.display_en_lang[0]]:answer
                    }
                }
                    answers.push(tempAnswer)})
                  
                return answers
        })() 
    },
    id:xApiController.activityId
});
    this.likert= new TinCan.ActivityDefinition({"definition": {
            "description": {
                "[params.display_en_lang[0]]": quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "likert",
            "correctResponsesPattern": [
             quiz.correctAnswer
            ],
            "scale": [
                (()=>{
                    let answers =[];
                    quiz.possibleAnswers.map((answer,index)=>{
                       let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                        "description":{
                            [params.display_en_lang[0]]:answer
                        }
                    }
                  answers.push(tempAnswer)})
                    return answers
            })()
            ]
        },
        id:xApiController.activityId
    });
    this.hotspot= new TinCan.ActivityDefinition({"definition": {
            "description": {
                [params.display_en_lang[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "choice",
            "correctResponsesPattern": [
                (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                        quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;
                    } else return quiz.correctAnswer;
                })()
            ],
            "choices": 
                (()=>{
                    let answers =[];
                    quiz.possibleAnswers.map((answer,index)=>{
                       let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                        "description":{
                            [params.display_en_lang[0]]:answer
                        }
                    }
                        answers.push(tempAnswer)})
                    return answers
            })()
        },
        id:xApiController.activityId
    }) ;
}
returnDefinition(type){
    return this[type];
};
};








