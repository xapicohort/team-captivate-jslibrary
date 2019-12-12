//TODO: look for instances of toLowerCase();
//MATCHING QUESTIONS MUST HAVE THE DEFAULT COLUMN 1 and COLUMN 2 headers must be, they can be changed, but not deleted or empty
//NOTE:Quiz results are all working with the exception of matching

const customVerbPrefix="http://id.superwrapper.com/verb/";
const params = {
    "display_language":["en-US","en-CA","es","fr-CA"],//uses whichever value is in the first positiiion [0] in Array
    "verbs":{
                access:[true,'accessed','http://activitystrea.ms/schema/1.0/access'],
                enter:[true,'entered slide',`${customVerbPrefix}enteredSlide`],
                return:[true,'returned to','http://activitystrea.ms/schema/1.0/return'],
                view:[true, 'viewed slide','http://id.tincanapi.com/verb/viewed'],
                complete:[true,'completed course','http://activitystrea.ms/schema/1.0/complete'],
                open: [true,'opened','http://activitystrea.ms/schema/1.0/open'],
                pressButton: [true,'pressed button' , 'http://future-learning.info/xAPI/verb/pressed'],
                pressClickBox:[true, 'clicked box'],//same verb as above
                focus:[true,'focused','http://id.tincanapi.com/verb/focused'],
                unfocus:[true,'unfocused','http://id.tincanapi.com/verb/unfocused'],
                experience:[true, 'experienced','http://adlnet.gov/expapi/verbs/experienced'],
            "quiz":
            {
                start:[true,'started','http://activitystrea.ms/schema/1.0/start'],
                skip:[true,'skipped',"http://id.tincanapi.com/verb/skipped"],
                answer:[true,'answered',"http://adlnet.gov/expapi/verbs/answered"],
                review:[true,'reviewed','https://brindlewaye.com/xAPITerms/verbs/reviewed'],
                finish:[true,'completed quiz','http://activitystrea.ms/schema/1.0/complete']
            },
            "video":
            {
                play:[true,'played','http://activitystrea.ms/schema/1.0/play'],
                pause:[true,'paused', "http://id.tincanapi.com/verb/paused"],
                scrub:[true,'scrubbed', `${customVerbPrefix}scrubbed`],
                mute:[true,'muted', `${customVerbPrefix}muted`],
                unmute:[true,'unmuted', `${customVerbPrefix}unmuted`],
                adjustVolume:[true,'adjusted volume',`${customVerbPrefix}adjustVolume`],
                watch: [true,'watched','http://activitystrea.ms/schema/1.0/watch'],
                expand:[true,'exapanded to full screen', `${customVerbPrefix}expanded`]
            },
        },
    "consoleLog":{
                statements:true,
                quickLogVerbActivity:false,
                quizLog:false,
                quizArray:false,
                videoLog:true,
                eventListener:true,
                lrs:false,
                version:true
    },
    "login":{
                Use_custom_login_messages:true,
                login_message:null,//this is the message displayed below email entry box
                placeholder_text:null,//this is the placeholder for the email entry box 
                Allow_user_to_skip_email:false,//when set to true skip email button will not show
                skip_email_default_value:false,//if skip email buttton is turn on this is the email address it will return
                invalid_email_placholder_Message:null//this is the plaeholder text that will be displayed if incorrect emal was displayed
    },
    "lrsSettings":{
        reportingToLrs:true,
        production:true,
        sandbox_key:null,
        sandbox_endpoint:null,
        sandbox_secret:null,
        production_secret:null,
        production_key:null,
        production_endpoint:null  
    
    },  
    removePlayButton:true, 
    quizName: null,//uses parent activity name with quiz appended to the end when null
    quizId:null,//uses baseID-ActivityName/quiz/parent/parentName when set to  null
    quizDescription:null, //combines verb and assessment and quizname when set to null
    remove_play_button_on_mobile:true,
    parentName:null,
    parentDescription:null,
    baseId:null,//uses base URL and path by default but can be defined to custom URI
    returnToLastSlideVisited:true,//TODO:write query to check last slide visited
    version:'1.2.0'
};

if(params.consoleLog.version)console.log(`superWrapper ${params.version}`);
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
         xApiController.defineStmt(null);
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
        this.parentDescription = params.parentDescription ||sw.var('cpInfoDescription');
        this.activityDescription=null;
        this.slideEnterTime = null;
        this.menuFlag = false;
        this.pauseTime=null;
        this.video=null;
        this.videoDuration=null;
        this.categoryName = null;
        this.categoryId = null;
        this.groupName = null;
        this.groupId=null;
        this.quizParent=null;
        this.quizStartTime=null;
        this.quizFinishTime=null;
        this.quizFinalScore = null;
        this.quizPossibleScore=null;
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
        if (params.lrsSettings.reportingToLrs){
        this.lrs=(()=>{ 
            if (!params.lrsSettings.production){
            var username = params.lrsSettings.sandbox_key||sw.var('v_key');
            var password = params.lrsSettings.sandbox_secret || sw.var('v_secret');
            var endpoint = params.lrsSettings.sandbox_endpoint || sw.var('v_endpoint');
            }
            else {
                var username = params.lrsSettings.production_key ||sw.var('v_prodKey');
                var password = params.lrsSettings.production_secret ||sw.var('v_prodSecret');
                var endpoint = params.lrsSettings.proudction_endpoint || sw.var('v_prodEndpoint');
            }
            try {
                
                let lrs = new TinCan.LRS({
                    endpoint: endpoint,
                    username: username,
                    password: password,
                    allowFail: false 
                });
                if(params.consoleLog.lrs)console.log('%c LRS endpoint:','color:#90ee90',lrs.endpoint)
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
        this.send = null;
        //first if is for access verb, since access happens when project is opened access is not passed into 
        //definestmt like it is for all other instances
        if (arguments[0]===null  && arguments.length==1){
            verb='access';
             }
        switch (verb){
        case 'access':
                this.verbName =this.verb[verb];
                this.verbId=this.verb[`${verb}Id`];
                this.activityId=this.parentId;
                this.activity=this.parentName;
                this.type = this.activityType.course;
                this.activityDescription = `The captivate project ${this.activity} was launched`;
                this.send=params.verbs[verb][0];;
        break;
        case'enter':
            this.type = this.activityType.slide;
            this.activityDescription = `Slide ${this.activity} was entered`; 
            if (this.activity.substr(0,10)==='xapi_menu_')this.activity.slice(10,this.activity.length)
            this.send=params.verbs[verb][0];;
        break;
        case 'answer':
            this.type =this.activityType.question;
            this.activityDescription =`Question:${quiz.question}`;
            this.activity=`${quiz.question}`;
            this.activityId=`${this.idPrefix}quiz/${quiz.questionId}`;
            this.send = params.verbs.quiz[verb][0];
            this.answerTime = new Date().getTime();
            this.slideDurationTime = sw.convertMilliSecondsToISO(Math.abs(this.slideEnterTime - this.answerTime));
           
        break;
        case  'review':
            this.type=this.activityType.question;
            this.activityDescription =`Review of quiz slide ${xApiController.currentSlideIndex}`;
            this.activity = `slide named ${xApiController.currentSlideName}`;
            this.activivityId = `${this.idPrefix}reveiwedquiz/${sw.insert_(xApiController.currentSlideName)}`;
            this.send = params.verbs.quiz[verb][0];
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
            this.send= params.verbs.video[verb][0]
        break;
        case'complete':
            this.activityDescription=`Completed by reaching the slide of ${passedActivity}`;
            this.type = this.activityType.course;
            this.activityId=this.parentId;
            this.send=params.verbs[verb][0];;
        break;
        case 'start':
        case 'finish':
           
            this.activityDescription=params.quizDescription ||`${verb}ed Assessment ${quiz.quizName}`;
            this.activity = params.quizName || quiz.quizName;
            this.activityId = params.quizId ||`${this.idPrefix}parent/quiz/${sw.insert_(quiz.quizName)}`;
            this.type = this.activityType.assessment;
            this.send= params.verbs.quiz[verb][0];
        break;
        case 'return':
                this.type = this.activityType.slide;
                this.activity =this.activity.slice(10,this.activity.length)
                this.activityDescription = `Returned to ${this.activity} Menu slide `; 
                this.send=params.verbs[verb][0];; 
            break;
        case'view':
            this.activityDescription =`Slide ${this.activity} was viewed`;
            this.send=params.verbs[verb][0];;
        break;
        case 'play':
        case 'pause':
        case 'scrub':
        case 'mute':
        case 'unmute':
        case 'adjust':
        case 'expand':
            this.activity=passedActivity;
            this.activityId=`${this.idPrefix}video/${passedActivity}`;
            this.type=this.activityType.video;
            this.activityDescription=`Slide ${this.currentSlideIndex} Video - ${passedActivity}`
            this.videoDuration=($(this.video)[0].duration);
            this.send= params.verbs.video[verb][0]
        break;
       case 'focus':
       case 'unfocus':
            
            this.type = this.activityType.slide
            this.activityDescription = `Slide ${this.activity} had a focus change`; 
            this.totalDurationTime = (this.focusEventTime);
            this.send=params.verbs[verb][0];
       break;
       default:
           break;
        }
    this.createStmt();
    this.prepareStmtToSend();

    if(this.send)this.sendStmt();
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
                "name":{[params.display_language[0]]:sw.remove_(this.activity)},
                "description":{[params.display_language[0]]:`${sw.remove_(this.activityDescription)}`},
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
                [params.display_language[0]]:this.verbName
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
                //"revision":this.revision,
                "language":params.display_language[0],
                "extensions": {
                    "http://id.tincanapi.com/extension/invitee": {
                        "studentId": this.lmsId,
                        "studentName": this.lmsUser
                      },
                "http://superwrapper/extension/slide-info":{
                    "slideIndex":this.currentSlideIndex,
                    "slideName":this.currentSlideName,
                    "slidesSequenceToThisPoint":this.slides
                },
                "http://id.tincanapi.com/extension/ending-point": endingPoint,
                "http://id.tincanapi.com/extension/starting-point":startingPoint,
                "http://id.tincanapi.com/extension/scrubDuration":{
                    "name":{[params.display_language[0]]:this.scrubTime,
                    "description":{[params.display_language[0]]:`PT${Math.round(this.rawScrubTime)}S`}
                    }
                },
                "http://id.tincanapi.com/extension/duration":{
                    "name":{[params.display_language[0]]:'Video length duration'},
                    "description":{[params.display_language[0]]:`PT${Math.round(this.videoDuration)}S`}
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
                      [params.display_language[0]]:this.parentName
                    },
                    "description": {
                      [params.display_language[0]]: this.parentDescription
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
                        [params.display_language[0]]: this.categoryName
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
                        [params.display_language[0]]: this.groupName
                      },
                      "type": this.groupType
                    }
                  }
              ]
        });
        if (this.groupName===null) context.grouping= null;
        if (this.categoryName===null) context.category= null;
        return  context;
    };
        createResult(quizType){
    
         if(this.quizFinalScore!==null){
            
            this.quizFinalScore = null;
            return new TinCan.Result({
                "score": {
                    "scaled": sw.var('cpInfoPercentage')/100,
                    "raw": sw.var('cpQuizInfoPointsscored'),
                    "min":0,
                    "max":sw.var('cpQuizInfoTotalProjectPoints')
                  },
                  "success": sw.var('cpQuizInfoPassFail'),      
                  "completion": true,
                  "duration": (()=>{return sw.convertMilliSecondsToISO(Math.abs(this.quizFinishTime-this.quizStartTime))})(),
                  "response": null
            })
           
        }
            else if (!quizType  && this.verbName !==this.verb.complete)return new TinCan.Result({
                duration:this.totalDurationTime
            })

            else if (this.verbName ===this.verb.complete){
                this.lastSlideTime = new Date().getTime();
                this.totalProjectTime = (sw.convertMilliSecondsToISO(this.lastSlideTime - this.projectEnterTime ));
                return new TinCan.Result({
                    duration:this.totalProjectTime
            })
        }
        else{
          
        return new TinCan.Result({
          
            "score": {
                "scaled": (()=>{
                    if(quiz.correct) return Number(`.${(quiz.totalPoints/quiz.quizPossiblePoints).toFixed(2).split('.')[1]}`);
                    else return 0; })(),
                "raw": (()=>{
                    if(quiz.correct) return quiz.totalPoints 
                    else return 0; })(),
                "min":0,
                "max":quiz.possiblePoints
              },
              "success": quiz.correct,
              "completion": true,
              "duration": this.totalDurationTime,
              "response": quiz.selectedAnswer.toString()
        });
    }
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
        switch (this.verbName){
                case this.verb.start:
                case this.verb.finish:
                    //creates quiz parent id
                    this.stmt.target.id = this.stmt.target.id+'/quiz';
                      //creates quiz parent info for question parent used in 'answered'
                    this.quizParent = this.stmt.target;
                break;
                case this.verb.answer:
                    //set activityType for answered to Types(aseessment)
                    this.quizParent.definition.type=this.activityType.assessment;
                    //cretate 2nd parent for slide
                    add2ndParent(this.quizParent);
                break;
                case this.verb.enter:
                case this.verb.access:
                    //the currentslide becomes the videos 2nd parent
                    this.vidParent = this.stmt.target;
                    //has no result so it is removed
                    this.stmt.result=null;
                    //the current slide being entered is a 2nd parent to buttons on that slide
                    this.buttonParent = this.stmt.target;
                break;
                case this.verb.complete:
                    //sets property of complete to true
                    this.stmt.result.complete=true
                break;
                case this.verb.finish:
                        this.stmt.result.complete=true
                        this.quizParent = this.stmt.target;
                        this.stmt.target.id = this.stmt.target.id+'/quiz';
                        add2ndParent(this.quizParent);
                break;

                case this.verb.pressButton:
                case this.verb.pressClickBox:
                    //when a button or click box is pressed set a the slide is the buttons 2nd parent.
                   add2ndParent(this.buttonParent);
                    //change id to show /button/button name from captivate
                    this.stmt.target.id=`${this.idPrefix}button/${sw.insert_(this.activity)}`;
                break; 
                case this.verb.play:
                    //add 2nd parent to reflect slide
                   add2ndParent(this.vidParent);
                   //delete unneeded vid extensions
                    delete this.stmt.context.extensions["http://id.tincanapi.com/extension/ending-point"];
                    delete this.stmt.context.extensions["http://id.tincanapi.com/extension/starting-point"];
                    
                break;
                case this.verb.pause:
                        //add 2nd parent to reflect slide
                       add2ndParent(this.vidParent);
                        //delete unneeded vid extensions
                        delete this.stmt.context.extensions["http://id.tincanapi.com/extension/starting-point"];
                break;
                case  this.verb.scrub:
                case  this.verb.adjustVolume:
                        //add 2nd parent to reflect slide
                        add2ndParent(this.vidParent);
                    break;
                case this.verb.mute:
                case this.verb.unmute:
                        //add 2nd parent to reflect slide
                        add2ndParent(this.vidParent)
                        //delete unneeded vid extensions
                        delete this.stmt.context.extensions["http://id.tincanapi.com/extension/starting-point"];
                break;
        }
            //remove scrub duration if not a scrubbed statement;
            if(this.verbName != this.verb.scrub){delete this.stmt.context.extensions["http://id.tincanapi.com/extension/scrubDuration"]}
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
        if (this.ie===true  || params.lrsSettings.reportingToLrs ===false){
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
            if(sw.var('cpInQuizScope')==0){this.quizStarted = false};
            if(sw.var('cpInQuizScope')==true  && !this.quizStarted){
                if(quiz.question ===null){
                    this.defineStmt(quiz.quizName,'start');
                    this.quizStartTime = new Date().getTime();
                    this.quizStarted = true;
                }
            }
            if(sw.var('cpInQuizScope')===false && !this.quizStarted ){
                    this.quizStarted===false;
            }
            if(!this.quizStarted && sw.var('cpInQuizScope')===false && this.quizReported!==true){
                this.quizReported  = true;
                this.quizFinalScore = sw.var('cpQuizInfoPointsscored');
                this.quizPossibleScore = sw.var('cpQuizInfoTotalQuizPoints');
                this.quizFinishTime = new Date().getTime();
                this.defineStmt(quiz.quizName,'finish');
            }
      
            this.currentSlideName = sw.var('cpInfoCurrentSlideLabel');
            //update index - cp Index starts as 0, slides start at 1
            this.currentSlideIndex=sw.var('cpInfoCurrentSlideIndex')+1;
            this.totalSlides=sw.var('cpInfoSlideCount');
           if(this.currentSlideIndex === this.totalSlides && params.verbs.complete){
              this.defineStmt(null,'complete');
                if (sw.var('cpInReviewMode')){
                    this.defineStmt(this.slides[this.slides.length-2],'review')
                    }else{
                this.defineStmt(this.slides[this.slides.length-2],'view')}
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
            if(!this.launchFlag){
                if (sw.var('cpInReviewMode')){
                    this.defineStmt(this.slides[this.slides.length-2],'review')
                    }else{
                 if(params.verbs.view[0]){this.defineStmt(this.slides[this.slides.length-1],'view');
                    }
                 }
                 //this listener is for slide change, so the end of the last slide now becomes
                 //beginning time for this slide
                 this.slideEnterTime = this.slideExitTime
              }else this.launchFlag=false;
                if(this.currentSlideName.substr(0,10)==='xapi_menu_' && !this.menuFlag){
                   this.defineStmt(sw.var('cpInfoCurrentSlideLabel'),'enter')
                    this.menuFlag=true;
                }
                else if (this.currentSlideName.substr(0,10)==='xapi_menu_' && this.menuFlag){
                    this.defineStmt (this.currentSlideName,'return');
                } else{
                    if (!sw.var('cpInReviewMode')){
                    this.defineStmt(sw.var('cpInfoCurrentSlideLabel'),'enter')}
                }
              
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
                
                    this.defineStmt(quiz.question,'answer');
                
            })
            window.cpAPIEventEmitter.addEventListener('CPAPI_QUESTIONSKIP',e=>{
                this.quizhandler(e);
                this.defineStmt(this.slides[this.slides.length-1],'skip')
            })
            window.cpAPIEventEmitter.addEventListener('CPAPI_VARIABLEVALUECHANGED','v_increment',e=>{
            });
            this.DOMListener((focus)=>{
                let milliSeconds
                if(focus){
                   
                    this.refocusStartTime=new Date().getTime();
                    milliSeconds = Math.floor((this.refocusStartTime-this.unfocusStartTime));
                    this.focusEventTime = sw.convertMilliSecondsToISO(milliSeconds);
                    this.defineStmt(sw.var('cpInfoCurrentSlideLabel'),'focus')}
                else {
                    this.unfocusStartTime = new Date().getTime();
                    if(!this.refocusStartTime) {milliSeconds = Math.abs((this.slideEnterTime - this.unfocusStartTime))}
                    else  { milliSeconds = Math.floor((this.unfocusStartTime- this.refocusStartTime))
                    }
                    this.focusEventTime = sw.convertMilliSecondsToISO(milliSeconds);
                    this.defineStmt(sw.var('cpInfoCurrentSlideLabel'), 'unfocus')}
            })
    };
    DOMListener(callback){
            let visible = true;
            if (!callback) {
                throw new Error('no callback given');
            }
            function focused() {
                if (!visible) {
                    callback(visible = true);
                }
            }
            function unfocused() {
                if (visible) {
                    callback(visible = false);
                }
            }
            // Standards:
            if ('hidden' in document) {
                document.addEventListener('visibilitychange',
                    function() {(document.hidden ? unfocused : focused)()});
            }
            if ('mozHidden' in document) {
                document.addEventListener('mozvisibilitychange',
                    function() {(document.mozHidden ? unfocused : focused)()});
            }
            if ('webkitHidden' in document) {
                document.addEventListener('webkitvisibilitychange',
                    function() {(document.webkitHidden ? unfocused : focused)()});
            }
            if ('msHidden' in document) {
                document.addEventListener('msvisibilitychange',
                    function() {(document.msHidden ? unfocused : focused)()});
            }
            // All others:
            window.onpageshow = window.onfocus = focused;
            window.onpagehide = window.onblur = unfocused;
        
    }
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
      
        if(input.indexOf(' ')>0)
        return (input.indexOf(' ') >0) ? input.split(' ').join('_'):input;
        else
        return (input.indexOf('-') >0) ? input.split('-').join('_'):input;
    };
    remove_(input){
        return (input.indexOf('_') > 0) ? input.split('_').join(' '):input;
    };
    uriCheck(uri){
        let validUri = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        let regexUri = /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i;
        let valid = regexUri.test(uri);   
        if(valid)return uri
        else {console.log(`%c User set IRI ${uri} does not match requirmenents.`,'color:orange');return null;}
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
    onLine(){
        return navigator.onLine;
    }
    parse(parseProperty){
      
        let keys = Object.keys(cp.model.data);
        this.quizQuestions = [];
        keys.map(key =>{
            Object.keys(cp.model.data[key]).map(item=>{if(item==='qt')(this.quizQuestions.push(cp.model.data[key][parseProperty]))})
        })
        
        return this.quizQuestions;
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
             //sw.capSetVarValue('v_actorName',this.learner.name);
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
            //"padding-bottom":"2vh",
            "min-height":"95vh",
            "border":"1px black solid",
            "border-radius":"5px",
            "background-color":"grey"
            //TODO:Create xAPI WRapper logo/background
            }); 
            sw.login = $('.login-screen');
            sw.placeholder = (params.login.Use_custom_login_messages  && params.login.placeholder_text !==null)?params.login.placeholder_text :"Please enter your email and press enter or submit";
            sw.footer ="Powered by superWrapper";
            sw.message= (params.login.Use_custom_login_messages &&params.login.login_message!==null)?params.login.login_message :`Entering an email address will be the user that is reported to the demo LRS, for this
                        demonstration if you would prefer please press the skip button and a demo email
                        will be assinged to you`;
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
                "width":"50%",
                "padding-top":"25px",
                "font-family":"arial",
                "margin-left":"50%",
                "transform":"translate(-50%,-10%)",
                "color":"#FFFAFA"
            })
            $('<button id="submit">Submit Email</button>')
            .insertBefore('.message')
            .css({
                "background-color":"green",
                "color":"white",
                "margin-left":"40vw",
                "min-width":"8vw",
                "min-height":"5vh",
                "border-radius":"5px",
                "box-shadow": "2px 2px #888888",
            }).on ('click',()=>{passEmail($('.email-input').val())
        });
            if(params.login.Allow_user_to_skip_email){
                $('<button id="skip">Skip Email</button>')
                .insertAfter('#submit')
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
                 
                    window.open(`${this.url.href}?mbox=${(()=>{return ((user.testEmail(params.login.skip_email_default_value))?params.login.skip_email_default_value:'user@superWrapper.com')})()}`,"_parent");
                });
            }
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
            if(screen.width <415){
                $('.message')
                .css({
                    "width":"85%"
                })

                $('.email-input')
                .css({
                    "min-width":"75%"
                })
                $('#submit').
                css({
                    "margin-left":"28vw"
                })
            }
        function passEmail(email){
            let valid = user.testEmail(email);
            if(!valid)$('.email-input').val('').focus('').attr("placeholder",params.login.invalid_email_placholder_Message || "Invalid email please try again and press enter");
            else {
                window.open(`${user.url.href}?mbox=${email}`,"_parent");
            }
        }    
    });
}
 


};
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
                this.getStartTime= this.video.currentTime; 
                clearInterval(playFlag);
            }
            },1000)
           
     
        // $(`#btmControl${this.name}`).on('mousedown', ()=>{
        
        //      this.getStartTime= this.video.currentTime; 
        // })
    
        this.listener = $(`#btmControl${this.name}`).on('mousedown',e=>{

                console.log($(e.t))
                let playbarAction = ($(e.target)[0].innerText);
                console.log(playbarAction)
                let playbar;
                (playbarAction.indexOf(',')> -1)? playbar = playbarAction.split(",")[0]:playbar = playbarAction;
                (playbarAction.indexOf('set to')> -1)? playbar = playbarAction.split("set to")[0]:playbar = playbar;
                switch(playbar.trim()){
                    case 'Stop':
                            this.getStartTime= this.video.currentTime; 
                        this.pauseTime.push(this.video.currentTime);
                        if(params.consoleLog.videoLog)console.log(`stopped at ${this.pauseTime}`);
                        break;
                    case 'Pause':
                            this.getStartTime= this.video.currentTime; 
                            this.pauseTime.push(this.video.currentTime);
                            if(params.consoleLog.videoLog)console.log(`paused at ${this.pauseTime[this.pauseTime.length-1]}`);
                            xApiController.pauseTime=this.pauseTime[this.pauseTime.length-1];
                            xApiController.defineStmt(this.name,'pause');
                            break;
                    case 'Play':
                            this.getStartTime= this.video.currentTime; 
                        if(params.consoleLog.videoLog)console.log(`played after pause/stop at ${this.pauseTime[this.pauseTime.length-1]}`)
                        break;
                    case 'Progress':
                            let a = playbarAction.split(',')[1];
                            a = a.split('at')[1];
                            a = a.split('seconds')[0];
                            //TODO:test to ensure that seconds don't become minutes on videos with duration >60 seconds
                           
                            $(`#btmControl${this.name}`).on('mouseup',(e)=>{
                                console.log('fire');
                                
                            let scrubTime = this.video.currentTime - this.getStartTime ;
                            let rawTime = scrubTime;
                            (scrubTime <0) ? scrubTime=`scrubbed back ${Math.floor(scrubTime)}`:scrubTime=`scrubbed forward ${Math.floor(scrubTime)}`
                            if(params.consoleLog.videoLog) console.log(scrubTime);
                            if(params.verbs.video.scrub){
                            xApiController.newTime=this.video.currentTime;
                            xApiController.pauseTime=this.getStartTime;
                            xApiController.scrubTime=scrubTime;
                            xApiController.rawScrubTime=Math.abs(rawTime);
                            xApiController.defineStmt(this.name,'scrub');
                            this.getStartTime= this.video.currentTime; 
                            $(`#btmControl${this.name}`).unbind('mouseup');
                            }
                         })
                        break;
                    case 'Mute':
                        if(params.consoleLog.videoLog) console.log('mute at'+$(this.video)[0].currentTime);
                            xApiController.pauseTime=$(this.video)[0].currentTime;
                            xApiController.defineStmt(this.name,'mute');
                        break;
                    case 'Unmute':
                        xApiController.defineStmt(this.name,'unmute');
                        xApiController.pauseTime=$(this.video)[0].currentTime;
                        break;
                    case 'Volume':
                        if(params.consoleLog.videoLog)console.log(`adjust to ${this.newVolume}`);
                      
                        this.newVolume = playbarAction.split('set to')[1];
                        xApiController.pauseTime= this.startVolume;
                        xApiController.newTime =this.newVolume;
                        xApiController.defineStmt(this.name,'adjust');
                        this.startVolume=this.newVolume;
                        
                        break;
                    case 'Full Screen':
                        if(params.consoleLog.videoLog)console.log('Full Screen');
                        xApiController.defineStmt(this.name, 'expand')
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
        this.finish = params.verbs.quiz.finish[1] ||'finished';
        this.finishId =sw.uriCheck(params.verbs.quiz.finish[2])  || `${sw.verbId}finished`;
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
        this.expandId = sw.uriCheck(params.verbs.video.expand[2]) || `${sw.verbId}expnanded`;
        this.expand = params.verbs.video.expand[1]  || 'exapanded to full screen'
        this.experience =params.verbs.experience[1]||'experienced';
        this.experienceId =sw.uriCheck(params.verbs.experience[2]) || 'http://adlnet.gov/expapi/verbs/experienced';
        this.press=params.verbs.pressButton[1] ||'pressed the button';
        this.pressClickBox=params.verbs.pressClickBox[1] || 'pressed the click box';
        this.pressId = sw.uriCheck(params.verbs.pressButton[2]) || 'http://future-learning.info/xAPI/verb/pressed';
        this.focus = params.verbs.focus[1] || 'focused';
        this.unfocus =params.verbs.unfocus[1] || 'unfocus';
        this.focusId = sw.uriCheck(params.verbs.focus[2]) || 'http://id.tincanapi.com/verb/focused';
        this.unfocusId = sw.uriCheck(params.verbs.unfocus[2]) || 'http://id.tincanapi.com/verb/unfocused';
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
        this.questions=(sw.parse('qt'));
        this.possibleAnswers = [];
        this.quizName=params.quizName || xApiController.parentName + " Quiz";
        this.quizId=sw.uriCheck(params.quizId) || xApiController.parentId;
        this.questionType = sw.var('cpQuizInfoQuestionSlideType');
        this.totalquestions =sw.var('cpQuizInfoTotalQuestionsPerProject');
        this.totalPoints = sw.var('cpQuizInfoPointsPerQuestionSlide');
        this.quizPossiblePoints =sw.var('cpQuizInfoTotalQuizPoints');
        this.possiblePoints =sw.var('cpQuizInfoPointsPerQuestionSlide');
        this.questionId=data.cpData.interactionID;
        this.quizPassingGrade = sw.var('cpQuizInfoQuizPassPoints');
        this.quizTotalPoints = sw.var('cpQuizInfoTotalProjectPoints');
        this.question=null;
        this.questionTitle=null;
        if(data.cpData.hasOwnProperty('questionNumber')){
            this.question =this.questions[data.cpData.questionNumber];
            this.questionNumber =data.cpData.questionNumber;
        
        };
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

    if(typeof data.cpData.correctAnswer !='undefined'){
       
       if(params.consoleLog.quizArray) console.log(textArray)
        this.correctAnswer = (()=>{
            let answers = data.cpData.correctAnswer;
            if(answers.indexOf(';')>0)answers = answers.split(';')
            return answers;
        })();
        this.selectedAnswer =  (()=>{
            let answers = data.cpData.selectedAnswer;
            if(answers.indexOf(';')>0)answers = answers.split(';')
            return answers;
             })();   
        this.correct = (()=>{return (JSON.stringify(this.correctAnswer)==JSON.stringify(this.selectedAnswer))?true:false})();
       // console.log(this.questionType)
        switch (this.questionType){
        case 'long-fill-in':
        case 'fill-in':
                this.questionTitle=textArray[0];
                this.correctAnswer = (()=>{
                    let answers = data.cpData.correctAnswer.toLowerCase();
                    if(answers.indexOf(':'))answers = answers.split(':')
                    return answers;
                })();
                this.selectedAnswer =  (()=>{
                    let answers = data.cpData.selectedAnswer;
                    if(answers.indexOf(':'))answers = answers.split(':')
                    return answers;
                     })();
                this.correct =(()=>{
                    return (this.correctAnswer.indexOf(this.selectedAnswer[0].toLowerCase())>-1)?true:false;
                })(); 
        break;
        case 'matching':
                this.questionTitle = textArray[1];
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
        break;
        case 'choice':
                
                this.questionTitle = textArray[1];
                let startingIndex = textArray.indexOf('Multiple Choice ')+2;
                textArray.slice(startingIndex,textArray.length).map(value=>{
                    //console.log(value)
                    if (value.split(' ')[0] ==='Incorrect'  ||
                     value.split(' ')[0]==='Correct'||
                     value.trim()==='Submit' ||
                     value.trim()==='You must answer the question before continuing.'||
                     value.split(' ')[0]==='Try')
                     
                     {
                         ///noaction
                   }
                         else{
                        this.possibleAnswers.push(value.trim())
                    }
                } )
            
             
        break;
        case 'true-false':
          
                this.questionTitle = textArray[1];
                this.possibleAnswers=["true","false"];
        break;
        case 'sequencing':
                
                this.questionTitle = textArray[1];
        break;
        case 'hotspot':
                this.questionTitle = textArray[1];
             
        break;
        case 'likert':
                this.questionTitle=textArray[1];
            
                if(typeof cp.model.data[`${xApiController.quizIdentifier}`] !=='undefined')
                this.possibleAnswers=cp.model.data[`${xApiController.quizIdentifier}`].rsv
        break;
        default:    
        break;
        }
        }
       else this.correctAnswer,this.selectedAnswer,this.correct = null;
//    if(this.questionType !='matching')this.possibleAnswers= (this.questionType==='sequencing')
//    ?this.possibleAnswers = textArray.slice(3,textArray.indexOf('Submit '))||null
//    :this.possibleAnswers = textArray.slice(4,textArray.indexOf('Submit '))||null;
}
};
class Definitions{
constructor(){
    this.choice =  new TinCan.Activity({definition: {
        "name":{[params.display_language[0]]:xApiController.activity},
            "description": {
                [params.display_language[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "choice",
            "correctResponsesPattern": [
                (()=>{
                    if(quiz.correctAnswer.length>1  && quiz.questionType==='choicee'){
                        let correctAnswer='';
                        quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;
                    } else return quiz.correctAnswer.toString()
                })()
            ],
            "choices": 
                (()=>{
                    let answers =[];
                    quiz.possibleAnswers.map((answer,index)=>{
                       let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                        "description":{
                            [params.display_language[0]]:answer
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
            "name":{[params.display_language[0]]:xApiController.activity},
            "description": {
                [params.display_language[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "true-false",
            "correctResponsesPattern": [quiz.correctAnswer],
            "choices":quiz.possibleAnswers
        },
        id:xApiController.activityId
    });
    this.long_fill_in= new TinCan.Activity({"definition": {
             "name":{[params.display_language[0]]:xApiController.activity},
            "description": {
                [params.display_language[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "long-fill-in",
            "correctResponsesPattern": [
                (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                        if(quiz.questioonType ==='long_fill_in'){quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;}
                    } else return quiz.correctAnswer;
                })()
            ]
    },
    id:xApiController.activityId
    });
    this.fill_in = new TinCan.Activity( {"definition": {
     "name":{[params.display_language[0]]:xApiController.activity},
    "description": {
        [params.display_language[0]]: quiz.question
    },
    "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
    "interactionType": "fill-in",
    "correctResponsesPattern": [
        (()=>{
            if(quiz.correctAnswer.length>1){
                let correctAnswer='';
                if(quiz.questionType ==='fill_in'){quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                return correctAnswer;}
            } else return quiz.correctAnswer;
        })()
    ]

},
id:xApiController.activityId
    });
    this.matching = new TinCan.Activity({"definition": {
    "name":{[params.display_language[0]]:quiz.question},
        "description": {
            [params.display_language[0]]: quiz.question
        }, 
        "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
        "interactionType": "matching",
        "correctResponsesPattern": 
            // "ben[.]3[,]chris[.]2[,]troy[.]4[,]freddie[.]1"
            (()=>{
                    let aAndb = quiz.correctAnswer.toString().split(',');
                    let correctAnswer='';
                    if (quiz.source)quiz.source.map((answer,index)=>{
                        
                        correctAnswer=correctAnswer+`${answer.trim()}[.]${aAndb[index].substr(2,2)}[,]`});
                    correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                    return correctAnswer.toString();
            })()
        ,
        "source": 
            (()=>{
                let answers =[];
                if (quiz.source)quiz.source.map((answer,index)=>{
                   let tempAnswer={"id":`${answer.trim()}`,
                    "description":{
                        [params.display_language[0]]:answer.trim()
                    }
                }
                    answers.push(tempAnswer)})
                return answers
        })()
         ,
        "target": 
        (()=>{
            let answers =[];
            if(quiz.target)quiz.target.map((answer,index)=>{
               let tempAnswer={"id":`${answer.trim()}`,
                "description":{
                    [params.display_language[0]]:answer.trim()
                }
            }
                answers.push(tempAnswer)})
            return answers
    })(),
    },
    id:xApiController.activityId
    })
    this.sequencing = new TinCan.Activity({"definition": {
            "name":{[params.display_language[0]]:xApiController.activity},
            "description": {
                [params.display_language[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "sequencing",
            "correctResponsesPattern": 
                (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                       if(quiz.questionType ==='sequencing'){quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;}
                    } else return quiz.correctAnswer;
                })()
            ,
            "choices":  (()=>{
                let answers =[];
                quiz.possibleAnswers.map((answer,index)=>{
                   let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                    "description":{
                        [params.display_language[0]]:answer
                    }
                }
                    answers.push(tempAnswer)})
                return answers
        })() 
    },
    id:xApiController.activityId
    });
    this.likert= new TinCan.Activity({"definition": {
             "name":{[params.display_language[0]]:xApiController.activity},
            "description": {
                [params.display_language[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "likert",
            "correctResponsesPattern": quiz.possibleAnswers,
             "scale":(()=>{
                let answers =[];quiz.possibleAnswers.map((answer,index)=>{
                let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                 "description":{
                     [params.display_language[0]]:answer
                 }
             }
                 answers.push(tempAnswer)})
             return answers
     })() 
        },
        id:xApiController.activityId
    });
    this.hotspot= new TinCan.Activity({"definition": {
            "description": {
                [params.display_language[0]]: quiz.question
            },
            "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
            "interactionType": "choice",
            "correctResponsesPattern": 
                (()=>{
                    if(quiz.correctAnswer.length>1){
                        let correctAnswer='';
                        if(quiz.questionType ==='hotspot'){quiz.correctAnswer.map((answer)=>{correctAnswer=correctAnswer+`${answer}[,]`});
                        correctAnswer = correctAnswer.substr(0,correctAnswer.length-3);
                        return correctAnswer;}
                    } else return quiz.correctAnswer;
                })()
            ,
            "choices": 
                (()=>{
                    let answers =[];
                    quiz.possibleAnswers.map((answer,index)=>{
                       let tempAnswer={"id":`${quiz.questionType}-${index+1}`,
                        "description":{
                            [params.display_language[0]]:answer
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
    if(type ==='true-false')type = 'true_false';
    if(type ==='long-fill-in')type ='long_fill_in';
    if(type === 'fill-in')type ='fill_in';
    if(type=== 'likert')quiz.correct=null;
    if(quiz.correctAnswers)console.log(this);
    return this[type];
};
};
/*ensure all CP files are loaded and then call the init feature in this document and elimnate play button;
$(document).ready(function(){

    setTimeout(()=>{
        if(params.removePlayButton)cp.movie.play();
        init();
    },100);
})
*/






